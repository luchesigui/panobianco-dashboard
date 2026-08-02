import { NextResponse } from "next/server";
import { z } from "zod";
import {
	saveMonthlyKpisAction,
	saveSmDashboardAction,
} from "@/app/kpis/entrada-dados/actions";
import { validateApiRequest } from "@/lib/auth";
import { loadEntradaPageData } from "@/lib/data/entrada-load";
import { recomputeWeeklyTotals } from "@/lib/data/sales-marketing-payload-merge";

const nonNegativeInt = z.number().int().nonnegative();
const rowSchema = z.object({
	name: z.string().min(1),
	leads: nonNegativeInt,
	sales: nonNegativeInt,
});

const schema = z.object({
	gym: z.string().min(1).default("panobianco-sjc-satelite"),
	period: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	week: z.number().int().min(1).max(5),
	funnel: z.object({
		scheduled: nonNegativeInt,
		present: nonNegativeInt,
		closings: nonNegativeInt,
	}),
	opportunities: z.object({
		leads: nonNegativeInt,
		sales: nonNegativeInt,
		byReceptionist: z.array(rowSchema),
	}),
});

function firstNameKey(name: string): string {
	const key = name
		.trim()
		.split(/\s+/)[0]
		?.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "") ?? "";
	return key === "kathleen" ? "kethleen" : key;
}

function sum(values: Array<number | null | undefined>): number {
	return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

export async function POST(req: Request) {
	const auth = validateApiRequest(req);
	if (!auth.isValid) {
		return NextResponse.json({ error: auth.error }, { status: auth.status });
	}

	try {
		const input = schema.parse(await req.json());
		const weekIndex = input.week - 1;
		const { smPayload } = await loadEntradaPageData(input.gym, input.period);
		const payload = structuredClone(smPayload);

		payload.weekly.funnelWeekly.scheduled[weekIndex] = input.funnel.scheduled;
		payload.weekly.funnelWeekly.attendance[weekIndex] = input.funnel.present;
		payload.weekly.funnelWeekly.closings[weekIndex] = input.funnel.closings;
		payload.weekly.salesWeekly.leadsByWeek[weekIndex] = input.opportunities.leads;
		payload.weekly.salesWeekly.totals[weekIndex] = input.opportunities.sales;

		const apiRows = new Map(
			input.opportunities.byReceptionist.map((row) => [firstNameKey(row.name), row]),
		);
		const recepRows = payload.weekly.salesWeekly.byReceptionist ?? [];
		for (const row of recepRows) {
			const apiRow = apiRows.get(firstNameKey(row.name));
			row.leadsByWeek[weekIndex] = apiRow?.leads ?? 0;
			row.salesByWeek[weekIndex] = apiRow?.sales ?? 0;
		}

		recomputeWeeklyTotals(payload.weekly);
		payload.funnel.scheduled.value = sum(payload.weekly.funnelWeekly.scheduled);
		payload.funnel.present.value = sum(payload.weekly.funnelWeekly.attendance);
		payload.funnel.closings.value = sum(payload.weekly.funnelWeekly.closings);
		payload.funnel.conversion.value = payload.funnel.scheduled.value
			? Math.round((payload.funnel.closings.value / payload.funnel.scheduled.value) * 1000) / 10
			: 0;

		const byRecep = new Map(recepRows.map((row) => [row.name, row]));
		for (const row of payload.receptionists) {
			const weekly = byRecep.get(row.name);
			if (weekly) {
				if (row.leads == null) row.leads = weekly.leadsTotal ?? null;
				if (row.sales == null) row.sales = weekly.salesTotal ?? null;
			}
			row.conversion_pct = row.leads && row.sales != null
				? Math.round((row.sales / row.leads) * 1000) / 10
				: 0;
		}

		const saveSm = await saveSmDashboardAction({
			gymSlug: input.gym,
			periodId: input.period,
			payload,
		});
		if (!saveSm.ok) {
			return NextResponse.json({ error: saveSm.error }, { status: 500 });
		}

		const saveKpis = await saveMonthlyKpisAction({
			gymSlug: input.gym,
			periodId: input.period,
			values: {
				leads_generated: payload.weekly.salesWeekly.leadsGrandTotal,
				sales_total: payload.weekly.salesWeekly.grandTotal,
			},
		});
		if (!saveKpis.ok) {
			return NextResponse.json({ error: saveKpis.error }, { status: 500 });
		}

		return NextResponse.json({
			ok: true,
			week: input.week,
			monthly: {
				funnel: {
					scheduled: payload.funnel.scheduled.value,
					present: payload.funnel.present.value,
					closings: payload.funnel.closings.value,
				},
				opportunities: {
					leads: payload.weekly.salesWeekly.leadsGrandTotal,
					sales: payload.weekly.salesWeekly.grandTotal,
				},
			},
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: "Payload inválido.", issues: error.issues }, { status: 400 });
		}
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Erro ao salvar dados do EVO." },
			{ status: 500 },
		);
	}
}
