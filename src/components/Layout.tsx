// src/components/Layout.tsx
import React from 'react';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Barra Lateral de Navegación */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-2xl font-bold">Barbería App</h1>
        </div>
        <nav className="flex-1 p-2 space-y-2">
          <a href="#" className="flex items-center p-2 text-lg bg-gray-700 rounded-md">
            📅
            <span className="ml-3">Agenda</span>
          </a>
          <a href="#" className="flex items-center p-2 text-lg hover:bg-gray-700 rounded-md">
            👥
            <span className="ml-3">Clientes</span>
          </a>
          <a href="#" className="flex items-center p-2 text-lg hover:bg-gray-700 rounded-md">
            ⚙️
            <span className="ml-3">Configuración</span>
          </a>
        </nav>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}