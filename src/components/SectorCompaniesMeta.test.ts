import assert from "node:assert/strict";
import test from "node:test";
import { summarizeSectorCompanyGroups } from "./SectorCompaniesMeta.js";
import type { SectorCompanies } from "@/types/issueDocent";

const groups: SectorCompanies[] = [
  {
    sector: "전기·전자",
    companies: [
      { company_id: 1, name: "삼성전자", market: "KOSPI" },
      { company_id: 2, name: "SK하이닉스", market: "KOSPI" },
      { company_id: 3, name: "LG에너지솔루션", market: "KOSPI" },
      { company_id: 4, name: "에코프로비엠", market: "KOSDAQ" },
    ],
  },
  {
    sector: "건설",
    companies: [{ company_id: 5, name: "현대건설", market: "KOSPI" }],
  },
  {
    sector: null,
    companies: [{ company_id: null, name: "미분류 종목", market: null }],
  },
];

test("summarizes sector groups for compact issue cards", () => {
  const summary = summarizeSectorCompanyGroups(groups);

  assert.equal(summary.hiddenGroupCount, 1);
  assert.deepEqual(
    summary.visibleGroups.map((group) => ({
      sectorLabel: group.sectorLabel,
      visibleCompanyNames: group.visibleCompanyNames,
      hiddenCompanyCount: group.hiddenCompanyCount,
    })),
    [
      {
        sectorLabel: "전기·전자",
        visibleCompanyNames: ["삼성전자", "SK하이닉스"],
        hiddenCompanyCount: 2,
      },
      {
        sectorLabel: "건설",
        visibleCompanyNames: ["현대건설"],
        hiddenCompanyCount: 0,
      },
    ],
  );
});

test("uses fallback label for groups without a sector", () => {
  const summary = summarizeSectorCompanyGroups([groups[2]]);

  assert.equal(summary.hiddenGroupCount, 0);
  assert.equal(summary.visibleGroups[0].sectorLabel, "기타");
  assert.deepEqual(summary.visibleGroups[0].visibleCompanyNames, ["미분류 종목"]);
});
