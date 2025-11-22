import OpenAIClient from '#clients/OpenAI.client.js';
import { computeJaccardScore } from '#libs/ranking.js';
import { callFunction } from './callFunction.js';
import { getPromptsAndTools } from './getPromptsAndTools.js';

const GPT_MODEL = 'gpt-4.1-mini';

export async function discoverIntents({ userText, messagesInConversation, isProspect }) {
  const resp = await OpenAIClient.responses.create({
    model: GPT_MODEL,
    text: {
      format: {
        name: 'intent',
        type: 'json_schema',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            intents: {
              type: 'array',
              description: 'one or maximum two best intents for this query',
              items: {
                type: 'string',
                enum: [
                  'menu_enquiry',
                  'fetch_menu_items',
                  'fetch_menu_sections',
                  'get_amenities',
                  'get_concierge',
                  'get_hotel_details',
                  'get_directions',
                  'get_hours',
                  'leave_feedback',
                  'help',
                  'repeat',
                  'out_of_scope',
                  'unknown',
                  'negative_confirmation',
                  'room_availability',
                  'book_room',
                  'inquire_pricing',
                  ...(isProspect
                    ? []
                    : [
                        'create_hotel_request',
                        'order_food',
                        'get_booking_details',
                        'get_previous_requests',
                        'order_status',
                        'request_status',
                        'cancel_request',
                        'modify_request',
                        'play_music',
                        'stop_music',
                        'get_contact',
                        'get_billing_info',
                        'cancel',
                        'small_talk',
                        'general_knowledge',
                      ]),
                ],
              },
            },
            confidence: { type: 'number' },
          },
          required: ['intents', 'confidence'],
        },
      },
    },
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text:
              "Classify the user's ask into one or two intent" +
              'Return ONLY JSON matching the schema.',
          },
        ],
      },

      ...messagesInConversation,
      {
        role: 'user',
        content: [{ type: 'input_text', text: userText }],
      },
    ],
  });

  // Extract JSON from the Responses API output
  const msg = (resp.output || []).find((o) => o.type === 'message');
  const textParts = (msg?.content || [])
    .filter((c) => c.type === 'output_text' && typeof c.text === 'string')
    .map((c) => c.text);

  if (!textParts?.length) throw new Error('No output_text returned by router');

  const raw = textParts.join('').trim();
  // Strip accidental code fences if any
  const cleaned = raw.replace(/^```json\s*|\s*```$/g, '');
  return JSON.parse(cleaned); // { intent, slots, confidence }
}

function collectReplyTexts(resp) {
  if (!resp?.output) return null;

  let isUserResponseNeeded = null;
  let canEndCall = null;
  let agents = [];

  // 1) Keep only assistant messages in this response
  const assistantMsgs = resp.output.filter((o) => o.type === 'message' && o.role === 'assistant');

  if (assistantMsgs.length === 0) return null;

  // 2) Collect ALL output_text chunks from ALL assistant messages, in order
  const rawTexts = [];
  for (const msg of assistantMsgs) {
    for (const c of msg.content || []) {
      if (c.type === 'output_text' && typeof c.text === 'string') {
        const trimmed = c.text.trim();
        if (trimmed) rawTexts.push(trimmed);
      }
    }
  }

  if (rawTexts.length === 0) return null;

  // 3) Deduplicate consecutive identical texts (fixes "Manchow" × 20 type issues)
  const deduped = [];
  for (const t of rawTexts) {
    if (!deduped.length || computeJaccardScore(deduped[deduped.length - 1], t) < 3) {
      deduped.push(t);
    }
  }

  // 4) Join into one final string for this response
  // Use a space to avoid sticking sentences together
  let finalText = deduped.join(' ').trim();
  if (!finalText) return null;

  const originalTextForMetaCheck = finalText;

  // 5) Prefer META-wrapped JSON blocks: <META>{...}</META>
  const META_RE = /<META>\s*({[\s\S]*?})\s*<\/META>/g;
  finalText = finalText
    .replace(META_RE, (full, jsonStr) => {
      try {
        const meta = JSON.parse(jsonStr);
        if (typeof meta.isUserResponseNeeded === 'boolean') {
          isUserResponseNeeded = meta.isUserResponseNeeded;
        }
        if (typeof meta.canEndCall === 'boolean') {
          canEndCall = meta.canEndCall;
        }
        if (Array.isArray(meta.agents)) {
          agents = meta.agents;
        }
      } catch (e) {
        console.error('META parse error:', e);
      }
      return ''; // strip meta from user-facing text
    })
    .trim();

  // 6) Fallback: scan lines for standalone JSON blocks IF there were no META markers
  if (!/<META>/.test(originalTextForMetaCheck)) {
    const lines = finalText.split('\n');
    const kept = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const obj = JSON.parse(trimmed);
          if (typeof obj.isUserResponseNeeded === 'boolean') {
            isUserResponseNeeded = obj.isUserResponseNeeded;
            continue; // don't keep this line in reply text
          }
          if (typeof obj.canEndCall === 'boolean') {
            canEndCall = obj.canEndCall;
            continue;
          }
          if (Array.isArray(obj.agents)) {
            agents = obj.agents;
            continue;
          }
        } catch (e) {
          // not valid JSON; keep it
        }
      }
      kept.push(line);
    }
    finalText = kept.join('\n').trim();
  }

  // 7) If META / JSON didn’t say anything, infer from punctuation of final text
  if (isUserResponseNeeded === null) {
    const endsWithQuestion = /\?/.test(finalText);
    isUserResponseNeeded = endsWithQuestion;
  }

  return { replyText: finalText, agents, isUserResponseNeeded, canEndCall };
}

export async function askChatGpt({
  userText,
  messagesInConversation,
  hotelId,
  roomId,
  deviceId,
  bookingId,
  conversationId,
  guestUserId,
  conversationState,
  isProspect,
}) {
  // 1) Default conversation state
  if (!conversationState) {
    conversationState = {
      menu_items: [],
    };
  }

  // 2) Discover intents and tools/prompts
  const intentResp = await discoverIntents({ userText, messagesInConversation, isProspect });
  const { tools, prompts } = getPromptsAndTools({
    intents: intentResp.intents,
    isProspect,
  });

  // 3) Build base input for the first call
  const baseInput = [
    {
      role: 'system',
      content: [...prompts, JSON.stringify({ state: conversationState })].join('\n\n'),
    },
    { role: 'user', content: userText },
  ];

  const MAX_LOOPS = 6;
  let previousResponseId = conversationState.previousResponseId;

  // This will hold the best/latest assistant reply we saw across all steps
  let lastReplyMeta = null;

  // Helper: single model step
  async function step({ input, instructions } = {}) {
    const args = { model: GPT_MODEL, tools };

    // For tool outputs, we override input
    if (input) {
      args.input = input;
    }

    if (previousResponseId) {
      // Continue an existing Responses API conversation
      args.previous_response_id = previousResponseId;
    }

    if (!previousResponseId || !args.input) {
      // First call: provide the full baseInput
      args.input = baseInput;
    }

    if (instructions) {
      args.instructions = instructions;
    }

    const resp = await OpenAIClient.responses.create(args);
    previousResponseId = resp.id;
    return resp;
  }

  // Helper: extract all function calls from a response
  function getFunctionCalls(resp) {
    const out = resp.output || [];
    return out.filter((o) => o.type === 'function_call');
  }

  // Helper: update lastReplyMeta from a response
  function captureReply(resp) {
    const reply = collectReplyTexts(resp);
    if (reply && reply.replyText) {
      lastReplyMeta = reply; // overwrite older one
    }
  }

  // 4) First turn
  let resp = await step({});
  captureReply(resp);
  conversationState.previousResponseId = previousResponseId;

  // 5) Tool loop
  for (let i = 0; i < MAX_LOOPS; i++) {
    const toolCalls = getFunctionCalls(resp);

    // If there are no function calls, we are done
    if (!toolCalls.length) {
      break;
    }

    // Resolve all tool calls in parallel
    const toolResults = await Promise.all(
      toolCalls.map(async (tc) => {
        let args = {};
        try {
          args = tc.arguments ? JSON.parse(tc.arguments) : {};
        } catch (e) {
          console.error('error parsing tool call args', e);
        }

        const output = await callFunction({
          name: tc.name,
          args,
          hotelId,
          roomId,
          deviceId,
          bookingId,
          conversationId,
          guestUserId,
          conversationState,
        });

        if (tc.name === 'fetch_menu_items') {
          const getBool = (a, b) => (typeof a === 'boolean' ? a : b);
          const existingItems = conversationState.menu_items || [];
          const existingItemsSet = new Set(existingItems.map((i) => i.itemId));
          conversationState.menu_items = [
            ...existingItems,
            ...output.filter((i) => !existingItemsSet.has(i.itemId)),
          ];

          conversationState.vegOnly = getBool(args.vegOnly, conversationState.vegOnly);
          conversationState.veganOnly = getBool(args.veganOnly, conversationState.veganOnly);
          conversationState.glutenFree = getBool(args.glutenFree, conversationState.glutenFree);
          conversationState.excludeAllergens =
            Array.isArray(args.excludeAllergens) && args.excludeAllergens.length > 0
              ? args.excludeAllergens
              : conversationState.excludeAllergens;
        }

        if (tc.name === 'order_food') {
          conversationState.order_requests.push(output);
        }

        if (tc.name === 'create_hotel_requests') {
          conversationState.hotel_requests.push(output);
        }

        return {
          type: 'function_call_output',
          call_id: tc.call_id,
          output: JSON.stringify(output ?? null),
        };
      })
    );

    // Ask model to continue with tool results
    resp = await step({
      input: toolResults,
      instructions:
        "Give TTS friendly responses without any characters that can't be conveyed in speech",
    });

    // Capture any assistant text in this response
    captureReply(resp);
    conversationState.previousResponseId = previousResponseId;
  }

  // 6) Final reply object
  let replyText = '';
  let isUserResponseNeeded = false;
  let canEndCall = false;
  let agents = [];

  if (lastReplyMeta) {
    replyText = lastReplyMeta.replyText;
    isUserResponseNeeded = lastReplyMeta.isUserResponseNeeded;
    canEndCall = lastReplyMeta.canEndCall;
    agents = lastReplyMeta.agents;
  }

  return {
    reply: replyText || 'Something went wrong, could you please try that again?',
    isUserResponseNeeded,
    canEndCall,
    agents,
    conversationState,
  };
}
