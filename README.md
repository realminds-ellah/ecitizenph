
  # eCitizenPH

  Hackathon prototype of the Philippine eGovPH super-app, featuring the
  eCitizenPH intelligence layer: a proactive government-benefits recommender
  gated behind a simulated PhilSys National ID verification, with an explicit
  national-ID-plus-supporting-documents flow for applying to each recommended
  program.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the frontend dev server.

  Run `npm run server` (in a second terminal) to start the backend proxy
  (`server/index.mjs`) that fronts the real eVerify / eReport / eMessage
  hackathon sandbox APIs — see `server/.env.example` for the credentials it
  needs. Without them, `/api/verify` and `/api/ereport/*` return `501` and the
  app falls back to its local simulated verification flow.
  