export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  cost?: number;
  expiresAt?: string;
}

export const COMMON_UNITS = [
  'g', 'kg', 'oz', 'lb',
  'ml', 'l', 'cup', 'tbsp', 'tsp',
  'clove', 'can', 'slice', 'bunch',
] as const;
