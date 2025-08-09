// frontend/app/components/ConfigForm.jsx
'use client';

import { Play, Square } from 'lucide-react';

const ConfigForm = ({ onSubmit, onStop, isTesting }) => (
    <form onSubmit={onSubmit} className="bg-black border-rose-50 border-2 p-10 rounded-lg shadow-lg w-full">
        <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-5">
            <input name="url" type="url" placeholder="API URL to test (e.g., https://api.example.com)" required className="p-8 rounded bg-black border border-gray-600 text-white focus:ring-2 focus:white outline-none" />
            <input name="connections" type="number" placeholder="Concurrent Connections (e.g., 10)" required className="p-2 rounded bg-black border border-gray-600 text-white focus:ring-2 focus:ring-white outline-none"  />
            <input name="duration" type="number" placeholder="Duration (seconds) (e.g., 10)" required className="p-5 rounded bg-black border border-gray-600 text-white focus:ring-2 focus:ring-white outline-none"  />
        </div>
        <div className="mt-4 flex space-x-4">
            <button type="submit" disabled={isTesting} className="flex items-center justify-center px-4 py-2 bg-white text-black border border-white rounded-md hover:bg-black hover:text-white disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
                <Play className="mr-2" size={16} /> Start Test
            </button>
            <button type="button" onClick={onStop} disabled={!isTesting} className="flex items-center justify-center px-4 py-2 bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
                <Square className="mr-2" size={16} /> Stop Test
            </button>
        </div>
    </form>
);

export default ConfigForm;