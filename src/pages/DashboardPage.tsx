// src/pages/DashboardPage.tsx
import { Layout } from '../components/Layout'; // Reutilizamos el layout que ya creamos

export function DashboardPage() {
  return (
    <Layout>
      <h2 className="text-3xl font-semibold text-gray-800">Vista Principal de la Agenda</h2>
      <p className="text-gray-600 mt-2">
        Selecciona una fecha para ver las citas programadas.
      </p>
    </Layout>
  );
}