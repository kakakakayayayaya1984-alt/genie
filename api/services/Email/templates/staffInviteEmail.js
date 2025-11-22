import { baseLayout, stripHtml } from './layout.js';

/**
 * Staff invite email (dark-mode friendly, inline CSS)
 */
export function staffInviteEmail({ staffName, hotelName, inviteLink }) {
  const title = 'You have been invited to Room Mitra';
  const subject = title;

  const safeName = staffName || 'there';
  const safeHotelName = hotelName || 'your hotel';

  const bodyHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="color:#f5f5f5; font-family:Arial, sans-serif; font-size:14px; line-height:1.6;">
      <tr>
        <td>
          <div style="font-size:18px; font-weight:bold; margin:0 0 16px 0; color:#ffffff;">
            Hi ${safeName},
          </div>

          <div style="margin:0 0 12px 0; color:#e5e7eb;">
            You have been invited to use
            <strong style="color:#f9fafb;">Room Mitra</strong>
            at
            <strong style="color:#f9fafb;">${safeHotelName}</strong>.
          </div>

          <div style="margin:0 0 16px 0; color:#d1d5db;">
            Click the button below to set up your account and start managing guest requests.
          </div>

          <div style="margin:24px 0;">
            <a href="${inviteLink}"
               style="background-color:#E2C044; color:#111827; text-decoration:none; padding:10px 18px; border-radius:4px; font-size:14px; font-weight:600; display:inline-block;">
              Accept invite
            </a>
          </div>

          <div style="margin:0 0 8px 0; color:#9ca3af;">
            If the button does not work, copy and paste this link into your browser:
          </div>

          <div style="word-break:break-all; font-size:12px; color:#9ca3af;">
            ${inviteLink}
          </div>
        </td>
      </tr>
    </table>
  `;

  const html = baseLayout({ title, bodyHtml });

  const text = stripHtml(
    `Hi ${safeName}, you have been invited to use Room Mitra at ${safeHotelName}. ` +
      `Open this link to accept the invite: ${inviteLink}`
  );

  return { subject, html, text };
}
