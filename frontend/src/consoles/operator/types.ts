// Types for the Operator console (O1–O3).
// Mirrors the JobStage / Blueprint snapshot fields from the Architecture doc §3.2.6 and §3.2.3.

export type ProcessEntryStatus = 'AVAILABLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED';

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface QcQuestion {
  id: string;
  questionText: string;
  responseType: 'PASS_FAIL' | 'NUMERIC' | 'TEXT' | 'YES_NO';
  value: string | null;
}

export interface GuidelinesDiagram {
  feed: string;
  process: string;
  output: string;
}

// A JobStage assigned to the logged-in operator, with its blueprint-snapshot
// sections (guidelines / checklist / quantity / QC) resolved inline for rendering.
export interface ProcessEntry {
  id: string;
  jobId: string; // human-readable, e.g. "JOB-6A20526A"
  jobProductName: string; // e.g. "Pineapple Juice 1L Cartons"
  parentJobName: string; // e.g. "Morning Pinaapp"
  stageName: string; // e.g. "Juice Extraction"
  stationTag: string;
  estimatedDurationMinutes: number;
  status: ProcessEntryStatus;
  isEmergencyStopped?: boolean; // distinct visual treatment per O1 edge case

  // Blueprint-snapshot optional sections — each may be absent.
  guidelines?: {
    content: string;
    diagram?: GuidelinesDiagram;
  };
  checklist?: {
    items: ChecklistItem[];
    timing: 'Before Start' | 'Before End' | 'Both';
  };
  quantity?: {
    batchesRecorded: number;
  };
  qcForm?: {
    questions: QcQuestion[];
  };

  elapsedSeconds: number;
}