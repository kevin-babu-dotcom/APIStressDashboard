// frontend/app/page.js
'use client';

import { useState, useEffect } from 'react';
// Import all three of your separate components
import ConfigForm from './components/ConfigForm';
import MetricsChart from './components/MetricsChart';
import ResultsSummary from './components/ResultsSummary';

export default function HomePage() {
  // --- State Management ---
  const [isTesting, setIsTesting] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState({ cpu: 0, memory: 0 });
  const [finalResults, setFinalResults] = useState(null);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // --- Side Effect for SSE Connection ---
  useEffect(() => {
    const eventSource = new EventSource(`${API_URL}/metrics`);
    console.log('Connecting to SSE...');
    let time = 0;

    eventSource.addEventListener('system:update', (event) => {
      const data = JSON.parse(event.data);
      setSystemMetrics(data);
    });

    eventSource.addEventListener('test:progress', (event) => {
      const data = JSON.parse(event.data);
      time += 1;
      setChartData(prev => [...prev.slice(-20), { ...data, time }]);
    });

    eventSource.addEventListener('test:complete', (event) => {
      const data = JSON.parse(event.data);
      setFinalResults(data);
      setIsTesting(false);
      console.log('Test complete event received.');
    });

    eventSource.onerror = () => {
      console.error("SSE connection error or closed by server.");
      eventSource.close();
    };

    return () => {
      console.log('Closing SSE connection.');
      eventSource.close();
    };
  }, [API_URL]);

  // --- Handler Functions (These were missing) ---
  const handleStartTest = async (e) => {
    e.preventDefault();
    setChartData([]);
    setFinalResults(null);
    setIsTesting(true);

    const formData = new FormData(e.target);
    const config = Object.fromEntries(formData.entries());

    await fetch(`${API_URL}/stress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', config }),
    });
  };

  const handleStopTest = async () => {
    await fetch(`${API_URL}/stress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stop' }),
    });
    setIsTesting(false);
  };
  
  const handleExport = (format) => {
    window.open(`${API_URL}/export?format=${format}`, '_blank');
  };

  // --- JSX for Rendering the Page ---
  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Zero-Downtime API Stress Dashboard</h1>
          <p className="text-gray-400 mt-2">Simulate load and monitor your API&apos;s performance in real-time.</p>
        </header>

        <ConfigForm onSubmit={handleStartTest} onStop={handleStopTest} isTesting={isTesting} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-4 rounded-lg flex justify-around text-center">
                <div><p className="text-sm text-gray-400">CPU Usage</p><p className="text-2xl font-bold">{systemMetrics.cpu}%</p></div>
                <div><p className="text-sm text-gray-400">Memory Usage</p><p className="text-2xl font-bold">{systemMetrics.memory}%</p></div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg flex justify-around text-center">
                <div><p className="text-sm text-gray-400">Requests/Sec</p><p className="text-2xl font-bold">{chartData.length > 0 ? chartData[chartData.length - 1].requests.mean.toFixed(1) : '0.0'}</p></div>
                <div><p className="text-sm text-gray-400">Latency (p99)</p><p className="text-2xl font-bold">{chartData.length > 0 ? chartData[chartData.length - 1].latency.p99.toFixed(1) : '0.0'} ms</p></div>
            </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MetricsChart data={chartData} yKey="requests.mean" name="Requests per Second" color="#3b82f6" unit="/s" />
          <MetricsChart data={chartData} yKey="latency.p99" name="p99 Latency (ms)" color="#10b981" unit="ms" />
        </div>

        <ResultsSummary results={finalResults} onExport={handleExport} />
      </div>
    </main>
  );
}