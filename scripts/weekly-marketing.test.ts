import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { assemblePayloadFromNormalized } from "../lib/data/vendas-marketing-assembler";
import {
  assembleSmPayload,
  buildWeeklyStrings,
  compFromPayload,
  funnelToState,
} from "../app/kpis/entrada-dados/lib/payloads";

function octoberPayload() {
  return assemblePayloadFromNormalized({
    funilMensal: null,
    marketingSemanal: [
      { week_num: 1, reach: 9.3612, views: 23.8979, frequency: 2.4, followers: 9 },
      { week_num: 2, reach: 86_087, views: 0, frequency: null, followers: null },
      { week_num: 4, reach: 10.0105, views: 24.3855, frequency: null, followers: null },
    ],
    funilSemanal: [],
    conversoesSemanal: [],
    recepcaoSemanal: [],
    consultoras: [],
    periodLabel: "Out/26",
  });
}

test("weekly marketing reads legacy counts as the full digits shown in data entry", () => {
  const { marketing } = octoberPayload().weekly;
  assert.deepEqual(marketing.reach, [93_612, 86_087, null, 100_105, null]);
  assert.deepEqual(marketing.views, [238_979, 0, null, 243_855, null]);
  assert.equal(marketing.frequency[0], 2.4);
  assert.equal(marketing.followers[0], 9);
  assert.equal(marketing.totals.reach, 279_804);
  assert.equal(marketing.totals.views, 482_834);
});

test("weekly reach and views save as counts even after editing a formatted cell", () => {
  const base = octoberPayload();
  const fields = buildWeeklyStrings(base);
  fields.reach[0] = "9.3612";
  fields.views[0] = "23.8979";
  fields.reach[1] = "86.087";
  fields.views[1] = "0";
  fields.frequency[0] = "2,4";
  const saved = assembleSmPayload(base, funnelToState(base), fields, [], [], "Out/26", compFromPayload(base));
  assert.deepEqual(saved.weekly.marketing.reach.slice(0, 3), [93_612, 86_087, null]);
  assert.deepEqual(saved.weekly.marketing.views.slice(0, 3), [238_979, 0, null]);
  assert.equal(saved.weekly.marketing.frequency[0], 2.4);
});

test("the weekly table shows full counts and does not mark a past month as current", (t) => {
  const requireFromTest = createRequire(import.meta.url);
  const originalCss = requireFromTest.extensions[".css"];
  requireFromTest.extensions[".css"] = (module) => { module.exports = {}; };
  t.after(() => {
    if (originalCss) requireFromTest.extensions[".css"] = originalCss;
    else delete requireFromTest.extensions[".css"];
  });
  const { WeeklyView } = requireFromTest("../app/kpis/_components/vendas-marketing/WeeklyView.tsx") as typeof import("../app/kpis/_components/vendas-marketing/WeeklyView");
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-11-25T15:00:00Z") });

  const markup = renderToStaticMarkup(createElement(WeeklyView, {
    weekly: octoberPayload().weekly,
    weekSourcePeriod: Array(5).fill("Out/26"),
    primaryPeriodLabel: "Out/26",
    calendarCurrentMonthLabel: "Nov/26",
    comparisonPeriodLabel: "Set/26",
    salesTotal: null,
    comparisonSalesTotal: null,
    comparisonPayload: null,
    activeWeekHeader: "S4",
    periodParam: "2026-10-01",
  }));
  assert.match(markup, />93\.612</);
  assert.match(markup, />238\.979</);
  assert.match(markup, /week=S4&amp;period=2026-10-01/);
  assert.doesNotMatch(markup, />Atual<| \(out\)/);
});
