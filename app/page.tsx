"use client";

import { useState, useCallback, useEffect } from "react";
import { Toaster } from "sonner";
import { useVault } from "./hooks/useVault";
import { useDataRequests } from "./hooks/useDataRequests";
import { LoginView } from "./components/LoginView";
import { Sidebar } from "./components/Sidebar";
import { PropertiesSection } from "./components/PropertiesSection";
import { MedicalRecordsSection } from "./components/MedicalRecordsSection";
import { SharingSection } from "./components/SharingSection";
import { EnhancedSharingSection } from "./components/EnhancedSharingSection";
import { DevicesSection } from "./components/DevicesSection";
import { SettingsSection } from "./components/SettingsSection";
import { AccessNetworkFlow } from "./components/AccessNetworkFlow";
import { ActivityLogSection } from "./components/ActivityLogSection";
import { ChatAssistant } from "./components/ChatAssistant";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { PropertyKeyPrefixes, getDisplayName } from "./types/medical";

export default function HomePage() {
  const vault = useVault();
  const [activeSection, setActiveSection] = useState("records");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Sidebar collapsed state with localStorage persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored === 'true') {
      setIsSidebarCollapsed(true);
    }
  }, []);
  
  const handleToggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => {
      const newValue = !prev;
      localStorage.setItem('sidebar-collapsed', String(newValue));
      return newValue;
    });
  }, []);
  
  // Data requests hook (only active when signed in)
  const dataRequests = useDataRequests(vault.signedIn ? vault.entityId : null);

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

  // Show onboarding wizard for new users who haven't completed setup
  if (vault.isOnboardingComplete === false && vault.entityRole) {
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
        <OnboardingWizard
          role={vault.entityRole}
          onComplete={vault.saveProfile}
          isSubmitting={vault.isSavingProfile}
        />
      </>
    );
  }

  // Show profile editing wizard
  if (isEditingProfile && vault.entityRole) {
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
        <OnboardingWizard
          role={vault.entityRole}
          onComplete={async (profile) => {
            await vault.saveProfile(profile);
            setIsEditingProfile(false);
          }}
          isSubmitting={vault.isSavingProfile}
          initialProfile={vault.userProfile}
          isEditing
          onCancel={() => setIsEditingProfile(false)}
        />
      </>
    );
  }

  // Show loading while checking onboarding status
  if (vault.isOnboardingComplete === null) {
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
            <h1 className="font-merriweather">Loading...</h1>
            <p className="login-desc">Preparing your secure vault...</p>
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

      <div className={`app-layout ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          connected={vault.connected}
          onLogout={vault.logout}
          entityRole={vault.entityRole}
          pendingRequestsCount={dataRequests.pendingCount}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />

        <main className="main-content">
          {activeSection === "records" && (
            <MedicalRecordsSection
              properties={vault.properties}
              onSetProperty={vault.setProperty}
              onDeleteProperty={vault.deleteProperty}
              onRenameRecord={vault.renameRecord}
              disabled={vault.isBusy || !vault.connected}
              entityRole={vault.entityRole}
              entityId={vault.entityId}
              uploaderName={vault.userProfile ? getDisplayName(vault.userProfile) : undefined}
              shares={vault.shares}
              sharedData={vault.sharedData}
              allPatients={vault.allPatients}
              onRegisterPatient={vault.registerPatient}
              onRequestData={vault.entityRole === "doctor" ? async (patientId, requestedTypes, message) => {
                await dataRequests.sendRequest(patientId, requestedTypes, message);
              } : undefined}
              isRequestingData={dataRequests.isSendingRequest}
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
                userDisplayName={vault.userProfile ? getDisplayName(vault.userProfile) : undefined}
                userRole={vault.entityRole}
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
              entityRole={vault.entityRole}
              onTransferRecords={vault.transferRecords}
              isTransferring={vault.isTransferring}
              // Data requests (patient only)
              dataRequests={dataRequests.incomingRequests}
              pendingRequestsCount={dataRequests.pendingCount}
              onFulfillRequest={async (requestId, sharedPropertyNames) => {
                // Create shares for the selected records
                for (const propertyName of sharedPropertyNames) {
                  await vault.createShareInvite(propertyName);
                }
                // Mark the request as fulfilled
                await dataRequests.fulfillRequest(requestId, sharedPropertyNames);
              }}
              onDeclineRequest={async (requestId) => {
                await dataRequests.declineRequest(requestId);
              }}
              isFulfillingRequest={dataRequests.isFulfillingRequest}
              isDecliningRequest={dataRequests.isDecliningRequest}
            />
          )}

          {activeSection === "activity" && (
            <ActivityLogSection events={vault.events} />
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
              entityRole={vault.entityRole}
              userProfile={vault.userProfile}
              onReset={vault.resetEverything}
              onEditProfile={() => setIsEditingProfile(true)}
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
