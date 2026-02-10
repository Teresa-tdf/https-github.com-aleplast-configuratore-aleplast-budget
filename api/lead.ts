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
  hcaptchaToken?: string;
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

const PRODUCT_CARDS: Record<
  string,
  { name: string; material: string; type: string; description: string; features: string[] }
> = {
  // PVC Windows
  prolux: {
    name: 'Prolux',
    material: 'PVC',
    type: 'Finestra',
    description: 'Design arrotondato e profilo ridotto per massima luminosità.',
    features: ['+22% luce naturale', 'Maniglia centrale simmetrica', 'Profili sottili', 'Ideale per ristrutturazioni'],
  },
  'prolux-evolution': {
    name: 'Prolux Evolution',
    material: 'PVC',
    type: 'Finestra',
    description: 'Versione squadrata e minimale della Prolux, con nodo centrale ridotto.',
    features: ['Design squadrato', 'Nodo centrale ridotto', 'Alta luminosità', 'Look contemporaneo'],
  },
  'prolux-plus': {
    name: 'Prolux Plus',
    material: 'PVC',
    type: 'Finestra',
    description: 'Vetro incollato e design asimmetrico con maniglia decentrata.',
    features: ['Vetro incollato', 'Design asimmetrico', 'Profili slim', 'Prestazioni elevate'],
  },
  'prolux-plus-symmetric': {
    name: 'Prolux +',
    material: 'PVC',
    type: 'Finestra',
    description: 'Versione simmetrica senza fermavetro: massimo minimalismo e luce.',
    features: ['Senza fermavetro', 'Design simmetrico', 'Massima luce', 'Tre guarnizioni'],
  },
  'platinium-plus': {
    name: 'Platinium Plus',
    material: 'PVC',
    type: 'Finestra',
    description: 'Linee morbide e stile classico con profilo ribassato.',
    features: ['Profilo ribassato', 'Stile classico', 'Più vetro', 'Buon isolamento'],
  },
  squareline: {
    name: 'Squareline',
    material: 'PVC',
    type: 'Finestra',
    description: 'Design moderno e squadrato con profili sottili e vetro extra-light.',
    features: ['Linee nette', 'Profilo sottile', 'Alta luminosità', 'Ottimo isolamento'],
  },
  'prismatic-evolution': {
    name: 'Prismatic Evolution',
    material: 'PVC',
    type: 'Finestra',
    description: 'Nodo centrale ridotto e simmetria perfetta con isolamento ai massimi livelli.',
    features: ['Nodo centrale ridotto', 'Simmetria totale', 'Uw fino a 0,78', 'Alta luminosità'],
  },
  'winergetic-passive': {
    name: 'Winergetic Premium Passive',
    material: 'PVC',
    type: 'Finestra',
    description: 'Isolamento estremo con Aerogel e profilo 82 mm per case passive.',
    features: ['Aerogel Space Block', 'Uw fino a 0,6–0,7', 'CasaClima Gold', 'Triplo vetro'],
  },
  'koncept-plus': {
    name: 'Koncept Plus',
    material: 'PVC',
    type: 'Finestra',
    description: 'Soluzione equilibrata tra prestazioni e prezzo con design sobrio.',
    features: ['Ottimo rapporto qualità/prezzo', 'Design lineare', 'Buon isolamento', 'Versatile'],
  },

  // Aluminum Windows
  titano: {
    name: 'Titano',
    material: 'Alluminio',
    type: 'Finestra',
    description: 'Linea robusta con taglio termico e design moderno.',
    features: ['Taglio termico', 'Design moderno', 'Robustezza', 'Ottimo isolamento'],
  },
  'titano-evo': {
    name: 'Titano EVO',
    material: 'Alluminio',
    type: 'Finestra',
    description: 'Profili sottili e maniglia centrale per simmetria e luce.',
    features: ['Nodo centrale ridotto', 'Massima luce', 'Uw fino a 0,78', 'Design minimale'],
  },
  'titano-oc': {
    name: 'Titano OC',
    material: 'Alluminio',
    type: 'Finestra',
    description: 'Anta a scomparsa esterna per look ultra-minimal.',
    features: ['Anta a scomparsa', 'Look tutto vetro', 'Nodo ridotto', 'Design minimal'],
  },
  'titano-evo-oc': {
    name: 'Titano EVO OC',
    material: 'Alluminio',
    type: 'Finestra',
    description: 'Massima trasparenza e simmetria con profili ridotti.',
    features: ['EVO + OC', 'Luce massima', 'Uw fino a 0,77', 'Top di gamma'],
  },
  'titano-steel': {
    name: 'Titano Steel',
    material: 'Alluminio',
    type: 'Finestra',
    description: 'Finiture effetto acciaio e look industriale di pregio.',
    features: ['Effetto acciaio', 'Design industrial', 'Alta resistenza', 'Ottimo isolamento'],
  },
  futural: {
    name: 'Futural',
    material: 'Alluminio',
    type: 'Finestra',
    description: 'Alluminio solido e affidabile con taglio termico.',
    features: ['Struttura robusta', 'Taglio termico', 'Design sobrio', 'Durabilità elevata'],
  },
  'futural-oc': {
    name: 'Futural OC',
    material: 'Alluminio',
    type: 'Finestra',
    description: 'Versione complanare con profili sottili e grande luminosità.',
    features: ['Anta a scomparsa', 'Nodo ridotto', 'Look minimale', 'Buon isolamento'],
  },
  'prolux-alu': {
    name: 'Prolux ALU',
    material: 'Alluminio',
    type: 'Finestra',
    description: 'Design minimal con vetro incollato e profili ultra-sottili.',
    features: ['Vetro incollato', 'Anta a scomparsa', 'Profilo minimale', 'Design premium'],
  },

  // PVC Sliding
  'prolux-slide': {
    name: 'Prolux Slide',
    material: 'PVC',
    type: 'Scorrevole',
    description: 'Scorrevole evoluto con tenuta ermetica e grande luminosità.',
    features: ['Scorrimento leggero', 'Ottima tenuta', 'Nodo ridotto', 'Alta luminosità'],
  },
  'hst-motion': {
    name: 'HST Motion',
    material: 'PVC',
    type: 'Scorrevole',
    description: 'Alzante scorrevole per grandi vetrate con profili ribassati.',
    features: ['Grandi dimensioni', 'Soglia ribassata', 'Scorrimento fluido', 'Luce massima'],
  },
  'hst-premium': {
    name: 'HST Premium',
    material: 'PVC',
    type: 'Scorrevole',
    description: 'Alzante scorrevole robusto per aperture monumentali.',
    features: ['Aperture grandi', 'Robustezza', 'Triplo vetro', 'Comfort elevato'],
  },
  psk: {
    name: 'Traslante PSK',
    material: 'PVC',
    type: 'Scorrevole',
    description: 'Sistema scorrevole-vasistas salvaspazio con buona tenuta.',
    features: ['Ribalta + scorrevole', 'Salvaspazio', 'Buona tenuta', 'Versatile'],
  },
  ekosol: {
    name: 'Ekosol',
    material: 'PVC',
    type: 'Scorrevole',
    description: 'Scorrevole semplice ed economico per aperture medie.',
    features: ['Soluzione economica', 'Semplice da usare', 'Buon isolamento', 'Ingombro ridotto'],
  },

  // Aluminum Sliding
  skyline: {
    name: 'Skyline',
    material: 'Alluminio',
    type: 'Scorrevole',
    description: 'Minimal frame per massima trasparenza e impatto architettonico.',
    features: ['Profili quasi invisibili', 'Design premium', 'Grandi vetrate', 'Massima luce'],
  },
  'aluslide-lux': {
    name: 'Aluslide LUX',
    material: 'Alluminio',
    type: 'Scorrevole',
    description: 'Scorrevole super luminoso con nodo centrale ridotto.',
    features: ['Nodo centrale sottile', 'Alta luminosità', 'Design moderno', 'Scorrevolezza'],
  },
  'aluslide-pro': {
    name: 'Aluslide PRO',
    material: 'Alluminio',
    type: 'Scorrevole',
    description: 'Scorrevole robusto per grandi aperture con ottima manovrabilità.',
    features: ['Ante grandi', 'Scorrimento fluido', 'Struttura robusta', 'Design pulito'],
  },
  'ms-slide': {
    name: 'MS Slide',
    material: 'Alluminio',
    type: 'Scorrevole',
    description: 'Scorrevole compatto per aperture medio-grandi con ingombro ridotto.',
    features: ['Compatto', 'Facile da usare', 'Ingombro minimo', 'Buon rapporto qualità/prezzo'],
  },

  // Doors
  'portoncini-pvc': {
    name: 'Portoncini PVC Oknoplast',
    material: 'PVC',
    type: 'Portoncino',
    description: 'Ingressi in PVC con buon isolamento, design personalizzabile e ottima sicurezza.',
    features: ['Isolamento termico', 'Design personalizzabile', 'Sicurezza multipunto', 'Ampia scelta finiture'],
  },
  cosmo: {
    name: 'Portoncini PVC Cosmo',
    material: 'PVC',
    type: 'Portoncino',
    description: 'Linea premium con pannelli HPL e isolamento elevato.',
    features: ['Uw fino a 1,2', 'Pannelli HPL', 'Sicurezza elevata', 'Design moderno'],
  },
  tenvis: {
    name: 'Portoncini Tenvis',
    material: 'Alluminio',
    type: 'Portoncino',
    description: 'Isolamento top, serratura automatica multipunto e design premium.',
    features: ['Ud fino a 0,84', 'Serratura automatica', 'Alta sicurezza', 'Design di pregio'],
  },
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
  const resendReplyTo = process.env.RESEND_REPLY_TO || 'info@aleplast.it';
  const hcaptchaSecret = process.env.HCAPTCHA_SECRET;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Server not configured' });
  }
  if (!resendApiKey || !resendFromEmail || !resendToEmail) {
    return res.status(500).json({ error: 'Email not configured' });
  }
  if (!hcaptchaSecret) {
    return res.status(500).json({ error: 'Captcha not configured' });
  }

  const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const payload = rawBody as LeadPayload;

  const honeypot = (payload.honeypot || '').trim();
  if (honeypot.length > 0) {
    return res.status(400).json({ error: 'Invalid submission' });
  }

  if (!payload.hcaptchaToken) {
    return res.status(400).json({ error: 'Captcha required' });
  }

  const captchaResponse = await fetch('https://hcaptcha.com/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${encodeURIComponent(hcaptchaSecret)}&response=${encodeURIComponent(payload.hcaptchaToken)}`,
  });
  const captchaJson = await captchaResponse.json();
  if (!captchaJson.success) {
    return res.status(400).json({ error: 'Captcha failed' });
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

  const resultCard = payload.resultProductId
    ? PRODUCT_CARDS[payload.resultProductId]
    : undefined;

  const userEmailText = resultCard
    ? [
        `Ciao ${sanitize(payload.firstName)},`,
        '',
        'Ecco la tua scheda prodotto personalizzata Aleplast:',
        `${resultCard.name} (${resultCard.material} - ${resultCard.type})`,
        resultCard.description,
        '',
        'Punti di forza:',
        ...resultCard.features.map(f => `- ${f}`),
        '',
        'Per qualsiasi domanda, rispondi a questa email o contattaci.',
      ].join('\n')
    : [
        `Ciao ${sanitize(payload.firstName)},`,
        '',
        'Grazie per aver completato il configuratore Aleplast.',
        'Ti contatteremo a breve con la tua scheda prodotto personalizzata.',
      ].join('\n');

  const baseUrl = process.env.PUBLIC_BASE_URL || 'https://quiz.aleplast.it';
  const logoUrl = `${baseUrl}/assets/aleplast-logo-white.png`;
  const productImageUrl = resultCard?.name && payload.resultProductId
    ? `${baseUrl}/products/${payload.resultProductId}.png`
    : '';

  const userEmailHtml = resultCard
    ? `
      <div style="font-family:Arial, sans-serif; background:#0A1628; color:#ffffff; padding:24px;">
        <div style="max-width:640px; margin:0 auto; background:#0f1f36; border:1px solid #1e3354; border-radius:12px; overflow:hidden;">
          <div style="padding:20px 24px; background:linear-gradient(135deg,#12315a,#0A1628);">
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
              <img src="${logoUrl}" alt="Aleplast" style="height:28px; width:auto;" />
              <div style="font-size:12px; letter-spacing:2px; text-transform:uppercase; color:#D4AF37; font-weight:700;">
                Scheda Prodotto
              </div>
            </div>
            <div style="font-size:22px; font-weight:600; margin-top:6px;">
              ${resultCard.name}
            </div>
            <div style="font-size:14px; color:#9fb4d6; margin-top:4px;">
              ${resultCard.material} • ${resultCard.type}
            </div>
          </div>
          ${productImageUrl ? `<img src="${productImageUrl}" alt="${resultCard.name}" style="width:100%; display:block; background:#0A1628;" />` : ''}
          <div style="padding:24px;">
            <p style="color:#dbe7ff; font-size:15px; line-height:1.6; margin:0 0 16px;">
              ${resultCard.description}
            </p>
            <div style="color:#9fb4d6; font-size:13px; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:8px;">
              Punti di forza
            </div>
            <ul style="margin:0; padding-left:18px; color:#ffffff; font-size:14px; line-height:1.6;">
              ${resultCard.features.map(f => `<li>${f}</li>`).join('')}
            </ul>
            <div style="margin-top:20px;">
              <a href="${baseUrl}" style="display:inline-block; background:#2E74B5; color:#ffffff; text-decoration:none; padding:12px 18px; border-radius:8px; font-size:13px; letter-spacing:1px; text-transform:uppercase;">
                Richiedi preventivo
              </a>
              <a href="https://wa.me/393515645413" style="display:inline-flex; align-items:center; gap:6px; background:#22c55e; color:#ffffff; text-decoration:none; padding:12px 14px; border-radius:8px; font-size:13px; letter-spacing:1px; text-transform:uppercase; margin-left:8px;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="#ffffff" style="display:block;">
                  <path d="M16.1 3C9.5 3 4.2 8.3 4.2 14.9c0 2.5.7 4.8 2.1 6.9L5 29l7.4-1.9c2 1.1 4.3 1.7 6.6 1.7 6.6 0 11.9-5.3 11.9-11.9C30.9 8.3 25.6 3 19 3h-2.9zm3.9 20.3c-1.6.8-3.4 1.1-5.2.9-2.2-.2-4.2-1.2-5.9-2.6l-.4-.3-4.3 1.1 1.2-4.2-.3-.4c-1-1.6-1.6-3.4-1.6-5.3 0-5.2 4.2-9.4 9.4-9.4h2.9c5.2 0 9.4 4.2 9.4 9.4 0 3.6-2 6.8-5.2 8.3zm3.2-5.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.2-.1-.9-.3-1.7-1-.6-.5-1-1.1-1.1-1.3-.1-.2 0-.3.1-.4.1-.1.2-.3.3-.4.1-.1.1-.2.2-.4.1-.1.1-.3 0-.4-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9 0 1.1.8 2.1.9 2.3.1.2 1.6 2.6 4 3.6.6.2 1 .4 1.4.5.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.1-.2-.2-.4-.3z"/>
                </svg>
                WhatsApp
              </a>
            </div>
            <p style="margin-top:14px; color:#9fb4d6; font-size:13px;">
              Per qualsiasi domanda, rispondi a questa email o contattaci:
              <a href="tel:+390799738992" style="color:#9fb4d6; text-decoration:underline;">Tel. 079 9738992</a>
              •
              <a href="https://wa.me/393515645413" style="color:#9fb4d6; text-decoration:underline;">WhatsApp 351 564 5413</a>
            </p>
          </div>
        </div>
      </div>
    `.trim()
    : `
      <div style="font-family:Arial, sans-serif; background:#0A1628; color:#ffffff; padding:24px;">
        <div style="max-width:640px; margin:0 auto; background:#0f1f36; border:1px solid #1e3354; border-radius:12px; padding:24px;">
          <div style="font-size:18px; font-weight:600; margin-bottom:8px;">Grazie ${sanitize(payload.firstName)}</div>
          <div style="color:#9fb4d6;">Ti contatteremo a breve con la tua scheda prodotto personalizzata.</div>
        </div>
      </div>
    `.trim();

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: resendToEmail,
      reply_to: resendReplyTo,
      subject: 'Nuovo lead dal configuratore',
      text: emailBody,
    }),
  });

  if (!emailResponse.ok) {
    const errorText = await emailResponse.text();
    console.error('Resend admin email error:', emailResponse.status, errorText);
    return res.status(500).json({ error: 'Failed to send email' });
  }

  const userEmailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: sanitize(payload.email),
      reply_to: resendReplyTo,
      subject: 'La tua scheda prodotto Aleplast',
      text: userEmailText,
      html: userEmailHtml,
    }),
  });

  if (!userEmailResponse.ok) {
    const errorText = await userEmailResponse.text();
    console.error('Resend user email error:', userEmailResponse.status, errorText);

    // Fallback: notify admin about user email failure
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: resendToEmail,
        reply_to: resendReplyTo,
        subject: 'Errore invio scheda al cliente',
        text: [
          'Non è stato possibile inviare la scheda al cliente.',
          `Cliente: ${sanitize(payload.firstName)} ${sanitize(payload.lastName)}`,
          `Email: ${sanitize(payload.email)}`,
          `Errore: ${userEmailResponse.status} ${errorText}`,
        ].join('\n'),
      }),
    });
    // Do not fail the request if user email fails; lead already saved.
  }

  return res.status(200).json({ ok: true });
}
