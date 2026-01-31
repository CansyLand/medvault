"use client";

import { useState, useMemo, useEffect } from "react";
import { HeartIcon, PlusIcon } from "./Icons";
import type { SharesResponse, PublicProfile } from "../lib/api";
import { getPublicProfiles } from "../lib/api";

export interface PatientInfo {
  entityId: string;
  displayName: string;
  recordCount: number;
  lastActivity?: string;
}

interface PatientListPanelProps {
  shares: SharesResponse;
  selectedPatientId: string | null;
  onSelectPatient: (patientId: string | null) => void;
  onAddPatient: (entityId: string) => void;
  className?: string;
}

export function PatientListPanel({
  shares,
  selectedPatientId,
  onSelectPatient,
  onAddPatient,
  className = "",
}: PatientListPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPatientId, setNewPatientId] = useState("");
  const [patientProfiles, setPatientProfiles] = useState<Record<string, PublicProfile>>({});

  // Derive patient list from incoming shares (unique sourceEntityIds)
  const patientIds = useMemo(() => {
    const ids = new Set<string>();
    shares.incoming.forEach((share) => {
      ids.add(share.sourceEntityId);
    });
    return Array.from(ids);
  }, [shares.incoming]);

  // Count records per patient
  const recordCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    shares.incoming.forEach((share) => {
      counts[share.sourceEntityId] = (counts[share.sourceEntityId] || 0) + 1;
    });
    return counts;
  }, [shares.incoming]);

  // Fetch patient profiles
  useEffect(() => {
    if (patientIds.length === 0) return;

    getPublicProfiles(patientIds)
      .then((profiles) => {
        setPatientProfiles(profiles);
      })
      .catch((err) => {
        console.error("Failed to fetch patient profiles:", err);
      });
  }, [patientIds]);

  // Build patient info list
  const patients: PatientInfo[] = useMemo(() => {
    return patientIds.map((id) => {
      const profile = patientProfiles[id];
      return {
        entityId: id,
        displayName: profile?.displayName || `Patient ${id.slice(0, 8)}...`,
        recordCount: recordCounts[id] || 0,
      };
    });
  }, [patientIds, patientProfiles, recordCounts]);

  const handleAddPatient = () => {
    if (!newPatientId.trim()) return;
    onAddPatient(newPatientId.trim());
    setNewPatientId("");
    setShowAddForm(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddPatient();
    } else if (e.key === "Escape") {
      setShowAddForm(false);
      setNewPatientId("");
    }
  };

  return (
    <div className={`patient-list-panel ${className}`}>
      <div className="patient-list-header">
        <h3>Patients</h3>
        <span className="patient-count">{patients.length}</span>
      </div>

      {/* Add Patient Button/Form */}
      {showAddForm ? (
        <div className="add-patient-form">
          <input
            type="text"
            placeholder="Enter patient entity ID..."
            value={newPatientId}
            onChange={(e) => setNewPatientId(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <div className="add-patient-actions">
            <button className="small" onClick={handleAddPatient}>
              Add
            </button>
            <button
              className="small secondary"
              onClick={() => {
                setShowAddForm(false);
                setNewPatientId("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          className="add-patient-btn"
          onClick={() => setShowAddForm(true)}
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add Patient</span>
        </button>
      )}

      {/* Patient List */}
      <div className="patient-list">
        {patients.length === 0 ? (
          <div className="patient-list-empty">
            <HeartIcon className="w-6 h-6" style={{ opacity: 0.3 }} />
            <p>No patients yet</p>
            <span>Add a patient by their entity ID</span>
          </div>
        ) : (
          patients.map((patient) => (
            <button
              key={patient.entityId}
              className={`patient-item ${
                selectedPatientId === patient.entityId ? "active" : ""
              }`}
              onClick={() => onSelectPatient(patient.entityId)}
            >
              <div className="patient-avatar">
                <HeartIcon className="w-4 h-4" />
              </div>
              <div className="patient-info">
                <span className="patient-name">{patient.displayName}</span>
                <span className="patient-meta">
                  {patient.recordCount} record{patient.recordCount !== 1 ? "s" : ""}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* View All / Deselect */}
      {selectedPatientId && (
        <button
          className="view-all-btn"
          onClick={() => onSelectPatient(null)}
        >
          View All Records
        </button>
      )}
    </div>
  );
}
