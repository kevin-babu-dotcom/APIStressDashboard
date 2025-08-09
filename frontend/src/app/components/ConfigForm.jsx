// frontend/app/components/ConfigForm.jsx
'use client';

import { Play, Square } from 'lucide-react';

const ConfigForm = ({ onSubmit, onStop, isTesting }) => (
    <form onSubmit={onSubmit} className="bg-gray-800 p-6 rounded-lg shadow-lg w-full">
        <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input name="url" type="url" placeholder="API URL to test (e.g., https://api.example.com)" required className="p-2 rounded bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
            <input name="connections" type="number" placeholder="Concurrent Connections" required className="p-2 rounded bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 outline-none" defaultValue="10" />
            <input name="duration" type="number" placeholder="Duration (seconds)" required className="p-2 rounded bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 outline-none" defaultValue="10" />
        </div>
        <div className="mt-4 flex space-x-4">
            <button type="submit" disabled={isTesting} className="flex items-center justify-center px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
                <Play className="mr-2" size={16} /> Start Test
            </button>
            <button type="button" onClick={onStop} disabled={!isTesting} className="flex items-center justify-center px-4 py-2 bg-red-600 rounded hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
                <Square className="mr-2" size={16} /> Stop Test
            </button>
        </div>
    </form>
);

export default ConfigForm;