# Sistema de Inicialización Automática de Usuarios

## 🎯 Objetivo

Garantizar que **cada usuario nuevo que se registre** automáticamente tenga:
- Rol por defecto: **Usuario Normal** (rol `regular`)
- Todos los campos inicializados en **valores seguros** (0, vacío, false, null)
- Sin permisos administrativos
- Sin datos residuales
- Sin posibilidad de manipular su rol durante el registro

---

## ✅ Implementación Completa

### 1. **Rol por Defecto Automático**

Cada vez que un usuario completa el registro, el sistema **automáticamente** asigna:

```
role: "regular" (Usuario Normal)
```

**Restricciones de seguridad:**
- ❌ El usuario NO puede registrarse como Super Administrador
- ❌ El usuario NO puede registrarse como Instalador
- ❌ El usuario NO puede registrarse como Supervisor
- ❌ El usuario NO puede modificar su rol durante el registro
- ✅ El rol es asignado **desde el backend** mediante trigger automático

---

### 2. **Campos Inicializados Automáticamente**

Al crear un usuario nuevo, el sistema inicializa estos valores:

#### **Datos Básicos**
```sql
email: correo del usuario (del auth)
full_name: "Usuario Nuevo" (o del metadata)
role: "regular"
phone: null
assigned_crew_id: null
```

#### **Estado y Configuración**
```sql
is_active: true (cuenta activa)
is_verified: false (email no verificado)
profile_completed: false (perfil sin completar)
```

#### **Estadísticas (todas en 0)**
```sql
projects_owned_count: 0
projects_shared_count: 0
projects_created_count: 0
projects_completed_count: 0
notifications_unread_count: 0
total_logins: 0
```

#### **Timestamps**
```sql
created_at: fecha actual
updated_at: fecha actual
last_login: null
```

**Garantía:**
- ✅ No hereda valores de otros usuarios
- ✅ No hay datos residuales
- ✅ Todos los campos empiezan limpios
- ✅ Sin proyectos asignados
- ✅ Sin notificaciones
- ✅ Sin configuraciones previas

---

## 🔧 Arquitectura Técnica

### **Trigger Automático en Base de Datos**

El sistema utiliza un **trigger SQL** que se ejecuta automáticamente cuando se crea un usuario en `auth.users`:

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_new_user_profile();
```

**¿Qué hace este trigger?**
1. Detecta cuando se crea un nuevo usuario
2. Ejecuta la función `initialize_new_user_profile()`
3. Crea automáticamente el perfil en `user_profiles`
4. Inicializa todos los campos en valores seguros
5. Asigna rol `regular` por defecto
6. No requiere intervención manual

---

### **Función de Inicialización**

```sql
CREATE OR REPLACE FUNCTION initialize_new_user_profile()
```

**Responsabilidades:**
- Obtiene email del usuario nuevo
- Extrae nombre completo del metadata (si existe)
- Crea perfil con todos los campos inicializados
- Asigna rol `regular` **forzosamente**
- Previene duplicados con `ON CONFLICT DO NOTHING`
- Registra fecha de creación

**Datos extraídos automáticamente:**
- `email`: Del usuario de auth
- `full_name`: De `raw_user_meta_data` (si existe) o "Usuario Nuevo"

**Datos asignados por defecto:**
- Todos los demás campos según especificación

---

### **Función de Validación de Roles**

```sql
CREATE OR REPLACE FUNCTION validate_user_role()
```

**Protecciones implementadas:**

#### **En INSERT (creación de usuario):**
1. Si el rol no es válido → forzar a `regular`
2. Si alguien intenta asignarse `admin`, `installer`, o `supervisor` → forzar a `regular`
3. Solo permite roles privilegiados si un admin existente lo está creando

#### **En UPDATE (actualización de perfil):**
1. Si un usuario `regular` intenta cambiar su rol → mantener `regular`
2. Solo permite cambio de rol si un admin hace el cambio
3. Previene auto-elevación de privilegios

**Trigger de validación:**
```sql
CREATE TRIGGER validate_user_role_trigger
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_role();
```

---

## 🔒 Seguridad Implementada

### **1. Prevención en Base de Datos**

**CHECK Constraint:**
```sql
role CHECK (role IN ('admin', 'regular', 'installer', 'supervisor'))
```
- Solo permite valores válidos
- Rechaza cualquier otro valor

**Default Constraint:**
```sql
role DEFAULT 'regular'
```
- Si no se especifica rol, usa `regular`
- No puede ser null

**Trigger de validación:**
- Verifica rol antes de insertar/actualizar
- Previene auto-asignación de roles privilegiados
- Requiere admin existente para crear usuarios privilegiados

### **2. Prevención en Backend**

**Trigger automático:**
- Ejecuta función de inicialización al crear usuario
- No depende de código frontend
- No puede ser evitado o manipulado

**Función SECURITY DEFINER:**
- Ejecuta con privilegios elevados
- Garantiza creación del perfil
- No requiere permisos especiales del usuario

### **3. Prevención en Frontend**

**AuthPage:**
- Solo solicita email y password
- NO muestra selector de rol
- NO permite pasar rol en el registro

**SignUp:**
```typescript
const signUp = async (email: string, password: string) => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
};
```
- No acepta parámetro de rol
- No manipula metadata para rol
- Deja que el trigger maneje todo

---

## 📊 Políticas RLS (Row Level Security)

### **Política de inserción automática:**
```sql
CREATE POLICY "System can create user profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (true);
```
- Permite al trigger crear perfiles automáticamente
- No requiere permisos especiales del usuario
- Esencial para funcionamiento del trigger

### **Políticas de visualización:**
```sql
-- Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));
```

### **Políticas de actualización:**
```sql
-- Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```
- Pero el trigger `validate_user_role` previene cambio de rol

---

## 🎭 Roles del Sistema

### **1. Usuario Normal (`regular`)** ⭐ ROL POR DEFECTO

**Características:**
- Rol asignado automáticamente a todo usuario nuevo
- No requiere aprobación de admin
- Activado inmediatamente al registrarse

**Permisos:**
- ✅ Crear proyectos propios
- ✅ Editar sus propios proyectos
- ✅ Eliminar sus propios proyectos
- ✅ Compartir sus propios proyectos
- ✅ Ver proyectos compartidos con él
- ✅ Editar proyectos compartidos
- ✅ Recibir y responder invitaciones
- ✅ Ver notificaciones
- ✅ Acceder a inventario
- ✅ Gestionar proveedores
- ❌ NO puede ver usuarios del sistema
- ❌ NO puede administrar roles
- ❌ NO puede cambiar contraseñas de otros
- ❌ NO puede ver proyectos de otros usuarios (sin invitación)
- ❌ NO puede eliminar proyectos compartidos
- ❌ NO puede compartir proyectos de otros

**Vista inicial al registrarse:**
```
Dashboard vacío:
- 0 proyectos
- 0 notificaciones
- 0 documentos
- 0 avances
- Acceso a "Crear Proyecto"
```

### **2. Super Administrador (`admin`)**

**Asignación:**
- Solo otro admin puede crear admins
- No puede auto-asignarse durante registro

**Permisos:**
- ✅ Acceso total al sistema
- ✅ Ver todos los proyectos
- ✅ Ver todos los usuarios
- ✅ Crear/editar/eliminar usuarios
- ✅ Asignar roles
- ✅ Cambiar contraseñas
- ✅ Reasignar proyectos
- ✅ Ver audit log completo
- ✅ Gestionar invitaciones de todos

### **3. Instalador (`installer`)**

**Asignación:**
- Solo admin puede crear instaladores
- Se asigna a cuadrillas específicas

**Permisos:**
- ✅ Ver módulo de "Avance"
- ✅ Ver proyectos de su cuadrilla
- ✅ Subir fotos y evidencia
- ✅ Actualizar progreso de hitos
- ❌ NO puede ver lista completa de proyectos
- ❌ NO puede recibir invitaciones
- ❌ NO puede compartir proyectos

### **4. Supervisor (`supervisor`)**

**Asignación:**
- Solo admin puede crear supervisores
- Similar a instalador con permisos extra

**Permisos:**
- Similar a instalador
- Vista limitada enfocada en avance

---

## 📋 Flujo de Registro Completo

### **Paso a Paso:**

**1. Usuario visita página de registro**
```
URL: /auth
Vista: AuthPage
Campos: Email, Password
```

**2. Usuario completa formulario**
```typescript
email: "nuevo@ejemplo.com"
password: "miPassword123"
```

**3. Usuario hace clic en "Crear Cuenta"**
```typescript
await signUp(email, password);
```

**4. Frontend llama a Supabase Auth**
```typescript
supabase.auth.signUp({ email, password })
```

**5. Supabase crea usuario en `auth.users`**
```sql
INSERT INTO auth.users (email, encrypted_password, ...)
VALUES ('nuevo@ejemplo.com', hash_password, ...)
```

**6. 🎯 Trigger automático se ejecuta**
```sql
TRIGGER: on_auth_user_created
EJECUTA: initialize_new_user_profile()
```

**7. Función de inicialización crea perfil**
```sql
INSERT INTO user_profiles (
  id, email, full_name, role,
  is_active, is_verified, profile_completed,
  projects_owned_count, projects_shared_count,
  projects_created_count, projects_completed_count,
  notifications_unread_count, total_logins,
  last_login, created_at, updated_at
) VALUES (
  user_id, 'nuevo@ejemplo.com', 'Usuario Nuevo', 'regular',
  true, false, false,
  0, 0, 0, 0, 0, 0,
  null, now(), now()
)
```

**8. Usuario recibe confirmación**
```javascript
alert('Cuenta creada exitosamente. Por favor inicia sesión.');
```

**9. Usuario inicia sesión**
```typescript
await signIn(email, password);
```

**10. Sistema carga perfil del usuario**
```typescript
loadUserProfile(userId);
// Obtiene perfil con role: 'regular'
```

**11. Usuario ve dashboard vacío**
```
Dashboard:
- "Bienvenido, Usuario Nuevo"
- 0 proyectos
- 0 notificaciones
- Botón: "Crear Proyecto"
```

---

## 🧪 Validaciones Automáticas

### **1. Usuario sin rol asignado**
```sql
IF NEW.role IS NULL OR NEW.role NOT IN (allowed_roles) THEN
  NEW.role := 'regular';
END IF;
```
**Resultado:** Asigna `regular` automáticamente

### **2. Usuario con rol incorrecto**
```sql
IF NEW.role NOT IN ('admin', 'regular', 'installer', 'supervisor') THEN
  NEW.role := 'regular';
END IF;
```
**Resultado:** Sobreescribe a `regular`

### **3. Usuario intenta manipular rol desde frontend**
```sql
IF NEW.role IN ('admin', 'installer', 'supervisor') THEN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin') THEN
    NEW.role := 'regular';
  END IF;
END IF;
```
**Resultado:** Ignora y mantiene `regular` (a menos que un admin lo esté creando)

### **4. Usuario regular intenta auto-elevarse**
```sql
IF OLD.role = 'regular' AND NEW.role != 'regular' THEN
  IF NOT admin_making_change THEN
    NEW.role := OLD.role; -- mantiene 'regular'
  END IF;
END IF;
```
**Resultado:** Previene cambio de rol sin admin

---

## 📈 Contadores y Estadísticas

Los contadores se actualizan automáticamente mediante triggers o aplicación:

### **projects_owned_count**
- Se incrementa cuando el usuario crea un proyecto
- Se decrementa si elimina un proyecto

### **projects_shared_count**
- Se incrementa cuando acepta una invitación
- Se decrementa si se remueve del proyecto

### **projects_created_count**
- Contador total (nunca decrementa)
- Registra histórico de proyectos creados

### **projects_completed_count**
- Se incrementa cuando un proyecto llega a status 'finished'

### **notifications_unread_count**
- Se incrementa con cada notificación nueva
- Se decrementa cuando marca como leída

### **total_logins**
- Se incrementa cada vez que inicia sesión
- Útil para analytics

### **last_login**
- Se actualiza en cada inicio de sesión
- Registra timestamp del último login

---

## 🎨 Interfaz de Usuario

### **Para Usuario Normal**

**Sidebar - Perfil:**
```
Email: nuevo@ejemplo.com
Rol: "Usuario Normal"
Estado: Activo ✓
```

**Dashboard inicial:**
```
Panel de Control
================

Proyectos: 0
Notificaciones: 0
Documentos: 0

[Botón: Crear Proyecto]
```

**Menú disponible:**
- Dashboard
- Proyectos
- Invitaciones ← NUEVO
- Almacén Central
- Proveedores
- Configuración

**Menú NO disponible:**
- ❌ Administración de Usuarios
- ❌ Registro de Auditoría (no visible)
- ❌ Gestión de Roles

---

## 🔍 Verificación del Sistema

### **Cómo verificar que funciona:**

**1. Crear usuario nuevo:**
```sql
-- Registrar usuario desde frontend
-- O manualmente en SQL:
SELECT * FROM auth.users WHERE email = 'test@ejemplo.com';
```

**2. Verificar perfil creado:**
```sql
SELECT * FROM user_profiles WHERE email = 'test@ejemplo.com';
```

**Debe retornar:**
```sql
id: uuid
email: test@ejemplo.com
full_name: Usuario Nuevo
role: regular ✓
is_active: true ✓
is_verified: false ✓
profile_completed: false ✓
projects_owned_count: 0 ✓
projects_shared_count: 0 ✓
projects_created_count: 0 ✓
projects_completed_count: 0 ✓
notifications_unread_count: 0 ✓
total_logins: 0 ✓
last_login: null ✓
created_at: 2024-12-06 ... ✓
updated_at: 2024-12-06 ... ✓
```

**3. Verificar que no puede cambiar rol:**
```sql
-- Intentar actualizar rol (como usuario regular)
UPDATE user_profiles
SET role = 'admin'
WHERE id = auth.uid();

-- Resultado: rol permanece 'regular' (trigger lo previene)
```

**4. Verificar que admin puede cambiar roles:**
```sql
-- Como admin, actualizar rol de otro usuario
UPDATE user_profiles
SET role = 'installer'
WHERE id = 'otro-usuario-id';

-- Resultado: rol cambia exitosamente (admin tiene permiso)
```

---

## 🎯 Casos de Uso

### **Caso 1: Registro normal**
```
Usuario → Registro → Email + Password → Submit
↓
Sistema crea usuario en auth.users
↓
Trigger ejecuta initialize_new_user_profile()
↓
Perfil creado con role: 'regular'
↓
Usuario ve dashboard vacío
```

### **Caso 2: Intento de manipulación**
```
Hacker → Intenta enviar role: 'admin' en signup
↓
Frontend ignora (no acepta parámetro role)
↓
Backend recibe solo email/password
↓
Trigger asigna role: 'regular'
↓
Trigger validate_user_role verifica
↓
Si no es admin quien crea, fuerza a 'regular'
↓
Perfil creado con role: 'regular' (seguro)
```

### **Caso 3: Admin crea instalador**
```
Admin → Vista Usuarios → Crear Usuario
↓
Admin especifica role: 'installer'
↓
Sistema verifica: auth.uid() es admin? ✓
↓
Trigger valida: admin creando? ✓
↓
Permite role: 'installer'
↓
Instalador creado exitosamente
```

---

## 📚 Resumen Ejecutivo

### **✅ Implementado:**

1. **Rol automático:** Todos los usuarios nuevos = `regular`
2. **Campos inicializados:** Todos en 0, vacío, false, o null
3. **Trigger automático:** Ejecuta al crear usuario en auth
4. **Validaciones:** Previene manipulación de roles
5. **Seguridad:** RLS + Triggers + Frontend
6. **Frontend limpio:** No permite selección de rol
7. **Backend seguro:** SECURITY DEFINER + CHECK constraints
8. **Documentación:** Completa y detallada

### **🔒 Garantías de Seguridad:**

- ✅ No es posible auto-asignarse admin
- ✅ No es posible auto-asignarse installer
- ✅ No es posible auto-asignarse supervisor
- ✅ Solo admin puede crear usuarios privilegiados
- ✅ Usuarios regulares no pueden cambiar su rol
- ✅ Todos los usuarios empiezan en 0 (sin datos previos)
- ✅ Sistema consistente y profesional

### **🎯 Resultado Final:**

Un sistema robusto que garantiza:
- **Seguridad**: Roles controlados desde backend
- **Consistencia**: Datos limpios siempre
- **Profesionalismo**: Flujo claro y automático
- **Escalabilidad**: Fácil agregar más validaciones
- **Mantenibilidad**: Todo documentado y centralizado

---

## 🚀 Listo para Producción

El sistema está completamente implementado y probado. Cada usuario nuevo que se registre automáticamente:
- Tendrá rol `regular` (Usuario Normal)
- Empezará con 0 proyectos, 0 notificaciones, 0 datos
- No podrá manipular su rol
- Verá solo su dashboard limpio
- Tendrá permisos apropiados de Usuario Normal

**Todo funciona automáticamente sin intervención manual.**
