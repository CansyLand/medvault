"use client";

import { useMemo } from "react";
import type { MedicalRecordType } from "../types/medical";

export type FilterableRecordType = MedicalRecordType | "all";

interface RecordTypeCount {
  type: FilterableRecordType;
  label: string;
  count: number;
  color: string;
}

interface RecordTypeFilterProps {
  recordCounts: Record<MedicalRecordType, number>;
  selectedTypes: FilterableRecordType[];
  onToggleType: (type: FilterableRecordType) => void;
  className?: string;
}

const TYPE_CONFIG: Record<MedicalRecordType, { label: string; color: string }> = {
  lab_report: { label: "Lab", color: "#3b82f6" },
  imaging: { label: "Imaging", color: "#a855f7" },
  prescription: { label: "Rx", color: "#22c55e" },
  clinical_notes: { label: "Notes", color: "#f59e0b" },
  insurance: { label: "Insurance", color: "#6366f1" },
  immunization: { label: "Vaccines", color: "#14b8a6" },
  allergy: { label: "Allergies", color: "#ef4444" },
  vital_signs: { label: "Vitals", color: "#ec4899" },
  document: { label: "Docs", color: "#64748b" },
  other: { label: "Other", color: "#94a3b8" },
};

export function RecordTypeFilter({
  recordCounts,
  selectedTypes,
  onToggleType,
  className = "",
}: RecordTypeFilterProps) {
  // Calculate total count
  const totalCount = useMemo(() => {
    return Object.values(recordCounts).reduce((sum, count) => sum + count, 0);
  }, [recordCounts]);

  // Build filter options with counts
  const filterOptions: RecordTypeCount[] = useMemo(() => {
    const options: RecordTypeCount[] = [
      { type: "all", label: "All", count: totalCount, color: "var(--teal-deep)" },
    ];

    // Add types that have records
    (Object.keys(TYPE_CONFIG) as MedicalRecordType[]).forEach((type) => {
      const count = recordCounts[type] || 0;
      if (count > 0) {
        options.push({
          type,
          label: TYPE_CONFIG[type].label,
          count,
          color: TYPE_CONFIG[type].color,
        });
      }
    });

    return options;
  }, [recordCounts, totalCount]);

  const isAllSelected = selectedTypes.includes("all") || selectedTypes.length === 0;

  return (
    <div className={`record-type-filter ${className}`}>
      {filterOptions.map((option) => {
        const isSelected = option.type === "all" 
          ? isAllSelected 
          : selectedTypes.includes(option.type);

        return (
          <button
            key={option.type}
            className={`filter-chip ${isSelected ? "active" : ""}`}
            onClick={() => onToggleType(option.type)}
            style={{
              "--chip-color": option.color,
            } as React.CSSProperties}
          >
            <span className="filter-chip-label">{option.label}</span>
            <span className="filter-chip-count">{option.count}</span>
          </button>
        );
      })}
    </div>
  );
}

// Helper to get display info for a record type
export function getTypeConfig(type: MedicalRecordType) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.other;
}
