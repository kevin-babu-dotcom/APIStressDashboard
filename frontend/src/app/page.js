// frontend/app/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function OverviewPage() {
  const [aggregate, setAggregate] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetch(`${API_URL}/analysis/aggregate`)
      .then((res) => res.json())
      .then(setAggregate)
      .catch(() => setError('Could not load analysis. Is the backend running?'));
  }, [API_URL]);

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  if (!aggregate) {
    return <p className="text-gray-400">Loading analysis...</p>;
  }

  const { worst, averageErrorRate, ranked } = aggregate;

  if (ranked.length === 0) {
    return (
      <div className="bg-black border-2 border-white p-8 rounded-lg text-center">
        <p className="text-gray-400">No test runs yet. Head to the Stress Test tab to run one.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-black border-rose-50 border-2 p-8 rounded-lg">
          <p className="text-sm text-gray-400">Worst p99 Latency</p>
          {worst ? (
            <>
              <p className="text-2xl font-bold">{worst.p99?.toFixed(2)} ms</p>
              <p className="text-gray-400 mt-1">{worst.label || worst.url}</p>
              <Link href={`/targets/${worst.target_id}`} className="text-blue-400 hover:underline text-sm">
                View target &rarr;
              </Link>
            </>
          ) : (
            <p className="text-2xl font-bold">N/A</p>
          )}
        </div>
        <div className="bg-black border-rose-50 border-2 p-8 rounded-lg">
          <p className="text-sm text-gray-400">Average Error Rate (all runs)</p>
          <p className="text-2xl font-bold">{averageErrorRate != null ? `${averageErrorRate.toFixed(2)}%` : 'N/A'}</p>
        </div>
      </div>

      <div className="bg-black border-2 border-white p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Targets Ranked by Average p99 Latency</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-600 text-gray-400 text-sm">
              <th className="py-2 pr-4">Target</th>
              <th className="py-2 pr-4">Avg p99 (ms)</th>
              <th className="py-2 pr-4">Runs</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((t) => (
              <tr key={t.target_id} className="border-b border-gray-800 hover:bg-gray-900">
                <td className="py-2 pr-4">
                  <Link href={`/targets/${t.target_id}`} className="text-blue-400 hover:underline">
                    {t.label || t.url}
                  </Link>
                </td>
                <td className="py-2 pr-4">{t.avg_p99?.toFixed(2)}</td>
                <td className="py-2 pr-4">{t.run_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
