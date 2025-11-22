// app/api/feedback/route.jsx
import { NextResponse } from 'next/server';

// Force Node.js runtime so multipart + fetch behave nicely
export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const endpoint = `${process.env.API_BASE_URL}/website/feedback`;

    // Read incoming multipart/form-data (text fields + File/Blob)
    const incomingFormData = await req.formData();

    // Rebuild a fresh FormData to send to api
    const outFormData = new FormData();
    for (const [key, value] of incomingFormData.entries()) {
      // value can be string or File; FormData handles both
      outFormData.append(key, value);
    }

    // Forward to api backend
    const backendRes = await fetch(endpoint, {
      method: 'POST',
      body: outFormData,
      // Do NOT set Content-Type manually, fetch will set correct boundary
    });

    const contentType = backendRes.headers.get('content-type') || 'application/json';
    const status = backendRes.status;

    // Try to pass through JSON if possible, otherwise just text
    if (contentType.includes('application/json')) {
      const data = await backendRes.json().catch(() => null);
      if (data) {
        return NextResponse.json(data, { status });
      }
      return NextResponse.json({ ok: status >= 200 && status < 300 }, { status });
    } else {
      const text = await backendRes.text().catch(() => '');
      return new NextResponse(text, {
        status,
        headers: { 'content-type': contentType },
      });
    }
  } catch (err) {
    console.error('Error proxying feedback to api:', err);
    return NextResponse.json({ ok: false, error: 'Failed to send feedback' }, { status: 500 });
  }
}
