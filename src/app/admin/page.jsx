import dynamic from 'next/dynamic';
import AuthGuard from '../../components/AuthGuard';

// Forzamos que el Dashboard y todos sus listeners nazcan solo en el navegador
// Evita que Next.js intente pre-renderizar en el servidor sin contexto de autenticación
const AdminDashboard = dynamic(
  () => import('../../components/AdminDashboard'),
  { ssr: false }
);

export const metadata = {
  title: "Gestión | Alternativa Tecnológica",
};

export default function AdminPage() {
  return (
    <main>
      <AuthGuard>
        <AdminDashboard />
      </AuthGuard>
    </main>
  );
}
