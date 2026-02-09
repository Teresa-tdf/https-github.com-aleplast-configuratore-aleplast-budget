# Chat Log Summary (2026-02-09)

## Obiettivo
Rendere operativo il configuratore Aleplast, con lead su Supabase, deploy su Vercel, email Resend, dominio personalizzato, nuove logiche di prodotto e scheda finale con foto.

---

## Stato attuale (summary)
- **Deploy** attivo su Vercel con dominio: `https://quiz.aleplast.it`.
- **Leads** salvati correttamente in Supabase.
- **Email** di notifica via Resend funzionanti.
- **Logo** aggiornato con pittogramma bianco senza testo (su richiesta successiva, poi ripristinato e infine rimesso bianco).
- **Scheda finale**: immagine prodotto ora a pieno riquadro con `object-cover` + `rounded-2xl`.
- **Materiale**: domanda “PVC / Alluminio / Ho bisogno di un consiglio”.
- **Catalogo prodotti** esteso (PVC, Alluminio, scorrevoli, portoncini).
- **Foto** collegate a quasi tutti i prodotti.

---

## Infrastruttura / Deploy
- Vercel collegato a GitHub. Deploy automatico su push.
- Variabili env:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL`
  - `RESEND_TO_EMAIL`
- Dominio personalizzato: `quiz.aleplast.it`

---

## Backend
- API `/api/lead` in Vercel (salva lead su Supabase, invia email via Resend).
- Antispam: honeypot + rate limit.

---

## Privacy
- Link reale a Privacy Policy (iubenda).

---

## UI / UX
- Ripristino stile iniziale richiesto.
- Scheda finale ora mostra immagine prodotto a pieno riquadro.
- CTA e copy rivisti (poi parzialmente ripristinati).

---

## Prodotti (catalogo)
### Finestre PVC
- Prolux
- Prolux Evolution
- Prolux Plus
- Prolux +
- Platinium Plus
- Squareline
- Prismatic Evolution (Prismatic base rimosso)
- Winergetic Premium Passive
- Koncept Plus

### Finestre Alluminio
- Titano
- Titano EVO
- Titano OC
- Titano EVO OC
- Titano Steel
- Futural
- Futural OC
- Prolux ALU

### Scorrevoli PVC
- Prolux Slide
- HST Motion
- HST Premium
- PSK
- Ekosol

### Scorrevoli Alluminio
- Skyline
- Aluslide LUX
- Aluslide PRO
- MS Slide

### Portoncini
- Portoncini PVC (generico)
- Cosmo (generico)
- Tenvis (generico)

---

## Foto prodotto
Le immagini sono state copiate in `public/products/` e collegate via `imageUrl`.
Per HST Premium: `public/products/hst-premium.png`.
Per eventuali nuovi prodotti, aggiungere file in `public/products/` e aggiornare `imageUrl` in `index.tsx`.

---

## File principali modificati
- `index.tsx` (logica, UI, prodotti, immagini)
- `public/products/*` (immagini prodotto)
- `api/lead.ts` (Supabase + Resend)
- `vercel.json` (routing)
- `tailwind.config.js`, `postcss.config.js`, `styles.css` (Tailwind local)
- `.gitignore` (aggiunte `.env.local`, `.env.local.save`, `.vercel/`)
- `index.html` (OG meta, favicon)
- `public/og-image.png`, `public/favicon.png`

---

## Comandi utili
- Deploy:
  - `git add .`
  - `git commit -m "message"`
  - `git push`
- Vercel:
  - `vercel --prod`

---

## TODO futuri
- Inserire foto mancanti (se necessario).
- Rifinire scheda finale con dettagli tecnici (opzionale).
- Rivedere UX e copy se richiesto.

