// electron/main.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

// --- IMPLEMENTACIÓN DE setupDatabase ---
function setupDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'barberia.db');
  const db = new Database(dbPath);
  console.log('Verificando base de datos en:', dbPath);

  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS empleados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      apellidos TEXT NOT NULL,
      foto_path TEXT,
      tipo_documento TEXT,
      numero_documento TEXT UNIQUE,
      telefono TEXT,
      email TEXT NOT NULL UNIQUE,
      rol TEXT NOT NULL,
      fecha_ingreso TEXT,
      direccion TEXT,
      ciudad TEXT,
      provincia TEXT,
      pais TEXT,
      nacionalidad TEXT
    );

    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      empleado_id INTEGER NOT NULL,
      FOREIGN KEY (empleado_id) REFERENCES empleados (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS citas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_cliente TEXT NOT NULL,
      telefono_cliente TEXT,
      fecha TEXT NOT NULL,
      hora TEXT NOT NULL,
      servicio TEXT,
      empleado_id INTEGER NOT NULL,
      FOREIGN KEY (empleado_id) REFERENCES empleados (id) ON DELETE CASCADE
    );
  `);
  console.log('Base de datos lista y configurada.');
}

// --- LÓGICA DE LAS VENTANAS ---
function createWindows() {
  // Ventana Principal (Login)
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      // ESTA ES LA LÍNEA CLAVE QUE FALTABA
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Ventana Splash
  const splash = new BrowserWindow({
    width: 600,
    height: 400,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    parent: mainWindow // Asocia el splash a la ventana principal
  });

  splash.loadFile(path.join(app.getAppPath(), 'splash.html'));

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      splash.destroy();
      mainWindow.show();
    }, 2000); // 2 segundos
  });
}

// --- MANEJADORES DE IPC ---
// (El resto de manejadores para 'login-user' y 'register-user' se quedan igual que en la versión anterior)

// Manejador para el LOGIN de usuarios
ipcMain.handle('login-user', async (event, { email, password }) => {
  const dbPath = path.join(app.getPath('userData'), 'barberia.db');
  const db = new Database(dbPath);
  try {
    const user = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
    if (!user) {
      return { success: false, message: 'El correo electrónico no está registrado.' };
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return { success: false, message: 'La contraseña es incorrecta.' };
    }
    
    return { success: true, message: 'Inicio de sesión exitoso.' };

  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    return { success: false, message: 'Ocurrió un error en el servidor.' };
  }
});

// Manejador para el REGISTRO de nuevos usuarios
ipcMain.handle('register-user', async (event, userData) => {
  const dbPath = path.join(app.getPath('userData'), 'barberia.db');
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON;');

  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);

    const transaction = db.transaction(() => {
      const empleadoStmt = db.prepare(
        `INSERT INTO empleados (nombre, apellidos, tipo_documento, numero_documento, telefono, email, rol, fecha_ingreso, direccion, ciudad, provincia, pais, nacionalidad)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      const empleadoInfo = empleadoStmt.run(
        userData.nombre, userData.apellidos, userData.tipoDocumento,
        userData.numeroDocumento, userData.telefono, userData.email,
        userData.rol === 'Otro' ? userData.otroRol : userData.rol,
        userData.fechaIngreso, userData.direccion, userData.ciudad,
        userData.provincia, userData.pais, userData.nacionalidad
      );

      const nuevoEmpleadoId = empleadoInfo.lastInsertRowid;
      const usuarioStmt = db.prepare(
        'INSERT INTO usuarios (email, password_hash, empleado_id) VALUES (?, ?, ?)'
      );
      usuarioStmt.run(userData.email, passwordHash, nuevoEmpleadoId);
    });

    transaction();
    return { success: true, message: 'Empleado registrado con éxito.' };
  } catch (error) {
    console.error('Error en el registro:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return { success: false, message: 'El correo electrónico o número de documento ya está registrado.' };
    }
    return { success: false, message: 'Ocurrió un error al registrar el empleado.' };
  }
});

// --- CICLO DE VIDA DE LA APP ---
app.whenReady().then(() => {
  setupDatabase();
  createWindows();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});