import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { Dashboard3D } from './components/Dashboard3D';
import { DashboardVR } from './components/DashboardVR';
import { ThreatDashboard } from './components/ThreatDashboard';
import { UserGuideModal } from './components/UserGuideModal';
import { OnboardingTour } from './components/OnboardingTour';
import { DashboardMode } from './types';

function App() {
  const [viewMode, setViewMode] = useState<'2d' | '3d' | 'vr' | 'threat3d'>('threat3d');
  const [mode, setMode] = useState<DashboardMode>('crypto');
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);

  const handleOpenGuide = () => setIsGuideOpen(true);
  const handleStartTour = () => setIsTourOpen(true);

  return (
    <>
      {viewMode === 'vr' ? (
        <DashboardVR
          mode={mode}
          onModeSwitch={setMode}
          onViewModeSwitch={setViewMode}
          onOpenGuide={handleOpenGuide}
          onStartTour={handleStartTour}
        />
      ) : viewMode === 'threat3d' ? (
        <ThreatDashboard
          mode={mode}
          onModeSwitch={setMode}
          viewMode={viewMode}
          onViewModeSwitch={setViewMode}
          onOpenGuide={handleOpenGuide}
          onStartTour={handleStartTour}
        />
      ) : viewMode === '3d' ? (
        <Dashboard3D
          mode={mode}
          onModeSwitch={setMode}
          viewMode={viewMode}
          onViewModeSwitch={setViewMode}
          onOpenGuide={handleOpenGuide}
          onStartTour={handleStartTour}
        />
      ) : (
        <Dashboard
          mode={mode}
          onModeSwitch={setMode}
          viewMode={viewMode}
          onViewModeSwitch={setViewMode}
          onOpenGuide={handleOpenGuide}
          onStartTour={handleStartTour}
        />
      )}

      {/* Interactive User Guide Modal */}
      <UserGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Interactive Step-by-Step Onboarding Tour */}
      <OnboardingTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onSwitchMode={setViewMode}
      />
    </>
  );
}

export default App;
