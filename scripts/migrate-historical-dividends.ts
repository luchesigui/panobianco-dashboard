import { getServiceSupabase } from "@/lib/supabase/server";
import { isDividendExpense } from "@/lib/data/expense-mapping";

async function main() {
  const supabase = getServiceSupabase();

  console.log("1. Upserting kpi_definitions: dividends_total and operational_result...");
  const { error: defErr } = await supabase.from("kpi_definitions").upsert(
    [
      {
        code: "dividends_total",
        label: "Dividendos distribuídos",
        unit: "currency_brl",
        category: "finance",
      },
      {
        code: "operational_result",
        label: "Resultado operacional",
        unit: "currency_brl",
        category: "finance",
      },
    ],
    { onConflict: "code" },
  );

  if (defErr) {
    console.error("Error upserting definitions:", defErr);
    process.exit(1);
  }

  const { data: defs, error: fetchDefsErr } = await supabase
    .from("kpi_definitions")
    .select("id, code, label");

  if (fetchDefsErr || !defs) {
    console.error("Error fetching definitions:", fetchDefsErr);
    process.exit(1);
  }

  const defMap = new Map(defs.map((d) => [d.id, d]));
  const codeToDef = new Map(defs.map((d) => [d.code, d]));

  const expDefId = codeToDef.get("expenses_total")?.id;
  const divDefId = codeToDef.get("dividends_total")?.id;
  const opDefId = codeToDef.get("operational_result")?.id;

  if (!expDefId || !divDefId || !opDefId) {
    console.error("Required definition IDs missing!");
    process.exit(1);
  }

  const { data: vals, error: valsErr } = await supabase
    .from("kpi_values")
    .select("*")
    .order("period_id", { ascending: true });

  if (valsErr || !vals) {
    console.error("Error fetching values:", valsErr);
    process.exit(1);
  }

  const gymPeriods = new Set(vals.map((v) => `${v.gym_id}__${v.period_id}`));

  for (const gp of gymPeriods) {
    const [gymId, periodId] = gp.split("__");
    const pVals = vals.filter(
      (v) => v.gym_id === gymId && v.period_id === periodId,
    );

    const expDefs = pVals.filter((v) => {
      const d = defMap.get(v.kpi_definition_id);
      return d?.code.startsWith("expense_");
    });

    const divDefs = expDefs.filter((v) => {
      const d = defMap.get(v.kpi_definition_id);
      return isDividendExpense(d?.code) || isDividendExpense(d?.label);
    });

    const nonDivDefs = expDefs.filter((v) => {
      const d = defMap.get(v.kpi_definition_id);
      return !isDividendExpense(d?.code) && !isDividendExpense(d?.label);
    });

    const sumDiv = divDefs.reduce((acc, v) => acc + (v.value_numeric || 0), 0);
    const sumNonDiv = nonDivDefs.reduce(
      (acc, v) => acc + (v.value_numeric || 0),
      0,
    );

    const expTotalRow = pVals.find((v) => v.kpi_definition_id === expDefId);
    const revTotalRow = pVals.find(
      (v) => defMap.get(v.kpi_definition_id)?.code === "revenue_total",
    );

    const currentExpTotal = expTotalRow?.value_numeric;
    const revTotal = revTotalRow?.value_numeric;

    // If there are breakdown expense rows, operational expenses is sum of non-div items.
    // If no breakdown rows, operational expenses is currentExpTotal.
    let operationalExpenses = currentExpTotal;
    if (expDefs.length > 0) {
      operationalExpenses = sumNonDiv;
    } else if (currentExpTotal != null && sumDiv > 0) {
      operationalExpenses = currentExpTotal - sumDiv;
    }

    console.log(`\nProcessing Gym ${gymId} Period ${periodId}:`);
    console.log(`  Raw exp total in DB: ${currentExpTotal}`);
    console.log(`  Operational exp (excluding dividends): ${operationalExpenses}`);
    console.log(`  Dividends total: ${sumDiv}`);
    console.log(`  Revenue: ${revTotal}`);

    const rowsToUpsert = [];

    // 1. Update expenses_total if different
    if (operationalExpenses != null) {
      rowsToUpsert.push({
        gym_id: gymId,
        period_id: periodId,
        kpi_definition_id: expDefId,
        value_numeric: operationalExpenses,
        meta_json: expTotalRow?.meta_json ?? {},
      });
    }

    // 2. Upsert dividends_total
    rowsToUpsert.push({
      gym_id: gymId,
      period_id: periodId,
      kpi_definition_id: divDefId,
      value_numeric: sumDiv,
      meta_json: {
        breakdown: Object.fromEntries(
          divDefs.map((d) => [
            defMap.get(d.kpi_definition_id)?.code ?? "dividend",
            d.value_numeric,
          ]),
        ),
      },
    });

    // 3. Upsert operational_result if revTotal is present and operationalExpenses is present
    if (revTotal != null && operationalExpenses != null) {
      const opResult = revTotal - operationalExpenses;
      console.log(`  Computed operational_result: ${opResult}`);
      rowsToUpsert.push({
        gym_id: gymId,
        period_id: periodId,
        kpi_definition_id: opDefId,
        value_numeric: opResult,
        meta_json: {},
      });
    }

    if (rowsToUpsert.length > 0) {
      const { error: upErr } = await supabase
        .from("kpi_values")
        .upsert(rowsToUpsert, {
          onConflict: "gym_id,period_id,kpi_definition_id",
        });

      if (upErr) {
        console.error(`  Failed to upsert for period ${periodId}:`, upErr);
      } else {
        console.log(`  Successfully updated ${rowsToUpsert.length} KPI values for period ${periodId}`);
      }
    }
  }

  console.log("\nMigration completed successfully!");
}

main();
