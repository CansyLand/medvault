"use client";

import { useState } from "react";
import { DocumentIcon } from "./Icons";

type PropertiesSectionProps = {
  properties: Record<string, string>;
  onSetProperty: (key: string, value: string) => void;
  onDeleteProperty: (key: string) => void;
  disabled: boolean;
};

// Helper to determine record type from key name
function getRecordType(key: string): { type: string; iconClass: string } {
  const lowerKey = key.toLowerCase();
  if (lowerKey.includes('lab') || lowerKey.includes('blood') || lowerKey.includes('test')) {
    return { type: 'Lab', iconClass: 'lab' };
  }
  if (lowerKey.includes('mri') || lowerKey.includes('xray') || lowerKey.includes('ct') || lowerKey.includes('imaging') || lowerKey.includes('scan')) {
    return { type: 'Imaging', iconClass: 'imaging' };
  }
  if (lowerKey.includes('rx') || lowerKey.includes('prescription') || lowerKey.includes('medication')) {
    return { type: 'Rx', iconClass: 'rx' };
  }
  if (lowerKey.includes('note') || lowerKey.includes('visit') || lowerKey.includes('consult')) {
    return { type: 'Notes', iconClass: 'notes' };
  }
  return { type: 'Record', iconClass: 'default' };
}

export function PropertiesSection({ properties, onSetProperty, onDeleteProperty, disabled }: PropertiesSectionProps) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const propertyKeys = Object.keys(properties).sort();

  const handleAddProperty = () => {
    if (!newKey.trim()) return;
    onSetProperty(newKey.trim(), newValue);
    setNewKey("");
    setNewValue("");
  };

  const handleStartEdit = (key: string) => {
    setEditingKey(key);
    setEditValue(properties[key]);
  };

  const handleSaveEdit = () => {
    if (editingKey) {
      onSetProperty(editingKey, editValue);
      setEditingKey(null);
      setEditValue("");
    }
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditValue("");
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="font-merriweather">Medical Records</h2>
        <span className="badge">{propertyKeys.length}</span>
      </div>
      <p className="section-desc">
        Store encrypted medical records. All data syncs instantly across your devices.
      </p>

      {/* Add new record */}
      <div className="add-property-form">
        <input
          type="text"
          placeholder="Record name"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          disabled={disabled}
          className="input-small"
        />
        <input
          type="text"
          placeholder="Value or description"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          disabled={disabled}
          onKeyDown={(e) => e.key === "Enter" && handleAddProperty()}
        />
        <button onClick={handleAddProperty} disabled={disabled || !newKey.trim()}>
          Add Record
        </button>
      </div>

      {/* Property list */}
      {propertyKeys.length === 0 ? (
        <div className="empty-state">
          <DocumentIcon className="w-12 h-12" style={{ opacity: 0.2 }} />
          <p>No medical records yet</p>
          <span className="empty-hint">Add your first encrypted record above</span>
        </div>
      ) : (
        <ul className="property-list">
          {propertyKeys.map((key) => {
            const recordType = getRecordType(key);
            return (
              <li key={key} className="property-item">
                {editingKey === key ? (
                  <div className="property-edit">
                    <span className="property-key">{key}</span>
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit();
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                      autoFocus
                      disabled={disabled}
                    />
                    <div className="property-actions">
                      <button className="small" onClick={handleSaveEdit} disabled={disabled}>
                        Save
                      </button>
                      <button className="small secondary" onClick={handleCancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={`record-type-icon ${recordType.iconClass}`}>
                      {recordType.type.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="property-content" onClick={() => handleStartEdit(key)}>
                      <span className="property-key">{key}</span>
                      <span className="property-value">{properties[key] || <em className="empty">empty</em>}</span>
                    </div>
                    <button
                      className="small danger"
                      onClick={() => onDeleteProperty(key)}
                      disabled={disabled}
                    >
                      Delete
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
