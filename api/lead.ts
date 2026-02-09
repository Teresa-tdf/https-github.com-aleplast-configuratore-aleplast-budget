import { createClient } from '@supabase/supabase-js';

type LeadPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  privacy: boolean;
  marketing: boolean;
  answers: Record<number, string>;
  resultProductId: string | null;
  honeypot?: string;
};

const REQUIRED_FIELDS: Array<keyof LeadPayload> = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'privacy',
];

const isEmailValid = (email: string) => /\S+@\S+\.\S+/.test(email);
const sanitize = (value: string) => value.trim().slice(0, 200);

const RATE_WINDOW_MS = 5 * 60 * 1000;
const RATE_MAX = 5;
const rateStore = new Map<string, { count: number; resetAt: number }>();

const getClientIp = (req: any) => {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) return xff.split(',')[0].trim();
  const xri = req.headers['x-real-ip'];
  if (typeof xri === 'string' && xri.length > 0) return xri.trim();
  return req.socket?.remoteAddress || 'unknown';
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL;
  const resendToEmail = process.env.RESEND_TO_EMAIL;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Server not configured' });
  }
  if (!resendApiKey || !resendFromEmail || !resendToEmail) {
    return res.status(500).json({ error: 'Email not configured' });
  }

  const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const payload = rawBody as LeadPayload;

  const honeypot = (payload.honeypot || '').trim();
  if (honeypot.length > 0) {
    return res.status(400).json({ error: 'Invalid submission' });
  }

  const ip = getClientIp(req);
  const now = Date.now();
  const current = rateStore.get(ip);
  if (!current || now > current.resetAt) {
    rateStore.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
  } else {
    current.count += 1;
    rateStore.set(ip, current);
    if (current.count > RATE_MAX) {
      return res.status(429).json({ error: 'Too many requests' });
    }
  }

  for (const field of REQUIRED_FIELDS) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      return res.status(400).json({ error: `Missing field: ${field}` });
    }
  }

  if (!payload.privacy) {
    return res.status(400).json({ error: 'Privacy consent required' });
  }

  if (!isEmailValid(payload.email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { error } = await supabase.from('leads').insert({
    first_name: sanitize(payload.firstName),
    last_name: sanitize(payload.lastName),
    email: sanitize(payload.email),
    phone: sanitize(payload.phone),
    privacy_consent: payload.privacy,
    marketing_consent: payload.marketing ?? false,
    answers: payload.answers ?? {},
    result_product_id: payload.resultProductId,
  });

  if (error) {
    return res.status(500).json({ error: 'Failed to save lead' });
  }

  const emailBody = [
    'Nuovo lead dal configuratore:',
    `Nome: ${sanitize(payload.firstName)} ${sanitize(payload.lastName)}`,
    `Email: ${sanitize(payload.email)}`,
    `Telefono: ${sanitize(payload.phone)}`,
    `Consenso privacy: ${payload.privacy ? 'si' : 'no'}`,
    `Consenso marketing: ${payload.marketing ? 'si' : 'no'}`,
    `Risultato: ${payload.resultProductId ?? 'n/a'}`,
  ].join('\n');

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: resendToEmail,
      subject: 'Nuovo lead dal configuratore',
      text: emailBody,
    }),
  });

  if (!emailResponse.ok) {
    return res.status(500).json({ error: 'Failed to send email' });
  }

  return res.status(200).json({ ok: true });
}
