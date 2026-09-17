// frontend/app/targets/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TargetsPage() {
  const [targets, setTargets] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetch(`${API_URL}/targets`)
      .then((res) => res.json())
      .then(setTargets)
      .catch(() => setError('Could not load targets. Is the backend running?'));
  }, [API_URL]);

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  if (!targets) {
    return <p className="text-gray-400">Loading targets...</p>;
  }

  if (targets.length === 0) {
    return (
      <div className="bg-black border-2 border-white p-8 rounded-lg text-center">
        <p className="text-gray-400">No targets yet. Head to the Stress Test tab to run one.</p>
      </div>
    );
  }

  return (
    <div className="bg-black border-2 border-white p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Targets</h2>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-600 text-gray-400 text-sm">
            <th className="py-2 pr-4">Target</th>
            <th className="py-2 pr-4">Requests/Sec (latest)</th>
            <th className="py-2 pr-4">p99 (latest)</th>
            <th className="py-2 pr-4">Last Run</th>
          </tr>
        </thead>
        <tbody>
          {targets.map((t) => (
            <tr key={t.id} className="border-b border-gray-800 hover:bg-gray-900">
              <td className="py-2 pr-4">
                <Link href={`/targets/${t.id}`} className="text-blue-400 hover:underline">
                  {t.label || t.url}
                </Link>
                {t.label && <p className="text-xs text-gray-500">{t.url}</p>}
              </td>
              <td className="py-2 pr-4">{t.requests_per_sec != null ? t.requests_per_sec.toFixed(1) : '—'}</td>
              <td className="py-2 pr-4">{t.p99 != null ? `${t.p99.toFixed(2)} ms` : '—'}</td>
              <td className="py-2 pr-4">{t.last_run_at || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
