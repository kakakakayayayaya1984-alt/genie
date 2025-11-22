import { baseLayout, stripHtml } from './layout.js';

export function verificationEmail({ name, code }) {
  const title = 'Your Room Mitra verification code';
  const subject = title;

  // DARK-MODE SAFE BODY HTML
  const bodyHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="color:#f5f5f5; font-family:Arial, sans-serif; font-size:14px; line-height:1.6;">
      <tr>
        <td>
          <div style="font-size:18px; font-weight:bold; margin:0 0 16px 0; color:#ffffff;">
            Hi ${name || 'there'},
          </div>

          <div style="margin:0 0 12px 0; color:#e5e7eb;">
            Your Room Mitra verification code is:
          </div>

          <div style="font-size:28px; font-weight:700; letter-spacing:3px; color:#E2C044; margin:16px 0;">
            ${code}
          </div>

          <div style="margin-top:16px; color:#d1d5db;">
            This code is valid for the next 10 minutes.
          </div>
        </td>
      </tr>
    </table>
  `;

  const html = baseLayout({ title, bodyHtml });

  const text = stripHtml(
    `Hi ${name || 'there'}, your Room Mitra verification code is ${code}. This code is valid for the next 10 minutes.`
  );

  return { subject, html, text };
}
