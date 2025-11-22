export const fetch_menu_sections = {
  type: 'function',
  name: 'fetch_menu_sections',
  description:
    "A quick way to find out what's on the menu, this function fetches the restaurant menu sections for the current hotel, with a few sample items under each section",
  strict: true,
  parameters: {
    type: 'object',
    properties: {
      itemsPerSection: {
        type: 'integer',
        description: 'Specifies how many sample items per section to retrieve',
        minimum: 5,
        maximum: 50,
        default: 5,
      },
    },
    required: ['itemsPerSection'],
    additionalProperties: false,
  },
};
