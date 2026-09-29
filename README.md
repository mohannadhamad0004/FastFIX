# FastFIX

Car maintenance platform: customers upload a photo, video or audio of a car problem, an AI gives a preliminary diagnosis, and a mechanic confirms it.

## Project layout

| Folder            | What it is                                             |
| ----------------- | ------------------------------------------------------ |
| `apps/web/`       | React web app (Vite + CSS Modules)                     |
| `apps/mobile/`    | React Native app (not initialized yet)                 |
| `apps/api/`       | Node.js API (Express + PostgreSQL)                     |
| `packages/shared/`| Types, API client and validation shared by web + mobile |

Each feature and module folder has its own README explaining its purpose. Conventions are in `CLAUDE.md`.

## Getting started

Requirements: Node.js 22+ and PostgreSQL.

```sh
npm install
npm install express cors helmet pg -w @fastfix/api
npm install -D concurrently
copy apps\api\.env.example apps\api\.env      # then edit apps/api/.env
npm run dev                                    # api on :4000, web on :5173
```

API keys (AI, maps) go in `apps/api/.env` only. The web and mobile apps call the api, never the AI provider directly.
