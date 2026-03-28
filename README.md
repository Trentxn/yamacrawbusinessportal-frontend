# Yamacraw Business Portal - Frontend

The frontend application for the [Yamacraw Business Portal](https://yamacrawbusinessportal.com), a civic business directory connecting residents of the Yamacraw constituency in Nassau, The Bahamas with local businesses, government contractors, and service providers.

Sponsored by the Office of Minister Zane Enrico Lightbourne, Member of Parliament for Yamacraw.

## Tech Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS v4** for styling
- **TanStack Query** for server state and caching
- **React Router v7** for client-side routing
- **React Hook Form** + **Zod** for form validation
- **Framer Motion** for animations
- **Axios** with JWT interceptor for API communication
- **Cloudflare Turnstile** for CAPTCHA protection
- **Lucide React** for icons

## Features

**Public**
- Homepage with featured businesses, category browsing, and search
- Business directory with filtering by category, type, and tags
- Business detail pages with photo galleries, operating hours, and inquiry forms
- About, FAQ, Terms of Service, Privacy Policy, and Contact pages

**Registered Users**
- Account registration with email verification
- Inquiry tracking dashboard with status updates
- Profile management

**Business Owners**
- Business listing creation and management (up to 5 listings)
- Photo uploads with reordering and captions
- Inquiry inbox with reply functionality
- Dashboard with listing stats and profile completeness

**Admin Portal**
- Listing moderation queue (approve, reject, suspend)
- Category management
- Inquiry oversight and flag moderation
- Portal statistics dashboard
- User management and audit logs (system admin)

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Development

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`. Set `VITE_API_BASE_URL` in a `.env` file to point to the API (defaults to `/api`).

### Build

```bash
npm run build
```

Output goes to `dist/`.

### Docker

The frontend is containerized and served via nginx. See `docker-compose.yml` for the full stack setup including the API, PostgreSQL, and nginx reverse proxy.

```bash
docker compose up --build
```

This starts the full stack at `http://localhost:8080`.

## Project Structure

```
src/
  api/          # API client, endpoint modules, TypeScript types
  components/   # Reusable UI components
  contexts/     # React context providers (Auth, Notifications)
  hooks/        # Custom hooks
  layouts/      # Page layout shells (Public, Dashboard, Admin, etc.)
  pages/        # Route pages organized by section
  styles/       # Global CSS and Tailwind theme
  utils/        # Formatters, validators, helpers
```

## Related

- [yamacrawbusinessportal-api](https://github.com/yamacrawbusinessportal/yamacrawbusinessportal-api) - Backend API

## License

Private. All rights reserved.
