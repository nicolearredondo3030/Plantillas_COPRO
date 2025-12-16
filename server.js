const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const PDFDocument = require('pdfkit');
app.use(express.json());


// Configuración de la sesión
app.use(session({
  secret: 'secretKey',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // importante en desarrollo
}));

app.use(express.urlencoded({ extended: true }));

// Conexión a MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: '23212179',
  password: 'AEAN050403',
  database: 'COPRO'
});

connection.connect(err => {
  if (err) {
    console.error('Error conectando a MySQL:', err);
    return;
  }
  console.log('Conexión exitosa a MySQL');
});

// Ruta de registro de usuario (solo username, correo y password)
app.post('/registrar', async (req, res) => {
  const { username, correo, password } = req.body;

  if (!username || !correo || !password) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Error</title>
        <link rel="stylesheet" href="/bootstrap/bootstrap.css">
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body class="bg-light">
        <div class="container mt-5">
          <div class="row justify-content-center">
            <div class="col-md-6">
              <div class="card shadow">
                <div class="card-body text-center">
                  <h1 class="text-danger mb-4">Todos los campos son obligatorios</h1>
                  <button onclick="window.location.href='/registro.html'" class="btn btn-primary">
                    🔙 Volver
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
  }

  try {
    connection.query('SELECT * FROM usuarios WHERE correo = ?', [correo], async (err, results) => {
      if (err) {
        return res.send(`
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <title>Error</title>
            <link rel="stylesheet" href="/bootstrap/bootstrap.css">
            <link rel="stylesheet" href="/styles.css">
          </head>
          <body class="bg-light">
            <div class="container mt-5">
              <div class="alert alert-danger text-center" role="alert">
                Error en la base de datos.
              </div>
              <div class="text-center mt-3">
                <button onclick="window.location.href='/registro.html'" class="btn btn-secondary">Volver</button>
              </div>
            </div>
          </body>
          </html>
        `);
      }

      if (results.length > 0) {
        return res.send(`
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <title>Error</title>
            <link rel="stylesheet" href="/bootstrap/bootstrap.css">
            <link rel="stylesheet" href="/styles.css">
          </head>
          <body class="bg-light">
            <div class="container mt-5">
              <div class="card shadow">
                <div class="card-body text-center">
                  <h1 class="text-warning mb-4">El correo ya está registrado</h1>
                  <button onclick="window.location.href='/registro.html'" class="btn btn-primary">Volver</button>
                </div>
              </div>
            </div>
          </body>
          </html>
        `);
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const insertUser = 'INSERT INTO usuarios (nombre, correo, password_hash, tipo_usuario) VALUES (?, ?, ?, ?)';
      connection.query(insertUser, [username, correo, passwordHash, 'cliente'], (err) => {
        if (err) {
          return res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <title>Error</title>
              <link rel="stylesheet" href="/bootstrap/bootstrap.css">
              <link rel="stylesheet" href="/styles.css">
            </head>
            <body class="bg-light">
              <div class="container mt-5">
                <div class="alert alert-danger text-center" role="alert">
                  Error al registrar usuario
                </div>
                <div class="text-center mt-3">
                  <button onclick="window.location.href='/registro.html'" class="btn btn-secondary">Volver</button>
                </div>
              </div>
            </body>
            </html>
          `);
        }
        res.redirect('/login.html');
      });
    });
  } catch (hashError) {
    console.error('Error al hashear la contraseña:', hashError);
    return res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Error</title>
        <link rel="stylesheet" href="/bootstrap/bootstrap.css">
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body class="bg-light">
        <div class="container mt-5">
          <div class="alert alert-danger text-center" role="alert">
            Error al procesar la contraseña
          </div>
          <div class="text-center mt-3">
            <button onclick="window.location.href='/registro.html'" class="btn btn-secondary">Volver</button>
          </div>
        </div>
      </body>
      </html>
    `);
  }
});


// Ruta login
app.post('/login', async (req, res) => {
  const { correo, password } = req.body;

  connection.query('SELECT * FROM usuarios WHERE correo = ?', [correo], async (err, results) => {
    if (err || results.length === 0) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Error</title>
          <link rel="stylesheet" href="/bootstrap/bootstrap.css">
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body class="bg-light">
          <div class="container mt-5">
            <div class="row justify-content-center">
              <div class="col-md-6">
                <div class="card shadow">
                  <div class="card-body text-center">
                    <div class="alert alert-danger mb-4" role="alert">
                      Correo no registrado
                    </div>
                    <button onclick="window.location.href='/login.html'" class="btn btn-primary">
                      🔙 Volver
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (match) {
      // ✅ Guardar sesión unificada
      req.session.usuario = {
        id: user.id,
        nombre: user.nombre,
        tipo_usuario: user.tipo_usuario
      };
      res.redirect('/');
    } else {
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Error</title>
          <link rel="stylesheet" href="/bootstrap/bootstrap.css">
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body class="bg-light">
          <div class="container mt-5">
            <div class="row justify-content-center">
              <div class="col-md-6">
                <div class="card shadow">
                  <div class="card-body text-center">
                    <div class="alert alert-warning mb-4" role="alert">
                      Contraseña incorrecta
                    </div>
                    <button onclick="window.location.href='/login.html'" class="btn btn-secondary">
                      🔙 Volver
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
    }
  });
});

// Cerrar sesión
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login.html');
});


// Ruta para obtener el tipo de usuario
app.get('/tipo-usuario', requireLogin, (req, res) => {
  res.json({ tipo_usuario: req.session.usuario?.tipo_usuario });
});

// Middleware: verificar que haya sesión iniciada
function requireLogin(req, res, next) {
  if (!req.session.usuario) {
    return res.redirect('/login.html');
  }
  next();
}

// Middleware: verificar roles permitidos
function requireRoles(...roles) {
  return (req, res, next) => {
    const usuario = req.session.usuario;
    if (usuario && roles.includes(usuario.tipo_usuario)) {
      next();
    } else {
      let html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Error</title>
        <link rel="stylesheet" href="/bootstrap/bootstrap.css">
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body class="bg-light">
        <div class="container mt-5">
          <div class="row justify-content-center">
            <div class="col-md-6">
              <div class="card shadow">
                <div class="card-body text-center">
                  <h1 class="text-danger mb-4">Acceso denegado</h1>
                  <p class="text-muted">No tienes permisos para acceder a esta sección.</p>
                  <button onclick="window.location.href='/'" class="btn btn-secondary">
                    🔙 Volver al inicio
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
      `;
      return res.send(html);
    }
  };
}

// Servir archivos estáticos (HTML)
app.use(express.static(path.join(__dirname, 'public')));

// Ruta protegida (Página principal después de iniciar sesión)
app.get('/', requireLogin, (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/registrar', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'registro.html'));
});

// Ruta gestion de datos (admin)
app.get('/gestionar-registros', requireLogin, requireRoles('admin'), (req, res) => {
  const query = 'SELECT id, nombre, tipo_usuario FROM usuarios';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener usuarios:', err);
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Error</title>
          <link rel="stylesheet" href="/bootstrap/bootstrap.css">
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body class="bg-light">
          <div class="container mt-5">
            <div class="alert alert-danger text-center" role="alert">
              Error al cargar los usuarios.
            </div>
            <div class="text-center mt-3">
              <a href="/" class="btn btn-secondary">Volver</a>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    let html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Gestión de Usuarios</title>
        <link rel="stylesheet" href="/bootstrap/bootstrap.css">
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body class="bg-light">
        <div class="container mt-5">
          <h1 class="text-center mb-4">👥 Gestión de Usuarios</h1>
          <table class="table table-striped table-hover shadow-sm">
            <thead class="table-dark">
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Tipo de Usuario</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
    `;

    results.forEach(usuario => {
      html += `
        <tr>
          <td>${usuario.id}</td>
          <td>${usuario.nombre}</td>
          <td>${usuario.tipo_usuario}</td>
          <td>
            <form action="/editar-usuario" method="POST" class="d-inline">
              <input type="hidden" name="id" value="${usuario.id}">
              <input type="text" name="nuevo_tipo" 
                     placeholder="Nuevo rol (admin, empleado, medico)" 
                     class="form-control d-inline w-50 mb-2" required>
              <button type="submit" class="btn btn-sm btn-primary">Editar</button>
            </form>
            <form action="/eliminar-usuario" method="POST" class="d-inline ms-2">
              <input type="hidden" name="id" value="${usuario.id}">
              <button type="submit" 
                      class="btn btn-sm btn-danger" 
                      onclick="return confirm('¿Seguro que deseas eliminar este usuario?')">
                Eliminar
              </button>
            </form>
          </td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
          <div class="text-center mt-4">
            <a href="/" class="btn btn-secondary">🏠 Volver al inicio</a>
          </div>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  });
});


// Editar tipo de usuario
app.post('/editar-usuario', requireLogin, requireRoles('admin'), (req, res) => {
  const { id, nuevo_tipo } = req.body;
  const query = 'UPDATE usuarios SET tipo_usuario = ? WHERE id = ?';
  connection.query(query, [nuevo_tipo, id], (err) => {
    if (err) {
      console.error('Error al actualizar usuario:', err);
      return res.send('Error al editar usuario.');
    }
    res.redirect('/gestionar-registros');
  });
});

// Eliminar usuario
app.post('/eliminar-usuario', requireLogin, requireRoles('admin'), (req, res) => {
  const { id } = req.body;
  const query = 'DELETE FROM usuarios WHERE id = ?';
  connection.query(query, [id], (err) => {
    if (err) {
      console.error('Error al eliminar usuario:', err);
      return res.send('Error al eliminar usuario.');
    }
    res.redirect('/gestionar-registros');
  });
});

// Ruta editar plantillas
app.get('/gestionar-plantillas', requireLogin, requireRoles('admin', 'empleado'), (req, res) => {
  const query = 'SELECT id, nombre, descripcion, talla, estado, precio FROM plantillas';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener plantillas:', err);
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Error</title>
          <link rel="stylesheet" href="/bootstrap/bootstrap.css">
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body class="bg-light">
          <div class="container mt-5">
            <div class="alert alert-danger text-center">Error al cargar las plantillas.</div>
            <div class="text-center mt-3">
              <a href="/" class="btn btn-secondary">Volver</a>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    let html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Editar Plantillas</title>
        <link rel="stylesheet" href="/bootstrap/bootstrap.css">
        <link rel="stylesheet" href="/styles.css">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body class="bg-light">
        <div class="container mt-5">
          <h1 class="text-center mb-4">📝 Editar Plantillas</h1>

          <table class="table table-striped table-hover shadow-sm">
            <thead class="table-dark">
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Talla</th>
                <th>Estado</th>
                <th>Precio</th>
              </tr>
            </thead>
            <tbody>
    `;

    results.forEach(plantilla => {
      html += `
        <tr>
          <td>${plantilla.id}</td>
          <td>${plantilla.nombre}</td>
          <td>${plantilla.descripcion}</td>
          <td>${plantilla.talla}</td>
          <td>${plantilla.estado}</td>
          <td>$${plantilla.precio}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
    `;

    results.forEach(plantilla => {
      html += `
        <div class="card mb-4 shadow-sm">
          <div class="card-body">
            <h5 class="card-title">Actualizar datos de <strong>${plantilla.nombre}</strong> (ID ${plantilla.id})</h5>
            <div class="row gx-4 gy-3">
              <div class="col-md-3">
                <form action="/editar-plantilla" method="POST">
                  <input type="hidden" name="id" value="${plantilla.id}">
                  <label class="form-label">Descripción:</label>
                  <input type="text" name="nueva_descripcion" class="form-control mb-2" placeholder="Cambiar descripción" required>
                  <button type="submit" class="btn btn-sm btn-primary w-100">Editar</button>
                </form>
              </div>

              <div class="col-md-3">
                <form action="/editar-plantilla" method="POST">
                  <input type="hidden" name="id" value="${plantilla.id}">
                  <label class="form-label">Talla:</label>
                  <select name="nueva_talla" class="form-select mb-2" required>
                    <option value="">Selecciona</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                  </select>
                  <button type="submit" class="btn btn-sm btn-primary w-100">Editar</button>
                </form>
              </div>

              <div class="col-md-3">
                <form action="/editar-plantilla" method="POST">
                  <input type="hidden" name="id" value="${plantilla.id}">
                  <label class="form-label">Estado:</label>
                  <select name="nuevo_estado" class="form-select mb-2" required>
                    <option value="">Selecciona</option>
                    <option value="disponible">Disponible</option>
                    <option value="agotado">Agotado</option>
                  </select>
                  <button type="submit" class="btn btn-sm btn-primary w-100">Editar</button>
                </form>
              </div>

              <div class="col-md-3">
                <form action="/editar-plantilla" method="POST">
                  <input type="hidden" name="id" value="${plantilla.id}">
                  <label class="form-label">Precio:</label>
                  <input type="number" name="nuevo_precio" class="form-control mb-2" placeholder="Cambiar precio" required>
                  <button type="submit" class="btn btn-sm btn-primary w-100">Editar</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    html += `
          <div class="text-center mt-4">
            <a href="/" class="btn btn-secondary">🏠 Volver al inicio</a>
          </div>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  });
});


//Editar plantilla
app.post('/editar-plantilla', requireLogin, requireRoles('admin', 'empleado'), (req, res) => {
  const { id, nueva_descripcion, nueva_talla, nuevo_estado, nuevo_precio } = req.body;

  const usuario = req.session.usuario;
  if (!usuario || !usuario.tipo_usuario) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Sesión inválida</title>
        <link rel="stylesheet" href="/bootstrap/bootstrap.css">
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body class="bg-light">
        <div class="container mt-5">
          <div class="alert alert-danger text-center">Sesión inválida. Por favor inicia sesión nuevamente.</div>
          <div class="text-center mt-3">
            <a href="/login.html" class="btn btn-secondary">🔐 Ir al login</a>
          </div>
        </div>
      </body>
      </html>
    `);
  }

  const rol = usuario.tipo_usuario;
  let campo = null;
  let valor = null;

  if (rol === 'admin') {
    if (nueva_descripcion) {
      campo = 'descripcion';
      valor = nueva_descripcion;
    } else if (nueva_talla) {
      campo = 'talla';
      valor = nueva_talla;
    } else if (nuevo_estado) {
      campo = 'estado';
      valor = nuevo_estado;
    } else if (nuevo_precio) {
      campo = 'precio';
      valor = nuevo_precio;
    }
  } else if (rol === 'empleado') {
    if (nueva_talla) {
      campo = 'talla';
      valor = nueva_talla;
    } else if (nuevo_estado) {
      campo = 'estado';
      valor = nuevo_estado;
    } else {
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Permiso denegado</title>
          <link rel="stylesheet" href="/bootstrap/bootstrap.css">
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body class="bg-light">
          <div class="container mt-5">
            <div class="card shadow text-center">
              <div class="card-body">
                <h1 class="text-danger mb-3">No tienes permiso para cambiar este campo.</h1>
                <a href="/" class="btn btn-secondary">🏠 Volver al inicio</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
    }
  }

  if (!campo || !valor) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Datos inválidos</title>
        <link rel="stylesheet" href="/bootstrap/bootstrap.css">
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body class="bg-light">
        <div class="container mt-5">
          <div class="alert alert-warning text-center">No se proporcionó ningún dato válido para actualizar.</div>
          <div class="text-center mt-3">
            <a href="/gestionar-plantillas" class="btn btn-secondary">🔙 Volver</a>
          </div>
        </div>
      </body>
      </html>
    `);
  }

  const query = `UPDATE plantillas SET ${campo} = ? WHERE id = ?`;
  connection.query(query, [valor, id], (err) => {
    if (err) {
      console.error('Error al actualizar plantilla:', err);
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Error al actualizar</title>
          <link rel="stylesheet" href="/bootstrap/bootstrap.css">
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body class="bg-light">
          <div class="container mt-5">
            <div class="card shadow text-center">
              <div class="card-body">
                <h1 class="text-danger mb-3">No se puede actualizar la plantilla</h1>
                <p class="text-muted">No tienes permiso para cambiar este campo.</p>
                <a href="/plantilla.html" class="btn btn-secondary">🔙 Volver</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    res.redirect('/gestionar-plantillas');
  });
});

// Ruta para mostrar los usuarios de la base de datos en formato HTML
app.get('/ver-usuarios', requireLogin, requireRoles('admin', 'empleado'), (req, res) => {
  connection.query('SELECT * FROM usuarios', (err, results) => {
    if (err) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Error</title>
          <link rel="stylesheet" href="/bootstrap/bootstrap.css">
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body class="bg-light">
          <div class="container mt-5">
            <div class="alert alert-danger text-center">Error al obtener los datos.</div>
            <div class="text-center mt-3">
              <a href="/" class="btn btn-secondary">Volver</a>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    let html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Usuarios</title>
        <link rel="stylesheet" href="/bootstrap/bootstrap.css">
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body class="bg-light">
        <div class="container mt-5">
          <h1 class="text-center mb-4">👥 Usuarios Registrados</h1>
          <table class="table table-striped table-hover shadow-sm">
            <thead class="table-dark">
              <tr>
                <th>Nombre</th>
                <th>Tipo de usuario</th>
              </tr>
            </thead>
            <tbody>
    `;

    results.forEach(usuario => {
      html += `
        <tr>
          <td>${usuario.nombre}</td>
          <td>${usuario.tipo_usuario}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
          <div class="text-center mt-4">
            <a href="/" class="btn btn-secondary">🏠 Volver al inicio</a>
          </div>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  });
});

//Agregar al carrito
app.post('/agregar-al-carrito', requireLogin, requireRoles('cliente'), (req, res) => {
  const { nombre, talla } = req.body;
  const productoId = 1; // id real de la plantilla
  const usuarioId = req.session.usuario.id;

  if (!talla) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Error</title>
        <link rel="stylesheet" href="/bootstrap/bootstrap.css">
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body class="bg-light">
        <div class="container mt-5">
          <div class="alert alert-warning text-center">Selecciona una talla</div>
          <div class="text-center mt-3">
            <a href="/plantilla.html" class="btn btn-secondary">🔙 Volver</a>
          </div>
        </div>
      </body>
      </html>
    `);
  }

  // Validar estado en BD
  connection.query('SELECT estado, precio FROM plantillas WHERE id = ?', [productoId], (err, results) => {
    if (err || results.length === 0) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Error</title>
          <link rel="stylesheet" href="/bootstrap/bootstrap.css">
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body class="bg-light">
          <div class="container mt-5">
            <div class="alert alert-danger text-center">Error al consultar disponibilidad.</div>
            <div class="text-center mt-3">
              <a href="/plantilla.html" class="btn btn-secondary">Volver</a>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    const estado = results[0].estado;
    const precio = results[0].precio;

    if (estado !== 'disponible') {
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>No disponible</title>
          <link rel="stylesheet" href="/bootstrap/bootstrap.css">
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body class="bg-light">
          <div class="container mt-5">
            <div class="card shadow text-center">
              <div class="card-body">
                <h1 class="text-danger mb-3">Lo sentimos</h1>
                <p class="text-muted">Esta plantilla está agotada.</p>
                <a href="/plantilla.html" class="btn btn-secondary">🔙 Volver</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    // Buscar si ya existe el mismo producto/talla en el carrito
    const checkQuery = 'SELECT id, cantidad FROM carrito WHERE usuario_id = ? AND producto_id = ? AND talla = ?';
    connection.query(checkQuery, [usuarioId, productoId, talla], (err, rows) => {
      if (err) {
        return res.send(`
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <title>Error</title>
            <link rel="stylesheet" href="/bootstrap/bootstrap.css">
            <link rel="stylesheet" href="/styles.css">
          </head>
          <body class="bg-light">
            <div class="container mt-5">
              <div class="alert alert-danger text-center">Error al verificar carrito.</div>
              <div class="text-center mt-3">
                <a href="/plantilla.html" class="btn btn-secondary">Volver</a>
              </div>
            </div>
          </body>
          </html>
        `);
      }

      const confirmarHTML = (mensaje) => `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Confirmación</title>
          <link rel="stylesheet" href="/bootstrap/bootstrap.css">
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body class="bg-light">
          <div class="container mt-5">
            <div class="card shadow text-center">
              <div class="card-body">
                <h1 class="text-success mb-3">${mensaje}</h1>
                <p class="text-muted">Has agregado la talla <strong>${talla}</strong> de "${nombre}".</p>
                <div class="d-flex justify-content-center gap-3 mt-3">
                  <a href="/carrito" class="btn btn-primary">🛒 Ver Carrito</a>
                  <a href="/plantilla.html" class="btn btn-secondary">➕ Seguir comprando</a>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      if (rows.length > 0) {
        // Ya existe → actualizar cantidad
        const nuevaCantidad = rows[0].cantidad + 1;
        connection.query('UPDATE carrito SET cantidad = ? WHERE id = ?', [nuevaCantidad, rows[0].id], (err) => {
          if (err) return res.send('Error al actualizar cantidad.');
          return res.send(confirmarHTML("Cantidad actualizada"));
        });
      } else {
        // No existe → insertar nuevo
        const insertQuery = 'INSERT INTO carrito (usuario_id, producto_id, nombre, talla, cantidad, precio) VALUES (?, ?, ?, ?, 1, ?)';
        connection.query(insertQuery, [usuarioId, productoId, nombre, talla, precio], (err) => {
          if (err) return res.send('Error al agregar al carrito.');
          return res.send(confirmarHTML("Plantilla agregada al carrito"));
        });
      }
    });
  });
});

//Mostrar carrito
app.get('/carrito', requireLogin, requireRoles('cliente'), (req, res) => {
  const usuarioId = req.session.usuario.id;

  const query = `
    SELECT nombre, talla, SUM(cantidad) AS cantidad, precio
    FROM carrito
    WHERE usuario_id = ?
    GROUP BY nombre, talla, precio
  `;

  connection.query(query, [usuarioId], (err, results) => {
    if (err) return res.send('Error al cargar carrito.');

    let total = 0;
    let html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Mi Carrito</title>
        <link rel="stylesheet" href="/bootstrap/bootstrap.css">
        <link rel="stylesheet" href="/styles.css">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          .acciones-carrito {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 0.25rem;
            margin-top: 0.5rem;
            flex-wrap: wrap;
          }
          .total-carrito {
            font-size: 1.8rem;
            font-weight: bold;
            color: #d9534f;
            text-align: right;
            margin-top: 1rem;
          }
        </style>
      </head>
      <body class="bg-light">
        <div class="container mt-5">
          <h1 class="text-center mb-4 text-primary">🛒 Mi Carrito</h1>
          <table class="table table-striped table-hover shadow-sm">
            <thead class="table-dark">
              <tr>
                <th>Producto</th>
                <th>Talla</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Subtotal</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
    `;

    results.forEach(item => {
      const subtotal = item.cantidad * item.precio;
      total += subtotal;
      html += `
        <tr>
          <td>${item.nombre}</td>
          <td>${item.talla}</td>
          <td>${item.cantidad}</td>
          <td>$${item.precio}</td>
          <td>$${subtotal}</td>
          <td>
            <form method="POST" action="/eliminar-del-carrito" class="d-inline">
              <input type="hidden" name="nombre" value="${item.nombre}">
              <input type="hidden" name="talla" value="${item.talla}">
              <button type="submit" class="btn btn-danger">🗑️ Eliminar</button>
            </form>
          </td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>

          <div class="total-carrito">Total: $${total}</div>

          <div class="acciones-carrito mb-5">
            <button onclick="document.getElementById('vaciarForm').submit()" class="btn btn-warning">🗑️ Vaciar carrito</button>
            <button onclick="window.location.href='/'" class="btn btn-secondary">🏠 Volver al inicio</button>
            <button onclick="document.getElementById('pagoForm').submit()" class="btn btn-success">💳 Proceder al pago</button>
          </div>

          <form id="vaciarForm" method="POST" action="/vaciar-carrito" style="display:none;"></form>
          <form id="pagoForm" method="POST" action="/finalizar-compra" style="display:none;"></form>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  });
});


// Eliminar del carrito
app.post('/eliminar-del-carrito', requireLogin, requireRoles('cliente'), (req, res) => {
  const { nombre, talla } = req.body;
  const usuarioId = req.session.usuario.id;

  const query = 'SELECT id, cantidad FROM carrito WHERE usuario_id = ? AND nombre = ? AND talla = ? LIMIT 1';
  connection.query(query, [usuarioId, nombre, talla], (err, rows) => {
    if (err || rows.length === 0) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Producto no encontrado</title>
          <link rel="stylesheet" href="/bootstrap/bootstrap.css">
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body class="bg-light">
          <div class="container mt-5">
            <div class="alert alert-warning text-center">Producto no encontrado en el carrito.</div>
            <div class="text-center mt-3">
              <a href="/carrito" class="btn btn-secondary">🔙 Volver al carrito</a>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    const { id, cantidad } = rows[0];

    if (cantidad > 1) {
      connection.query('UPDATE carrito SET cantidad = cantidad - 1 WHERE id = ?', [id], (err) => {
        if (err) {
          return res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <title>Error</title>
              <link rel="stylesheet" href="/bootstrap/bootstrap.css">
              <link rel="stylesheet" href="/styles.css">
            </head>
            <body class="bg-light">
              <div class="container mt-5">
                <div class="alert alert-danger text-center">Error al actualizar cantidad.</div>
                <div class="text-center mt-3">
                  <a href="/carrito" class="btn btn-secondary">🔙 Volver al carrito</a>
                </div>
              </div>
            </body>
            </html>
          `);
        }
        res.redirect('/carrito');
      });
    } else {
      connection.query('DELETE FROM carrito WHERE id = ?', [id], (err) => {
        if (err) {
          return res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <title>Error</title>
              <link rel="stylesheet" href="/bootstrap/bootstrap.css">
              <link rel="stylesheet" href="/styles.css">
            </head>
            <body class="bg-light">
              <div class="container mt-5">
                <div class="alert alert-danger text-center">Error al eliminar producto.</div>
                <div class="text-center mt-3">
                  <a href="/carrito" class="btn btn-secondary">🔙 Volver al carrito</a>
                </div>
              </div>
            </body>
            </html>
          `);
        }
        res.redirect('/carrito');
      });
    }
  });
});

// Vaciar carrito
app.post('/vaciar-carrito', requireLogin, requireRoles('cliente'), (req, res) => {
  const usuarioId = req.session.usuario.id;

  connection.query('DELETE FROM carrito WHERE usuario_id = ?', [usuarioId], (err) => {
    if (err) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Error</title>
          <link rel="stylesheet" href="/bootstrap/bootstrap.css">
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body class="bg-light">
          <div class="container mt-5">
            <div class="alert alert-danger text-center">Error al vaciar el carrito.</div>
            <div class="text-center mt-3">
              <a href="/carrito" class="btn btn-secondary">🔙 Volver al carrito</a>
            </div>
          </div>
        </body>
        </html>
      `);
    }
    res.redirect('/carrito');
  });
});

// Finalizar compra
app.post('/finalizar-compra', requireLogin, requireRoles('cliente'), (req, res) => {
  const usuarioId = req.session.usuario.id;

  // Obtener productos del carrito
  connection.query('SELECT * FROM carrito WHERE usuario_id = ?', [usuarioId], (err, productos) => {
    if (err) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Error</title>
          <link rel="stylesheet" href="/bootstrap/bootstrap.css">
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body class="bg-light">
          <div class="container mt-5">
            <div class="alert alert-danger text-center">Error al finalizar la compra.</div>
            <div class="text-center mt-3">
              <a href="/carrito" class="btn btn-secondary">🔙 Volver al carrito</a>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    if (productos.length === 0) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Carrito vacío</title>
          <link rel="stylesheet" href="/bootstrap/bootstrap.css">
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body class="bg-light">
          <div class="container mt-5">
            <div class="alert alert-warning text-center">No hay productos en el carrito.</div>
            <div class="text-center mt-3">
              <a href="/" class="btn btn-secondary">🏠 Volver al inicio</a>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    // Insertar cada producto en historial
    const insertQuery = 'INSERT INTO historial (usuario_id, producto_id, nombre, talla, cantidad, precio) VALUES (?, ?, ?, ?, ?, ?)';
    productos.forEach(prod => {
      connection.query(insertQuery, [usuarioId, prod.producto_id, prod.nombre, prod.talla, prod.cantidad, prod.precio]);
    });

    // Vaciar carrito
    connection.query('DELETE FROM carrito WHERE usuario_id = ?', [usuarioId], (err) => {
      if (err) {
        return res.send(`
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <title>Error</title>
            <link rel="stylesheet" href="/bootstrap/bootstrap.css">
            <link rel="stylesheet" href="/styles.css">
          </head>
          <body class="bg-light">
            <div class="container mt-5">
              <div class="alert alert-danger text-center">Error al vaciar carrito.</div>
              <div class="text-center mt-3">
                <a href="/carrito" class="btn btn-secondary">🔙 Volver al carrito</a>
              </div>
            </div>
          </body>
          </html>
        `);
      }

      // Mostrar página de confirmación
      res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Compra Exitosa</title>
          <link rel="stylesheet" href="/bootstrap/bootstrap.css">
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body class="bg-light">
          <div class="container mt-5">
            <div class="card shadow text-center">
              <div class="card-body">
                <h1 class="text-success mb-3">¡Compra exitosa!</h1>
                <p class="text-muted">Gracias por tu compra. Tus productos se han guardado en tu historial.</p>
                <div class="d-flex justify-content-center gap-3 mt-3">
                  <a href="/" class="btn btn-secondary">🏠 Volver al inicio</a>
                  <a href="/historial" class="btn btn-primary">📜 Ver historial</a>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
    });
  });
});


//Ruta historial 
app.get('/historial', requireLogin, requireRoles('cliente'), (req, res) => {
  const usuarioId = req.session.usuario.id;

  const query = 'SELECT nombre, talla, cantidad, precio, fecha FROM historial WHERE usuario_id = ? ORDER BY fecha DESC';
  connection.query(query, [usuarioId], (err, results) => {
    if (err) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Error</title>
          <link rel="stylesheet" href="/bootstrap/bootstrap.css">
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body class="bg-light">
          <div class="container mt-5">
            <div class="alert alert-danger text-center">Error al cargar historial.</div>
            <div class="text-center mt-3">
              <a href="/" class="btn btn-secondary">🏠 Volver al inicio</a>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    let html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Historial de Compras</title>
        <link rel="stylesheet" href="/bootstrap/bootstrap.css">
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body class="bg-light">
        <div class="container mt-5">
          <h1 class="text-center mb-4 text-primary">📜 Historial de Compras</h1>
          <table class="table table-striped table-hover shadow-sm">
            <thead class="table-dark">
              <tr>
                <th>Producto</th>
                <th>Talla</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
    `;

    results.forEach(item => {
      html += `
        <tr>
          <td>${item.nombre}</td>
          <td>${item.talla}</td>
          <td>${item.cantidad}</td>
          <td>$${item.precio}</td>
          <td>${item.fecha.toLocaleString()}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>

          <div class="d-flex justify-content-center gap-3 mt-4">
            <button onclick="window.location.href='/descargar-historial'" class="btn btn-primary">⬇️ Descargar PDF</button>
            <button onclick="window.location.href='/'" class="btn btn-secondary">🏠 Volver al inicio</button>
          </div>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  });
});


//Ruta ventas
app.get('/ventas', requireLogin, requireRoles('admin'), (req, res) => {
  const query = `
    SELECT h.nombre, h.talla, h.cantidad, h.precio, h.fecha, u.correo
    FROM historial h
    JOIN usuarios u ON h.usuario_id = u.id
    ORDER BY h.fecha DESC
  `;

  connection.query(query, (err, results) => {
    if (err) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Error</title>
          <link rel="stylesheet" href="/bootstrap/bootstrap.css">
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body class="bg-light">
          <div class="container mt-5">
            <div class="alert alert-danger text-center">Error al cargar ventas.</div>
            <div class="text-center mt-3">
              <a href="/" class="btn btn-secondary">🏠 Volver al inicio</a>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    let total = 0;
    let html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Ventas</title>
        <link rel="stylesheet" href="/bootstrap/bootstrap.css">
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body class="bg-light">
        <div class="container mt-5">
          <h1 class="text-center mb-4 text-primary">📊 Historial de Ventas</h1>
          <table class="table table-striped table-hover shadow-sm">
            <thead class="table-dark">
              <tr>
                <th>Cliente</th>
                <th>Producto</th>
                <th>Talla</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Fecha</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
    `;

    results.forEach(item => {
      const subtotal = item.cantidad * item.precio;
      total += subtotal;
      html += `
        <tr>
          <td>${item.correo}</td>
          <td>${item.nombre}</td>
          <td>${item.talla}</td>
          <td>${item.cantidad}</td>
          <td>$${item.precio}</td>
          <td>${item.fecha.toLocaleString()}</td>
          <td>$${subtotal}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>

          <div class="text-end text-success fs-4 fw-bold mb-3">
            Total ganado: $${total}
          </div>

          <div class="d-flex justify-content-center gap-3 mb-5">
            <button onclick="window.location.href='/descargar-ventas'" class="btn btn-primary">⬇️ Descargar PDF</button>
            <button onclick="window.location.href='/'" class="btn btn-secondary">🏠 Volver al inicio</button>
          </div>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  });
});


// Ver perfil del cliente
app.get('/ver-mi-perfil', requireLogin, requireRoles('cliente'), (req, res) => {
  const usuarioId = req.session.usuario.id;

  connection.query('SELECT id, nombre, correo, tipo_usuario FROM usuarios WHERE id = ?', [usuarioId], (err, results) => {
    if (err || results.length === 0) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Error</title>
          <link rel="stylesheet" href="/bootstrap/bootstrap.css">
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body class="bg-light">
          <div class="container d-flex justify-content-center align-items-center vh-100">
            <div class="text-center">
              <div class="alert alert-danger">Error al cargar perfil</div>
              <button onclick="window.location.href='/'" class="btn btn-danger mt-3">Volver</button>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    const u = results[0];

    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Mi Perfil</title>
        <link rel="stylesheet" href="/bootstrap/bootstrap.css">
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body class="bg-light">
        <div class="container mt-4">
          <h1 class="text-primary mb-3">👤 Mi Perfil</h1>
          <div class="table-responsive">
            <table class="table table-striped table-hover align-middle shadow-sm">
              <thead class="table-primary">
                <tr>
                  <th>ID</th><th>Nombre</th><th>Correo</th><th>Rol</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${u.id}</td>
                  <td>${u.nombre}</td>
                  <td>${u.correo}</td>
                  <td>${u.tipo_usuario}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 class="mt-4 mb-3">Actualizar datos</h3>

          <div class="row g-3">
            <!-- Formulario actualizar correo -->
            <div class="col-md-6">
              <form method="POST" action="/actualizar-correo">
                <input type="hidden" name="id" value="${u.id}">
                <label class="form-label">Nuevo correo</label>
                <div class="input-group">
                  <input type="email" name="nuevo_correo" class="form-control w-100" placeholder="ejemplo@correo.com" required>
                  <button type="submit" class="btn btn-success">Actualizar correo</button>
                </div>
              </form>
            </div>

            <!-- Formulario actualizar contraseña -->
            <div class="col-md-6">
              <form method="POST" action="/actualizar-password">
                <input type="hidden" name="id" value="${u.id}">
                <label class="form-label">Nueva contraseña</label>
                <div class="input-group">
                  <input type="password" name="nuevo_password" class="form-control w-100" placeholder="••••••••••••" required>
                  <button type="submit" class="btn btn-warning">Actualizar contraseña</button>
                </div>
              </form>
            </div>
          </div>

          <div class="mt-4">
            <button onclick="window.location.href='/'" class="btn btn-outline-primary">🏠 Volver al inicio</button>
          </div>
        </div>
      </body>
      </html>
    `);
  });
});


// Actualizar correo
app.post('/actualizar-correo', requireLogin, requireRoles('cliente'), (req, res) => {
  const { id, nuevo_correo } = req.body;

  connection.query('UPDATE usuarios SET correo = ? WHERE id = ?', [nuevo_correo, id], (err) => {
    if (err) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Error</title><link rel="stylesheet" href="/bootstrap/bootstrap.css"></head>
        <body class="bg-light"><div class="container d-flex justify-content-center align-items-center vh-100">
          <div class="text-center">
            <div class="alert alert-danger">Error al actualizar correo</div>
            <button onclick="window.location.href='/ver-mi-perfil'" class="btn btn-danger mt-3">Volver</button>
          </div></div></body></html>
      `);
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Confirmación</title><link rel="stylesheet" href="/bootstrap/bootstrap.css"></head>
      <body class="bg-light"><div class="container d-flex justify-content-center align-items-center vh-100">
        <div class="text-center">
          <div class="alert alert-success">Correo actualizado correctamente</div>
          <button onclick="window.location.href='/ver-mi-perfil'" class="btn btn-success mt-3">Volver</button>
        </div></div></body></html>
    `);
  });
});

// Actualizar contraseña
app.post('/actualizar-password', requireLogin, requireRoles('cliente'), async (req, res) => {
  const { id, nuevo_password } = req.body;
  const passwordHash = await bcrypt.hash(nuevo_password, 10);

  connection.query('UPDATE usuarios SET password_hash = ? WHERE id = ?', [passwordHash, id], (err) => {
    if (err) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Error</title><link rel="stylesheet" href="/bootstrap/bootstrap.css"></head>
        <body class="bg-light"><div class="container d-flex justify-content-center align-items-center vh-100">
          <div class="text-center">
            <div class="alert alert-danger">Error al actualizar contraseña</div>
            <button onclick="window.location.href='/ver-mi-perfil'" class="btn btn-danger mt-3">Volver</button>
          </div></div></body></html>
      `);
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Confirmación</title><link rel="stylesheet" href="/bootstrap/bootstrap.css"></head>
      <body class="bg-light"><div class="container d-flex justify-content-center align-items-center vh-100">
        <div class="text-center">
          <div class="alert alert-success">Contraseña actualizada correctamente</div>
          <button onclick="window.location.href='/ver-mi-perfil'" class="btn btn-success mt-3">Volver</button>
        </div></div></body></html>
    `);
  });
});


// Finalizar compra
app.post('/finalizar-compra', requireLogin, requireRoles('cliente'), (req, res) => {
  const usuarioId = req.session.usuario.id;

  // Vaciar el carrito del usuario
  connection.query('DELETE FROM carrito WHERE usuario_id = ?', [usuarioId], (err) => {
    if (err) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Error</title>
          <link rel="stylesheet" href="/bootstrap/bootstrap.css">
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body class="bg-light">
          <div class="container d-flex justify-content-center align-items-center vh-100">
            <div class="text-center">
              <div class="alert alert-danger">Error al finalizar la compra.</div>
              <a href="/carrito" class="btn btn-secondary mt-3">🔙 Volver al carrito</a>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    // Mostrar página de confirmación
    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Compra Exitosa</title>
        <link rel="stylesheet" href="/bootstrap/bootstrap.css">
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body class="bg-light">
        <div class="container d-flex justify-content-center align-items-center vh-100">
          <div class="card shadow text-center p-4">
            <div class="card-body">
              <h1 class="text-success mb-3">¡Compra exitosa!</h1>
              <p class="text-muted">Gracias por tu compra. Tu carrito ha sido vaciado.</p>
              <div class="d-flex justify-content-center gap-3 mt-3">
                <a href="/" class="btn btn-primary">🏠 Volver al inicio</a>
                <a href="/historial" class="btn btn-secondary">📜 Ver historial</a>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
  });
});


//Ruta descargar ventas
app.get('/descargar-ventas', requireLogin, requireRoles('admin'), (req, res) => {
  const query = `
    SELECT h.nombre, h.talla, h.cantidad, h.precio, h.fecha, u.correo
    FROM historial h
    JOIN usuarios u ON h.usuario_id = u.id
    ORDER BY h.fecha DESC
  `;

  connection.query(query, (err, results) => {
    if (err) return res.send('Error al generar PDF.');

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="ventas.pdf"');
    doc.pipe(res);

    doc.fontSize(20).text('Historial de Ventas', { align: 'center' });
    doc.moveDown();

    let total = 0;
    results.forEach(item => {
      const subtotal = item.cantidad * item.precio;
      total += subtotal;
      doc.fontSize(12).text(
        `Cliente: ${item.correo} | Producto: ${item.nombre} | Talla: ${item.talla} | Cantidad: ${item.cantidad} | Precio: $${item.precio} | Fecha: ${item.fecha.toLocaleString()} | Subtotal: $${subtotal}`
      );
    });

    doc.moveDown();
    doc.fontSize(14).text(`Total ganado: $${total}`, { align: 'right' });

    doc.end();
  });
});


//Ruta: Descargar historial en PDF
app.get('/descargar-historial', requireLogin, requireRoles('cliente'), (req, res) => {
  const usuarioId = req.session.usuario.id;

  const query = 'SELECT nombre, talla, cantidad, precio, fecha FROM historial WHERE usuario_id = ? ORDER BY fecha DESC';
  connection.query(query, [usuarioId], (err, results) => {
    if (err) return res.send('Error al generar PDF.');

    // Crear documento PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="historial.pdf"');
    doc.pipe(res);

    doc.fontSize(20).text('Historial de Compras', { align: 'center' });
    doc.moveDown();

    results.forEach(item => {
      doc.fontSize(12).text(
        `Producto: ${item.nombre} | Talla: ${item.talla} | Cantidad: ${item.cantidad} | Precio: $${item.precio} | Fecha: ${item.fecha}`
      );
    });

    doc.end();
  });
});


// Iniciar el servidor
app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});





