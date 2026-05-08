import AdminDashboard from '../../components/AdminDashboard';
import AuthGuard from '../../components/AuthGuard';

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
