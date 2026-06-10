import { NextRequest, NextResponse } from 'next/server';
import { searchReps } from '@/lib/representativesData';
import { INDIA_STATES } from '@/lib/indiaData';

/**
 * WhatsApp Bot webhook (Meta Cloud API)
 *
 * GET  — webhook verification handshake
 * POST — incoming message → reply with representative/state info
 *
 * Setup: Meta for Developers → WhatsApp → Configuration
 *   Callback URL: https://reviewyourleader.com/api/whatsapp
 *   Verify token: WHATSAPP_VERIFY_TOKEN env var
 */

// ── Webhook verification (Meta calls this once on setup) ────────
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get('hub.mode');
  const token = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// ── HMAC-SHA256 signature verification ─────────────────────────
async function verifyWebhookSignature(request: NextRequest, rawBody: string): Promise<boolean> {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) return true; // Skip if not configured (dev)

  const signature = request.headers.get('x-hub-signature-256');
  if (!signature?.startsWith('sha256=')) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const expected = 'sha256=' + Array.from(new Uint8Array(signed))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return expected === signature;
}

// ── Incoming message handler ────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    if (!(await verifyWebhookSignature(request, rawBody))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);

    const entry = body.entry?.[0]?.changes?.[0]?.value;
    const message = entry?.messages?.[0];
    if (!message) return NextResponse.json({ status: 'no_message' });

    const from = message.from;
    const text = (message.text?.body || '').trim();

    const reply = buildReply(text);
    await sendWhatsAppMessage(from, reply);

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('[whatsapp]', err);
    return NextResponse.json({ status: 'error' }, { status: 200 });
  }
}

// ── Build the text reply ────────────────────────────────────────
function buildReply(query: string): string {
  if (!query || query.length < 2) {
    return `👋 *ReviewYourLeader Bot*\n\nSend me:\n• An MP/MLA name (e.g. "Rajnath Singh")\n• A constituency (e.g. "Lucknow")\n• A state (e.g. "Telangana")\n\nI'll send you their profile, attendance, and election stats.`;
  }

  // State match
  const state = INDIA_STATES.find(s =>
    s.name.toLowerCase().includes(query.toLowerCase())
  );
  if (state) {
    const si = state as typeof state & { chief_minister?: string; ruling_party?: string; landmark?: string };
    return `🗺 *${state.name}*\n\n` +
      `🏛 Capital: ${state.capital}\n` +
      `👤 CM: ${si.chief_minister || 'N/A'}\n` +
      `🎗 Ruling Party: ${si.ruling_party || 'N/A'}\n` +
      `📍 Landmark: ${si.landmark || 'N/A'}\n\n` +
      `🔗 Explore: reviewyourleader.com`;
  }

  // Representative match
  const reps = searchReps(query);
  if (reps.length > 0) {
    const r = reps[0];
    const election = r.election_results?.[r.election_results.length - 1];
    let msg = `👤 *${r.name}*\n\n` +
      `🎗 Party: ${r.party} (${r.party_short})\n` +
      `🏛 ${r.constituency_type === 'parliament' ? 'MP' : 'MLA'}: ${r.constituency_name}\n` +
      `📍 State: ${r.state_name}\n`;
    if (r.attendance_percentage != null) msg += `📊 Attendance: ${r.attendance_percentage}%\n`;
    if (r.questions_asked != null) msg += `❓ Questions: ${r.questions_asked}\n`;
    if (r.bills_introduced != null) msg += `📜 Bills: ${r.bills_introduced}\n`;
    if (r.ministry?.some(m => m.is_current)) {
      msg += `⭐ Minister: ${r.ministry.find(m => m.is_current)?.portfolio}\n`;
    }
    if (election) {
      msg += `\n🗳 2024: Won with ${election.vote_share}% (margin ${(election.margin / 1000).toFixed(0)}K)\n`;
    }
    msg += `\n🔗 Full profile: reviewyourleader.com`;

    if (reps.length > 1) {
      msg += `\n\n_Also found: ${reps.slice(1, 4).map(x => x.name).join(', ')}_`;
    }
    return msg;
  }

  return `🔍 No match for "${query}".\n\nTry an MP name, constituency, or state name. Example: "Amit Shah" or "Gujarat".`;
}

// ── Send reply via Meta Cloud API ───────────────────────────────
async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) {
    console.warn('[whatsapp] credentials not configured — reply not sent');
    return;
  }

  await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });
}
