// src/App.tsx
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Ruta inicial, redirige a /login */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Definición de las páginas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;