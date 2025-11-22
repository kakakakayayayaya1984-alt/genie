import {
  GUESTS_BASE_SYSTEM,
  PROSPECTS_BASE_SYSTEM,
  GUESTS_METADATA_REQUIREMENT,
  PROSPECTS_METADATA_REQUIREMENT,
} from './prompts/Base.prompt.js';
import { ROOM_BOOKING_PROMPT } from './prompts/BookRoom.prompt.js';
import { MENU_ENQUIRY_PROMPT } from './prompts/MenuEnquiry.prompt.js';
import { MUSIC_PROMPT } from './prompts/Music.prompt.js';
import { ORDER_FOOD_PROMPT } from './prompts/OrderFood.prompt.js';
import { book_room } from './tools/book_room.tool.js';
import { create_hotel_requests } from './tools/create_hotel_requests.tool.js';
import { fetch_menu_items } from './tools/fetch_menu_items.tool.js';
import { fetch_menu_sections } from './tools/fetch_menu_sections.tool.js';
import { get_amenities } from './tools/get_amenities.tool.js';
import { get_available_rooms } from './tools/get_available_rooms.tool.js';
import { get_booking_details } from './tools/get_booking_details.tool.js';
import { get_concierge_services } from './tools/get_concierge_services.tool.js';
import { get_hotel_details } from './tools/get_hotel_details.tool.js';
import { get_previous_requests } from './tools/get_previous_requests.tool.js';
import { order_food } from './tools/order_food.tool.js';

export function getPromptsAndTools({ intents, isProspect }) {
  const tools = [];
  const toolSet = new Set();

  const prompts = [];
  const promptSet = new Set();

  if (isProspect) {
    prompts.push(PROSPECTS_BASE_SYSTEM);
    prompts.push(PROSPECTS_METADATA_REQUIREMENT);
  } else {
    prompts.push(GUESTS_BASE_SYSTEM);
    prompts.push(GUESTS_METADATA_REQUIREMENT);
  }

  for (const intent of intents) {
    switch (intent) {
      case 'menu_enquiry': {
        toolSet.add(fetch_menu_items);

        promptSet.add(MENU_ENQUIRY_PROMPT);

        continue;
      }

      case 'fetch_menu_items': {
        toolSet.add(fetch_menu_items);
        toolSet.add(fetch_menu_sections);

        promptSet.add(MENU_ENQUIRY_PROMPT);

        continue;
      }

      case 'fetch_menu_sections': {
        toolSet.add(fetch_menu_items);
        toolSet.add(fetch_menu_sections);

        promptSet.add(MENU_ENQUIRY_PROMPT);

        continue;
      }

      case 'get_amenities': {
        toolSet.add(get_amenities);
        continue;
      }
      case 'get_concierge': {
        toolSet.add(get_concierge_services);
        toolSet.add(create_hotel_requests);
        continue;
      }
      case 'get_hotel_details': {
        toolSet.add(get_hotel_details);
        continue;
      }
      case 'get_directions': {
        toolSet.add(get_hotel_details);
        continue;
      }
      case 'get_hours': {
        continue;
      }

      case 'leave_feedback': {
        toolSet.add(create_hotel_requests);
        continue;
      }
      case 'help': {
        toolSet.add(create_hotel_requests);
        continue;
      }
      case 'repeat': {
        continue;
      }

      case 'out_of_scope': {
        continue;
      }
      case 'unknown': {
        continue;
      }
      case 'negative_confirmation': {
        continue;
      }
      case 'room_availability': {
        toolSet.add(get_available_rooms);
        continue;
      }

      case 'book_room': {
        toolSet.add(get_available_rooms);
        toolSet.add(book_room);

        promptSet.add(ROOM_BOOKING_PROMPT);
        continue;
      }

      case 'inquire_pricing': {
        toolSet.add(get_available_rooms);
        continue;
      }

      // For guests only

      case 'create_hotel_request': {
        toolSet.add(create_hotel_requests);
        continue;
      }
      case 'order_food': {
        toolSet.add(fetch_menu_items);
        toolSet.add(order_food);

        promptSet.add(MENU_ENQUIRY_PROMPT);
        promptSet.add(ORDER_FOOD_PROMPT);

        continue;
      }

      case 'get_booking_details': {
        toolSet.add(get_booking_details);
        continue;
      }
      case 'get_previous_requests': {
        toolSet.add(get_previous_requests);
        continue;
      }
      case 'order_status': {
        toolSet.add(get_previous_requests);
        continue;
      }
      case 'request_status': {
        toolSet.add(get_previous_requests);
        continue;
      }
      case 'cancel_request': {
        toolSet.add(get_previous_requests);
        toolSet.add(create_hotel_requests);
        continue;
      }
      case 'modify_request': {
        toolSet.add(get_previous_requests);
        toolSet.add(create_hotel_requests);
        continue;
      }
      case 'play_music': {
        promptSet.add(MUSIC_PROMPT);

        continue;
      }
      case 'stop_music': {
        promptSet.add(MUSIC_PROMPT);

        continue;
      }

      case 'get_contact': {
        toolSet.add(get_hotel_details);
        continue;
      }
      case 'get_billing_info': {
        toolSet.add(create_hotel_requests);
        toolSet.add(get_booking_details);
        continue;
      }
      case 'cancel': {
        continue;
      }
      case 'small_talk': {
        continue;
      }
      case 'general_knowledge': {
        continue;
      }
    }
  }

  for (const tool of toolSet) {
    tools.push(tool);
  }

  for (const prompt of promptSet) {
    prompts.push(prompt);
  }

  return { tools, prompts };
}
