export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export const COMMON_UNITS = [
  'g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp',
  'oz', 'lb', 'piece', 'clove',
  'slice', 'bunch', 'can',
] as const;
