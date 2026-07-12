import type { ProcessEntry } from '../types';

// Mock data reproducing the exact entries visible in the O1 (Assigned Process List)
// reference screenshots for operator "Jim Kim". Replace with a live query once the
// REST/Socket layer described in the Architecture doc (§2.2.1) is wired up.
export const mockAssignedEntries: ProcessEntry[] = [
  {
    id: 'entry-1',
    jobId: 'JOB-6A20526A',
    jobProductName: 'Pineapple Juice 1L Cartons',
    parentJobName: 'Morning Pinaapp',
    stageName: 'Juice Extraction',
    stationTag: 'Station B',
    estimatedDurationMinutes: 60,
    status: 'AVAILABLE',
    elapsedSeconds: 0,
  },
  {
    id: 'entry-2',
    jobId: 'JOB-6A20526A',
    jobProductName: 'Pineapple Juice 1L Cartons',
    parentJobName: 'Morning Pinaapp',
    stageName: 'Juice Extraction',
    stationTag: 'Station B',
    estimatedDurationMinutes: 60,
    status: 'AVAILABLE',
    elapsedSeconds: 0,
  },
  {
    id: 'entry-3',
    jobId: 'JOB-628E7AAF',
    jobProductName: 'Mango Juice 500ml Bottles',
    parentJobName: 'orange wakiso',
    stageName: 'Mango Pulp Blending',
    stationTag: 'Station E',
    estimatedDurationMinutes: 75,
    status: 'AVAILABLE',
    elapsedSeconds: 0,
  },
  {
    id: 'entry-b677e0b5',
    jobId: 'JOB-B677E0B5',
    jobProductName: 'Dairy Yoghurt Cups',
    parentJobName: 'Strawberry Yoghurt Kisaasi',
    stageName: 'Quality Inspection Gate',
    stationTag: 'QC Station',
    estimatedDurationMinutes: 30,
    status: 'RUNNING',
    elapsedSeconds: 91, // 00:01:31 as seen elsewhere in the reference set
  },
  {
    id: 'entry-f1d66620',
    jobId: 'JOB-F1D66620',
    jobProductName: 'Mango Juice 500ml Bottles',
    parentJobName: 'xcfdg',
    stageName: 'Mango Pulp Blending',
    stationTag: 'Station E',
    estimatedDurationMinutes: 75,
    status: 'AVAILABLE',
    elapsedSeconds: 0,
  },
  {
    id: 'entry-3802cb6d',
    jobId: 'JOB-3802CB6D',
    jobProductName: 'Mango Juice 500ml Bottles',
    parentJobName: 'Evening Mango Juice',
    stageName: 'UHT Pasteurization',
    stationTag: 'Station C',
    estimatedDurationMinutes: 90,
    status: 'AVAILABLE',
    elapsedSeconds: 0,
  },
  // The detailed O2/O3 reference screens are all for this entry — full
  // guidelines + checklist + quantity + QC sections attached.
  {
    id: 'entry-e1f601bd',
    jobId: 'JOB-E1F601BD',
    jobProductName: 'Mixed Fruit Juice 250ml',
    parentJobName: 'Orange & Passion Juice',
    stageName: 'TetraPak Filling',
    stationTag: 'Station D',
    estimatedDurationMinutes: 45,
    status: 'AVAILABLE',
    elapsedSeconds: 0,
    guidelines: {
      content:
        'Ensure sterile conditions. Fill containers to specified volume. Seal and check integrity of each package.',
      diagram: { feed: 'Feed', process: 'Process', output: 'Output' },
    },
    checklist: {
      timing: 'Both',
      items: [
        { id: 'c1', text: 'Verify sterile chamber integrity before start', checked: false },
        { id: 'c2', text: 'Check H₂O₂ bath concentration (target: 35%)', checked: false },
        { id: 'c3', text: 'Confirm fill volume calibration (1000ml ±5ml)', checked: false },
        { id: 'c4', text: 'Run seal integrity test on first 10 units', checked: false },
      ],
    },
    quantity: { batchesRecorded: 0 },
    qcForm: {
      questions: [
        { id: 'q1', questionText: 'Seal integrity check passed on sample units?', responseType: 'PASS_FAIL', value: null },
        { id: 'q2', questionText: 'Units filled this hour', responseType: 'NUMERIC', value: null },
        { id: 'q3', questionText: 'Any fill volume deviations noted?', responseType: 'TEXT', value: null },
      ],
    },
  },
];

export function getEntryById(id: string): ProcessEntry | undefined {
  return mockAssignedEntries.find((e) => e.id === id);
}