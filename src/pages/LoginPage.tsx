// src/pages/LoginPage.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Evita que la página se recargue
    console.log('Intentando iniciar sesión con:', { email, password });
    // Aquí irá la lógica para verificar las credenciales
    
    // Si el login es exitoso, redirigimos al dashboard
    // Por ahora, lo haremos directamente al hacer clic
    navigate('/dashboard');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          {/* Puedes poner un logo aquí */}
          <h2 className="text-3xl font-bold text-gray-800">Iniciar Sesión</h2>
          <p className="mt-2 text-sm text-gray-600">Bienvenido a Barbería App</p>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo Electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="tu@email.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="••••••••"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300"
            >
              Entrar
            </button>
          </div>
        </form>

        <p className="text-sm text-center text-gray-600">
          ¿No tienes una cuenta?{' '}
          <Link to="/registro" className="font-medium text-indigo-600 hover:text-indigo-500">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}