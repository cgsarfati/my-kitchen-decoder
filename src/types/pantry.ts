export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export const COMMON_UNITS = [
  'g', 'kg', 'ml', 'l', 'cup', 'cups', 'tbsp', 'tsp',
  'oz', 'lb', 'piece', 'pieces', 'clove', 'cloves',
  'slice', 'slices', 'bunch', 'can', 'cans',
] as const;
