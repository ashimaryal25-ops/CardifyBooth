# CardifyBooth

CardifyBooth is a privacy-minded AI photo booth kiosk for creating Gettysburg College-themed collectible trading cards. The current build uses a camera-first booth flow, generates card traits from a short self-description, renders a print-ready PNG, and stores the final card locally for QR access and printing.


## Demo Images

<p align="center">
  <img src="Screenshot 2026-06-20 134731.png" alt="CardifyBooth Demo" width="550">
</p>

<p align="center">
  <img src="Screenshot 2026-06-20 134926.png" alt="CardifyBooth Demo" width="550">
</p>

<p align="center">
  <img src="Screenshot 2026-06-20 135108.png" alt="CardifyBooth Demo" width="550">
</p>

<p align="center">
  <img src="Screenshot 2026-06-20 133639.png" alt="CardifyBooth Demo" width="550">
</p>

## Current Features

- Kiosk entry screen with `Card Booth` and reserved `Photo Collage` mode
- Camera-first card capture with sample-photo fallback for testing
- AI card identity generation from a short self-description
- Structured JSON generation with Zod validation
- Local fallback card generation when no OpenAI key is configured
- Gettysburg College-themed card renderer with rarity, trait bars, Campus Power, Known For, and Special Ability
- Local PNG storage in `.booth-storage/cards`
- Local SQLite metadata storage in `.booth-storage/cardifybooth.db`
- QR-friendly saved-card page at `/local-cards/[id]`
- Print button stub for the future physical print queue

## Stack

- Next.js App Router
- React and TypeScript
- Tailwind CSS
- OpenAI Responses API
- SQLite with `better-sqlite3`
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
```

The app still works without `OPENAI_API_KEY`; it uses the local fallback generator.

## Local Storage

Generated cards are stored locally on the booth computer:

```txt
.booth-storage/
  cardifybooth.db
  cards/
    {cardId}.png
```

The PNG file is the actual final card image. SQLite stores the metadata that points to that PNG, including display name, rarity, trait scores, Campus Power, print status, creation time, and expiration time.

## Card Flow

```txt
Card Booth
-> capture photo
-> enter name and self-description
-> generate card identity
-> render final card PNG
-> save PNG locally
-> insert SQLite metadata row
-> QR points to /local-cards/{cardId}
```

## Important Files

- `src/components/BoothApp.tsx`: main kiosk flow
- `src/components/ImageUpload.tsx`: camera capture and sample input
- `src/components/CardForm.tsx`: name and self-description form
- `src/components/CardPreview.tsx`: card renderer
- `src/components/CardReveal.tsx`: final reveal, PNG export, local autosave
- `src/app/api/generate-card/route.ts`: card generation API
- `src/app/api/local-cards/route.ts`: local PNG and metadata save API
- `src/app/api/local-cards/[id]/image/route.ts`: local saved PNG image endpoint
- `src/app/local-cards/[id]/page.tsx`: QR destination page
- `src/lib/card-generation.ts`: OpenAI prompt, structured output, validation, fallback
- `src/lib/local-card-storage.ts`: saves PNG file and creates metadata record
- `src/lib/local-card-db.ts`: SQLite table, insert, and fetch helpers

## Privacy Note

The final card PNG and card metadata are saved locally. The current AI scoring layer sends the self-description to OpenAI when `OPENAI_API_KEY` is configured; local fallback generation is used when the key is missing.
