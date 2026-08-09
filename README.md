# AB TALKS AI Interview Agent

A premium AI-powered technical interview platform that simulates realistic adaptive interviews, scores candidate responses in real time, and generates detailed performance reports. Built for the AB TALKS 31-Day Enterprise AI Engineering cohort.

## Features

- **AI-Powered Interviews** — Conversational interview flow with an AI interviewer that asks questions and evaluates answers in real time
- **Adaptive Questioning** — Follow-up questions adapt based on candidate responses and learning signals
- **Candidate Profiling** — Multiple candidate profiles with strengths, weaknesses, and learning signal history
- **Curriculum-Aware Questioning** — Questions mapped to a 31-day AI engineering curriculum (RAG, Vector Databases, Prompt Engineering, Agentic AI, MCP, AI Deployment, Production AI)
- **Technical Scoring** — Multi-dimensional scoring (technical accuracy, depth, clarity) per answer with an overall technical fit score
- **Interview Reports** — AI-generated report with summary, recommendation, topic-wise performance, strengths, growth areas, and ideal model answers
- **Historical Reports** — Dashboard of all past interview sessions with scores, dates, and status
- **31-Day AI Curriculum** — Visual cohort journey grid showing completed, active, and pending days
- **Responsive UI** — Fully responsive across mobile, tablet, laptop, and large desktop screens
- **Premium Dark Glassmorphism** — Polished dark theme with glassmorphism, subtle animations, and accessible interactions

## Tech Stack

- **Framework:** Next.js 13 (App Router)
- **Language:** TypeScript
- **UI Library:** React 18
- **Styling:** Tailwind CSS
- **Component Library:** shadcn/ui (Radix UI primitives)
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Icons:** Lucide React
- **Backend:** Supabase (PostgreSQL database, session persistence)
- **Deployment:** Netlify (via `@netlify/plugin-nextjs`)

## Installation

```bash
git clone https://github.com/ashoknani0705-hash/ab-talks.git
cd ab-talks
npm install
```

## Environment Variables

Create a `.env` file in the project root with the following variables. Do not commit this file.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Running Locally

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Build

```bash
npm run build
```

## Lint and Type Check

```bash
npm run lint
npm run typecheck
```

## Deployment

This project is configured for Netlify deployment using `@netlify/plugin-nextjs`.

1. Push the repository to GitHub
2. Connect the repository to Netlify
3. Set the environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Netlify dashboard
4. Deploy — Netlify will run `npm run build` automatically

## Routes

| Route | Description |
|-------|-------------|
| `/` | Dashboard with cohort journey, stats, and candidate selector |
| `/setup` | Candidate setup and interview configuration |
| `/interview` | Live AI interview with chat, timer, and scoring |
| `/report` | Detailed interview report with charts and analysis |
| `/reports` | History of all completed interview sessions |

## Project Structure

```
app/
  page.tsx              # Dashboard
  setup/page.tsx        # Candidate setup
  interview/page.tsx    # Live interview
  report/page.tsx       # Interview report
  reports/page.tsx      # Reports history
components/
  app-shell.tsx         # Layout shell with mobile navigation
  sidebar.tsx           # Navigation sidebar
  ui/                   # shadcn/ui components
lib/
  interview-context.tsx # Interview state management
  interview-engine.ts   # Question generation, scoring, report logic
  types.ts              # TypeScript types
  supabase.ts           # Supabase client
  data/                 # Candidate and curriculum data
supabase/
  migrations/          # Database migrations
```

## License

This project is built for the AB TALKS community. For inquiries: team@abtalks.in
