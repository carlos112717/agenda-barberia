// src/components/CitaModal.tsx
import Modal from 'react-modal';
import { useState, useEffect } from 'react';

// ... (customStyles y Modal.setAppElement se mantienen igual)

interface Empleado {
  id: number;
  nombre: string;
  apellidos: string;
}

interface CitaModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onSave: (cita: any) => void;
  citaActual?: any;
  empleadoLogueado: Empleado; // Para saber el rol
  barberos: Empleado[]; // La lista de barberos para el admin
}

export function CitaModal({ isOpen, onRequestClose, onSave, citaActual, empleadoLogueado, barberos }: CitaModalProps) {
  const [nombreCliente, setNombreCliente] = useState('');
  const [hora, setHora] = useState('');
  const [servicio, setServicio] = useState('');
  // Nuevo estado para guardar el ID del barbero seleccionado por el admin
  const [barberoSeleccionadoId, setBarberoSeleccionadoId] = useState<number | string>('');

  useEffect(() => {
    if (citaActual) {
      setNombreCliente(citaActual.nombre_cliente || '');
      setHora(citaActual.hora || '');
      setServicio(citaActual.servicio || '');
      setBarberoSeleccionadoId(citaActual.empleado_id || '');
    } else {
      setNombreCliente('');
      setHora('');
      setServicio('');
      // Si es un barbero, se auto-selecciona. Si es admin, se deja vacío para que elija.
      setBarberoSeleccionadoId(empleadoLogueado.rol === 'Administrador' ? '' : empleadoLogueado.id);
    }
  }, [citaActual, isOpen, empleadoLogueado]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: citaActual?.id,
      nombre_cliente: nombreCliente,
      hora,
      servicio,
      empleado_id: barberoSeleccionadoId, // Enviamos el ID del barbero
    });
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} /* ... */ >
      <h2 className="text-2xl font-bold mb-6">{citaActual ? 'Editar Cita' : 'Añadir Nueva Cita'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Este campo solo se muestra si el usuario es Administrador */}
        {empleadoLogueado?.rol === 'Administrador' && (
          <div>
            <label htmlFor="barbero" className="block text-sm font-medium text-gray-700">Asignar a Barbero</label>
            <select
              id="barbero"
              value={barberoSeleccionadoId}
              onChange={e => setBarberoSeleccionadoId(Number(e.target.value))}
              required
              className="w-full mt-1 input-style"
            >
              <option value="" disabled>Seleccione un barbero</option>
              {barberos.map(b => (
                <option key={b.id} value={b.id}>{b.nombre} {b.apellidos}</option>
              ))}
            </select>
          </div>
        )}
        
        {/* ... (los otros campos del formulario: Nombre, Hora, Servicio se mantienen igual) ... */}

        <div className="flex justify-end gap-4 pt-4">
          {/* ... (botones de Cancelar y Guardar se mantienen igual) ... */}
        </div>
      </form>
    </Modal>
  );
}