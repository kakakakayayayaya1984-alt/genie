export function summarizeBookingArgs(args) {
  const { startDate, endDate, rooms = [], specialRequests = '' } = args;

  // Build date summary
  const dateSummary = `Stay from ${startDate} to ${endDate}`;

  // Build rooms summary
  const roomsSummary = rooms
    .map((r) => {
      const childInfo =
        r.children && r.children > 0
          ? `, Children: ${r.children} (${(r.childAges || []).join(', ')} yr)`
          : '';

      return `${r.quantity} × ${r.roomType} with ${r.bedConfiguration}, Adults: ${r.adults}${childInfo}`;
    })
    .join('\n');

  // Special instructions
  const special =
    specialRequests && specialRequests.trim() ? `Special Requests: ${specialRequests.trim()}` : '';

  const details = `${dateSummary}\n${roomsSummary}\n${special}`;

  // Request type (short)
  // Example: "Booking: Deluxe Room (2 rooms)"
  let requestType = 'Room Booking';

  if (rooms.length === 1) {
    const r = rooms[0];
    requestType = `Booking: ${r.roomType} (${r.quantity} room${r.quantity > 1 ? 's' : ''})`;
  } else if (rooms.length > 1) {
    requestType = `Booking: Multiple Room Types (${rooms.length})`;
  }

  return { requestType, details };
}
