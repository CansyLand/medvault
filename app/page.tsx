"use client";

import { useState } from "react";
import { Toaster } from "sonner";
import { useVault } from "./hooks/useVault";
import { LoginView } from "./components/LoginView";
import { Sidebar } from "./components/Sidebar";
import { PropertiesSection } from "./components/PropertiesSection";
import { MedicalRecordsSection } from "./components/MedicalRecordsSection";
import { SharingSection } from "./components/SharingSection";
import { EnhancedSharingSection } from "./components/EnhancedSharingSection";
import { DevicesSection } from "./components/DevicesSection";
import { SettingsSection } from "./components/SettingsSection";
import { AccessNetworkFlow } from "./components/AccessNetworkFlow";
import { ChatAssistant } from "./components/ChatAssistant";
import { PropertyKeyPrefixes } from "./types/medical";

export default function HomePage() {
  const vault = useVault();
  const [activeSection, setActiveSection] = useState("records");

  // Show login view if not signed in
  if (!vault.signedIn) {
    return (
      <>
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#ffffff",
              color: "#0f172a",
              border: "1px solid #e2e8f0"
            }
          }}
        />
        <LoginView
          onLogin={vault.login}
          isLoggingIn={vault.isLoggingIn}
          supportsPasskeys={vault.supportsPasskeys}
        />
      </>
    );
  }

  // Show loading state if missing key
  if (!vault.hasKey) {
    return (
      <>
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#ffffff",
              color: "#0f172a",
              border: "1px solid #e2e8f0"
            }
          }}
        />
        <main className="login-page">
          <div className="login-card">
            <h1 className="font-merriweather">Missing Key</h1>
            <p className="login-desc">
              This device is authenticated but missing the encryption key.
              Link it using an invite code from another device.
            </p>
            <DevicesSection
              generatedInvite={vault.generatedInvite}
              onGenerateInvite={vault.generateInvite}
              onLinkDevice={vault.linkDevice}
              disabled={vault.isBusy}
              isGenerating={vault.isGeneratingInvite}
              isLinking={vault.isLinking}
            />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#ffffff",
            color: "#0f172a",
            border: "1px solid #e2e8f0"
          }
        }}
      />

      <div className="app-layout">
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          entityId={vault.entityId}
          connected={vault.connected}
          onLogout={vault.logout}
        />

        <main className="main-content">
          {activeSection === "records" && (
            <MedicalRecordsSection
              properties={vault.properties}
              onSetProperty={vault.setProperty}
              onDeleteProperty={vault.deleteProperty}
              disabled={vault.isBusy || !vault.connected}
            />
          )}

          {activeSection === "network" && (
            <div className="section">
              <div className="section-header">
                <h2 className="font-merriweather">Access Network</h2>
              </div>
              <p className="section-desc">
                Visualize and manage who has access to your medical data. Each connection represents shared records.
              </p>
              <AccessNetworkFlow
                shares={vault.shares}
                sharedData={vault.sharedData}
                onRevokeShare={(params) => vault.removeShare(params)}
              />
            </div>
          )}

          {activeSection === "sharing" && (
            <EnhancedSharingSection
              properties={vault.properties}
              shares={vault.shares}
              sharedData={vault.sharedData}
              onCreateShare={vault.createShareInvite}
              onAcceptShare={vault.acceptShare}
              onRemoveShare={vault.removeShare}
              generatedShare={vault.generatedShare}
              disabled={vault.isBusy}
              isCreating={vault.isCreatingShare}
              isAccepting={vault.isAcceptingShare}
            />
          )}

          {activeSection === "devices" && (
            <DevicesSection
              generatedInvite={vault.generatedInvite}
              onGenerateInvite={vault.generateInvite}
              onLinkDevice={vault.linkDevice}
              disabled={vault.isBusy}
              isGenerating={vault.isGeneratingInvite}
              isLinking={vault.isLinking}
            />
          )}

          {activeSection === "settings" && (
            <SettingsSection
              entityId={vault.entityId}
              onReset={vault.resetEverything}
              disabled={vault.isBusy}
              isResetting={vault.isResetting}
            />
          )}
        </main>
      </div>

      {/* Floating Chat Assistant */}
      <ChatAssistant
        records={Object.entries(vault.properties)
          .filter(([key]) => key.startsWith(PropertyKeyPrefixes.RECORD))
          .map(([key, value]) => ({ key, value }))}
      />
    </>
  );
}
