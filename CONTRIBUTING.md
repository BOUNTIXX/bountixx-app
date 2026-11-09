# Contributing to bountixx-app

The Next.js product: Arena play plus the optional Community Rush layer.

## Setup

Clone this repository next to `bountixx-rush-sdk` (it is a `file:` dependency):

```bash
git clone https://github.com/BOUNTIXX/bountixx-rush-sdk.git
git clone https://github.com/BOUNTIXX/bountixx-app.git
(cd bountixx-rush-sdk && npm ci && npm run build)
cd bountixx-app
npm ci
cp .env.example .env.local   # fill in Clerk and Neon values for local dev
npm run dev
```

Before opening a pull request:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

This is Next.js 16: read the relevant guide in `node_modules/next/dist/docs/`
before using a new Next.js API. A wallet must never be required for normal
Arena play.

## Ground rules

- Read `PROJECT_CONTEXT.md` (or `docs/PRD.md` in the app) before changing behaviour.
- Never commit secrets: no Stellar secret keys, PEM private keys, Bearer
  secrets, or database URLs. Use `.env.example` for variable names only.
- Stellar **Testnet only**. Do not add Mainnet configuration.
- Keep the trust model honest. The verifier is the authorised attester; do not
  describe results as trustless or fully on-chain.
- One focused change per pull request, with tests for new behaviour.

## Drips Wave contributors

Issues labelled for a Drips Wave program are scoped so they can be completed
within one Wave. Please:

- Apply through the Drips Wave app and wait to be assigned before starting.
- Ask questions on the issue if the scope is unclear, rather than guessing.
- Submit work you understand and have tested yourself. Untested or
  copy-pasted generated code, and trivial PRs made to farm points, will be
  closed.
