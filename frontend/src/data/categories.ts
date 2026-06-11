export const CATEGORY_GROUPS: { group: string; options: string[] }[] = [
  {
    group: 'Accessories',
    options: ['Headwear', 'Neck & Torso', 'Hands & Arms', 'Feet & Legs', 'Bags', 'Jewelry'],
  },
  {
    group: 'Clothing',
    options: ['Sweaters', 'Tops', 'Bottoms', 'Dresses & Suits', 'Intimate Apparel', 'Outerwear'],
  },
  {
    group: 'Home Decor & Utility',
    options: ['Blankets', 'Cleaning', 'Tabletop', 'Containers', 'Pillows'],
  },
  {
    group: 'Toys, Pets & Novelties',
    options: ['Amigurumi & Toys', 'Pet Items', 'Holiday & Seasonal', 'Components'],
  },
]

export const ALL_CATEGORIES = CATEGORY_GROUPS.flatMap(g => g.options)
