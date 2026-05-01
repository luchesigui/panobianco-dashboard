import { getServiceSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ jobId: string }> },
) {
	const { jobId } = await params;
	const supabase = getServiceSupabase();

	const { data: job } = await supabase
		.from("crm_payables_sync_jobs")
		.select("*")
		.eq("id", jobId)
		.maybeSingle();

	if (!job) {
		return NextResponse.json({ error: "Job não encontrado." }, { status: 404 });
	}

	const result =
		job.status === "completed"
			? { groups: job.partial_groups as Record<string, number> }
			: undefined;

	return NextResponse.json({
		id: job.id,
		status: job.status,
		skipPosition: job.skip_position,
		totalFetched: job.total_fetched,
		result,
		error: job.error,
		lastFetchedAt: job.updated_at,
	});
}
