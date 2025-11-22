import { NextResponse } from 'next/server';

export async function POST(req) {
  const endpoint = `${process.env.API_BASE_URL}/website/leads`;

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
      const text = await res.text().catch(() => '');
      throw new Error(text || `Request failed with ${res.status}`);
    }
  } catch (err) {
    return NextResponse.json(
      {
        error: err?.message || 'Something went wrong. Please try again.',
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
