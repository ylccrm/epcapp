# Credenciales del Super Administrador

## Cuenta de Super Administrador

**Email:** admin@solarepc.com
**Contraseña:** *(Se requiere configuración inicial)*

## Configuración Inicial

Si es la primera vez que accedes al sistema o necesitas restablecer la contraseña del administrador, sigue estos pasos:

### Opción 1: Restablecer Contraseña desde la Interfaz

1. Ve a la página de inicio de sesión
2. Ingresa el email: `admin@solarepc.com`
3. Si no conoces la contraseña, puedes crear una nueva cuenta con un email diferente
4. El primer usuario registrado se convierte automáticamente en super administrador

### Opción 2: Configurar Contraseña del Admin Existente

Si ya existe un admin pero no conoces su contraseña, puedes usar la consola de Supabase:

1. Accede a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **Authentication** > **Users**
3. Busca el usuario `admin@solarepc.com`
4. Haz clic en los tres puntos (...) y selecciona "Send password recovery email"
5. El admin recibirá un email para restablecer su contraseña

### Opción 3: Crear un Nuevo Super Admin (Solo si no existe)

Si no existe ningún super administrador:

1. Regístrate normalmente en la aplicación con cualquier email
2. El primer usuario registrado automáticamente se convierte en super administrador
3. Usa estas credenciales para acceder al sistema

## Roles del Sistema

### Super Administrador (Admin)
- **Permisos:** Acceso completo al sistema
- **Puede:**
  - Ver y gestionar todos los proyectos
  - Gestionar todos los usuarios del sistema
  - Cambiar roles de usuarios (installer/supervisor)
  - Compartir proyectos con otros usuarios
  - Crear, editar y eliminar cualquier recurso
- **Restricción:** Solo puede existir UN super administrador en el sistema

### Supervisor
- **Permisos:** Acceso de visualización amplio
- **Puede:**
  - Ver todos los proyectos del sistema
  - Crear y gestionar sus propios proyectos
  - Ver inventario y proveedores
- **No puede:**
  - Gestionar usuarios
  - Editar proyectos de otros usuarios (a menos que sean compartidos con permisos de editor)

### Instalador (Installer)
- **Permisos:** Acceso limitado a proyectos asignados
- **Puede:**
  - Ver solo sus propios proyectos
  - Ver proyectos compartidos con ellos
  - Crear nuevos proyectos
  - Ver inventario general
- **No puede:**
  - Ver proyectos de otros usuarios
  - Gestionar usuarios
  - Ver todos los proyectos del sistema

## Sistema de Compartir Proyectos

### Roles de Colaboradores en Proyectos

1. **Propietario (Owner)**
   - El creador del proyecto
   - Control total del proyecto
   - Puede compartir con otros usuarios
   - No puede ser removido del proyecto

2. **Editor**
   - Puede ver y modificar el proyecto
   - Puede agregar datos y recursos
   - No puede eliminar el proyecto
   - No puede remover al propietario

3. **Visualizador (Viewer)**
   - Solo puede ver el proyecto
   - No puede hacer cambios
   - Acceso de solo lectura

### Cómo Compartir un Proyecto

1. Abre el proyecto que deseas compartir
2. Haz clic en el botón "Compartir" en la esquina superior derecha
3. Busca al usuario que deseas agregar
4. Selecciona el rol (Editor o Visualizador)
5. Haz clic en "Agregar"

## Aislamiento de Datos

### Principios de Seguridad

1. **Datos Limpios por Usuario:** Cada usuario nuevo comienza con una cuenta limpia, sin acceso a proyectos existentes
2. **Aislamiento de Proyectos:** Los usuarios solo ven sus propios proyectos por defecto
3. **Compartir Explícito:** Los proyectos solo se comparten cuando el propietario lo autoriza explícitamente
4. **Jerarquía de Permisos:**
   - Admin: Ve todo
   - Supervisor: Ve todos los proyectos (solo lectura por defecto)
   - Installer: Solo ve sus proyectos y proyectos compartidos

## Seguridad y Mejores Prácticas

### Para el Super Administrador

1. **Guarda tus credenciales de forma segura**
2. **No compartas tu cuenta de administrador**
3. **Usa contraseñas fuertes** (mínimo 8 caracteres)
4. **Revisa regularmente los usuarios** del sistema
5. **Asigna roles apropiados** según las responsabilidades de cada usuario
6. **Usa el sistema de compartir proyectos** en lugar de dar acceso de supervisor a todos

### Para Todos los Usuarios

1. Usa contraseñas únicas y seguras
2. No compartas tus credenciales
3. Cierra sesión al terminar de usar el sistema
4. Reporta cualquier actividad sospechosa al administrador

## Soporte Técnico

Si necesitas ayuda o tienes problemas para acceder:

1. Verifica que estés usando el email correcto
2. Intenta restablecer tu contraseña
3. Contacta al super administrador del sistema
4. Revisa la consola de Supabase para diagnósticos avanzados

## Notas Importantes

- Solo puede existir UN super administrador en el sistema
- El primer usuario registrado se convierte en super administrador automáticamente
- Los nuevos usuarios siempre empiezan como "Instalador" por defecto
- Solo el admin puede cambiar roles de usuarios
- Los proyectos son privados por defecto y deben compartirse explícitamente
