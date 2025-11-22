export const book_room = {
  type: 'function',
  name: 'book_room',
  description:
    'Creates a room booking for the guest for the given dates. Use this only after the guest has confirmed the dates, room type, bed preferences, and occupancy.',
  strict: true,
  parameters: {
    type: 'object',
    properties: {
      // Stay dates
      startDate: {
        type: 'string',
        format: 'date',
        description:
          'The check-in date in YYYY-MM-DD format. The guest stays the night starting from this date.',
      },
      
      endDate: {
        type: 'string',
        format: 'date',
        description: 'The check-out date in YYYY-MM-DD format. The guest leaves on this date.',
      },

      // Guest identity
      firstName: {
        type: 'string',
        description: "Guest's first name as it should appear on the booking.",
      },
      
      lastName: {
        type: 'string',
        description: "Guest's last name as it should appear on the booking.",
      },
      
      mobileNumber: {
        type: 'string',
        description: "Guest's 10-digit mobile phone number (for example: 9876543210).",
      },

      // Rooms in this booking
      rooms: {
        type: 'array',
        description:
          'List of room selections for this booking. Use one item per distinct combination of room type, bed configuration, and occupancy.',
        items: {
          type: 'object',
          properties: {
            roomType: {
              type: 'string',
              description:
                'The room type requested. Use the hotel-specific value if known (for example "Deluxe", "Superior", "Suite", or an internal code).',
            },
            bedConfiguration: {
              type: 'string',
              description:
                'Requested bed setup for this room. Examples: "one king", "two twins", "one queen", "one king plus sofa bed". If the guest did not specify, set this to "not specified" and ask the guest a follow up question in conversation.',
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              description:
                'How many rooms of this exact type, bed configuration, and occupancy to book for these dates.',
            },

            // Occupancy per room
            adults: {
              type: 'integer',
              minimum: 1,
              description: 'Number of adults per room for this room selection.',
            },
            children: {
              type: ['integer', 'null'],
              minimum: 0,
              description:
                'Number of children per room for this room selection. Use 0 if there are no children.',
            },
            childAges: {
              type: 'array',
              items: {
                type: ['integer', 'null'],
                minimum: 0,
              },
              description:
                'Ages of each child per room for this room selection, if provided by the guest. Leave as an empty array if not specified.',
            },
          },
          required: ['roomType', 'bedConfiguration', 'quantity', 'adults', 'children', 'childAges'],
          additionalProperties: false,
        },
        minItems: 1,
      },

      // Free text notes
      specialRequests: {
        type: 'string',
        description:
          'Optional free text for any non structured requests. Examples: "lower floors only", "away from elevator", "early check-in if possible", "interconnected rooms". If there are no special requests, send an empty string.',
      },
    },
    required: [
      'startDate',
      'endDate',
      'firstName',
      'lastName',
      'mobileNumber',
      'rooms',
      'specialRequests',
    ],
    additionalProperties: false,
  },
};
