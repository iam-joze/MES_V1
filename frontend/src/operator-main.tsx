import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { OperatorHome } from './components/OperatorHome';
import { OperatorRuntime } from './components/OperatorRuntime';
import { TestHelperOverlay } from './components/TestHelperOverlay';
import { getSharedState } from './lib/sharedState';
import type { OperatorProcessStage } from './types/operatorModule';
import './index.css';

function OperatorApp() {
  const [selectedStage, setSelectedStage] = useState<OperatorProcessStage | null>(null);

  // Read operator name from shared state (set when operator logs in via UnifiedLogin)
  const sharedState = getSharedState();
  const loggedInPhone = sharedState.activeOperatorPhone;
  const operatorAccount = loggedInPhone
    ? sharedState.operators.find(o => o.phone.replace(/\s/g, '') === loggedInPhone.replace(/\s/g, ''))
    : null;
  const operatorName = operatorAccount?.name || 'Operator';

  return (
    <>
      {selectedStage ? (
        <OperatorRuntime
          stageId={selectedStage.id}
          onBack={() => setSelectedStage(null)}
        />
      ) : (
        <OperatorHome
          operatorName={operatorName}
          onSelectStage={(stage) => setSelectedStage(stage)}
        />
      )}
      <TestHelperOverlay />
    </>
  );
}

createRoot(document.getElementById('operator-root')!).render(
  <StrictMode><OperatorApp /></StrictMode>
);
