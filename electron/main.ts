// electron/main.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

// Definimos un tipo para el usuario que viene de la base de datos
interface User {
  id: number;
  email: string;
  password_hash: string;
  empleado_id: number;
}

interface Empleado {
  id: number;
  nombre: string;
  apellidos: string;
  rol: string;
}

// ---- CONFIGURACIÓN DE LA BASE DE DATOS ----
function setupDatabase() {
  try {
    const dbPath = path.join(app.getPath('userData'), 'barberia.db');
    const db = new Database(dbPath, { verbose: console.log }); // Agregamos verbose para ver las consultas en la consola
    console.log('✅ Base de datos abierta en:', dbPath);

    db.pragma('foreign_keys = ON;');
    db.exec(`
      CREATE TABLE IF NOT EXISTS empleados ( id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, apellidos TEXT NOT NULL, foto_path TEXT, tipo_documento TEXT, numero_documento TEXT UNIQUE, telefono TEXT, email TEXT NOT NULL UNIQUE, rol TEXT NOT NULL, fecha_ingreso TEXT, direccion TEXT, ciudad TEXT, provincia TEXT, pais TEXT, nacionalidad TEXT );
      CREATE TABLE IF NOT EXISTS usuarios ( id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, empleado_id INTEGER NOT NULL, FOREIGN KEY (empleado_id) REFERENCES empleados (id) ON DELETE CASCADE );
      CREATE TABLE IF NOT EXISTS citas ( id INTEGER PRIMARY KEY AUTOINCREMENT, nombre_cliente TEXT NOT NULL, telefono_cliente TEXT, fecha TEXT NOT NULL, hora TEXT NOT NULL, servicio TEXT, empleado_id INTEGER NOT NULL, FOREIGN KEY (empleado_id) REFERENCES empleados (id) ON DELETE CASCADE );
    `);
    console.log('✅ Tablas verificadas/creadas.');
  } catch (error) {
    console.error('❌ Error al configurar la base de datos:', error);
  }
}

// ---- CREACIÓN DE LA VENTANA PRINCIPAL ----
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200, height: 800,
    webPreferences: {
      // ESTA ES LA CONEXIÓN CRÍTICA QUE ESTABLECE EL PUENTE
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools(); // Abrimos las herramientas para ver errores
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// ---- MANEJADORES DE IPC (LOGIN Y REGISTRO) ----

ipcMain.handle('login-user', async (event, { email, password }) => {
  const dbPath = path.join(app.getPath('userData'), 'barberia.db');
  const db = new Database(dbPath);
  try {
    const user = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email) as User | undefined;
    if (!user) {
      return { success: false, message: 'El correo electrónico no está registrado.' };
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return { success: false, message: 'La contraseña es incorrecta.' };
    }
    
    // Obtenemos los datos completos del empleado asociado
    const empleado = db.prepare('SELECT * FROM empleados WHERE id = ?').get(user.empleado_id);

    // Devolvemos los datos del empleado en la respuesta
    return { success: true, message: 'Inicio de sesión exitoso.', empleado };

  } catch (error) {
    console.error('❌ Error en el login:', error);
    return { success: false, message: 'Ocurrió un error inesperado durante el inicio de sesión.' };
  }
});

ipcMain.handle('register-user', async (event, userData) => {
  try {
    const dbPath = path.join(app.getPath('userData'), 'barberia.db');
    const db = new Database(dbPath);
    const passwordHash = await bcrypt.hash(userData.password, 10);
    const transaction = db.transaction(() => {
      const empleadoStmt = db.prepare(`INSERT INTO empleados (nombre, apellidos, tipo_documento, numero_documento, telefono, email, rol, fecha_ingreso, direccion, ciudad, provincia, pais, nacionalidad) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      const info = empleadoStmt.run(userData.nombre, userData.apellidos, userData.tipoDocumento, userData.numeroDocumento, userData.telefono, userData.email, userData.rol === 'Otro' ? userData.otroRol : userData.rol, userData.fechaIngreso, userData.direccion, userData.ciudad, userData.provincia, userData.pais, userData.nacionalidad);
      const usuarioStmt = db.prepare('INSERT INTO usuarios (email, password_hash, empleado_id) VALUES (?, ?, ?)');
      usuarioStmt.run(userData.email, passwordHash, info.lastInsertRowid);
    });
    transaction();
    return { success: true, message: 'Empleado registrado con éxito.' };
  } catch (error) {
    console.error('❌ Error en el registro:', error);
    if (error instanceof Error && 'code' in error && (error as any).code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return { success: false, message: 'El correo electrónico o número de documento ya está registrado.' };
    }
    return { success: false, message: `Ocurrió un error al registrar: ${(error as Error).message}` };
  }
});

//Obtener la lista de todos los barberos
ipcMain.handle('get-all-barbers', () => {
  const dbPath = path.join(app.getPath('userData'), 'barberia.db');
  const db = new Database(dbPath);
  const barberos = db.prepare("SELECT id, nombre, apellidos FROM empleados WHERE rol = 'Barbero'").all();
  return barberos;
});


// ---- CICLO DE VIDA DE LA APP ----
app.whenReady().then(() => {
  setupDatabase();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


//Obtener citas (distingue entre admin y barbero)
ipcMain.handle('get-citas-por-fecha', (event, { fechaISO, empleado }) => {
  const dbPath = path.join(app.getPath('userData'), 'barberia.db');
  const db = new Database(dbPath);
  const fecha = fechaISO.split('T')[0];
  
  let citas;
  if (empleado.rol === 'Administrador') {
    // Si es admin, trae las citas de todos los empleados, uniendo las tablas para obtener el nombre del barbero
    citas = db.prepare(`
      SELECT c.*, e.nombre as barbero_nombre, e.apellidos as barbero_apellidos
      FROM citas c
      JOIN empleados e ON c.empleado_id = e.id
      WHERE c.fecha = ?
      ORDER BY c.hora
    `).all(fecha);
  } else {
    // Si es barbero, trae solo sus propias citas
    citas = db.prepare('SELECT * FROM citas WHERE fecha = ? AND empleado_id = ? ORDER BY hora')
              .all(fecha, empleado.id);
  }
  return citas;
});

// Añadir una nueva cita (con validación)
ipcMain.handle('add-cita', (event, citaData) => {
  const dbPath = path.join(app.getPath('userData'), 'barberia.db');
  const db = new Database(dbPath);

  // VALIDACIÓN: Comprobar si ya existe una cita para ese empleado en esa fecha y hora
  const citaExistente = db.prepare(
    'SELECT id FROM citas WHERE fecha = ? AND hora = ? AND empleado_id = ?'
  ).get(citaData.fecha, citaData.hora, citaData.empleado_id);

  if (citaExistente) {
    return { success: false, message: 'El barbero ya tiene una cita programada a esa hora.' };
  }

  // Si no existe, procedemos a insertar
  const stmt = db.prepare(
    'INSERT INTO citas (nombre_cliente, telefono_cliente, fecha, hora, servicio, empleado_id) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const info = stmt.run(citaData.nombre_cliente, null, citaData.fecha, citaData.hora, citaData.servicio, citaData.empleado_id);
  return { success: true, id: info.lastInsertRowid };
});

// Eliminar una cita
ipcMain.handle('delete-cita', (event, id) => {
  const dbPath = path.join(app.getPath('userData'), 'barberia.db');
  const db = new Database(dbPath);
  const stmt = db.prepare('DELETE FROM citas WHERE id = ?');
  stmt.run(id);
  return { success: true };
});


// Actualizar una cita existente (con validación)
ipcMain.handle('update-cita', (event, citaData) => {
  const dbPath = path.join(app.getPath('userData'), 'barberia.db');
  const db = new Database(dbPath);

  // VALIDACIÓN: Comprobar si existe OTRA cita a la misma hora
  const citaExistente = db.prepare(
    'SELECT id FROM citas WHERE fecha = ? AND hora = ? AND empleado_id = ? AND id != ?'
  ).get(citaData.fecha, citaData.hora, citaData.empleado_id, citaData.id);

  if (citaExistente) {
    return { success: false, message: 'El barbero ya tiene otra cita programada a esa hora.' };
  }
  
  // Si no hay conflicto, procedemos a actualizar
  const stmt = db.prepare(
    'UPDATE citas SET nombre_cliente = ?, hora = ?, servicio = ?, fecha = ? WHERE id = ?'
  );
  const info = stmt.run(citaData.nombre_cliente, citaData.hora, citaData.servicio, citaData.fecha, citaData.id);
  return { success: info.changes > 0 };
});