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

// ---- CONFIGURACIÓN DE LA BASE DE DATOS ----
function setupDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'barberia.db');
  const db = new Database(dbPath);
  console.log('✅ Base de datos abierta en:', dbPath);

  db.pragma('foreign_keys = ON;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS empleados ( id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, apellidos TEXT NOT NULL, foto_path TEXT, tipo_documento TEXT, numero_documento TEXT UNIQUE, telefono TEXT, email TEXT NOT NULL UNIQUE, rol TEXT NOT NULL, fecha_ingreso TEXT, direccion TEXT, ciudad TEXT, provincia TEXT, pais TEXT, nacionalidad TEXT );
    CREATE TABLE IF NOT EXISTS usuarios ( id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, empleado_id INTEGER NOT NULL, FOREIGN KEY (empleado_id) REFERENCES empleados (id) ON DELETE CASCADE );
    CREATE TABLE IF NOT EXISTS citas ( id INTEGER PRIMARY KEY AUTOINCREMENT, nombre_cliente TEXT NOT NULL, telefono_cliente TEXT, fecha TEXT NOT NULL, hora TEXT NOT NULL, servicio TEXT, empleado_id INTEGER NOT NULL, FOREIGN KEY (empleado_id) REFERENCES empleados (id) ON DELETE CASCADE );
  `);
  console.log('✅ Tablas verificadas/creadas.');
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
  const user = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email) as User | undefined;
  
  if (!user) return { success: false, message: 'El correo electrónico no está registrado.' };
  
  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) return { success: false, message: 'La contraseña es incorrecta.' };
  
  return { success: true, message: 'Inicio de sesión exitoso.' };
});

ipcMain.handle('register-user', async (event, userData) => {
  const dbPath = path.join(app.getPath('userData'), 'barberia.db');
  const db = new Database(dbPath);
  try {
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
    if (error instanceof Error && 'code' in error && (error as any).code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return { success: false, message: 'El correo electrónico o número de documento ya está registrado.' };
    }
    return { success: false, message: 'Ocurrió un error al registrar.' };
  }
});

// ---- CICLO DE VIDA DE LA APP ----
app.whenReady().then(() => {
  setupDatabase();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});