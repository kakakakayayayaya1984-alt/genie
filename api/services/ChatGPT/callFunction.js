import { Department } from '#Constants/department.constants.js';
import { queryHotelMeta } from '#repositories/Hotel.repository.js';
import {
  getMobileRegistryByMobile,
  transactCreateUserWithMobileGuard,
} from '#repositories/User.repository.js';
import { getBookingById } from '#services/Booking.service.js';
import { getHotelById } from '#services/Hotel.service.js';
import { handleFetchMenuItems, handleFetchMenuSections } from '#services/Menu.service.js';
import { createRequest, listRequestsByBooking } from '#services/Request.service.js';
import { ulid } from 'ulid';
import { summarizeRequests } from './summarizers/request.summarizer.js';
import { summarizeBookingArgs } from './summarizers/booking.summarizer.js';

async function create_hotel_requests_handler({
  args,
  hotelId,
  roomId,
  deviceId,
  bookingId,
  conversationId,
  guestUserId,
}) {
  const requests = await Promise.all(
    args?.requests?.map((a) => {
      return createRequest({
        hotelId,
        roomId,
        deviceId,
        bookingId,
        conversationId,
        guestUserId,

        department: a.department,
        requestType: a.requestType,
        details: a.details,
        priority: a.priority,
        cart: a.cart,
      });
    })
  );

  return summarizeRequests(requests);
}

export const callFunction = async ({
  name,
  args,
  hotelId,
  roomId,
  deviceId,
  bookingId,
  conversationId,
  guestUserId,
  conversationState,
  isProspect,
}) => {
  switch (name) {
    case 'book_room': {
      if (!guestUserId) {
        // Ensure or create guest by mobile
        const mobileNumber = String(args.mobileNumber).trim();
        let guestUser = await getMobileRegistryByMobile(mobileNumber);

        if (!guestUser) {
          const userId = ulid();
          const newUser = {
            userId,
            entityType: 'USER',
            firstName: args.firstName || '',
            lastName: args.lastName || '',
            mobileNumber: mobileNumber,
            roles: ['guest'],
          };
          await transactCreateUserWithMobileGuard({ user: newUser });
          guestUser = newUser;
          guestUserId = guestUser.userId;
        }
      }

      const { requestType, details } = summarizeBookingArgs(args);

      return await create_hotel_requests_handler({
        args: {
          requests: [
            {
              department: Department.FRONT_OFFICE,
              requestType,
              details,
              priority: 'high',
            },
          ],
        },
        hotelId,
        conversationId,
        guestUserId,
        isProspect,
      });
    }

    case 'get_available_rooms': {
      const rooms = [
        {
          roomType: 'Deluxe Room',
          bedConfigurations: ['one king', 'two twins'],
          maxOccupancy: 3,
          pricePerNight: 4500,
          availableRooms: 4,
        },
        {
          roomType: 'Superior Room',
          bedConfigurations: ['one queen'],
          maxOccupancy: 2,
          pricePerNight: 3800,
          availableRooms: 2,
        },
        {
          roomType: 'Suite',
          bedConfigurations: ['one king'],
          maxOccupancy: 4,
          pricePerNight: 8200,
          availableRooms: 1,
        },
      ];

      // You can add logic here if you want to simulate no availability for specific dates.

      return {
        startDate: args.startDate,
        endDate: args.endDate,
        availableRooms: rooms,
      };
    }

    case 'fetch_menu_items': {
      if (args.vegOnly === undefined || args.vegOnly === null)
        args.vegOnly = conversationState.vegOnly;

      if (args.veganOnly === undefined || args.veganOnly === null)
        args.veganOnly = conversationState.veganOnly;

      if (args.glutenFree === undefined || args.glutenFree === null)
        args.glutenFree = conversationState.glutenFree;

      if (args.excludeAllergens === undefined || args.excludeAllergens === null)
        args.excludeAllergens = conversationState.excludeAllergens;

      return await handleFetchMenuItems({ hotelId, args });
    }

    case 'fetch_menu_sections':
      return await handleFetchMenuSections({ hotelId, args });

    case 'get_amenities':
      return await queryHotelMeta({ hotelId, entityType: 'AMENITY' });

    case 'get_booking_details': {
      return await getBookingById({ hotelId, bookingId });
    }

    case 'get_concierge_services':
      return await queryHotelMeta({ hotelId, entityType: 'CONCIERGE' });

    case 'get_hotel_details':
      return await getHotelById(hotelId);

    case 'get_previous_requests': {
      const requests = await listRequestsByBooking({ bookingId: bookingId });
      return summarizeRequests(requests.items);
    }

    case 'create_hotel_requests':
      return await create_hotel_requests_handler({
        args,
        hotelId,
        roomId,
        deviceId,
        bookingId,
        conversationId,
        guestUserId,
        isProspect,
      });

    case 'order_food':
      return await create_hotel_requests_handler({
        args: {
          requests: [
            {
              department: Department.ROOM_SERVICE,
              requestType: args.requestType,
              details: args.details,
              priority: 'high',
              cart: args.cart,
            },
          ],
        },
        hotelId,
        roomId,
        deviceId,
        bookingId,
        conversationId,
        guestUserId,
        isProspect,
      });
  }
};
