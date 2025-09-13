import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Calendar.css'; // Importaremos un archivo CSS para personalizar el calendario

type Cita = {
  id: number;
  nombre_cliente: string;
  hora: string;
  servicio: string;
};

export function DashboardPage() {
  const [fecha, setFecha] = useState(new Date());
  const [citas, setCitas] = useState<Cita[]>([]);

  useEffect(() => {
    // Cuando el componente se carga por primera vez, carga las citas del día de hoy
    handleFechaChange(new Date());
  }, []);

  const handleFechaChange = async (nuevaFecha: Date) => {
    setFecha(nuevaFecha);
    console.log('Obteniendo citas para:', nuevaFecha.toISOString().split('T')[0]);
    // Simulamos una llamada al backend
    // const citasDelDia = await window.electronAPI.invoke('get-citas-por-fecha', nuevaFecha.toISOString());
    // setCitas(citasDelDia);

    // Datos de ejemplo por ahora:
    setCitas([
      { id: 1, nombre_cliente: 'Juan Pérez', hora: '10:00', servicio: 'Corte de Caballero' },
      { id: 2, nombre_cliente: 'Ana García', hora: '11:30', servicio: 'Barba y Corte' },
    ]);
  };

  return (
    <Layout>
      {/* Usamos flexbox con flex-wrap para que los elementos se apilen en pantallas pequeñas */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Columna del Calendario (crecerá hasta un máximo) */}
        <div className="lg:w-1/3 xl:w-1/4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Calendario</h2>
          <div className="bg-white p-2 sm:p-4 rounded-lg shadow">
            <Calendar
              onChange={(value) => handleFechaChange(value as Date)}
              value={fecha}
              className="border-none w-full"
            />
          </div>
        </div>

        {/* Columna de Citas del Día (ocupará el espacio restante) */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
            <h2 className="text-2xl font-bold text-gray-800">
              Citas para el {fecha.toLocaleDateString('es-ES', { dateStyle: 'long' })}
            </h2>
            <button className="px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 w-full sm:w-auto">
              + Añadir Cita
            </button>
          </div>
          
          <div className="space-y-4">
            {citas.length > 0 ? (
              citas.map((cita) => (
                <div key={cita.id} className="bg-white p-4 rounded-lg shadow flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <p className="font-bold text-lg text-gray-900">{cita.hora} - {cita.nombre_cliente}</p>
                    <p className="text-gray-600">{cita.servicio}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <button className="text-blue-500 hover:text-blue-700 mr-4 text-sm font-medium">Editar</button>
                    <button className="text-red-500 hover:text-red-700 text-sm font-medium">Eliminar</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
                <p>No hay citas para este día.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}