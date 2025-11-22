import { toIsoString } from '#common/timestamp.helper.js';

export function summarizeRequests(requests) {
  return {
    prompt: `
    The summary field contains tabular data of the requests created.
    The header key has the column nammes.
    The rows key has the individual rows of data
    `,
    summary: {
      headers: ['department', 'requestType', 'details', 'priority', 'cart'],
      rows: requests?.map((r) => [
        r.department,
        r.requestType,
        r.details,
        r.priority,
        summarizeCart(r.cart),
      ]),
    },
  };
}

export function summarizeCart(cart) {
  if (!cart) return '';
  const forTime = cart.scheduledAt ? `to be delivered at ${toIsoString(cart.scheduledAt)}` : '';
  const instructions = cart.instructions ? `Instructions: ${cart.instructions}` : '';
  const items = cart.items
    .map((i) => `${i.itemName} ${i.notes && `(${i.notes})`} x ${i.quantity}`)
    .join('\n');

  return `
  Order placed ${forTime}
  ${instructions}
  ${items}
  `;
}
