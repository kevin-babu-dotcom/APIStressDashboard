// frontend/app/targets/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import TargetHistoryChart from '../../components/TargetHistoryChart';

export default function TargetDetailPage() {
  const { id } = useParams();
  const [runs, setRuns] = useState(null);
  const [trend, setTrend] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/targets/${id}/runs`).then((res) => res.json()),
      fetch(`${API_URL}/analysis/trend/${id}`).then((res) => res.json()),
    ])
      .then(([runsData, trendData]) => {
        setRuns(runsData);
        setTrend(trendData);
      })
      .catch(() => setError('Could not load target history. Is the backend running?'));
  }, [API_URL, id]);

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  if (!runs) {
    return <p className="text-gray-400">Loading target history...</p>;
  }

  return (
    <div className="space-y-8">
      <Link href="/targets" className="text-blue-400 hover:underline text-sm">
        &larr; Back to Targets
      </Link>

      {trend && (
        <div className="bg-black border-rose-50 border-2 p-6 rounded-lg">
          <p className="text-sm text-gray-400">p99 Trend</p>
          <p className="text-2xl font-bold capitalize">
            {trend.label}
            {trend.reason !== 'insufficient_data' && (
              <span className="text-base text-gray-400 font-normal ml-2">
                (slope {trend.slope?.toFixed(4)} ms/run, {(trend.relativeSlope * 100).toFixed(1)}% of mean p99)
              </span>
            )}
          </p>
          {trend.reason === 'insufficient_data' && (
            <p className="text-sm text-gray-500 mt-1">Need at least 2 runs to compute a trend.</p>
          )}
        </div>
      )}

      {runs.length === 0 ? (
        <p className="text-gray-400">No runs recorded for this target yet.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TargetHistoryChart data={runs} dataKey="p99" name="p99 Latency (ms)" color="#10b981" unit="ms" />
          <TargetHistoryChart data={runs} dataKey="requests_per_sec" name="Requests per Second" color="#3b82f6" unit="/s" />
        </div>
      )}
    </div>
  );
}
