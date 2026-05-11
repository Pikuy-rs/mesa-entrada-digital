"use client";
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { format, differenceInHours, startOfMonth, startOfWeeks, endOfWeek, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Users, 
  ChevronDown,
  BarChart2,
  Calendar
} from 'lucide-react';

export default function AnalyticsView({ submissions = [], evaluations = [] }) {
  const [selectedCatedra, setSelectedCatedra] = useState('');

  // 1. KPIs de Mesa de Entrada
  const kpis = useMemo(() => {
    const total = submissions.length;
    const completed = submissions.filter(s => s.status === 'completed').length;
    const resolutionRate = total > 0 ? (completed / total) * 100 : 0;

    // SLA (Tiempo de respuesta promedio en horas)
    const resolvedWithTimes = submissions.filter(s => s.status === 'completed' && s.completedAt && s.createdAt);
    const totalHours = resolvedWithTimes.reduce((acc, curr) => {
      const start = curr.createdAt.toDate();
      const end = curr.completedAt.toDate();
      return acc + differenceInHours(end, start);
    }, 0);
    const sla = resolvedWithTimes.length > 0 ? totalHours / resolvedWithTimes.length : 0;

    return { total, completed, resolutionRate, sla };
  }, [submissions]);

  // 2. Gráfico de Demanda Estacional (Trámites por Mes)
  const demandData = useMemo(() => {
    const monthsMap = {};
    submissions.forEach(s => {
      if (!s.createdAt) return;
      const date = s.createdAt.toDate();
      const monthKey = format(date, 'MMM yy', { locale: es });
      monthsMap[monthKey] = (monthsMap[monthKey] || 0) + 1;
    });

    return Object.entries(monthsMap).map(([name, total]) => ({ name, total }));
  }, [submissions]);

  // 3. Evolución Académica (LineChart)
  const uniqueCatedras = useMemo(() => {
    return Array.from(new Set(evaluations.map(e => e.catedra))).sort();
  }, [evaluations]);

  const academicTrendData = useMemo(() => {
    if (!selectedCatedra) return [];

    const filtered = evaluations
      .filter(e => e.catedra === selectedCatedra && e.createdAt)
      .sort((a, b) => a.createdAt.toDate() - b.createdAt.toDate());

    // Agrupar por mes para suavizar la línea
    const timelineMap = {};
    filtered.forEach(e => {
      const date = e.createdAt.toDate();
      const key = format(date, 'MMM yy', { locale: es });
      if (!timelineMap[key]) {
        timelineMap[key] = { name: key, ICT: 0, NDC: 0, CAT: 0, TCE: 0, count: 0 };
      }
      const t = timelineMap[key];
      t.ICT += (e.ict || 0);
      t.NDC += (e.ndc || 0);
      t.CAT += (e.cat || 0);
      t.TCE += (e.tce || 0);
      t.count++;
    });

    return Object.values(timelineMap).map(t => ({
      name: t.name,
      ICT: Number((t.ICT / t.count).toFixed(1)),
      NDC: Number((t.NDC / t.count).toFixed(1)),
      CAT: Number((t.CAT / t.count).toFixed(1)),
      TCE: Number((t.TCE / t.count).toFixed(1))
    }));
  }, [evaluations, selectedCatedra]);

  const Card = ({ title, value, icon: Icon, color, suffix = "" }) => (
    <div style={{ 
      background: '#ffffff', 
      padding: '32px', 
      borderRadius: '4px', 
      border: '3px solid var(--color-primary)',
      boxShadow: `8px 8px 0px 0px ${color || 'var(--color-primary)'}`,
      flex: '1 1 200px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ background: `${color}15`, padding: '10px', borderRadius: '4px', color }}>
          <Icon size={24} />
        </div>
        <span style={{ fontSize: '0.85rem', fontWeight: '900', color: color || 'var(--color-primary)', textTransform: 'uppercase' }}>Histórico</span>
      </div>
      <h3 style={{ fontSize: '2.5rem', fontWeight: '950', color: 'var(--color-primary)', margin: '0 0 4px 0', fontFamily: 'var(--font-display)' }}>
        {typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(1) : value}{suffix}
      </h3>
      <p style={{ margin: 0, color: 'var(--color-text)', fontSize: '1rem', fontWeight: '700' }}>{title}</p>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* KPIs Section */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        <Card title="Volumen Total" value={kpis.total} icon={TrendingUp} color="#3f75ab" />
        <Card title="Resolución" value={kpis.resolutionRate} icon={CheckCircle} color="#10b981" suffix="%" />
        <Card title="SLA (Promedio)" value={kpis.sla} icon={Clock} color="#f59e0b" suffix=" h" />
        <Card title="Cátedras Activas" value={uniqueCatedras.length} icon={Users} color="#ef5f27" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '32px' }}>
        
        {/* Demand Chart */}
        <div style={{ background: '#ffffff', padding: '32px', borderRadius: '4px', border: '3px solid var(--color-primary)', boxShadow: '8px 8px 0px 0px rgba(0,0,0,0.1)' }}>
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BarChart2 style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ margin: 0, fontWeight: '900', fontSize: '1.6rem', fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>Demanda Administrativa</h3>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={demandData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontWeight: '900', fontSize: 12, fill: 'var(--color-primary)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontWeight: '900', fontSize: 12, fill: 'var(--color-primary)' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '4px', border: '2px solid var(--color-primary)', boxShadow: '8px 8px 0px 0px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: '900' }}
                />
                <Bar dataKey="total" fill="var(--color-primary)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Academic Evolution Chart */}
        <div style={{ background: '#ffffff', padding: '32px', borderRadius: '4px', border: '3px solid var(--color-primary)', boxShadow: '8px 8px 0px 0px rgba(0,0,0,0.1)' }}>
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <TrendingUp style={{ color: 'var(--color-accent)' }} />
              <h3 style={{ margin: 0, fontWeight: '900', fontSize: '1.6rem', fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>Evolución de Cátedra</h3>
            </div>
            <select 
              className="glass-input" 
              value={selectedCatedra} 
              onChange={(e) => setSelectedCatedra(e.target.value)}
              style={{ padding: '8px 16px', borderRadius: '4px', fontWeight: '900', border: '2px solid var(--color-primary)', background: '#fff', width: 'auto' }}
            >
              <option value="">Seleccionar Cátedra...</option>
              {uniqueCatedras.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          
          <div style={{ height: '300px', width: '100%' }}>
            {!selectedCatedra ? (
              <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--color-primary)', fontWeight: '900', border: '3px dashed var(--color-primary)33', borderRadius: '4px' }}>
                Seleccione una cátedra para visualizar la tendencia
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={academicTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontWeight: '900', fontSize: 12, fill: 'var(--color-primary)' }} />
                  <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fontWeight: '900', fontSize: 12, fill: 'var(--color-primary)' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '4px', border: '2px solid var(--color-primary)', boxShadow: '8px 8px 0px 0px rgba(0,0,0,0.1)' }}
                  />
                  <Legend iconType="square" wrapperStyle={{ fontWeight: '900', paddingTop: '20px', color: 'var(--color-primary)' }} />
                  <Line type="monotone" dataKey="ICT" stroke="var(--color-primary)" strokeWidth={5} dot={{ r: 6, fill: 'var(--color-primary)' }} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="NDC" stroke="#10b981" strokeWidth={5} dot={{ r: 6, fill: '#10b981' }} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="CAT" stroke="#f59e0b" strokeWidth={5} dot={{ r: 6, fill: '#f59e0b' }} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="TCE" stroke="var(--color-accent)" strokeWidth={5} dot={{ r: 6, fill: 'var(--color-accent)' }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
