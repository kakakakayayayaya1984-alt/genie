export const get_available_rooms = {
  type: 'function',
  name: 'get_available_rooms',
  description: 'Returns a list of available rooms for the given dates in the hotel for the guest to choose from.',
  strict: true,
  parameters: {
    type: 'object',
    properties: {
      startDate: {
        type: 'string',
        format: 'date',
        description: 'The start date of the stay in YYYY-MM-DD format.',
      },
      endDate: {
        type: 'string',
        format: 'date',
        description: 'The end date of the stay in YYYY-MM-DD format.',
      },
    },
    required: ['startDate', 'endDate'],
    additionalProperties: false,
  },
};
