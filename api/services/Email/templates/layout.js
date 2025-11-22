const BRAND_PRIMARY = '#161032'; // your existing brand color
const CARD_BG = '#1b1d24'; // dark card background
const PAGE_BG = '#eeeeeeff'; // outer background
const TEXT_COLOR = '#f5f5f5';

export function stripHtml(text) {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function baseLayout({ title, bodyHtml }) {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>${title}</title>
      <meta name="color-scheme" content="dark light" />
      <meta name="supported-color-schemes" content="dark light" />
    </head>
    <body style="margin:0; padding:0; background-color:${PAGE_BG};">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${PAGE_BG}; padding:24px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:${CARD_BG}; border-radius:8px; overflow:hidden; font-family:Arial, sans-serif; border:1px solid #252836;">

              <!-- Header: banner with centered logo -->
              <tr>
                <td align="center" style="background-color:${BRAND_PRIMARY}; padding:16px 24px;">
                  <a href="https://roommitra.com" style="display:inline-block; text-decoration:none;">
                    <img
                      src="https://roommitra.com/room-mitra-logo.png"
                      alt="Room Mitra"
                      width="160"
                      style="display:block; width:160px; max-width:100%; height:auto; border:0; outline:none; text-decoration:none;"
                    />
                  </a>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:24px; color:${TEXT_COLOR}; font-size:14px; line-height:1.6;">
                  ${bodyHtml}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color:#12141a; padding:16px 24px; font-size:12px; color:#9ca3af; text-align:center;">
                  You are receiving this email from Room Mitra because of an action related to your stay or your hotel account.<br/>
                  If you believe this was sent to you in error, please contact <a href="mailto:support@roommitra.com">support@roommitra.com</a>.
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}
