# Plantillas_COPRO
Sistema web para gestión de compras de plantillas terapéuticas

# Sistema de Gestión de Plantillas Terapéuticas
Este proyecto es una aplicación web desarrollada con **Node.js, Express y MySQL** que permite gestionar usuarios, roles, productos y compras de plantillas terapéuticas. Incluye funcionalidades para clientes y administradores, historial de compras, exportación en PDF y un diseño moderno con **Bootstrap**.

# Objetivos
-Permitir a los clientes:
  - Registrarse e iniciar sesión.
  - Visualizar catálogo de plantillas.
  - Agregar productos al carrito y realizar compras.
  - Consultar su historial de compras.
  - Actualizar su perfil (correo y contraseña).
-Permitir a los administradores:
  - Visualizar todas las ventas realizadas.
  - Consultar el total de ingresos.
  - Exportar reportes en PDF.

# Tecnologías utilizadas
- **Backend**: Node.js + Express
- **Base de datos**: MySQL
- **Frontend**: HTML5, CSS3, Bootstrap
- **Gestión de sesiones**: express-session
- **Seguridad**: bcrypt para contraseñas
- **Exportación**: pdfkit para generar reportes en PDF

## 📂 Estructura del proyecto
- BaseDatos
 - script.sql           # Script con creación de tablas y datos de ejemplo
- Public
 - login.html           # Página de inicio de sesión
 - registro.html        # Registro de usuarios
 - carrito.html         # Carrito de compras
 - historial.html       # Historial de compras
 - ventas.html          # Vista de administrador
 - styles.css           # Estilos personalizados
 - server.js            # Lógica principal del servidor Express
 - package.json         # Dependencias y configuración del proyecto
