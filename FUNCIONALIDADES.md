# Documentación de Funcionalidades - SolarEPC

## ✅ Funcionalidades Implementadas y Verificadas

---

## 1. 🔐 Sistema de Autenticación y Perfiles

### Autenticación
- **Login con email/contraseña** usando Supabase Auth
- **Logout** desde el header (botón con ícono)
- **Gestión de sesiones** automática
- **Protección de rutas** según rol de usuario

### Perfiles de Usuario
Tabla: `user_profiles`

Campos:
- `id` - UUID (referencia a auth.users)
- `email` - Email del usuario
- `full_name` - Nombre completo
- `role` - Rol: 'admin', 'installer', 'supervisor'
- `phone` - Teléfono de contacto
- `assigned_crew_id` - Cuadrilla asignada (para instaladores)
- `is_active` - Estado activo/inactivo

**Funcionalidad:**
- Los admins tienen acceso completo
- Los instaladores/supervisores ven vista móvil limitada
- Perfiles se cargan automáticamente al iniciar sesión

---

## 2. ⚙️ Sistema de Configuración

### Ubicación
Sidebar > Configuración

### Funcionalidades

#### A. Preferencias de Idioma
- **Español** (por defecto)
- **English**
- Se guarda en `system_settings` por usuario
- Cambio instantáneo

#### B. Gestión de Usuarios (Solo Admins)

**Crear Usuarios:**
- Email y contraseña
- Nombre completo
- Rol (admin/installer/supervisor)
- Teléfono
- Asignar a cuadrilla
- Estado activo/inactivo

**Ver Usuarios:**
- Lista completa de usuarios del sistema
- Roles visibles con badges de color
- Email y teléfono
- Estado (activo/inactivo)

**Activar/Desactivar Usuarios:**
- Botón toggle para cambiar estado
- Usuarios inactivos no pueden iniciar sesión

**Funcionalidad Especial:**
Los admins pueden crear cuentas de instaladores directamente desde la interfaz sin que el instalador tenga que registrarse.

---

## 3. 📋 Registro de Auditoría (Audit Log)

### Ubicación
Header > Ícono de Activity (solo admins)

### Qué Registra

**Acciones Trackeadas:**
- `create` - Creación de entidades
- `update` - Actualización de datos
- `delete` - Eliminación de registros
- `upload` - Subida de archivos
- `view` - Visualización de datos sensibles

**Información Capturada:**
- Usuario que realizó la acción (email)
- Tipo de acción
- Tipo de entidad afectada (proyecto, hito, contrato, etc.)
- Descripción legible en español
- Metadatos (valores antiguos/nuevos)
- Marca de tiempo
- IP address (opcional)

### Características

- **Vista en tiempo real**: Se actualiza automáticamente con nuevas entradas
- **Filtros**: Por tipo de acción (crear, actualizar, subir, eliminar)
- **Búsqueda**: Por entidad o usuario
- **Detalles expandibles**: JSON con metadatos completos
- **Timestamps relativos**: "Hace 5 min", "Hace 2 h", etc.

### Seguridad
- Solo admins pueden ver el log completo
- Usuarios regulares solo ven sus propias acciones
- Las entradas son inmutables (no se pueden editar ni eliminar)
- RLS protege el acceso

---

## 4. 🔔 Sistema de Notificaciones

### Ubicación
Header > Campanita (bell icon)

### Tipos de Notificaciones

**Automáticas desde Instaladores:**
1. **Actualización de Progreso**
   - Cuando un instalador actualiza el % de un hito
   - Muestra: nombre del instalador, hito, nuevo porcentaje

2. **Subida de Evidencia**
   - Cuando se sube una foto desde móvil
   - Muestra: nombre del instalador, hito, descripción

**Otras Notificaciones:**
- Pagos de contratos
- Alertas de inventario bajo
- Cambios en proyectos compartidos

### Características

- **Dropdown responsive**: Se adapta a móvil y desktop
- **Badge con contador**: Muestra cantidad de no leídas
- **Marcado como leído**: Click para marcar leída
- **Navegación directa**: Click lleva al proyecto relacionado
- **Colores por tipo**:
  - Info: Azul
  - Success: Verde
  - Warning: Amarillo
  - Alert: Rojo

---

## 5. 👥 Proyectos Compartidos

### Tabla: `project_collaborators`

**Funcionalidad:**
- Múltiples usuarios pueden acceder al mismo proyecto
- Tres niveles de acceso:
  - **Owner**: Control total
  - **Editor**: Puede modificar
  - **Viewer**: Solo lectura

### Permisos por Rol

**Owner:**
- Agregar/remover colaboradores
- Editar todos los datos del proyecto
- Eliminar el proyecto

**Editor:**
- Modificar datos del proyecto
- Subir documentos
- Actualizar hitos
- No puede gestionar colaboradores

**Viewer:**
- Ver toda la información
- Descargar documentos
- No puede modificar nada

### Cómo Funciona

1. Admin/Owner agrega colaborador desde proyecto
2. Colaborador recibe notificación
3. El proyecto aparece en su lista
4. Puede acceder según su rol
5. Todas las acciones quedan en audit log

---

## 6. 📱 Vista Móvil para Instaladores

### Acceso
Los usuarios con rol `installer` o `supervisor` ven automáticamente una interfaz móvil simplificada.

### Características

**Vista de Proyecto:**
- Proyecto asignado a su cuadrilla
- Información básica del cliente
- Lista de hitos con progreso

**Actualización de Progreso:**
- Botones grandes táctiles: 25%, 50%, 75%, 100%
- Barra de progreso visual
- Marca completado instantáneamente
- Genera notificación automática

**Subida de Fotos:**
- Botón "Subir Foto de Evidencia"
- Acceso directo a cámara del teléfono
- Agregar descripción opcional
- Upload automático a storage
- Genera notificación automática

**Tipos de Evidencia que pueden subir:**
- Fotos de instalación en progreso
- Tableros eléctricos terminados
- Paneles solares instalados
- Líneas de vida y seguridad
- Actas de entrega firmadas
- Cualquier documento relevante

### Registro Automático

Cada acción del instalador crea:
1. **Entrada en Audit Log**: Con detalles completos
2. **Notificación**: Para admins y supervisores
3. **Timestamp**: Fecha y hora exacta

---

## 7. 🔧 Gestión de Cuadrillas

### Tabla: `project_crews`

**Campos:**
- Nombre de cuadrilla
- Líder
- Número de miembros
- Especialidad (instalación, eléctrico, montaje, supervisión)
- Teléfono de contacto
- Estado (activo, de descanso, inactivo)
- Tarea actual

### Funcionalidad

**Asignar Cuadrilla a Proyecto:**
- Modal desde vista de proyecto
- Crear nueva cuadrilla en el momento
- Asignar cuadrilla existente

**Asignar Instaladores a Cuadrilla:**
- Desde Configuración al crear usuario
- Un instalador = una cuadrilla
- Vista móvil filtrada por cuadrilla

---

## 8. 📊 Tabla: `crew_members`

### Miembros Individuales de Cuadrillas

**Campos:**
- Nombre del miembro
- Referencia a user (si tiene cuenta)
- Rol en cuadrilla (líder, miembro, asistente)
- Teléfono
- Estado activo/inactivo

**Funcionalidad:**
- Tracking individual de miembros
- Pueden o no tener cuenta de usuario
- Si tienen cuenta, acceden a vista móvil
- Si no, solo aparecen como registro

---

## 9. 🛡️ Seguridad (RLS - Row Level Security)

### Políticas Implementadas

#### Audit Logs
- Admins: ven todo
- Usuarios: solo sus acciones
- Sistema: puede insertar siempre

#### User Profiles
- Usuarios: ven su propio perfil
- Admins: ven y editan todos
- Solo admins pueden crear perfiles

#### Project Collaborators
- Usuarios: ven sus colaboraciones
- Owners: gestionan colaboradores de su proyecto
- Admins: gestionan todo

#### Projects
- Usuarios: ven proyectos donde son colaboradores
- Admins: ven todos
- Instaladores: solo proyectos de su cuadrilla

#### Project Milestones
- Colaboradores: ven hitos de sus proyectos
- Instaladores: pueden actualizar progreso
- Admins: control total

#### Milestone Evidence
- Instaladores: pueden subir evidencia
- Colaboradores: pueden ver evidencia
- Admins: control total

---

## 10. 🗄️ Sistema de Almacenamiento (Storage)

### Buckets Creados

1. **project-documents**
   - Documentos generales de proyectos
   - Evidencias de hitos
   - Fotos de instaladores

2. **equipment-docs**
   - Manuales de equipos
   - Facturas de compra
   - Certificados de garantía

3. **contracts**
   - PDFs de contratos
   - Documentos legales

### Políticas de Acceso

- Instaladores pueden subir a project-documents
- Solo pueden acceder a archivos de sus proyectos
- Admins tienen acceso completo
- URLs públicas para visualización controlada

---

## 11. 🔌 Función SQL: `create_audit_log`

### Uso
```sql
SELECT create_audit_log(
  p_user_id := 'uuid-del-usuario',
  p_user_email := 'email@ejemplo.com',
  p_action_type := 'update',
  p_entity_type := 'milestone',
  p_entity_id := 'uuid-del-hito',
  p_description := 'Actualizó progreso de "Instalación Paneles" a 75%',
  p_metadata := '{"old_progress": 50, "new_progress": 75}'::jsonb
);
```

### Características
- SECURITY DEFINER (se ejecuta con privilegios de owner)
- Devuelve UUID del log creado
- Metadatos en formato JSON
- Se puede llamar desde cualquier contexto

---

## 12. ⚡ Características Especiales

### Real-time Updates
- Notificaciones se actualizan en tiempo real
- Audit log se actualiza automáticamente
- Subscripciones a cambios de base de datos

### Offline Support (Parcial)
- Las fotos se pueden tomar offline
- Se suben al reconectar (funcionalidad del navegador)

### Mobile-First Design
- Vista de instalador optimizada para móvil
- Botones grandes, táctiles
- Interfaz simplificada
- Sin elementos innecesarios

---

## 📝 Flujo Completo de Trabajo

### Escenario: Instalador Actualiza Progreso

1. **Admin crea proyecto** → Audit log
2. **Admin crea cuadrilla y la asigna** → Audit log
3. **Admin crea cuenta de instalador** → Audit log
4. **Admin asigna instalador a cuadrilla** → Audit log
5. **Instalador inicia sesión** → Ve automáticamente vista móvil
6. **Instalador ve su proyecto asignado** → Filtrado por cuadrilla
7. **Instalador actualiza progreso a 50%** → Se crea:
   - Entrada en audit_logs
   - Notificación para admins
   - Update en project_milestones
8. **Instalador sube foto** → Se crea:
   - Archivo en storage
   - Entrada en milestone_evidence
   - Entrada en audit_logs
   - Notificación con descripción
9. **Admin ve notificación** → Click lleva al proyecto
10. **Admin revisa audit log** → Ve todas las acciones del instalador

---

## 🎯 Resumen de Verificación

### ✅ Todas las funcionalidades están implementadas:

1. ✅ Cerrar sesión
2. ✅ Sistema de configuración
3. ✅ Cambio de idioma
4. ✅ Gestión de usuarios (crear instaladores)
5. ✅ Proyectos compartidos
6. ✅ Registro de auditoría completo
7. ✅ Notificaciones desde instaladores
8. ✅ Vista móvil para instaladores
9. ✅ Actualización de progreso
10. ✅ Subida de fotos con cámara
11. ✅ Sistema de permisos por rol
12. ✅ Row Level Security (RLS)
13. ✅ Storage para archivos
14. ✅ Audit logs automáticos
15. ✅ Notificaciones en tiempo real

---

## 📞 Soporte Técnico

Para cualquier duda sobre las funcionalidades:
- Revisa el código en los archivos correspondientes
- Consulta las migraciones en `supabase/migrations/`
- Verifica las políticas RLS en la base de datos
- Usa el registro de auditoría para debugging

**Todo está funcionando y probado exitosamente.**
