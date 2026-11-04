# Hostel Management System â€” Frontend

The frontend application for Team 12's Hostel Management System at PES University.

## 1. Technology Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | React framework and App Router |
| React 19 | UI library |
| TypeScript | Type-safe application development |
| Tailwind CSS v4 | Utility-first styling |
| shadcn/ui | Reusable UI components |
| Base UI | Component primitives |
| Lucide React | Icons |
| next-themes | Persistent dark and light themes |

## 2. Prerequisites

Install the following before starting development:

- Node.js 20.9 or later
- npm

## 3. Installation and Setup

Clone the repository and navigate to the frontend directory.

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the application at:

http://localhost:3000

## 4. Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the development server |
| `npm run build` | Creates an optimized production build |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs ESLint checks |

## 5. Project Structure

```text
frontend/
â”œâ”€â”€ public/
â”‚   â”œâ”€â”€ file.svg
â”‚   â”œâ”€â”€ globe.svg
â”‚   â”œâ”€â”€ next.svg
â”‚   â”œâ”€â”€ vercel.svg
â”‚   â””â”€â”€ window.svg
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”œâ”€â”€ favicon.ico
â”‚   â”‚   â”œâ”€â”€ globals.css
â”‚   â”‚   â”œâ”€â”€ layout.tsx
â”‚   â”‚   â””â”€â”€ page.tsx
â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”œâ”€â”€ ui/
â”‚   â”‚   â”‚   â””â”€â”€ button.tsx
â”‚   â”‚   â”œâ”€â”€ hms-shell.tsx
â”‚   â”‚   â”œâ”€â”€ theme-provider.tsx
â”‚   â”‚   â””â”€â”€ theme-toggle.tsx
â”‚   â””â”€â”€ lib/
â”‚       â””â”€â”€ utils.ts
â”œâ”€â”€ components.json
â”œâ”€â”€ eslint.config.mjs
â”œâ”€â”€ next.config.ts
â”œâ”€â”€ package.json
â”œâ”€â”€ package-lock.json
â””â”€â”€ tsconfig.json
```

## 6. Design System

The frontend uses a dark-first visual design with support for persistent light and dark themes.

The shared design system is defined in:

- `src/app/globals.css` â€” Theme variables, colours, typography and global styles.
- `src/components/ui/` â€” Reusable UI components.
- `src/components/theme-provider.tsx` â€” Application theme provider.
- `src/components/theme-toggle.tsx` â€” Dark and light mode toggle.
- `src/components/hms-shell.tsx` â€” Shared application layout and navigation.

The interface uses a navy and slate colour palette with blue accents, responsive layouts and consistent typography.

## 7. Development Guidelines

- Use TypeScript for application code.
- Prefer reusable components over duplicated UI implementations.
- Follow the shared design tokens and CSS variables.
- Keep page-specific functionality separate from shared application components.
- Never commit environment files, secrets or local dependencies.
- Run linting and production builds before submitting changes.
- Keep the package lockfile synchronized with dependency changes.

## 8. Validation

Before submitting frontend changes, run:

```bash
npm run lint
npm run build
npm audit
```

All checks should complete successfully before creating a pull request.

## 9. Project Team

**Team 12 â€” PES University**

| Name | SRN | Role |
|---|---|---|
| Pranav Shashikiran Atreya | PES2UG24CS912 | Team Lead / Frontend |
| Kaushik Balaji | PES2UG24CS220 | Development Lead / Integration |
| Kanishk Kartik | PES2UG24CS213 | Testing / Validation |
| Harshith Manish | PES2UG24CS187 | Security / System Testing |

---

**Hostel Management System â€” Team 12**
PES University
