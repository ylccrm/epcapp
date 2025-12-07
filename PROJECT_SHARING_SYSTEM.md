# Sistema de Compartir Proyectos por Email - Documentación Completa

## Resumen

Se ha implementado un sistema profesional de compartir proyectos basado en invitaciones por email, similar a herramientas como Asana, Notion, Slack y Trello. El sistema permite a los dueños de proyectos invitar colaboradores que deben aceptar la invitación antes de obtener acceso.

---

## 🎯 Características Principales

### 1. Invitaciones por Email
- Los proyectos se comparten introduciendo el **email del usuario**
- El sistema verifica que el email exista en la plataforma
- Si no existe, muestra error: "El usuario con ese correo no existe"
- No se puede compartir con uno mismo
- Previene invitaciones duplicadas

### 2. Flujo de Aprobación
- El usuario receptor debe **aceptar o rechazar** la invitación
- Solo después de aceptar, el proyecto aparece en su lista
- Las invitaciones pendientes no dan acceso al proyecto
- El owner puede cancelar invitaciones pendientes

### 3. Notificaciones Automáticas
- **Al invitar**: Receptor recibe notificación "Te han invitado a colaborar en el proyecto X"
- **Al aceptar**: Owner recibe notificación "usuario@email.com ha aceptado tu invitación"
- **Al rechazar**: Owner recibe notificación "usuario@email.com ha rechazado tu invitación"

### 4. Sistema de Permisos
- **Owner (Dueño)**: Control total, puede compartir y eliminar el proyecto
- **Colaborador**: Puede ver, editar y actualizar, pero NO eliminar
- **Admin**: Acceso total a todos los proyectos del sistema

---

## 🗄️ Estructura de Base de Datos

### Tabla: `shared_project_requests`

```sql
CREATE TABLE shared_project_requests (
  id uuid PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  owner_id uuid REFERENCES auth.users(id),
  email_invited text NOT NULL,
  invited_user_id uuid REFERENCES auth.users(id),
  status text CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Campos:**
- `id`: Identificador único de la invitación
- `project_id`: Proyecto que se está compartiendo
- `owner_id`: Usuario que envía la invitación
- `email_invited`: Email del usuario invitado
- `invited_user_id`: ID del usuario invitado (si existe)
- `status`: Estado de la invitación
  - `pending`: Invitación enviada, esperando respuesta
  - `accepted`: Usuario aceptó la invitación
  - `rejected`: Usuario rechazó la invitación
  - `cancelled`: Owner canceló la invitación

### Tabla: `projects` (Actualizada)

Se agregaron dos campos:

```sql
ALTER TABLE projects ADD COLUMN created_by uuid REFERENCES auth.users(id);
ALTER TABLE projects ADD COLUMN shared_with uuid[] DEFAULT '{}';
```

**Campos nuevos:**
- `created_by`: Usuario que creó el proyecto (owner)
- `shared_with`: Array de IDs de usuarios con acceso al proyecto

---

## 🔐 Políticas de Seguridad (RLS)

### Proyectos

```sql
-- Admins ven todos los proyectos
CREATE POLICY "Admins can view all projects"
  ON projects FOR SELECT
  USING (user is admin);

-- Users ven sus propios proyectos
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (created_by = auth.uid());

-- Users ven proyectos compartidos con ellos
CREATE POLICY "Users can view shared projects"
  ON projects FOR SELECT
  USING (auth.uid() = ANY(shared_with));

-- Solo owners pueden eliminar sus proyectos
CREATE POLICY "Owners can delete their projects"
  ON projects FOR DELETE
  USING (created_by = auth.uid());

-- Colaboradores pueden actualizar proyectos compartidos
CREATE POLICY "Shared users can update shared projects"
  ON projects FOR UPDATE
  USING (auth.uid() = ANY(shared_with));
```

### Invitaciones

```sql
-- Owners pueden ver invitaciones que enviaron
CREATE POLICY "Owners can view sent invitations"
  ON shared_project_requests FOR SELECT
  USING (owner_id = auth.uid());

-- Invited users pueden ver invitaciones que recibieron
CREATE POLICY "Users can view received invitations"
  ON shared_project_requests FOR SELECT
  USING (invited_user_id = auth.uid());

-- Solo owners pueden crear invitaciones
CREATE POLICY "Owners can create invitations"
  ON shared_project_requests FOR INSERT
  WITH CHECK (owner_id = auth.uid());
```

---

## 🛠️ Funciones SQL

### 1. `create_project_invitation()`

Crea una nueva invitación de proyecto.

**Parámetros:**
- `p_project_id` (uuid): ID del proyecto a compartir
- `p_email_invited` (text): Email del usuario a invitar

**Validaciones:**
1. Verifica que el usuario esté autenticado
2. Verifica que sea owner del proyecto
3. Verifica que no intente compartir consigo mismo
4. Verifica que el email exista en el sistema
5. Verifica que no haya invitación activa o aceptada

**Retorna:** JSON con éxito/error

**Efectos:**
- Crea registro en `shared_project_requests`
- Crea notificación para el usuario invitado
- Registra en audit log

**Ejemplo:**
```sql
SELECT create_project_invitation(
  p_project_id := 'uuid-del-proyecto',
  p_email_invited := 'colaborador@ejemplo.com'
);
```

### 2. `accept_project_invitation()`

Acepta una invitación pendiente.

**Parámetros:**
- `p_invitation_id` (uuid): ID de la invitación

**Validaciones:**
1. Usuario autenticado
2. La invitación existe y pertenece al usuario
3. La invitación está en estado `pending`

**Retorna:** JSON con éxito/error

**Efectos:**
- Cambia status a `accepted`
- Agrega usuario al array `shared_with` del proyecto
- Crea notificación para el owner
- Registra en audit log

### 3. `reject_project_invitation()`

Rechaza una invitación pendiente.

**Parámetros:**
- `p_invitation_id` (uuid): ID de la invitación

**Validaciones:**
1. Usuario autenticado
2. La invitación existe y pertenece al usuario
3. La invitación está en estado `pending`

**Retorna:** JSON con éxito/error

**Efectos:**
- Cambia status a `rejected`
- Crea notificación para el owner
- Registra en audit log
- NO agrega al proyecto

### 4. `cancel_project_invitation()`

Cancela una invitación pendiente (solo owner).

**Parámetros:**
- `p_invitation_id` (uuid): ID de la invitación

**Validaciones:**
1. Usuario autenticado
2. Usuario es el owner de la invitación
3. La invitación está en estado `pending`

**Retorna:** JSON con éxito/error

**Efectos:**
- Cambia status a `cancelled`
- Registra en audit log

---

## 🎨 Componentes Frontend

### 1. ShareProjectModal

**Ubicación:** `src/components/Modals/ShareProjectModal.tsx`

**Props:**
- `isOpen`: boolean - Controla visibilidad del modal
- `onClose`: function - Función para cerrar el modal
- `projectId`: string - ID del proyecto a compartir
- `projectName`: string - Nombre del proyecto

**Características:**
- Input de email con validación
- Llamada a `create_project_invitation()`
- Muestra errores si el usuario no existe
- Toast de confirmación al enviar
- Información sobre permisos del colaborador

**Uso:**
```tsx
<ShareProjectModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  projectId="uuid-del-proyecto"
  projectName="Nombre del Proyecto"
/>
```

### 2. Invitations (Vista)

**Ubicación:** `src/components/Views/Invitations.tsx`

**Características:**
- Dos pestañas: "Recibidas" y "Enviadas"
- **Recibidas**: Invitaciones que el usuario ha recibido
  - Botones: Aceptar / Rechazar
  - Solo muestra invitaciones pendientes con prominencia
- **Enviadas**: Invitaciones que el usuario ha enviado
  - Botón: Cancelar (solo si está pendiente)
  - Muestra estado de cada invitación
- Badges de estado con colores
- Contador de pendientes en cada tab
- Responsive (cards en móvil)

**Estados:**
- `pending`: Amarillo - "Pendiente"
- `accepted`: Verde - "Aceptada"
- `rejected`: Rojo - "Rechazada"
- `cancelled`: Gris - "Cancelada"

### 3. Projects (Vista Actualizada)

**Ubicación:** `src/components/Views/Projects.tsx`

**Características nuevas:**
- **Botón de compartir**: Aparece al hacer hover en cada card (solo para owners)
- **Badge "Compartido"**: Indica visualmente si un proyecto está compartido
- **Filtrado automático**: Muestra proyectos propios + proyectos compartidos
- **Indicador de ownership**: Solo owners ven el botón de compartir

**Uso del botón compartir:**
1. Hover sobre un card de proyecto
2. Aparece ícono de Share en la esquina superior derecha
3. Click abre el ShareProjectModal
4. No afecta la navegación al proyecto

---

## 📱 Flujo de Usuario Completo

### Escenario: Admin comparte proyecto con colaborador

#### Paso 1: Admin invita
1. Admin navega a "Proyectos"
2. Hace hover sobre un proyecto (que él creó)
3. Aparece botón de compartir (ícono Share2)
4. Click en el botón
5. Se abre modal "Compartir Proyecto"
6. Introduce email: `colaborador@ejemplo.com`
7. Click en "Enviar Invitación"
8. Sistema valida:
   - ✅ Email existe
   - ✅ No es el mismo usuario
   - ✅ No hay invitación activa
9. Crea invitación con status `pending`
10. Envía notificación al colaborador
11. Registra en audit log
12. Muestra toast: "Invitación enviada exitosamente"

#### Paso 2: Colaborador recibe notificación
1. Colaborador inicia sesión
2. Ve badge con número de notificaciones
3. Click en campanita (bell)
4. Ve notificación: "Te han invitado a colaborar en el proyecto X"
5. Click en la notificación
6. Navega a "Invitaciones"

#### Paso 3: Colaborador acepta
1. En vista "Invitaciones", tab "Recibidas"
2. Ve la invitación pendiente del Admin
3. Información visible:
   - Nombre del proyecto
   - Email del owner
   - Fecha de invitación
   - Badge "Pendiente"
4. Click en botón "Aceptar"
5. Sistema:
   - Cambia status a `accepted`
   - Agrega colaborador al array `shared_with`
   - Crea notificación para el Admin
   - Registra en audit log
6. Muestra toast: "Has aceptado la invitación exitosamente"
7. La invitación cambia a estado "Aceptada"

#### Paso 4: Proyecto visible
1. Colaborador navega a "Proyectos"
2. Ahora ve:
   - Sus propios proyectos
   - El proyecto compartido por el Admin (con badge "Compartido")
3. Puede acceder al proyecto
4. Puede editar y actualizar
5. NO puede eliminar el proyecto
6. NO puede compartir el proyecto (no es owner)

#### Paso 5: Admin recibe confirmación
1. Admin ve notificación: "colaborador@ejemplo.com ha aceptado tu invitación"
2. En "Invitaciones" > "Enviadas", ve status "Aceptada"
3. El proyecto ahora muestra badge "Compartido"

---

## 🎛️ Flujo Alternativo: Rechazo de Invitación

### Colaborador rechaza
1. En "Invitaciones" > "Recibidas"
2. Click en "Rechazar"
3. Sistema:
   - Cambia status a `rejected`
   - Crea notificación para el Admin
   - Registra en audit log
4. La invitación cambia a "Rechazada"
5. El proyecto NO aparece en lista del colaborador
6. Admin recibe notificación: "usuario@email.com ha rechazado tu invitación"

---

## 🛡️ Permisos por Rol

### Super Administrador (role: 'admin')

**Proyectos:**
- ✅ Ver todos los proyectos del sistema
- ✅ Ver a qué usuario pertenece cada proyecto
- ✅ Editar cualquier proyecto
- ✅ Eliminar cualquier proyecto
- ✅ Reasignar proyectos a otros usuarios
- ✅ Ver invitaciones de cualquier proyecto

**Invitaciones:**
- ✅ Ver todas las invitaciones del sistema
- ✅ Actualizar cualquier invitación
- ✅ Cancelar invitaciones de otros usuarios

**Vista especial:**
- Módulo "Administración de Usuarios"
- Panel de todos los proyectos con dueños

### Usuario Normal (role: regular/default)

**Proyectos propios:**
- ✅ Crear proyectos
- ✅ Editar sus proyectos
- ✅ Eliminar sus proyectos
- ✅ Compartir sus proyectos
- ✅ Cancelar invitaciones que envió

**Proyectos compartidos:**
- ✅ Ver proyectos compartidos con él
- ✅ Editar proyectos compartidos
- ✅ Actualizar datos del proyecto
- ✅ Subir documentos y evidencia
- ❌ NO puede eliminar proyectos compartidos
- ❌ NO puede compartir proyectos de otros

**Invitaciones:**
- ✅ Recibir invitaciones
- ✅ Aceptar invitaciones
- ✅ Rechazar invitaciones
- ✅ Ver sus invitaciones enviadas
- ✅ Ver sus invitaciones recibidas

**Restricciones:**
- ❌ NO puede ver usuarios del sistema
- ❌ NO puede administrar roles
- ❌ NO puede cambiar contraseñas de otros
- ❌ NO puede ver proyectos de otros usuarios (sin invitación)

### Instalador (role: 'installer')

**Vista limitada:**
- Solo ve el módulo "Avance del Proyecto"
- Solo ve proyectos de su cuadrilla asignada
- Puede subir fotos y evidencia
- Puede actualizar progreso de hitos

**Restricciones:**
- ❌ NO puede ver módulo de proyectos completo
- ❌ NO puede recibir invitaciones
- ❌ NO puede compartir proyectos
- ❌ NO puede ver inventario
- ❌ NO puede ver configuraciones

---

## 🔍 Validaciones del Sistema

### Al Crear Invitación

1. **Usuario autenticado**
   - Error: "Usuario no autenticado"

2. **Usuario es owner del proyecto**
   - Error: "No tienes permisos para compartir este proyecto"

3. **Email no es el propio**
   - Error: "No puedes compartir el proyecto contigo mismo"

4. **Email existe en el sistema**
   - Error: "El usuario con ese correo no existe"

5. **No hay invitación activa**
   - Si status = `accepted`: "Este usuario ya tiene acceso al proyecto"
   - Si status = `pending`: "Ya existe una invitación pendiente para este usuario"

### Al Aceptar/Rechazar

1. **Usuario autenticado**
   - Error: "Usuario no autenticado"

2. **Invitación existe y pertenece al usuario**
   - Error: "Invitación no encontrada"

3. **Invitación está pendiente**
   - Error: "Esta invitación ya fue procesada"

### Al Cancelar

1. **Usuario autenticado**
   - Error: "Usuario no autenticado"

2. **Usuario es owner de la invitación**
   - Error: "Invitación no encontrada o no tienes permisos"

3. **Invitación está pendiente**
   - Error: "Solo se pueden cancelar invitaciones pendientes"

---

## 📊 Casos de Uso Especiales

### 1. Usuario eliminado

Si un usuario es eliminado del sistema:
- Sus invitaciones se eliminan automáticamente (ON DELETE CASCADE)
- Los proyectos compartidos con él se actualizan (se remueve del array)
- El campo `invited_user_id` se pone en NULL

### 2. Proyecto eliminado

Si un proyecto es eliminado:
- Todas las invitaciones asociadas se eliminan (ON DELETE CASCADE)
- Las notificaciones relacionadas permanecen (histórico)

### 3. Multiple colaboradores

Un proyecto puede tener múltiples colaboradores:
- Array `shared_with` puede contener múltiples UUIDs
- Cada colaborador debe aceptar su propia invitación
- Cada colaborador tiene los mismos permisos (editor)
- Solo el owner puede eliminar el proyecto

### 4. Owner transfiere proyecto

Si un admin reasigna un proyecto:
- El nuevo owner hereda control total
- Los colaboradores existentes mantienen acceso
- Las invitaciones pendientes permanecen válidas

---

## 🎯 Indicadores Visuales

### En Lista de Proyectos

**Badge "Compartido":**
- Color: Azul claro (bg-blue-100 text-blue-800)
- Ícono: Users
- Aparece solo si `shared_with.length > 0`

**Botón de compartir:**
- Visible solo para owners
- Aparece al hacer hover
- Ícono: Share2
- Efecto: opacity-0 → opacity-100

### En Invitaciones

**Estados con colores:**
- Pendiente: Amarillo (bg-amber-100 text-amber-800)
- Aceptada: Verde (bg-green-100 text-green-800)
- Rechazada: Rojo (bg-red-100 text-red-800)
- Cancelada: Gris (bg-gray-100 text-gray-800)

**Badges en tabs:**
- Muestra cantidad de invitaciones pendientes
- Se actualiza en tiempo real

---

## 🚀 Integración con Módulos Existentes

### Dashboard
- Muestra proyectos propios + compartidos
- Gráficas incluyen datos de todos los proyectos accesibles

### Audit Log
- Registra todas las acciones de compartir
- Tipo de entidad: `project_invitation`
- Acciones: `create`, `update`
- Incluye email invitado en metadata

### Notificaciones
- Nuevos tipos: `invitation`, `invitation_accepted`, `invitation_rejected`
- Click en notificación navega a módulo de invitaciones
- Badge en campanita incluye invitaciones

### Proyectos (Detail)
- Colaboradores pueden editar todo
- Solo owner ve opción de eliminar
- Colaboradores no ven botón de compartir

---

## 🔄 Próximas Mejoras Sugeridas

1. **Niveles de permiso**
   - Viewer (solo lectura)
   - Editor (editar)
   - Admin (todo excepto eliminar)

2. **Invitación con mensaje personalizado**
   - Campo opcional de mensaje al invitar

3. **Notificación por email**
   - Enviar email además de notificación interna

4. **Historial de colaboradores**
   - Ver quiénes han tenido acceso al proyecto

5. **Transferir ownership**
   - Owner puede transferir proyecto a colaborador

6. **Compartir con múltiples usuarios a la vez**
   - Input de múltiples emails separados por coma

---

## ✅ Checklist de Implementación Completada

- [x] Tabla `shared_project_requests` creada
- [x] Campos `created_by` y `shared_with` en `projects`
- [x] Políticas RLS para proyectos actualizadas
- [x] Políticas RLS para invitaciones creadas
- [x] Función `create_project_invitation()` implementada
- [x] Función `accept_project_invitation()` implementada
- [x] Función `reject_project_invitation()` implementada
- [x] Función `cancel_project_invitation()` implementada
- [x] Componente `ShareProjectModal` creado
- [x] Vista `Invitations` creada
- [x] Vista `Projects` actualizada con botón de compartir
- [x] Sidebar actualizado con link a Invitaciones
- [x] App.tsx actualizado con ruta de invitaciones
- [x] Integración con sistema de notificaciones
- [x] Integración con audit log
- [x] Validaciones en frontend
- [x] Validaciones en backend
- [x] Testing y build exitoso

---

## 📝 Resumen Final

El sistema de compartir proyectos está **completamente implementado** y listo para usar. Proporciona:

- ✅ Seguridad robusta con RLS
- ✅ Validaciones completas
- ✅ Notificaciones automáticas
- ✅ Audit log integrado
- ✅ UI/UX profesional estilo Apple
- ✅ Responsive completo
- ✅ Flujo de aprobación obligatorio
- ✅ Permisos granulares por rol

El sistema es escalable, seguro y fácil de usar, cumpliendo con todas las especificaciones solicitadas.
