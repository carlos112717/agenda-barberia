// src/pages/DashboardPage.tsx
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Layout } from "../components/Layout";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Calendar.css";
import { CitaModal } from "../components/CitaModal";

type Cita = {
  id: number;
  nombre_cliente: string;
  hora: string;
  servicio: string;
};

export function DashboardPage() {
  const location = useLocation();
  const empleadoLogueado = location.state?.empleado;

  const [fecha, setFecha] = useState(new Date());
  const [citas, setCitas] = useState<any[]>([]); // `any` para incluir los datos del barbero
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [citaParaEditar, setCitaParaEditar] = useState<any | null>(null);
  const [barberos, setBarberos] = useState<Empleado[]>([]);

  // Cargar la lista de barberos (solo si es admin)
  useEffect(() => {
    if (empleadoLogueado?.rol === "Administrador") {
      const fetchBarberos = async () => {
        const listaBarberos = await window.electronAPI.invoke(
          "get-all-barbers"
        );
        setBarberos(listaBarberos);
      };
      fetchBarberos();
    }
  }, [empleadoLogueado]);

  const cargarCitas = useCallback(
    async (fechaACargar: Date) => {
      try {
        const fechaISO = fechaACargar.toISOString();
        // Ahora enviamos el objeto empleado completo
        const citasDelDia = await window.electronAPI.invoke(
          "get-citas-por-fecha",
          { fechaISO, empleado: empleadoLogueado }
        );
        setCitas(citasDelDia);
      } catch (error) {
        console.error("Error al cargar citas:", error);
      }
    },
    [empleadoLogueado]
  );

  useEffect(() => {
    cargarCitas(fecha);
  }, [fecha, cargarCitas]);

  const abrirModalParaCrear = () => {
    setCitaParaEditar(null); // Nos aseguramos de que no hay datos de edición
    setIsModalOpen(true);
  };

  const abrirModalParaEditar = (cita: Cita) => {
    setCitaParaEditar(cita); // Pasamos los datos de la cita a editar
    setIsModalOpen(true);
  };

  const handleGuardarCita = async (citaData: any) => {
    if (!empleadoLogueado) {
      alert("Error: No se ha identificado al empleado.");
      return;
    }

    const datosParaGuardar = {
      ...citaData,
      fecha: fecha.toISOString().split("T")[0],
      empleado_id: citaData.empleado_id || empleadoLogueado.id,
    };

    const result = citaData.id
      ? await window.electronAPI.invoke("update-cita", datosParaGuardar)
      : await window.electronAPI.invoke("add-cita", datosParaGuardar);

    if (result.success) {
      setIsModalOpen(false);
      cargarCitas(fecha);
    } else {
      alert(`Error: ${result.message}`); // Mostramos el error de doble reserva
    }
  };

  const handleEliminarCita = async (id: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta cita?")) {
      await window.electronAPI.invoke("delete-cita", id);
      cargarCitas(fecha);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/3 xl:w-1/4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Calendario</h2>
          <div className="bg-white p-2 sm:p-4 rounded-lg shadow">
            <Calendar
              onChange={(value) => setFecha(value as Date)}
              value={fecha}
              className="border-none w-full"
            />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
            <h2 className="text-2xl font-bold text-gray-800">
              Citas para el{" "}
              {fecha.toLocaleDateString("es-ES", { dateStyle: "long" })}
            </h2>
            <button
              onClick={abrirModalParaCrear}
              className="px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 w-full sm:w-auto"
            >
              + Añadir Cita
            </button>
          </div>

          <div className="space-y-4">
            {citas.length > 0 ? (
              citas.map((cita) => (
                <div
                  key={cita.id}
                  className="bg-white p-4 rounded-lg shadow flex flex-col sm:flex-row justify-between sm:items-center gap-4"
                >
                  <div>
                    <p className="font-bold text-lg text-gray-900">
                      {cita.hora} - {cita.nombre_cliente}
                    </p>
                    <p className="text-gray-600">{cita.servicio}</p>
                    {empleadoLogueado?.rol === "Administrador" && (
                      <p className="text-sm text-indigo-600 font-semibold mt-1">
                        Barbero: {cita.barbero_nombre} {cita.barbero_apellidos}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => abrirModalParaEditar(cita)}
                      className="text-blue-500 hover:text-blue-700 mr-4 text-sm font-medium"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminarCita(cita.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Eliminar
                    </button>
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

      <CitaModal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        onSave={handleGuardarCita}
        citaActual={citaParaEditar}
        empleadoLogueado={empleadoLogueado}
        barberos={barberos}
      />
    </Layout>
  );
}
