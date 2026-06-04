# CardifyBooth

CardifyBooth is a photo booth web app for creating Gettysburg-themed collage and trading-card printouts. The current build focuses on the trading-card flow: upload a photo, enter a name and traits, generate a card identity, save the final card PNG, and make the card available through a QR-friendly saved-card page.

## Current Features

- Mode chooser for `Card Booth` and a placeholder `Photo Collage` flow
- Upload-only card setup with preview and sample-photo fallback
- Gettysburg-themed trading-card renderer
- Structured card generation with Zod validation
- Local fallback generation when no AI key is configured
- Supabase Postgres persistence for generated card metadata
- Supabase Storage upload for print-ready generated card PNGs
- QR target route at `/cards/[id]`
- Saved-card page that displays the stored card image and card details
- Print button placeholder for the future physical print queue

## Stack

- Next.js App Router
- React and TypeScript
- Tailwind CSS
- Supabase Postgres
- Supabase Storage
- Zod
- `html-to-image`
- `qrcode`

## Local Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Create `.env.local` from `.env.example`:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The app still works without `OPENAI_API_KEY`; it uses the local fallback generator. Supabase values are required for database rows, saved PNGs, and QR card pages.

## Database

Supabase uses two tables:

- `events`: optional grouping for booth events
- `card_generations`: one row per generated card

Generated card rows store searchable metadata such as name, title, rarity, traits, stats, generation source, token estimates, print status, and the stored PNG path.

The final card image is stored in Supabase Storage:

- Bucket: `card-prints`
- Path format: `card-prints/{cardId}.png`

## Card Flow

```txt
Card Booth
-> upload or sample photo
-> enter name, traits, known-for text
-> generate card identity
-> save metadata row in Supabase
-> render final card PNG
-> upload PNG to Supabase Storage
-> QR points to /cards/{cardId}
```

## Important Files

- `src/components/BoothApp.tsx`: main kiosk flow
- `src/components/ImageUpload.tsx`: upload and sample image input
- `src/components/CardForm.tsx`: card form inputs
- `src/components/CardPreview.tsx`: card template
- `src/components/CardReveal.tsx`: final reveal, print placeholder, PNG autosave
- `src/app/api/generate-card/route.ts`: card generation API
- `src/app/api/cards/[id]/print-image/route.ts`: saved PNG upload API
- `src/app/cards/[id]/page.tsx`: QR destination page
- `src/lib/card-generation.ts`: prompt, AI call, validation, fallback
- `src/lib/card-records.ts`: Supabase row insert
- `src/lib/supabase-server.ts`: server-side Supabase client
