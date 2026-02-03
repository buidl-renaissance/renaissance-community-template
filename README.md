# Renaissance Community Template

A ready-to-use community app template for organizers who want to run a members hub with events, a social feed, chat, and member directory—without building from scratch.

## What It’s For

This template is for **community organizers** who need:

- **A home base** – One place for your community to see what’s happening and find resources.
- **Events** – List upcoming events, RSVPs, and optional links to external event pages.
- **Social feed** – Posts, likes, and comments so members can share and stay in the loop.
- **Chat** – A shared community chat so people can talk in real time.
- **Members** – A simple directory so members can see who’s in the community and join.
- **Admin tools** – Email broadcasts to members (e.g. via Resend) and role-based access (admin/organizer).

You can turn features on or off and rebrand the app so it fits your community instead of the other way around.

## Features at a Glance

| Feature | Description |
|--------|-------------|
| **Home** | Resources, quick links, guides, FAQs, and a compact list of upcoming events. |
| **Feed** | Social feed with rich posts, images, likes, and comments. |
| **Events** | Create and list events, RSVPs, optional external event links. |
| **Members** | Member directory with search; “Join community” for new users. |
| **Chat** | Full-page community chat with a fixed input and scrollable history. |
| **Account** | Profile, sign out, QR sign-in for desktop; profile visibility (public / members only / hidden); notification toggles (stub in v1); admin section when applicable. |
| **Admin** | Email broadcasts to members (Resend); restricted to admins. |

**Auth:** Phone + PIN by default; optional wallet-based QR sign-in for desktop.

## Getting Started

### 1. Install and run

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000). You’ll land on the app entry; use **Register** or **Login** to create an account and try the app.

### 2. Database

The app uses SQLite (file-based) by default, with optional [Turso](https://turso.tech) for a hosted DB.

- **Local:** Ensure `USE_LOCAL=true` (or unset `TURSO_AUTH_TOKEN`) so the app uses `./dev.sqlite3`.
- **Apply migrations:**

  ```bash
  yarn db:push
  # or
  yarn db:migrate
  ```

- **Seed sample data** (events, members, messages, posts):

  ```bash
  yarn db:seed
  ```

After seeding, log in and you’ll see sample events on the home page, posts in the feed, messages in chat, and members in the directory.

### 3. Environment

Copy `env.example` to `.env.local` and set any variables you need (e.g. Resend API key for broadcasts, Turso URL/token if you use Turso). Local SQLite works without extra env for development.

## How Community Organizers Use It

### Branding and features

Edit **`src/config/community.ts`** to:

- Set your **community name**, tagline, and description.
- Set **branding**: logo path, favicon.
- Turn features **on/off**: members, chat, events, social feed.
- Configure **home page copy**: mission, who it’s for, how to participate, how to contribute/lead, member value; optional FAQ/guidelines URLs (linked, not inline).
- **Visibility and safety**: `memberDirectoryPublic` (who can see the member list), `eventsPublic`, `attendeeVisibility` for event attendee lists (`public` | `members` | `attendees_only`), and member-level profile visibility (Account).
- **Engagement**: `showLikes` — when false (default), like button and count are hidden on posts; comments remain.
- **Events**: `attendeeVisibility` (see above); `autoEventRecap` — when enabled in future, a system post can be created after an event ends (implementation deferred for v1).
- **Chat**: Single channel in v1. Config key `features.chatChannels` is `'single'`; future values may include `'event_based'` or `'topic_based'` for multiple channels.
- Set **theme** colors (primary, etc.).
- Add **social links** (Twitter, Discord, website, etc.) and contact info.

That file is the main “control panel” for how the template behaves and looks.

### Day-to-day use

- **Events** – Organizers and admins can create events; members see them on the home page and on the Events list and can RSVP.
- **Feed** – Chronological (newest first); anyone (or only members, depending on config) can post. Likes are optional per community (`showLikes`); comments are always available.
- **Chat** – Single community-wide channel in v1; useful for announcements and casual conversation. Multi-channel structure (e.g. event-based, topic-based) is planned; see `features.chatChannels` in config.
- **Members** – New users can join the community; the directory helps people discover each other. Directory visibility is configurable (`memberDirectoryPublic`); members can set profile visibility (public, members only, hidden) on the Account page.
- **Broadcasts** – Admins can send email blasts to members from the Account → Admin → Broadcasts area (requires Resend configured).

### Roles

- **User** – Default: can post, chat, RSVP, join as member.
- **Organizer** – Can create and manage events.
- **Mentor** – Displayed in the member directory; use for community mentors (set in DB).
- **Admin** – Can do everything organizers can, plus send email broadcasts and access admin-only UI.

Roles are set in the database (e.g. when seeding or via your own tooling).

## Customization Overview

| What | Where |
|------|--------|
| Name, tagline, description | `src/config/community.ts` → `name`, `tagline`, `description` |
| Logo, favicon | `src/config/community.ts` → `branding` |
| Features on/off | `src/config/community.ts` → `features` |
| Theme colors | `src/config/community.ts` → `theme` |
| Social / contact links | `src/config/community.ts` → `social`, `contact` |
| Home page copy and resources | `src/config/community.ts` → `home` (mission, how to participate, member value, FAQ/guidelines URLs); dashboard renders from config |

## Scripts

| Command | Purpose |
|--------|--------|
| `yarn dev` | Start dev server (Turbopack). |
| `yarn build` | Production build. |
| `yarn start` | Run production server. |
| `yarn db:push` | Push schema to DB (Drizzle). |
| `yarn db:migrate` | Run migrations. |
| `yarn db:seed` | Seed sample events, members, messages, posts. |
| `yarn db:studio` | Open Drizzle Studio on the DB. |
| `yarn lint` | Run ESLint. |

## Tech Stack

- **Next.js** (Pages Router) with React
- **Styled Components** for UI
- **Drizzle ORM** with SQLite / Turso (libsql)
- **Resend** for email (broadcasts)
- **bcrypt** for PIN hashing; **ethers** for optional wallet-based QR sign-in

---

You can use this template as a starting point for a members-only site, a local community hub, or an event-driven community—customize the config and content to match how you run your community.
