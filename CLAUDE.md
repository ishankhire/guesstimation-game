# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start development server (Next.js on localhost:3000)
- `npm run build` — Production build
- `npm run start` — Start production server (requires build first)
- `npm run lint` — Run ESLint

## Architecture

This is a Next.js 16 app using the App Router with TypeScript, Tailwind CSS v4, and React 19.

- **Source code** lives in `src/` with path alias `@/*` mapped to `./src/*`
- **App Router** entry point is `src/app/` — uses `layout.tsx` and `page.tsx` conventions
- **Styling** uses Tailwind CSS v4 via `@tailwindcss/postcss` plugin
- **ESLint** config is in `eslint.config.mjs` (flat config format, ESLint 9)
