import { NextResponse } from 'next/server';

export async function POST(req) {
  const endpoint = `${process.env.API_BASE_URL}/website/voice-agent-trial-request`;

  //JSON handler
  const body = await req.json().catch(() => null);

  if (body.hp) {
    return NextResponse.json({ ok: true });
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const e = await res.json().catch(() => '');
      throw new Error(e?.error || `Request failed with ${res.status}`);
    }
    return NextResponse.json(await res.json().catch(() => ({})));
  } catch (err) {
    return NextResponse.json(
      {
        error: err?.message || 'Something went wrong. Please try again.',
      },
      { status: 400 }
    );
  }
}
