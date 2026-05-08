"use client";

import dynamic from 'next/dynamic';

const AdminDashboardDynamic = dynamic(
  () => import('../../components/AdminDashboard'),
  { ssr: false }
);

export default function AdminPage() {
  return <AdminDashboardDynamic />;
}
