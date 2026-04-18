# InterviewLab

InterviewLab is a comprehensive simulation platform designed for both students and administrators to manage and conduct mock interviews. It features an AI-powered question generator, real-time interview monitoring, and a robust question bank covering various technologies.

## Features

- **Student Portal**: Take mock interviews in real-time with persistent timers and browser-exit protection.
- **Admin Dashboard**: Manage students, interview groups, and monitor interview progress.
- **AI Question Bank**: Thousands of questions across 20+ technologies including HTML, CSS, JavaScript, React, Node.js, Python, and more.
- **Integrity Checks**: Built-in mechanisms to ensure interview fairness.
- **Analytics**: Detailed performance metrics for students and overall group statistics.

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

The database schema is provided in `supabase_schema.sql`. You can run this in your Supabase SQL editor to set up the necessary tables.

## License

MIT

