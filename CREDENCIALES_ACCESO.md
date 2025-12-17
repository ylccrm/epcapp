# Credenciales de Acceso - Sistema Solar EPC

## IMPORTANTE: Usuarios Existentes

Los siguientes usuarios **ya existen** en el sistema, pero las contraseñas no están documentadas:
- admin@solarepc.com
- jose@gmail.com
- carlos@gmail.com

## Opciones para Acceder al Sistema

### Opción 1: Crear una Nueva Cuenta (RECOMENDADO)

Puedes registrarte con un nuevo email y contraseña:

1. Ve a la página de registro
2. Usa cualquier email válido (ej: `tuusuario@gmail.com`)
3. Crea una contraseña de tu elección (mínimo 6 caracteres)
4. El sistema te asignará el rol de **Instalador** por defecto

**Nota:** El primer usuario registrado automáticamente se convierte en Super Admin, pero ya hay usuarios en el sistema, así que nuevos usuarios serán Instaladores.

### Opción 2: Restablecer Contraseña de Usuario Existente

Si quieres usar uno de los usuarios existentes:

#### Para admin@solarepc.com:

1. Ve a la página de login
2. Haz clic en "¿Olvidaste tu contraseña?" (si existe)
3. O accede directamente a Supabase Dashboard:
   - Ve a https://supabase.com/dashboard
   - Selecciona tu proyecto
   - Ve a **Authentication** > **Users**
   - Busca `admin@solarepc.com`
   - Clic en los 3 puntos (...) > "Send password recovery email"
   - Revisa el email de recuperación

### Opción 3: Usar Credenciales Temporales (NUEVA CUENTA)

Te recomiendo crear una cuenta nueva con estas credenciales de prueba:

```
Email: prueba@solarepc.com
Contraseña: Prueba123!
```

Después de registrarte, puedes pedir al Super Admin actual que te cambie el rol a Admin o Supervisor si lo necesitas.

## Estructura de Roles

### Super Administrador (admin)
- Control total del sistema
- Gestión de todos los usuarios
- Acceso a todos los proyectos

### Supervisor
- Crear y gestionar proyectos
- Ver todos los proyectos del sistema
- Compartir proyectos con otros usuarios

### Instalador (installer)
- Ver solo sus propios proyectos
- Ver proyectos compartidos con ellos
- Actualizar progreso en proyectos asignados

## ¿Necesitas Acceso de Admin Inmediatamente?

Si necesitas acceso administrativo urgente y no puedes restablecer la contraseña de `admin@solarepc.com`, contacta al desarrollador o administrador del sistema para que:

1. Te comparta las credenciales del admin actual
2. Te cree una cuenta nueva con rol de admin
3. O te ayude a restablecer la contraseña desde Supabase Dashboard

## Acceso a Supabase Dashboard

Para administración completa del backend:

1. Ve a https://supabase.com/dashboard
2. Inicia sesión con la cuenta del proyecto
3. Selecciona el proyecto "Solar EPC"
4. Desde ahí puedes:
   - Ver todos los usuarios en Authentication > Users
   - Restablecer contraseñas
   - Modificar roles directamente en la tabla `user_profiles`
   - Ejecutar consultas SQL

---

**Última actualización:** Diciembre 2025
