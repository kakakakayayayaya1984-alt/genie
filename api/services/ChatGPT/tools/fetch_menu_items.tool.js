import { Allergens, Categories, Cuisines } from '#Constants/menu.constants.js';

export const fetch_menu_items = {
  type: 'function',
  name: 'fetch_menu_items',
  description:
    'Fetches the restaurant menu items for the current hotel, optionally filtered or searched.',
  strict: true,
  parameters: {
    type: 'object',
    properties: {
      searchText: {
        type: ['string', 'null'],
        description:
          "Free-text search across item names and descriptions. Example: 'paneer butter masala', 'soup', 'pizza'.",
      },
      cuisines: {
        type: 'array',
        items: {
          type: 'string',
          enum: Cuisines,
        },
      },
      categories: {
        type: 'array',
        items: {
          type: 'string',
          enum: Categories,
        },
        description:
          "Filter by menu categories like 'starter', 'main_course', 'dessert', 'bread', 'beverage'.",
      },
      vegOnly: {
        type: ['boolean', 'null'],
        description:
          'If true, only return vegetarian dishes. Use when guest explicitly asks for veg/veggie/vegetarian items.',
      },
      veganOnly: {
        type: ['boolean', 'null'],
        description:
          'If true, only return vegan dishes. Use when guest explicitly asks for vegan items.',
      },
      glutenFree: {
        type: ['boolean', 'null'],
        description:
          'If true, only return gluten free dishes. Use when guest explicitly asks for gluten free items.',
      },
      excludeAllergens: {
        type: 'array',
        items: {
          type: 'string',
          enum: Allergens,
        },
      },
      includeUnavailable: {
        type: 'boolean',
        description:
          'If true, include items that are currently unavailable. Default is false (only show available items).',
      },
      maxItems: {
        type: 'integer',
        description:
          'Maximum number of items to return. Use small limits (e.g. 50) for broad questions.',
        minimum: 5,
        maximum: 50,
        default: 5,
      },
    },
    required: [
      'searchText',
      'cuisines',
      'categories',
      'vegOnly',
      'veganOnly',
      'glutenFree',
      'includeUnavailable',
      'excludeAllergens',
      'maxItems',
    ],
    additionalProperties: false,
  },
};
