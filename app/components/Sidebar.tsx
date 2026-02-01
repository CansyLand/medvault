"use client";

import { useState } from "react";
import { ShieldIcon, DocumentIcon, ShareIcon, DeviceIcon, SettingsIcon, NetworkIcon, HistoryIcon, HeartIcon } from "./Icons";
import type { EntityRole } from "../lib/api";

type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  badgeKey?: string; // Key for dynamic badge count
};

const getNavItems = (isPatient: boolean): NavItem[] => {
  const items: NavItem[] = [
    { id: "records", label: "Medical Records", icon: <DocumentIcon className="w-5 h-5" /> },
    { id: "network", label: "Access Network", icon: <NetworkIcon className="w-5 h-5" /> },
  ];

  // Add requests section for patients only
  if (isPatient) {
    items.push({ 
      id: "requests", 
      label: "Data Requests", 
      icon: <HeartIcon className="w-5 h-5" />,
      badgeKey: "requests",
    });
  }

  items.push(
    { id: "sharing", label: "Sharing", icon: <ShareIcon className="w-5 h-5" /> },
    { id: "activity", label: "Activity Log", icon: <HistoryIcon className="w-5 h-5" /> },
    { id: "devices", label: "Devices", icon: <DeviceIcon className="w-5 h-5" /> },
    { id: "settings", label: "Settings", icon: <SettingsIcon className="w-5 h-5" /> },
  );

  return items;
};

type SidebarProps = {
  activeSection: string;
  onSectionChange: (section: string) => void;
  connected: boolean;
  onLogout: () => void;
  entityRole?: EntityRole | null;
  pendingRequestsCount?: number;
};

export function Sidebar({ 
  activeSection, 
  onSectionChange, 
  connected, 
  onLogout, 
  entityRole,
  pendingRequestsCount = 0,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (id: string) => {
    onSectionChange(id);
    setMobileOpen(false);
  };

  const getRoleLabel = (role: EntityRole | null | undefined) => {
    if (role === "doctor") return "Healthcare Provider";
    if (role === "patient") return "Patient";
    return null;
  };

  const isPatient = entityRole === "patient";
  const navItems = getNavItems(isPatient);

  const getBadgeCount = (badgeKey: string | undefined): number => {
    if (badgeKey === "requests") return pendingRequestsCount;
    return 0;
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
          {entityRole && (
            <div className={`role-badge ${entityRole}`}>
              {getRoleLabel(entityRole)}
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const badgeCount = getBadgeCount(item.badgeKey);
            
            return (
              <button
                key={item.id}
                className={`nav-item ${activeSection === item.id ? "active" : ""}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {badgeCount > 0 && (
                  <span className="nav-badge">{badgeCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
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
