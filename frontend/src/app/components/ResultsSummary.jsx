// frontend/app/components/ResultsSummary.jsx
'use client';

import { Download } from 'lucide-react';

const ResultsSummary = ({ results, onExport }) => {
  if (!results) {
    return null; // Don't render anything if there are no results
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4">Final Test Results</h2>
      <div className="flex space-x-4 mb-4">
        <button 
          onClick={() => onExport('json')} 
          className="flex items-center px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 transition-colors"
        >
          <Download className="mr-2" size={16}/> Export as JSON
        </button>
        <button 
          onClick={() => onExport('csv')} 
          className="flex items-center px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 transition-colors"
        >
          <Download className="mr-2" size={16}/> Export as CSV
        </button>
      </div>
      <pre className="bg-gray-900 p-4 rounded overflow-x-auto text-sm">
        <code>{JSON.stringify(results, null, 2)}</code>
      </pre>
    </div>
  );
};

export default ResultsSummary;