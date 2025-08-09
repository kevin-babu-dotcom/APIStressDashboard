// frontend/app/components/MetricsChart.jsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MetricsChart = ({ data, yKey, name, color, unit }) => (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-72">
        <h3 className="text-lg font-semibold mb-4">{name}</h3>
        <ResponsiveContainer width="100%" height="85%">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                <XAxis dataKey="time" stroke="#a0aec0" name="Time" unit="s" />
                <YAxis stroke="#a0aec0" unit={unit} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }} />
                <Legend />
                <Line type="monotone" dataKey={yKey} name={name} stroke={color} dot={false} strokeWidth={2} />
            </LineChart>
        </ResponsiveContainer>
    </div>
);

export default MetricsChart;