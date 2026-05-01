import { runPayablesSyncJob } from "@/lib/services/payables-sync";
import { getServiceSupabase } from "@/lib/supabase/server";
import DayjsUtils from "@date-io/dayjs";
import { after } from "next/server";
import { NextResponse } from "next/server";

const dateFns = new DayjsUtils();
const GYM_SLUG = "panobianco-sjc-satelite";

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const today = dateFns.date();
		const dueDateStart =
			searchParams.get("dueDateStart") ??
			today.startOf("month").format("YYYY-MM-DD");
		const dueDateEnd =
			searchParams.get("dueDateEnd") ??
			today.endOf("month").format("YYYY-MM-DD");
		const requery = searchParams.has("requery");

		const requeueUrl = new URL(req.url);
		requeueUrl.searchParams.set("dueDateStart", dueDateStart);
		requeueUrl.searchParams.set("dueDateEnd", dueDateEnd);
		requeueUrl.searchParams.set("requery", "");

		const supabase = getServiceSupabase();

		const gymRow = await supabase
			.from("gyms")
			.select("id")
			.eq("slug", GYM_SLUG)
			.maybeSingle();

		if (!gymRow.data?.id) {
			return NextResponse.json(
				{ error: "Academia não encontrada." },
				{ status: 404 },
			);
		}
		const gymId = gymRow.data.id as string;

		const { data: settingsRows } = await supabase
			.from("gym_settings")
			.select("key,value")
			.eq("gym_id", gymId);

		const settingsMap = new Map(
			(settingsRows ?? []).map((r) => [r.key as string, r.value as string]),
		);
		const evoApiToken = settingsMap.get("evoApiToken") ?? "";

		if (!evoApiToken) {
			return NextResponse.json(
				{
					error:
						"Token EVO não configurado. Acesse Configurações > Integrações e API Keys.",
				},
				{ status: 400 },
			);
		}

		if (!requery) {
			const { data: existingJob } = await supabase
				.from("crm_payables_sync_jobs")
				.select("id,status,partial_groups,updated_at,error")
				.eq("gym_id", gymId)
				.eq("due_date_start", dueDateStart)
				.eq("due_date_end", dueDateEnd)
				.order("created_at", { ascending: false })
				.limit(1)
				.maybeSingle();

			if (existingJob) {
				if (existingJob.status === "completed") {
					return NextResponse.json({
						status: "completed",
						data: {
							groups: existingJob.partial_groups as Record<string, number>,
						},
						lastFetchedAt: existingJob.updated_at,
						refetchUrl: requeueUrl.toString(),
					});
				}
				if (
					existingJob.status === "running" ||
					existingJob.status === "pending"
				) {
					return NextResponse.json({
						status: "processing",
						jobId: existingJob.id,
						refetchUrl: requeueUrl.toString(),
					});
				}
				if (existingJob.status === "failed") {
					return NextResponse.json({
						status: "failed",
						jobId: existingJob.id,
						error: existingJob.error,
						refetchUrl: requeueUrl.toString(),
					});
				}
			}
		}

		const { data: newJob } = await supabase
			.from("crm_payables_sync_jobs")
			.insert({
				gym_id: gymId,
				status: "pending",
				due_date_start: dueDateStart,
				due_date_end: dueDateEnd,
			})
			.select("id")
			.single();

		if (!newJob) {
			return NextResponse.json({ error: "Erro ao criar job." }, { status: 500 });
		}

		const jobId = newJob.id as string;
		after(() => void runPayablesSyncJob(jobId));

		return NextResponse.json({
			status: "processing",
			jobId,
			refetchUrl: requeueUrl.toString(),
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Erro desconhecido";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
