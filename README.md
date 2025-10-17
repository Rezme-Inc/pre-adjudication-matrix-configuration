# Pre-Adjudication Matrix (minimal scaffold)

This repository was reorganized into a minimal React + TypeScript + Vite scaffold so you can run the UI locally.

Quick start

1. Install Node.js (v18+) and npm.
2. Install dependencies:

```
npm install
```

3. Create a `.env.local` file at the project root and add the Supabase keys:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_MATRIX_ID=your-matrix-id
VITE_COLLABORATOR_EMAIL=hiring.manager@example.com
```

4. Run the app:

```
npm run dev
```

Notes
- `.env.local` is ignored by `.gitignore` per request.
- `requirements.txt` contains a few Python packages you might want if using Python tooling.
