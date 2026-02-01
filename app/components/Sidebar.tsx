"use client";

import { useState, useEffect } from "react";
import { ShieldIcon, DocumentIcon, ShareIcon, DeviceIcon, SettingsIcon, NetworkIcon, HistoryIcon, ChevronLeftIcon, ChevronRightIcon } from "./Icons";
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
    // Data Requests is now integrated into Sharing section as a tab
    { id: "sharing", label: "Sharing", icon: <ShareIcon className="w-5 h-5" />, badgeKey: isPatient ? "sharing" : undefined },
    { id: "activity", label: "Activity Log", icon: <HistoryIcon className="w-5 h-5" /> },
    { id: "devices", label: "Devices", icon: <DeviceIcon className="w-5 h-5" /> },
    { id: "settings", label: "Settings", icon: <SettingsIcon className="w-5 h-5" /> },
  ];

  return items;
};

type SidebarProps = {
  activeSection: string;
  onSectionChange: (section: string) => void;
  connected: boolean;
  onLogout: () => void;
  entityRole?: EntityRole | null;
  pendingRequestsCount?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function Sidebar({ 
  activeSection, 
  onSectionChange, 
  connected, 
  onLogout, 
  entityRole,
  pendingRequestsCount = 0,
  isCollapsed = false,
  onToggleCollapse,
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

  const getRoleShortLabel = (role: EntityRole | null | undefined) => {
    if (role === "doctor") return "DR";
    if (role === "patient") return "PT";
    return null;
  };

  const isPatient = entityRole === "patient";
  const navItems = getNavItems(isPatient);

  const getBadgeCount = (badgeKey: string | undefined): number => {
    if (badgeKey === "sharing") return pendingRequestsCount;
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
      <aside className={`sidebar ${mobileOpen ? "open" : ""} ${isCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="brand">
            <div className="logo">
              <ShieldIcon className="w-6 h-6" />
            </div>
            {!isCollapsed && <span className="brand-name">MedVault</span>}
          </div>
          {entityRole && (
            <div className={`role-badge ${entityRole} ${isCollapsed ? "collapsed" : ""}`}>
              {isCollapsed ? getRoleShortLabel(entityRole) : getRoleLabel(entityRole)}
            </div>
          )}
          {onToggleCollapse && (
            <button 
              className="sidebar-collapse-btn"
              onClick={onToggleCollapse}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRightIcon className="w-4 h-4" />
              ) : (
                <ChevronLeftIcon className="w-4 h-4" />
              )}
            </button>
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
                title={isCollapsed ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
                {badgeCount > 0 && (
                  <span className={`nav-badge ${isCollapsed ? "collapsed" : ""}`}>{badgeCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout} title={isCollapsed ? "Log out" : undefined}>
            {isCollapsed ? (
              <span style={{ fontSize: '1.25rem' }}>↩</span>
            ) : (
              "Log out"
            )}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
    </>
  );
}
