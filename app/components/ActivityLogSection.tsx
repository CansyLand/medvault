"use client";

import { useState } from "react";
import type { 
  EntityEvent, 
  EventType,
  PropertySetData,
  PropertyDeletedData,
  RecordRenamedData,
  ShareCreatedData,
  ShareAcceptedData,
  ShareRevokedData,
} from "../hooks/useEventStream";
import { DocumentIcon, ShareIcon, HistoryIcon } from "./Icons";
import { CopyableEntityId } from "./CopyableEntityId";
import { getRecordTypeDisplayName, type MedicalRecordType } from "../types/medical";

type ActivityLogSectionProps = {
  events: EntityEvent[];
};

type GroupedEvents = {
  today: EntityEvent[];
  yesterday: EntityEvent[];
  earlier: EntityEvent[];
};

type ParsedRecordInfo = {
  title: string;
  type: MedicalRecordType | null;
  isPdf: boolean;
  recordId: string | null;
};

// Try to parse record info from the property value
function parseRecordInfo(key: string, value?: string): ParsedRecordInfo {
  const isPdf = key.startsWith("pdf:") || key.includes("pdf:");
  const cleanKey = key.replace(/^record:/, "").replace(/^pdf:/, "");
  
  // Default info
  const result: ParsedRecordInfo = {
    title: cleanKey,
    type: null,
    isPdf,
    recordId: cleanKey,
  };

  // For PDF data, we don't have meaningful content to parse
  if (isPdf || !value) {
    return result;
  }

  // Try to parse JSON to get title and type
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") {
      if (parsed.title) {
        result.title = parsed.title;
      }
      if (parsed.type) {
        result.type = parsed.type as MedicalRecordType;
      }
      if (parsed.id) {
        result.recordId = parsed.id;
      }
    }
  } catch {
    // Not JSON, use the key as title
  }

  return result;
}

// Get a human-readable description for the event
function getEventDescription(event: EntityEvent): { 
  action: string; 
  subject: string; 
  subjectType?: string;
  detail?: string;
  technicalId?: string;
  isShareEvent?: boolean;
  entityId?: string;
} {
  switch (event.type) {
    case "EntityCreated":
      return { 
        action: "Created", 
        subject: "your medical vault",
      };
    
    case "PropertySet": {
      const data = event.data as PropertySetData;
      const info = parseRecordInfo(data.key, data.value);
      
      if (info.isPdf) {
        return {
          action: "Added attachment for",
          subject: info.title,
          technicalId: info.recordId || undefined,
        };
      }
      
      const typeLabel = info.type ? getRecordTypeDisplayName(info.type) : "Record";
      return { 
        action: "Updated",
        subject: info.title,
        subjectType: typeLabel,
        technicalId: info.recordId || undefined,
      };
    }
    
    case "PropertyDeleted": {
      const data = event.data as PropertyDeletedData;
      const info = parseRecordInfo(data.key);
      
      if (info.isPdf) {
        return {
          action: "Removed attachment for",
          subject: info.title,
          technicalId: info.recordId || undefined,
        };
      }
      
      return { 
        action: "Deleted",
        subject: info.title,
        subjectType: "Record",
        technicalId: info.recordId || undefined,
      };
    }
    
    case "RecordRenamed": {
      const data = event.data as RecordRenamedData;
      return { 
        action: "Renamed",
        subject: data.oldName,
        detail: `→ ${data.newName}`,
        technicalId: data.key.replace(/^record:/, "") || undefined,
      };
    }
    
    case "ShareCreated": {
      const data = event.data as ShareCreatedData;
      const info = parseRecordInfo(data.propertyName);
      return { 
        action: "Generated share code for",
        subject: info.title,
        isShareEvent: true,
        technicalId: info.recordId || undefined,
      };
    }
    
    case "ShareAccepted": {
      const data = event.data as ShareAcceptedData;
      const info = parseRecordInfo(data.propertyName);
      return { 
        action: "Started receiving",
        subject: info.title,
        detail: "from another vault",
        isShareEvent: true,
        entityId: data.sourceEntityId,
        technicalId: info.recordId || undefined,
      };
    }
    
    case "ShareRevoked": {
      const data = event.data as ShareRevokedData;
      const info = parseRecordInfo(data.propertyName);
      const action = data.direction === "outgoing" 
        ? "Stopped sharing" 
        : "Stopped receiving";
      return { 
        action,
        subject: info.title,
        isShareEvent: true,
        entityId: data.entityId,
        technicalId: info.recordId || undefined,
      };
    }
    
    default:
      return { action: "Unknown", subject: "event" };
  }
}

function getEventIcon(type: EventType): React.ReactNode {
  switch (type) {
    case "EntityCreated":
      return <HistoryIcon className="w-4 h-4" />;
    case "PropertySet":
    case "PropertyDeleted":
    case "RecordRenamed":
      return <DocumentIcon className="w-4 h-4" />;
    case "ShareCreated":
    case "ShareAccepted":
    case "ShareRevoked":
      return <ShareIcon className="w-4 h-4" />;
    default:
      return <HistoryIcon className="w-4 h-4" />;
  }
}

function getEventIconClass(type: EventType): string {
  switch (type) {
    case "EntityCreated":
      return "activity-icon vault";
    case "PropertySet":
      return "activity-icon record-add";
    case "PropertyDeleted":
      return "activity-icon record-delete";
    case "RecordRenamed":
      return "activity-icon record-rename";
    case "ShareCreated":
      return "activity-icon share-out";
    case "ShareAccepted":
      return "activity-icon share-in";
    case "ShareRevoked":
      return "activity-icon share-revoke";
    default:
      return "activity-icon";
  }
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatFullTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function groupEventsByDate(events: EntityEvent[]): GroupedEvents {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

  const groups: GroupedEvents = {
    today: [],
    yesterday: [],
    earlier: [],
  };

  // Sort events by timestamp descending (newest first)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  for (const event of sortedEvents) {
    const eventDate = new Date(event.timestamp);
    if (eventDate >= todayStart) {
      groups.today.push(event);
    } else if (eventDate >= yesterdayStart) {
      groups.yesterday.push(event);
    } else {
      groups.earlier.push(event);
    }
  }

  return groups;
}

function EventItem({ event }: { event: EntityEvent }) {
  const [showDetails, setShowDetails] = useState(false);
  const desc = getEventDescription(event);

  return (
    <div className="activity-item-wrapper">
      <div 
        className="activity-item" 
        onClick={() => setShowDetails(!showDetails)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setShowDetails(!showDetails)}
      >
        <div className={getEventIconClass(event.type)}>
          {getEventIcon(event.type)}
        </div>
        <div className="activity-content">
          <div className="activity-title">
            <span className="activity-action">{desc.action}</span>
            {" "}
            <span className="activity-subject">{desc.subject}</span>
            {desc.subjectType && (
              <span className="activity-type-badge">{desc.subjectType}</span>
            )}
          </div>
          {desc.detail && (
            <div className="activity-subtitle">{desc.detail}</div>
          )}
          {desc.entityId && (
            <div className="activity-subtitle">
              <CopyableEntityId entityId={desc.entityId} short />
            </div>
          )}
        </div>
        <div className="activity-meta">
          <div className="activity-time">{formatRelativeTime(event.timestamp)}</div>
          <div className={`activity-expand-icon ${showDetails ? "expanded" : ""}`}>
            ›
          </div>
        </div>
      </div>
      
      {showDetails && (
        <div className="activity-details">
          <div className="activity-details-row">
            <span className="activity-details-label">Timestamp</span>
            <span className="activity-details-value">{formatFullTimestamp(event.timestamp)}</span>
          </div>
          <div className="activity-details-row">
            <span className="activity-details-label">Event Type</span>
            <span className="activity-details-value font-mono">{event.type}</span>
          </div>
          {desc.technicalId && (
            <div className="activity-details-row">
              <span className="activity-details-label">Record ID</span>
              <span className="activity-details-value font-mono">{desc.technicalId}</span>
            </div>
          )}
          <div className="activity-details-row">
            <span className="activity-details-label">Event ID</span>
            <span className="activity-details-value font-mono">{event.id}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function EventGroup({ label, events }: { label: string; events: EntityEvent[] }) {
  if (events.length === 0) return null;

  return (
    <div className="activity-group">
      <div className="activity-group-label">{label}</div>
      <div className="activity-list">
        {events.map((event) => (
          <EventItem key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

export function ActivityLogSection({ events }: ActivityLogSectionProps) {
  const grouped = groupEventsByDate(events);
  const hasEvents = events.length > 0;

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="font-merriweather">Activity Log</h2>
        {hasEvents && <span className="badge">{events.length}</span>}
      </div>
      <p className="section-desc">
        A complete history of changes to your medical records and sharing activity. 
        Click any event to see technical details.
      </p>

      {hasEvents ? (
        <div className="activity-timeline">
          <EventGroup label="Today" events={grouped.today} />
          <EventGroup label="Yesterday" events={grouped.yesterday} />
          <EventGroup label="Earlier" events={grouped.earlier} />
        </div>
      ) : (
        <div className="empty-state">
          <HistoryIcon className="w-12 h-12" style={{ opacity: 0.2 }} />
          <p>No activity yet</p>
          <span className="empty-hint">
            Your activity will appear here as you add records and share data
          </span>
        </div>
      )}
    </div>
  );
}
