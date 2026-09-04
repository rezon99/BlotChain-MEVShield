import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { Dashboard3D } from './components/Dashboard3D';
import { DashboardVR } from './components/DashboardVR';
import { DashboardMode } from './types';

function App() {
  const [viewMode, setViewMode] = useState<'2d' | '3d' | 'vr'>('2d');
  const [mode, setMode] = useState<DashboardMode>('crypto');

  if (viewMode === 'vr') {
    return (
      <DashboardVR
        mode={mode}
        onModeSwitch={setMode}
        onViewModeSwitch={setViewMode}
      />
    );
  }

  return viewMode === '2d' ? (
    <Dashboard
      mode={mode}
      onModeSwitch={setMode}
      viewMode={viewMode}
      onViewModeSwitch={setViewMode}
    />
  ) : (
    <Dashboard3D
      mode={mode}
      onModeSwitch={setMode}
      viewMode={viewMode}
      onViewModeSwitch={setViewMode}
    />
  );
}

export default App;
