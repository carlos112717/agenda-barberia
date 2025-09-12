import { app, BrowserWindow } from 'electron';
import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

function createWindows() {
  // Ventana Splash
  const splash = new BrowserWindow({
    width: 600,
    height: 400,
    transparent: true,
    frame: false, // Sin bordes
    alwaysOnTop: true
  });
  splash.loadFile('splash.html');

  // Ventana Principal (Login) - la creamos oculta al principio
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Inicia oculta
    // ... webPreferences
  });
  // Carga la URL de Vite como antes
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (!devServerUrl) {
    throw new Error('VITE_DEV_SERVER_URL is not defined');
  }
  mainWindow.loadURL(devServerUrl);

  // Lógica de tiempo
  setTimeout(() => {
    splash.close();
    mainWindow.show(); // Muestra la ventana principal después de 3 segundos
  }, 3000); // 3 segundos
}

// Manejador para el registro de nuevos usuarios
ipcMain.handle('register-user', async (event, userData) => {
  const dbPath = path.join(app.getPath('userData'), 'barberia.db');
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON;'); // Buena práctica activar claves foráneas

  try {
    // 1. Hashear la contraseña
    const saltRounds = 10; // Número de rondas de hashing (estándar)
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);

    // 2. Usar una transacción para asegurar la integridad de los datos
    // Si una de las inserciones falla, la otra se revierte.
    const transaction = db.transaction(() => {
      // 3. Insertar en la tabla 'empleados'
      const empleadoStmt = db.prepare(
        `INSERT INTO empleados (nombre, apellidos, tipo_documento, numero_documento, telefono, email, rol, fecha_ingreso, direccion, ciudad, provincia, pais, nacionalidad)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      const empleadoInfo = empleadoStmt.run(
        userData.nombre,
        userData.apellidos,
        userData.tipoDocumento,
        userData.numeroDocumento,
        userData.telefono,
        userData.email,
        userData.rol === 'Otro' ? userData.otroRol : userData.rol, // Usa el rol personalizado si existe
        userData.fechaIngreso,
        userData.direccion,
        userData.ciudad,
        userData.provincia,
        userData.pais,
        userData.nacionalidad
      );

      const nuevoEmpleadoId = empleadoInfo.lastInsertRowid;

      // 4. Insertar en la tabla 'usuarios'
      const usuarioStmt = db.prepare(
        'INSERT INTO usuarios (email, password_hash, empleado_id) VALUES (?, ?, ?)'
      );
      usuarioStmt.run(userData.email, passwordHash, nuevoEmpleadoId);
    });

    // Ejecutar la transacción
    transaction();

    return { success: true, message: 'Empleado registrado con éxito.' };

  } catch (error) {
    console.error('Error en el registro:', error);
    // Manejar errores comunes como email duplicado
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE'
    ) {
      return { success: false, message: 'El correo electrónico o número de documento ya está registrado.' };
    }
    return { success: false, message: 'Ocurrió un error al registrar el empleado.' };
  }
});


app.whenReady().then(() => {
  setupDatabase(); // Nuestra función de DB
  createWindows(); // Nuestra nueva función para crear las ventanas
});

function setupDatabase() {
  throw new Error('Function not implemented.');
}
