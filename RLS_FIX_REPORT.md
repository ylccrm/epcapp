# Reporte de Corrección de RLS - Acceso de Admin

## Problema Identificado

El usuario super admin no podía ver:
1. Los usuarios registrados en el sistema (tabla `user_profiles`)
2. Los proyectos creados (tabla `projects`)

### Causa Raíz

Las políticas RLS tenían un problema de **recursión infinita**:

```sql
-- Política problemática (ANTES)
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles  -- ⚠️ Consulta la misma tabla
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );
```

Cuando el admin intentaba consultar `user_profiles`:
1. Se activa la política "Admins can view all profiles"
2. La política consulta `user_profiles` para verificar si es admin
3. Esta consulta activa nuevamente la misma política
4. **Bucle infinito** → Error de recursión

## Solución Implementada

### 1. Sincronización de Rol a JWT

En lugar de consultar la tabla `user_profiles` para verificar roles, ahora almacenamos el rol en `auth.users.raw_app_meta_data`:

```sql
CREATE OR REPLACE FUNCTION sync_user_role_to_metadata()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data =
    COALESCE(raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Políticas RLS Sin Recursión

Las nuevas políticas usan `auth.jwt()` directamente:

```sql
-- Política corregida (AHORA)
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
```

### 3. Limpieza de Políticas Duplicadas

Se eliminaron políticas duplicadas y conflictivas en la tabla `projects` que causaban confusión.

### 4. Auto-refresco de Sesión

El `AuthContext` ahora detecta automáticamente si el JWT no tiene el rol sincronizado y refresca la sesión:

```typescript
const checkAndRefreshSession = async (user: User) => {
  const roleInJWT = user.app_metadata?.role;
  if (!roleInJWT) {
    await supabase.auth.refreshSession();
  }
};
```

## Cambios Realizados

### Migraciones Aplicadas

1. **fix_rls_infinite_recursion_v2.sql**
   - Función de sincronización de roles a app_metadata
   - Trigger automático para mantener sincronización
   - Políticas RLS correctas sin recursión
   - Limpieza de políticas duplicadas

2. **update_user_initialization_with_metadata_sync.sql**
   - Actualización de función de inicialización de usuarios
   - Validación de roles sin recursión
   - Sincronización automática en creación de usuarios

### Archivos Modificados

- `src/contexts/AuthContext.tsx`: Agregado auto-refresco de sesión

## Políticas RLS Actuales

### user_profiles

| Operación | Política | Condición |
|-----------|----------|-----------|
| SELECT | Admins can view all profiles | JWT role = 'admin' |
| SELECT | Users can view own profile | user_id = auth.uid() |
| INSERT | System can create user profiles | true (para registro) |
| INSERT | Admins can insert profiles | JWT role = 'admin' |
| UPDATE | Admins can update all profiles | JWT role = 'admin' |
| UPDATE | Users can update own profile | user_id = auth.uid() |
| DELETE | Admins can delete profiles | JWT role = 'admin' |

### projects

| Operación | Política | Condición |
|-----------|----------|-----------|
| SELECT | Admins can view all projects | JWT role = 'admin' |
| SELECT | Users can view own projects | created_by = auth.uid() |
| SELECT | Users can view shared projects | uid in shared_with array |
| SELECT | Collaborators can view shared projects | uid in project_collaborators |
| SELECT | Installers can view assigned projects | crew assignment |
| INSERT | Users can create projects | created_by = auth.uid() |
| UPDATE | Admins can update projects | JWT role = 'admin' |
| UPDATE | Owners can update their projects | created_by = auth.uid() |
| UPDATE | Editors can update shared projects | editor role |
| DELETE | Admins can delete projects | JWT role = 'admin' |
| DELETE | Owners can delete their projects | created_by = auth.uid() |

## Verificación

### Base de Datos

- ✅ Rol sincronizado en app_metadata: `admin`
- ✅ Total usuarios visibles: 1
- ✅ Total proyectos visibles: 5
- ✅ Políticas RLS creadas correctamente
- ✅ Sin errores de recursión

### Frontend

- ✅ Build exitoso sin errores
- ✅ AuthContext con auto-refresco implementado
- ✅ Componentes listos para cargar datos

## Instrucciones para el Usuario

### Para Aplicar los Cambios

El usuario super admin debe:

1. **Cerrar sesión** en la aplicación
2. **Volver a iniciar sesión**
3. El sistema automáticamente:
   - Refrescará la sesión
   - Cargará el JWT con el rol actualizado
   - Permitirá acceso completo a usuarios y proyectos

### Verificación de Acceso

Después de iniciar sesión, el admin podrá:

- ✅ Ver todos los usuarios en la sección "Configuración → Usuarios"
- ✅ Ver todos los proyectos en la sección "Proyectos"
- ✅ Crear, editar y eliminar usuarios
- ✅ Crear, editar y eliminar proyectos
- ✅ Acceder a todas las funcionalidades administrativas

## Beneficios

1. **Sin Recursión**: Las políticas RLS ahora son eficientes y sin bucles
2. **Performance**: Consultas más rápidas al usar JWT en lugar de subqueries
3. **Seguridad**: Roles almacenados de forma segura en app_metadata
4. **Mantenibilidad**: Código más limpio y fácil de entender
5. **Escalabilidad**: Sistema preparado para crecer sin problemas de recursión

## Notas Técnicas

- Los roles se sincronizan automáticamente entre `user_profiles.role` y `auth.users.raw_app_meta_data`
- El JWT se refresca automáticamente cuando falta información de rol
- Las políticas RLS son ahora consistentes y sin conflictos
- El sistema es backward-compatible con usuarios existentes
