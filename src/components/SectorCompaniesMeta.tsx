"use client";

import type { ReactNode } from "react";
import type { SectorCompanies } from "@/types/issueDocent";

const compactGroupLimit = 2;
const compactCompanyLimit = 2;
const fallbackSectorLabel = "기타";

interface SectorCompanySummaryGroup {
  key: string;
  sectorLabel: string;
  allCompanyNames: string[];
  visibleCompanyNames: string[];
  hiddenCompanyCount: number;
}

export function summarizeSectorCompanyGroups(groups: SectorCompanies[]) {
  const visibleGroups = groups.slice(0, compactGroupLimit).map((group, groupIndex) => {
    const allCompanyNames = group.companies.map((company) => company.name);

    return {
      key: `${group.sector ?? fallbackSectorLabel}-${groupIndex}`,
      sectorLabel: group.sector ?? fallbackSectorLabel,
      allCompanyNames,
      visibleCompanyNames: allCompanyNames.slice(0, compactCompanyLimit),
      hiddenCompanyCount: Math.max(allCompanyNames.length - compactCompanyLimit, 0),
    } satisfies SectorCompanySummaryGroup;
  });

  return {
    visibleGroups,
    expandedGroups: groups.map((group, groupIndex) => ({
      key: `${group.sector ?? fallbackSectorLabel}-${groupIndex}`,
      sectorLabel: group.sector ?? fallbackSectorLabel,
      allCompanyNames: group.companies.map((company) => company.name),
      visibleCompanyNames: group.companies.map((company) => company.name),
      hiddenCompanyCount: 0,
    })),
    hiddenGroupCount: Math.max(groups.length - compactGroupLimit, 0),
  };
}

function metaHeightClass(rowCount: number) {
  if (rowCount <= 1) return "h-[26px]";
  if (rowCount === 2) return "h-[58px]";
  return "h-[90px]";
}

function SectorLabel({ children }: { children: string }) {
  return (
    <span className="shrink-0 rounded-[5px] border border-[#f1d2c6] bg-[#fff3ee] px-2 py-0.5 text-[12px] font-semibold leading-5 text-[#b65335]">
      {children}
    </span>
  );
}

function CompanyChip({ children }: { children: string }) {
  return (
    <span className="shrink-0 rounded-full border border-[#e0e0e0] bg-[#fbfcfd] px-2.5 py-0.5 text-[12px] font-medium leading-5 text-[#333333]">
      {children}
    </span>
  );
}

function MoreChip({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 rounded-full border border-[#e0e0e0] bg-white px-2.5 py-0.5 text-[12px] font-medium leading-5 text-[#7a7a7a]">
      {children}
    </span>
  );
}

function CompactGroup({ group }: { group: SectorCompanySummaryGroup }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <SectorLabel>{group.sectorLabel}</SectorLabel>
      {group.visibleCompanyNames.length > 0 && (
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-hidden">
          {group.visibleCompanyNames.map((companyName, companyIndex) => (
            <CompanyChip key={`${companyName}-${companyIndex}`}>{companyName}</CompanyChip>
          ))}
          {group.hiddenCompanyCount > 0 && (
            <MoreChip>외 {group.hiddenCompanyCount}</MoreChip>
          )}
        </div>
      )}
    </div>
  );
}

function ExpandedGroup({ group }: { group: SectorCompanySummaryGroup }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <SectorLabel>{group.sectorLabel}</SectorLabel>
      {group.allCompanyNames.length > 0 && (
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto whitespace-nowrap">
          {group.allCompanyNames.map((companyName, companyIndex) => (
            <CompanyChip key={`${companyName}-${companyIndex}`}>{companyName}</CompanyChip>
          ))}
        </div>
      )}
    </div>
  );
}

export function SectorCompaniesMeta({ groups }: { groups: SectorCompanies[] }) {
  if (groups.length === 0) return null;

  const summary = summarizeSectorCompanyGroups(groups);
  const compactRowCount = summary.visibleGroups.length + (summary.hiddenGroupCount > 0 ? 1 : 0);

  return (
    <div
      className={`group relative mt-5 overflow-hidden text-[13px] ${metaHeightClass(compactRowCount)}`}
    >
      <div className="absolute inset-0 grid content-start gap-1.5 transition-opacity duration-150 group-hover:opacity-0 group-focus:opacity-0 group-focus-within:opacity-0">
        {summary.visibleGroups.map((group) => (
          <CompactGroup key={group.key} group={group} />
        ))}
        {summary.hiddenGroupCount > 0 && (
          <div className="text-[12px] font-semibold leading-5 text-[#7a7a7a]">
            +{summary.hiddenGroupCount}개 섹터
          </div>
        )}
      </div>

      <div className="absolute inset-0 grid content-start gap-1.5 overflow-y-auto pr-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100 group-focus-within:opacity-100">
        {summary.expandedGroups.map((group) => (
          <ExpandedGroup key={group.key} group={group} />
        ))}
      </div>
    </div>
  );
}
