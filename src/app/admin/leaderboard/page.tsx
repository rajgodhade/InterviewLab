'use client';

import LeaderboardView from '@/components/LeaderboardView';

export default function AdminLeaderboardPage() {
  return (
    <div className="container">
      <LeaderboardView isAdmin={true} />
    </div>
  );
}
