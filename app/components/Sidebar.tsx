"use client";

import { useState } from "react";
import { CopyableEntityId } from "./CopyableEntityId";
import { ShieldIcon, DocumentIcon, ShareIcon, DeviceIcon, SettingsIcon, NetworkIcon } from "./Icons";

type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { id: "records", label: "Medical Records", icon: <DocumentIcon className="w-5 h-5" /> },
  { id: "network", label: "Access Network", icon: <NetworkIcon className="w-5 h-5" /> },
  { id: "sharing", label: "Sharing", icon: <ShareIcon className="w-5 h-5" /> },
  { id: "devices", label: "Devices", icon: <DeviceIcon className="w-5 h-5" /> },
  { id: "settings", label: "Settings", icon: <SettingsIcon className="w-5 h-5" /> },
];

type SidebarProps = {
  activeSection: string;
  onSectionChange: (section: string) => void;
  entityId: string | null;
  connected: boolean;
  onLogout: () => void;
};

export function Sidebar({ activeSection, onSectionChange, entityId, connected, onLogout }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (id: string) => {
    onSectionChange(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile header */}
      <header className="mobile-header">
        <button className="menu-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
          <span className="menu-icon">{mobileOpen ? "✕" : "☰"}</span>
        </button>
        <div className="mobile-title">
          <ShieldIcon className="w-5 h-5" style={{ color: 'var(--teal-deep)' }} />
          <span>MedVault</span>
        </div>
        <div className={`status-dot ${connected ? "connected" : "disconnected"}`} />
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="brand">
            <div className="logo">
              <ShieldIcon className="w-6 h-6" />
            </div>
            <span className="brand-name">MedVault</span>
          </div>
          <div className={`status-indicator ${connected ? "connected" : "disconnected"}`}>
            {connected ? "● Encrypted & Live" : "○ Offline"}
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeSection === item.id ? "active" : ""}`}
              onClick={() => handleNavClick(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {entityId && (
            <div className="entity-info">
              <span className="entity-label">Vault ID</span>
              <CopyableEntityId entityId={entityId} short className="entity-id" />
            </div>
          )}
          <button className="logout-btn" onClick={onLogout}>
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
    </>
  );
}
