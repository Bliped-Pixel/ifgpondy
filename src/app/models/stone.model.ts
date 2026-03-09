export interface StoneSize {
  id: string;
  dimension: string; // e.g., "2x2", "3x3", "4x4"
  quantity: number;
  unit: 'sq-ft' | 'pieces';
}

export interface Stone {
  id: string;
  name: string;
  type: string;
  color: string;
  pricePerUnit: number;
  stockQuantity: number;
  sizes: StoneSize[];
  lastRestocked: Date;
  supplier: string;
  description?: string;
  imageUrl?: string;
}

export const PRESET_SIZES: StoneSize[] = [
  { id: '1', dimension: '2x2', quantity: 0, unit: 'sq-ft' },
  { id: '2', dimension: '3x3', quantity: 0, unit: 'sq-ft' },
  { id: '3', dimension: '4x4', quantity: 0, unit: 'sq-ft' },
  { id: '4', dimension: '5x5', quantity: 0, unit: 'sq-ft' },
  { id: '5', dimension: '6x6', quantity: 0, unit: 'sq-ft' },
  { id: '6', dimension: '2x1', quantity: 0, unit: 'sq-ft' },
  { id: '7', dimension: '3x1.5', quantity: 0, unit: 'sq-ft' },
  { id: '8', dimension: '12x12', quantity: 0, unit: 'pieces' },
  { id: '9', dimension: '18x18', quantity: 0, unit: 'pieces' },
  { id: '10', dimension: '24x24', quantity: 0, unit: 'pieces' }
];
