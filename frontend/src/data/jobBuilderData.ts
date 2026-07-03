import type { WorkOrder, OperatorInfo } from '../types';

export const mockWorkOrders: WorkOrder[] = [
  {
    id: 'wo-1',
    workOrderNumber: 'WO-2024-001',
    productName: 'Mango Juice 500ml Bottles',
    targetQuantity: 5000,
    unit: 'Bottles',
    status: 'pending',
  },
  {
    id: 'wo-2',
    workOrderNumber: 'WO-2024-002',
    productName: 'Pineapple Juice 1L Cartons',
    targetQuantity: 3000,
    unit: 'Cartons',
    status: 'pending',
  },
  {
    id: 'wo-3',
    workOrderNumber: 'WO-2024-003',
    productName: 'Mixed Fruit Juice 250ml',
    targetQuantity: 8000,
    unit: 'Bottles',
    status: 'in_progress',
  },
  {
    id: 'wo-4',
    workOrderNumber: 'WO-2024-004',
    productName: 'Dairy Yoghurt Cups',
    targetQuantity: 4000,
    unit: 'Cups',
    status: 'pending',
  },
];

export const mockOperatorsForAssignment: OperatorInfo[] = [
  {
    id: 'op-1',
    name: 'Wasswa Job',
    phone: '+256 700 456 789',
    skills: ['Pasteurization', 'Blender Ops', 'Filling', 'QC Certified'],
    status: 'active',
  },
  {
    id: 'op-2',
    name: 'Nakato Grace',
    phone: '+256 700 111 222',
    skills: ['Pasteurization', 'QC Certified', 'Washing'],
    status: 'active',
  },
  {
    id: 'op-3',
    name: 'Okello David',
    phone: '+256 700 333 444',
    skills: ['Filling', 'Capping', 'Labeling', 'Packaging'],
    status: 'active',
  },
  {
    id: 'op-4',
    name: 'Nankinga Sarah',
    phone: '+256 700 555 666',
    skills: ['Mixing', 'Blender Ops', 'QC Certified'],
    status: 'active',
  },
  {
    id: 'op-5',
    name: 'Kato Peter',
    phone: '+256 700 777 888',
    skills: ['Washing', 'Pulping', 'Maintenance'],
    status: 'on-break',
  },
  {
    id: 'op-6',
    name: 'Auma Lydia',
    phone: '+256 700 999 000',
    skills: ['Labeling', 'Packaging', 'QC Certified'],
    status: 'active',
  },
  {
    id: 'op-7',
    name: 'Ssentongo Mark',
    skills: ['QC Certified', 'Lab Testing', 'Pasteurization'],
    status: 'active',
  },
  {
    id: 'op-jim',
    name: 'Jim Kim',
    phone: '+256700333222',
    skills: ['Sorting', 'Washing', 'Maintenance', 'QC Certified'],
    status: 'active' as const,
  },
  {
    id: 'op-8',
    name: 'Babirye Janet',
    skills: ['QC Certified', 'Leadership', 'All Stations'],
    status: 'active',
  },
];
