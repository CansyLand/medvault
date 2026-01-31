"use client";

import { DocumentIcon } from "./Icons";
import type { MedicalRecord } from "../types/medical";
import { getRecordTypeDisplayName, getRecordTypeIconClass } from "../types/medical";

interface DocumentModalProps {
  record: MedicalRecord | null;
  pdfBase64?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

// Convert field keys to Title Case for display
function formatFieldName(key: string): string {
  return key
    .replace(/_/g, ' ')           // Replace underscores with spaces
    .replace(/([A-Z])/g, ' $1')   // Add space before capital letters
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function DocumentModal({ record, pdfBase64, isOpen, onClose }: DocumentModalProps) {
  if (!isOpen || !record) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div 
              className={`record-type-icon ${getRecordTypeIconClass(record.type)}`}
              style={{ width: '40px', height: '40px', fontSize: '0.85rem' }}
            >
              {getRecordTypeDisplayName(record.type).slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 style={{ 
                fontFamily: '"Merriweather", Georgia, serif',
                fontSize: '1.25rem',
                fontWeight: 700,
              }}>
                {record.title}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {getRecordTypeDisplayName(record.type)}
                {record.date && ` • ${record.date}`}
                {record.provider && ` • ${record.provider}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              fontSize: '1.25rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: 'calc(90vh - 200px)' }}>
          {/* Summary */}
          {record.summary && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Summary
              </h3>
              <p style={{ 
                padding: '1rem', 
                background: 'var(--mint-pale)', 
                borderRadius: '12px',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
              }}>
                {record.summary}
              </p>
            </div>
          )}

          {/* Structured Data */}
          {Object.keys(record.structuredData || {}).length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Key Information
              </h3>
              <div style={{ 
                padding: '1rem', 
                background: 'var(--bg-tertiary)', 
                borderRadius: '12px',
              }}>
                {Object.entries(record.structuredData).map(([key, value]) => (
                  <div key={key} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
                      {formatFieldName(key)}
                    </span>
                    <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.9rem' }}>
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PDF Preview */}
          {pdfBase64 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Document Preview
              </h3>
              <iframe
                src={`data:application/pdf;base64,${pdfBase64}`}
                style={{
                  width: '100%',
                  height: '500px',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                }}
                title="PDF Preview"
              />
            </div>
          )}

          {/* Full Content */}
          {record.content && (
            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Full Content
              </h3>
              <pre style={{ 
                padding: '1rem', 
                background: 'var(--bg-tertiary)', 
                borderRadius: '12px',
                fontSize: '0.85rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: '"JetBrains Mono", monospace',
                maxHeight: '300px',
                overflowY: 'auto',
              }}>
                {record.content}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Encrypted with XSalsa20-Poly1305
          </span>
          <button onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
