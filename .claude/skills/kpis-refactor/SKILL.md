---
name: kpis-refactor
description: Guia para refatorar seções do dashboard para a arquitetura de vertical slices estabelecida na página /kpis. Use quando o usuário pedir para refatorar uma área do app seguindo o mesmo padrão.
---

# Guia de Refactor: Vertical Slices no Dashboard

Este guia documenta a arquitetura e as decisões tomadas ao refatorar a página `/kpis`. Siga este padrão ao refatorar qualquer outra área do dashboard.

## Estrutura de diretórios

Cada domínio fica em `features/<domain>/` com os seguintes arquivos:

```
features/<domain>/
  types.ts                        # Tipos do domínio (KPIs, Data, Insights)
  parsers/
    get-kpis.ts                   # Parser puro: KpiMap → struct tipada
  data-access/
    get-insights.ts               # Busca insights do Supabase para este domínio
  components/
    index.tsx                     # Async Server Component principal
    KpiCards.tsx                  # Grid de cards do domínio
```

## Regras de arquitetura

### 1. Parsers são funções puras

Recebem `current`, `previous`, `currentMeta` (todos `Record<string, …>`) e retornam uma struct fortemente tipada. Sem efeitos colaterais, sem fetch.

```ts
export function getFinanceKpis({ current, previous, currentMeta }: Input): FinanceKpis {
  // só lógica de transformação de dados
}
```

Os parsers são chamados em `app/kpis/page.tsx`, não dentro dos componentes. Server Components não re-renderizam, então não há custo em manter os parsers fora.

### 2. Tipos `*Data` são contratos limpos

Os tipos passados como props para cada domain component devem conter **apenas** dados do domínio, sem `gymId`, sem `insights`:

```ts
// CORRETO
export type RetentionData = {
  kpis: RetentionKpis;
  charts: RetentionChartPayload;
  periodId: string;
  periodLabel: string;
  previousPeriodLabel?: string;
};

// ERRADO — vazar concerns globais
export type RetentionData = {
  gymId: string;           // ❌ resolvido internamente
  insights: Insight[];     // ❌ cada domínio busca os próprios
  ...
};
```

### 3. Cada domínio busca seus próprios insights

O `index.tsx` de cada domínio é `async` e chama seu próprio `get-insights.ts`. Não recebe insights como prop.

```tsx
// features/retention/components/index.tsx
export async function Retention({ data }: { data: RetentionData }) {
  const insights = await getRetentionInsights(data.periodId);
  return (
    <SectionCard ...>
      <KpiCards kpis={data.kpis} ... />
      <SectionInsights items={insights} ... />
    </SectionCard>
  );
}
```

### 4. `gymId` é resolvido internamente com `React.cache()`

Nunca passe `gymId` via props. Use `getGym()` de `lib/data/gym.ts` diretamente nos data-access. O `React.cache()` deduplica a query por request — múltiplas chamadas a `getGym()` na mesma request custam apenas uma consulta ao banco.

```ts
// lib/data/gym.ts
import { cache } from "react";

export const getGym = cache(async () => {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("gyms")
    .select("id,name,slug")
    .eq("slug", "panobianco-sjc-satelite")
    .single();
  if (error || !data) throw new Error(`Gym load failed: ${error?.message}`);
  return data;
});
```

```ts
// features/<domain>/data-access/get-insights.ts
export async function getRetentionInsights(periodId: string) {
  const [supabase, gym] = await Promise.all([
    Promise.resolve(getServiceSupabase()),
    getGym(),  // deduplicated via React.cache()
  ]);
  // ...
}
```

### 5. `force-dynamic` é necessário na página

O cliente Supabase JS não usa o `fetch` nativo do Node.js — ele usa a lib `node-fetch` internamente. Por isso o Next.js não consegue detectar automaticamente que a página é dinâmica, e a classifica como estática. Sem o flag, os dados ficam congelados no build.

```ts
// app/kpis/page.tsx
export const dynamic = "force-dynamic";
```

### 6. Nomes de variáveis descritivos (clean code)

Proibido: sufixos de uma letra (`M`, `C`, `V`), prefixos abreviados (`rev`, `mat`, `wh`, `tp`, `acc`, `roy`), helpers de uma letra (`get`, `m`).

```ts
// ERRADO
const get = (map, key) => map[key] ?? null;
const m = (key) => currentMeta[key] ?? {};
const revM = m("revenue_total");
const matRev = get(current, "matriculated_revenue");

// CORRETO
const getValue = (map, key) => map[key] ?? null;
const getMeta = (key) => currentMeta[key] ?? {};
const revenueTotalMeta = getMeta("revenue_total");
const matriculatedRevenueValue = getValue(current, "matriculated_revenue");
```

Para variáveis de período anterior, use `*PreviousValue` em vez de `*Prev`:

```ts
const revenueTotalPreviousValue = getValue(previous, "revenue_total");
```

### 7. Componentes compartilhados em `components/kpis/`

Quando o mesmo padrão de renderização aparece em múltiplos domínios, extraia para `components/kpis/`. Exemplo: `DeltaPill.tsx`.

```tsx
// components/kpis/DeltaPill.tsx
export function DeltaPill({ deltaPct, overrideDeltaPct, vsLabel, invert, integerPct }: Props) {
  // implementação única compartilhada por todos os domínios
}
```

Exceção: se a renderização tem semântica diferente (fallback, conteúdo fora do span, etc.), mantenha inline no componente do domínio.

## Checklist ao refatorar um domínio

- [ ] `features/<domain>/types.ts` — tipos `*Kpis` e `*Data` sem `gymId` e sem `insights`
- [ ] `features/<domain>/parsers/get-kpis.ts` — função pura, nomes descritivos
- [ ] `features/<domain>/data-access/get-insights.ts` — chama `getGym()` internamente
- [ ] `features/<domain>/components/index.tsx` — `async`, busca próprios insights
- [ ] `features/<domain>/components/KpiCards.tsx` — usa `DeltaPill` de `components/kpis/`
- [ ] `app/kpis/page.tsx` — chama parser, passa `*Data` limpo para o componente
- [ ] `export const dynamic = "force-dynamic"` presente na página
- [ ] Nenhum nome de variável abreviado nos parsers

## Domínios já migrados (referência)

| Domínio | Feature | Parser | Insights |
|---|---|---|---|
| Visão geral | `features/overview` | `get-kpis.ts` | `get-insights.ts` |
| Vendas & marketing | `features/sales-marketing` | `get-monthly-kpis.ts` | `get-insights.ts` (mensal + semanal) |
| Retenção | `features/retention` | `get-kpis.ts` | `get-insights.ts` |
| Financeiro | `features/finance` | `get-kpis.ts` | `get-insights.ts` |
| Previsão | `features/forecast` | — | `get-insights.ts` |
| ROI | `features/roi` | `get-kpis.ts` | `get-insights.ts` |
