// frontend/app/components/TargetHistoryChart.jsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TargetHistoryChart = ({ data, dataKey, name, color, unit }) => (
    <div className="bg-black border-2 border-white p-4 rounded-lg shadow-lg h-72">
        <h3 className="text-lg p-2 font-semibold mb-4">{name}</h3>
        <ResponsiveContainer width="100%" height="85%">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                <XAxis dataKey="timestamp" stroke="#a0aec0" name="Run Time" />
                <YAxis stroke="#a0aec0" unit={unit} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#000000', border: '1px solid #ffffff', padding: '12px' }} />
                <Legend />
                <Line type="monotone" dataKey={dataKey} name={name} stroke={color} dot={{ r: 3 }} strokeWidth={3} />
            </LineChart>
        </ResponsiveContainer>
    </div>
);

export default TargetHistoryChart;
