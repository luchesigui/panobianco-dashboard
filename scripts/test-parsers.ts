import * as XLSX from "xlsx";

// 1. Mock environment variables
process.env.CRON_SECRET = "test-secret";
process.env.INTEGRATION_TOKEN = "panobiancosatelite";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";

// 2. Pre-register mocks in module cache
const Module = require("module");
const originalRequire = Module.prototype.require;

interface SavedCall {
  type: string;
  data: any;
}

export const mockActions = {
  saveMonthlyKpisAction: async (data: any) => {
    mockActions.calls.push({ type: "saveMonthlyKpis", data });
    return { ok: true };
  },
  saveSmDashboardAction: async (data: any) => {
    mockActions.calls.push({ type: "saveSmDashboard", data });
    return { ok: true };
  },
  calls: [] as SavedCall[],
};

export const mockSupabase = {
  dbCalls: [] as { table: string; method: string; data?: any }[],
  getServiceSupabase: () => {
    return {
      from: (table: string) => {
        const query: any = {
          select: (fields: string) => query,
          eq: (col: string, val: any) => query,
          is: (col: string, val: any) => query,
          order: (col: string, opts?: any) => query,
          single: async () => {
            if (table === "gyms") {
              return { data: { id: "gym-123" }, error: null };
            }
            return { data: null, error: new Error("Not found") };
          },
          maybeSingle: async () => {
            if (table === "gyms") {
              return { data: { id: "gym-123" }, error: null };
            }
            if (table === "sales_marketing_dashboard_payload") {
              return { data: { payload: null }, error: null };
            }
            return { data: null, error: null };
          },
          upsert: async (data: any) => {
            mockSupabase.dbCalls.push({ table, method: "upsert", data });
            return { error: null };
          },
        };
        query.then = (onfulfilled: any) => {
          if (table === "consultoras") {
            return Promise.resolve({
              data: [
                { id: "c1", name: "Maria Oliveira", monthly_goal: 100, sort_order: 1 },
                { id: "c2", name: "Joao Silva", monthly_goal: 150, sort_order: 2 },
              ],
              error: null,
            }).then(onfulfilled);
          }
          if (table === "conversoes_semanais") {
            const upserts = mockSupabase.dbCalls.filter(c => c.table === "conversoes_semanais");
            const data = upserts.map(u => u.data);
            return Promise.resolve({
              data: data.length > 0 ? data : [{ leads: 4, sales: 3 }],
              error: null,
            }).then(onfulfilled);
          }
          return Promise.resolve({ data: [], error: null }).then(onfulfilled);
        };
        return query;
      },
    };
  },
};

Module.prototype.require = function (id: string) {
  if (id.includes("entrada-dados/actions")) {
    return mockActions;
  }
  if (id.includes("supabase/server")) {
    return mockSupabase;
  }
  return originalRequire.apply(this, arguments);
};

// 3. Now import the handlers using require to trigger require hook interception
const { POST: recebimentosHandler } = require("../app/api/parse/recebimentos/route");
const { POST: custosHandler } = require("../app/api/parse/custos/route");
const { POST: crescimentoHandler } = require("../app/api/parse/crescimento/route");
const { POST: recuperacaoHandler } = require("../app/api/parse/recuperacao/route");
const { POST: conversionHandler } = require("../app/api/parse/conversion/route");
const { POST: renovacaoHandler } = require("../app/api/parse/renovacao/route");

function createMockExcelBuffer(data: any[]): Buffer {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

function createUploadRequest(url: string, data: any[], headers: Record<string, string> = {}): Request {
  const buffer = createMockExcelBuffer(data);
  const file = new File([new Uint8Array(buffer)], "test.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const formData = new FormData();
  formData.append("file", file);

  return new Request(url, {
    method: "POST",
    headers: {
      ...headers,
    },
    body: formData,
  });
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTests() {
  console.log("🚀 Starting API parsing routes tests...\n");

  // ==========================================
  // TEST RECEBIMENTOS
  // ==========================================
  console.log("--- Testing recebimentos ---");
  const recebimentosData = [
    { "Centro de receita": "Matriculado - Mensalidade", "Valor baixa": "R$ 1.500,00" },
    { "Centro de receita": "Wellhub - Repasse", "Valor baixa": "800,00" },
    { "Centro de receita": "Totalpass", "Valor baixa": "400,00" },
    { "Centro de receita": "Venda de Água", "Valor baixa": "150,00" },
    { "Centro de receita": "Receita Desconhecida", "Descrição": "Repasse Wellhub Maio/2026", "Valor baixa": "500,00" },
  ];

  // Test save=false
  {
    const req = createUploadRequest("http://localhost:3000/api/parse/recebimentos", recebimentosData);
    const res = await recebimentosHandler(req);
    assert(res.status === 200, "Recebimentos save=false status 200");
    const json = await res.json();
    assert(json.total === 3350, `Recebimentos total correct (got ${json.total}, expected 3350)`);
    assert(json.groups["Matriculado - Mensalidade"] === 1500, "Matriculado correct");
    assert(json.groups["Wellhub - Repasse"] === 800, "Wellhub - Repasse correct");
    assert(json.groups["Receita Wellhub"] === 500, "Receita Wellhub from description correct");
    assert(json.groups["Totalpass"] === 400, "Totalpass correct");
    assert(json.groups["Venda de Água"] === 150, "Products correct");
  }

  // Test save=true Unauthorized
  {
    const req = createUploadRequest("http://localhost:3000/api/parse/recebimentos?save=true", recebimentosData);
    const res = await recebimentosHandler(req);
    assert(res.status === 401, "Recebimentos save=true unauthorized returns 401");
  }

  // Test save=true Authorized
  {
    mockActions.calls = [];
    const req = createUploadRequest(
      "http://localhost:3000/api/parse/recebimentos?save=true&period=2026-05-01&gym=test-gym",
      recebimentosData,
      { Authorization: "Bearer test-secret" }
    );
    const res = await recebimentosHandler(req);
    if (res.status !== 200) {
      console.log("Recebimentos status:", res.status);
      console.log("Recebimentos error text:", await res.text());
    }
    assert(res.status === 200, "Recebimentos save=true status 200");
    assert(mockActions.calls.length === 1, "saveMonthlyKpisAction was called");
    const call = mockActions.calls[0];
    assert(call.data.gymSlug === "test-gym", "Passed gym slug is correct");
    assert(call.data.periodId === "2026-05-01", "Period matches");
    assert(call.data.values.matriculated_revenue === 1500, "Matriculated revenue saved");
    assert(call.data.values.wellhub_revenue === 1300, `Wellhub revenue saved (got ${call.data.values.wellhub_revenue}, expected 1300)`);
    assert(call.data.values.totalpass_revenue === 400, "Totalpass revenue saved");
    assert(call.data.values.products_revenue === 150, "Products revenue saved");
    assert(call.data.values.revenue_total === 3350, "Revenue total saved");
  }

  // Test save=true Authorized with INTEGRATION_TOKEN
  {
    mockActions.calls = [];
    const req = createUploadRequest(
      "http://localhost:3000/api/parse/recebimentos?save=true&period=2026-05-01&gym=test-gym",
      recebimentosData,
      { Authorization: "Bearer panobiancosatelite" }
    );
    const res = await recebimentosHandler(req);
    assert(res.status === 200, "Recebimentos save=true authorized with INTEGRATION_TOKEN status 200");
    assert(mockActions.calls.length === 1, "saveMonthlyKpisAction was called with INTEGRATION_TOKEN");
  }

  // ==========================================
  // TEST CUSTOS
  // ==========================================
  console.log("\n--- Testing custos ---");
  const custosData = [
    { "Centro de custo": "Aluguel", "Valor": "R$ 5.000,00" },
    { "Centro de custo": "Energia Elétrica", "Valor": "1.200,50" },
    { "Centro de custo": "Salários", "Valor": "10.000,00" },
  ];

  // Test save=false
  {
    const req = createUploadRequest("http://localhost:3000/api/parse/custos", custosData);
    const res = await custosHandler(req);
    assert(res.status === 200, "Custos save=false status 200");
    const json = await res.json();
    assert(json.total === 16200.5, `Custos total correct (got ${json.total}, expected 16200.5)`);
    assert(json.items["Aluguel"] === 5000, "Aluguel value correct");
    assert(json.items["Energia Elétrica"] === 1200.5, "Energia value correct");
    assert(json.items["Salários"] === 10000, "Salários value correct");
  }

  // Test save=true Authorized
  {
    mockActions.calls = [];
    const req = createUploadRequest(
      "http://localhost:3000/api/parse/custos?save=true&period=2026-05-01&gym=test-gym",
      custosData,
      { Authorization: "Bearer test-secret" }
    );
    const res = await custosHandler(req);
    assert(res.status === 200, "Custos save=true status 200");
    assert(mockActions.calls.length === 1, "saveMonthlyKpisAction was called for custos");
    const call = mockActions.calls[0];
    assert(call.data.values.expenses_total === 16200.5, "Expenses total saved");
    assert(call.data.expenseItems.expense_aluguel === 5000, "Expense item slugified correctly");
    assert(call.data.expenseItems.expense_energia_eletrica === 1200.5, "Expense item slugified correctly");
  }

  // ==========================================
  // TEST CRESCIMENTO
  // ==========================================
  console.log("\n--- Testing crescimento ---");
  const crescimentoData = [
    { "Ativos fim": "1000", "Novos": "50", "Cancelados": "30", "Desistências": "10" },
    { "Ativos fim": "1010", "Novos": "60", "Cancelados": "40", "Desistências": "12" }, // Only this row should be read
  ];

  // Test save=false
  {
    const req = createUploadRequest("http://localhost:3000/api/parse/crescimento", crescimentoData);
    const res = await crescimentoHandler(req);
    assert(res.status === 200, "Crescimento save=false status 200");
    const json = await res.json();
    assert(json.base_students_end === 1010, "Base students end read from last row");
    assert(json.sales_total === 60, "Sales total read from last row");
    assert(json.monthly_cancellations === 40, "Cancellations read from last row");
    assert(json.monthly_non_renewed === 12, "Non-renewed read from last row");
  }

  // Test save=true Authorized
  {
    mockActions.calls = [];
    const req = createUploadRequest(
      "http://localhost:3000/api/parse/crescimento?save=true&period=2026-05-01&gym=test-gym",
      crescimentoData,
      { Authorization: "Bearer test-secret" }
    );
    const res = await crescimentoHandler(req);
    assert(res.status === 200, "Crescimento save=true status 200");
    assert(mockActions.calls.length === 1, "saveMonthlyKpisAction called for crescimento");
    const call = mockActions.calls[0];
    assert(call.data.values.base_students_end === 1010, "base_students_end saved");
    assert(call.data.values.sales_total === 60, "sales_total saved");
  }

  // ==========================================
  // TEST RECUPERACAO
  // ==========================================
  console.log("\n--- Testing recuperacao ---");
  const recuperacaoData = [
    { "Status": "Em aberto", "Valor da divida": "R$ 150,00" },
    { "Status": "Recuperado", "Valor da Dívida": "200,00" },
    { "Status": "Cancelada", "Valor": "100,00" },
    { "Status": "Em aberto", "Valor da dívida": "300,00" },
  ];

  // Test save=false
  {
    const req = createUploadRequest("http://localhost:3000/api/parse/recuperacao", recuperacaoData);
    const res = await recuperacaoHandler(req);
    assert(res.status === 200, "Recuperacao save=false status 200");
    const json = await res.json();
    console.log("Recuperacao Response JSON:", JSON.stringify(json, null, 2));
    assert(json.open_default_count === 2, "Open count correct");
    assert(json.open_default_value === 450, "Open value correct");
    assert(json.recovered_default_count === 1, "Recovered count correct");
    assert(json.recovered_default_value === 200, "Recovered value correct");
    assert(json.cancelled_count === 1, "Cancelled count correct");
  }

  // Test save=true Authorized
  {
    mockActions.calls = [];
    const req = createUploadRequest(
      "http://localhost:3000/api/parse/recuperacao?save=true&period=2026-05-01&gym=test-gym",
      recuperacaoData,
      { Authorization: "Bearer test-secret" }
    );
    const res = await recuperacaoHandler(req);
    assert(res.status === 200, "Recuperacao save=true status 200");
    assert(mockActions.calls.length === 1, "saveMonthlyKpisAction called for recuperacao");
    const call = mockActions.calls[0];
    assert(call.data.values.open_default_count === 2, "open_default_count saved");
    assert(call.data.values.open_default_value === 450, "open_default_value saved");
    assert(call.data.values.recovered_default_count === 1, "recovered_default_count saved");
    assert(call.data.values.recovered_default_value === 200, "recovered_default_value saved");
  }

  // ==========================================
  // TEST CONVERSION (CONVERSÃO)
  // ==========================================
  console.log("\n--- Testing conversion ---");
  const conversionData = [
    { "Cadastrado por": "Maria Oliveira", "Conversão": "2026-05-10" },
    { "Cadastrado por": "Maria Oliveira", "Conversão": "" },
    { "Cadastrado por": "Joao Silva", "Conversão": "2026-05-11" },
    { "Cadastrado por": "Pedro Invalido", "Conversão": "2026-05-12" }, // unmatched consultora
  ];

  // Test save=false
  {
    const req = createUploadRequest("http://localhost:3000/api/parse/conversion", conversionData);
    const res = await conversionHandler(req);
    assert(res.status === 200, "Conversion save=false status 200");
    const json = await res.json();
    assert(json.totalLeads === 4, "Total leads count correct");
    assert(json.totalSales === 3, "Total sales count correct");
    assert(json.byReceptionist.length === 3, "Correct receptionist map size");
    const maria = json.byReceptionist.find((r: any) => r.name === "Maria Oliveira");
    assert(maria.leads === 2 && maria.sales === 1, "Maria leads/sales correct");
  }

  // Test save=true Authorized
  {
    mockActions.calls = [];
    mockSupabase.dbCalls = [];
    const req = createUploadRequest(
      "http://localhost:3000/api/parse/conversion?save=true&period=2026-05-01&gym=test-gym&weekIndex=S2",
      conversionData,
      { Authorization: "Bearer test-secret" }
    );
    const res = await conversionHandler(req);
    if (res.status !== 200) {
      const errBody = await res.text();
      console.error("Conversion Save=True Failed Body:", errBody);
    }
    assert(res.status === 200, "Conversion save=true status 200");
    
    // Should call saveMonthlyKpisAction
    assert(mockActions.calls.length === 1, `Actions called: expected 1, got ${mockActions.calls.length}`);
    
    const saveKpi = mockActions.calls.find(c => c.type === "saveMonthlyKpis");
    assert(!!saveKpi, "saveMonthlyKpisAction was called");

    // Check grand totals updated in KPIs
    assert(saveKpi!.data.values.leads_generated === 4, "Grand total leads KPI saved");
    assert(saveKpi!.data.values.sales_total === 3, "Grand total sales KPI saved");

    // Check DB upserts
    const convUpsert = mockSupabase.dbCalls.find(c => c.table === "conversoes_semanais");
    const recUpsert = mockSupabase.dbCalls.find(c => c.table === "recepcao_semanal");

    assert(!!convUpsert, "conversoes_semanais upserted");
    assert(!!recUpsert, "recepcao_semanal upserted");

    assert(convUpsert!.data.leads === 4, "Weekly leads correct");
    assert(convUpsert!.data.sales === 3, "Weekly sales correct");
  }

  // ==========================================
  // TEST RENOVAÇÃO
  // ==========================================
  console.log("\n--- Testing renovacao ---");
  const renovacaoData = [
    { "Status": "Renovação manual", "Valor do último contrato": 129.9 },
    { "Status": "Renovação Automática", "Valor do último contrato": 139.9 },
    { "Status": "Não renovado", "Valor do último contrato": 119.9 },
  ];

  // Test save=false
  {
    const req = createUploadRequest("http://localhost:3000/api/parse/renovacao", renovacaoData);
    const res = await renovacaoHandler(req);
    assert(res.status === 200, "Renovacao save=false status 200");
    const json = await res.json();
    assert(json.monthly_renewed === 2, "Renewed count correct");
    assert(json.monthly_non_renewed === 1, "Non-renewed count correct");
    assert(json.month_total_records === 3, "Total records correct");
  }

  // Test save=true Authorized
  {
    mockActions.calls = [];
    const req = createUploadRequest(
      "http://localhost:3000/api/parse/renovacao?save=true&period=2026-05-01&gym=test-gym",
      renovacaoData,
      { Authorization: "Bearer test-secret" }
    );
    const res = await renovacaoHandler(req);
    assert(res.status === 200, "Renovacao save=true status 200");
    assert(mockActions.calls.length === 1, "saveMonthlyKpisAction called for renovacao");
    const call = mockActions.calls[0];
    assert(call.data.values.monthly_renewed === 2, "monthly_renewed saved");
    assert(call.data.values.monthly_non_renewed === 1, "monthly_non_renewed saved");
  }

  console.log("\n🎉 All tests passed successfully!");
}

runTests().catch(err => {
  console.error("❌ Test run failed with error:", err);
  process.exit(1);
});
