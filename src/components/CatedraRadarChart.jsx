"use client";
import React from 'react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';

export default function CatedraRadarChart({ data }) {
  // data should be an array like:
  // [
  //   { subject: 'Claridad', A: 4.5, fullMark: 5 },
  //   { subject: 'Material', A: 3.8, fullMark: 5 },
  //   { subject: 'Evaluación', A: 4.2, fullMark: 5 },
  //   { subject: 'Empatía', A: 4.8, fullMark: 5 },
  // ]

  if (!data || data.length === 0) return null;

  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 600 }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 5]} 
            tick={{ fill: '#9ca3af', fontSize: 10 }}
          />
          <Radar
            name="Cátedra"
            dataKey="A"
            stroke="var(--color-primary)"
            fill="var(--color-primary)"
            fillOpacity={0.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
