"use client";

import { useMemo } from "react";
import type { MedicalRecord } from "../types/medical";
import { getRecordTypeIconClass } from "../types/medical";
import { getTypeConfig } from "./RecordTypeFilter";

interface TimelineRecord {
  key: string;
  record: MedicalRecord;
  pdfKey?: string;
}

interface TimelineViewProps {
  records: TimelineRecord[];
  onRecordClick: (record: MedicalRecord, pdfKey?: string) => void;
  className?: string;
}

// Group records by date (year-month)
interface TimelineGroup {
  label: string;
  date: Date;
  records: TimelineRecord[];
}

export function TimelineView({
  records,
  onRecordClick,
  className = "",
}: TimelineViewProps) {
  // Group records by month
  const groupedRecords = useMemo(() => {
    const groups: Map<string, TimelineGroup> = new Map();

    records.forEach((item) => {
      const dateStr = item.record.date || item.record.createdAt;
      const date = new Date(dateStr);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      
      if (!groups.has(monthKey)) {
        groups.set(monthKey, {
          label: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
          date,
          records: [],
        });
      }
      
      groups.get(monthKey)!.records.push(item);
    });

    // Sort groups by date (newest first)
    return Array.from(groups.values()).sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
  }, [records]);

  if (records.length === 0) {
    return (
      <div className={`timeline-empty ${className}`}>
        <p>No records to display</p>
      </div>
    );
  }

  return (
    <div className={`timeline-view ${className}`}>
      {groupedRecords.map((group) => (
        <div key={group.label} className="timeline-group">
          <div className="timeline-month-label">{group.label}</div>
          <div className="timeline-items">
            {group.records.map((item) => {
              const typeConfig = getTypeConfig(item.record.type);
              const recordDate = new Date(item.record.date || item.record.createdAt);
              
              return (
                <div
                  key={item.key}
                  className="timeline-item"
                  onClick={() => onRecordClick(item.record, item.pdfKey)}
                >
                  <div className="timeline-connector">
                    <div 
                      className="timeline-dot"
                      style={{ backgroundColor: typeConfig.color }}
                    />
                    <div className="timeline-line" />
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-date">
                      {recordDate.toLocaleDateString("en-US", { 
                        month: "short", 
                        day: "numeric" 
                      })}
                    </div>
                    <div className="timeline-card">
                      <div className="timeline-card-header">
                        <div 
                          className={`record-type-icon ${getRecordTypeIconClass(item.record.type)}`}
                          style={{ width: "28px", height: "28px", fontSize: "0.6rem" }}
                        >
                          {typeConfig.label.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="timeline-card-title">
                          <span className="timeline-record-title">{item.record.title}</span>
                          <span className="timeline-record-type">{typeConfig.label}</span>
                        </div>
                      </div>
                      {item.record.summary && (
                        <p className="timeline-card-summary">
                          {item.record.summary.slice(0, 120)}
                          {item.record.summary.length > 120 ? "..." : ""}
                        </p>
                      )}
                      {item.record.provider && (
                        <div className="timeline-card-meta">
                          <span>Provider: {item.record.provider}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
