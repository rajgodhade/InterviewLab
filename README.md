# InterviewLab

InterviewLab is a premium simulation platform designed for both students and administrators to manage and conduct mock interviews. It features an AI-powered question generator, a resilient offline-first interview engine, and a comprehensive study material management system.

---

## Features

- **Student Portal**: Take mock interviews in real-time with persistent timers and browser-exit protection.
- **Admin Dashboard**: Manage students, batches, and monitor interview progress in real-time.
- **Study Material Module**: Centralized hub for students to access curated learning resources (videos, docs) assigned by instructors.
- **Offline Mode**: Resilient interview engine with local caching and auto-sync for unstable connections.
- **AI Question Bank**: Dynamically generated and static questions across 20+ technologies including HTML, CSS, JavaScript, React, and more.
- **In-App Inbox**: Integrated notification system for assignments and feedback.
- **Analytics & Leaderboards**: Detailed performance metrics and competitive ranking for students and batches.

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Database**: Supabase
- **Styling**: Tailwind CSS / Vanilla CSS
- **AI Integration**: Custom AI question generation fallback system

## Getting Started

### Prerequisites

- Node.js 18.x or later
- A Supabase account and project

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Database Schema

The database schema is provided in two parts:
- `supabase_schema.sql`: Core tables for students, interviews, and batches.
- `supabase_study_material.sql`: Tables for the study material module.

You can run these in your Supabase SQL editor to set up the environment.

## License

MIT

