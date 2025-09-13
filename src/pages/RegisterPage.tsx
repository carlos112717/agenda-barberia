// src/pages/RegisterPage.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    tipoDocumento: 'C.C.',
    numeroDocumento: '',
    telefono: '',
    email: '',
    rol: 'Barbero',
    otroRol: '',
    fechaIngreso: '',
    direccion: '',
    ciudad: '',
    provincia: '',
    pais: '',
    nacionalidad: '',
    password: '',
    confirmarPassword: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (formData.password !== formData.confirmarPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      // LLAMADA AL BACKEND
      const result = await window.electronAPI.invoke('register-user', formData);

      if (result.success) {
        alert(result.message);
        navigate('/login');
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Error al invocar IPC de registro:', error);
      setError('Ocurrió un error inesperado al registrar.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-2xl p-8 my-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800">Crear Cuenta de Empleado</h2>
          <p className="mt-2 text-sm text-gray-600">Completa el formulario para registrar un nuevo usuario.</p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded-md">
            {error}
          </div>
        )}

        <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
          {/* Columna Izquierda */}
          <div className="space-y-4">
            <InputField label="Nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
            <InputField label="Apellidos" name="apellidos" value={formData.apellidos} onChange={handleChange} required />
            <SelectField label="Tipo de Documento" name="tipoDocumento" value={formData.tipoDocumento} onChange={handleChange} options={['C.C.', 'C.E.', 'Pasaporte', 'Otro']} />
            <InputField label="Número de Documento" name="numeroDocumento" value={formData.numeroDocumento} onChange={handleChange} required />
            <InputField label="Teléfono" name="telefono" type="tel" value={formData.telefono} onChange={handleChange} />
            <InputField label="Correo Electrónico" name="email" type="email" value={formData.email} onChange={handleChange} required />
            <InputField label="Contraseña" name="password" type="password" value={formData.password} onChange={handleChange} required />
            <InputField label="Confirmar Contraseña" name="confirmarPassword" type="password" value={formData.confirmarPassword} onChange={handleChange} required />
          </div>

          {/* Columna Derecha */}
          <div className="space-y-4">
            <SelectField label="Rol" name="rol" value={formData.rol} onChange={handleChange} options={['Barbero', 'Administrador', 'Otro']} />
            {formData.rol === 'Otro' && (
              <InputField label="Especificar Rol" name="otroRol" value={formData.otroRol} onChange={handleChange} required />
            )}
            <InputField label="Fecha de Ingreso" name="fechaIngreso" type="date" value={formData.fechaIngreso} onChange={handleChange} />
            <InputField label="Dirección de Residencia" name="direccion" value={formData.direccion} onChange={handleChange} />
            <InputField label="Ciudad" name="ciudad" value={formData.ciudad} onChange={handleChange} />
            <InputField label="Provincia / Estado" name="provincia" value={formData.provincia} onChange={handleChange} />
            <InputField label="País" name="pais" value={formData.pais} onChange={handleChange} />
            <InputField label="Nacionalidad" name="nacionalidad" value={formData.nacionalidad} onChange={handleChange} />
          </div>

          {/* Botón y Enlace */}
          <div className="md:col-span-2">
            <button type="submit" className="w-full px-4 py-2 mt-4 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300">
              Registrar Empleado
            </button>
            <p className="mt-4 text-sm text-center text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

// === SECCIÓN CORREGIDA CON TIPOS ===

// Definimos los tipos para las props del InputField
type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

// Componentes auxiliares para no repetir código (DRY Principle)
const InputField = ({ label, ...props }: InputFieldProps) => (
  <div>
    <label htmlFor={props.name} className="block text-sm font-medium text-gray-700">{label}</label>
    <input id={props.name} {...props} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
  </div>
);

// Definimos los tipos para las props del SelectField
type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: string[];
};

const SelectField = ({ label, options, ...props }: SelectFieldProps) => (
  <div>
    <label htmlFor={props.name} className="block text-sm font-medium text-gray-700">{label}</label>
    <select id={props.name} {...props} className="w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
      {options.map(option => <option key={option} value={option}>{option}</option>)}
    </select>
  </div>
);