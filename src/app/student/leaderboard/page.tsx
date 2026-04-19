'use client';

import LeaderboardView from '@/components/LeaderboardView';

export default function StudentLeaderboardPage() {
  return (
    <div className="container">
      <LeaderboardView isAdmin={false} />
    </div>
  );
}
