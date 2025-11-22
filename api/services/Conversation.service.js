import * as messageRepo from '#repositories/Message.repository.js';
import * as conversationRepo from '#repositories/Conversation.repository.js';
import * as chatGPTService from '#services/ChatGPT/ChatGPT.service.js';
import { ulid } from 'ulid';
import { toIsoString } from '#common/timestamp.helper.js';

function newMessage({ role, content, conversationId, ...props }) {
  return {
    role,
    content,
    conversationId,
    entityType: 'MESSAGE',
    messageId: ulid(),
    ...props,
  };
}

export async function handleConversation({
  hotelId,
  roomId,
  deviceId,
  bookingId,
  guestUserId,
  conversationId,
  userContent,
  isProspect,
}) {
  let conversation = null;
  let conversationState = null;
  let messagesInConversation = [];

  if (conversationId) {
    // For existing conversations, retrieve the past messages
    const all = await messageRepo.queryAllForConversation(conversationId, {
      consistentRead: true,
    });

    const messages = all.filter((i) => i.sk !== 'STATE');
    conversationState = all.filter((i) => i.sk === 'STATE')?.[0];
    messagesInConversation = messages.map((m) => ({ role: m.role, content: m.content }));
  } else {
    // Create a new conversation
    conversationId = ulid();
    conversation = {
      hotelId,
      roomId,
      conversationId,
      entityType: 'CONVERSATION',
      bookingId: bookingId,
      guestUserId,
      deviceId: deviceId,
      channel: 'android',
      isProspect,
    };
  }

  if (!conversationState) {
    conversationState = {
      pk: `CONVERSATION#${conversationId}`,
      sk: 'STATE',
      active_pk: `CONVERSATION#${conversationId}`,
      active_sk: 'STATE',
      entityType: 'CONVERSATION_STATE',
      conversationId,
      createdAt: toIsoString(),
      vegOnly: false,
      veganOnly: false,
      glutenFree: false,
      excludeAllergens: [],
      hotel_requests: [],
      order_requests: [],
      menu_items: [],
    };
  }

  const newUserMessage = newMessage({ role: 'user', content: userContent, conversationId });

  const chatGPTResponse = await chatGPTService.askChatGpt({
    userText: userContent,
    messagesInConversation,
    hotelId,
    roomId,
    deviceId,
    bookingId,
    conversationId,
    guestUserId,
    conversationState,
    isProspect,
  });

  const {
    reply,
    isUserResponseNeeded,
    canEndCall,
    agents,
    conversationState: updatedConversationState,
  } = chatGPTResponse;

  // All new messages that have to be saved
  const newMessages = [
    newUserMessage,
    newMessage({ role: 'assistant', content: reply, conversationId }),
  ];
  // Now we save everything in the db
  await conversationRepo.saveConversationEntities(
    conversation,
    newMessages,
    updatedConversationState
  );

  const response = {
    conversationId,
    message: reply,
    isConversationOpen: isUserResponseNeeded,
    canEndCall,
    agents,
    // requests: savedRequests.map(requestResponse),
  };

  return response;
}
