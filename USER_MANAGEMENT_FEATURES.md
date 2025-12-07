# Sistema de Gestión de Usuarios - Funcionalidades Completas

## Nuevas Funcionalidades Implementadas

### 1. Edición de Usuarios

Los administradores ahora pueden editar completamente cualquier usuario del sistema desde la interfaz de Configuración > Gestión de Usuarios.

#### Campos Editables

**Información Personal**:
- Nombre completo
- Email
- Teléfono

**Configuración de Cuenta**:
- Rol (Regular, Instalador, Supervisor, Administrador)
- Asignación a cuadrilla
- Estado activo/inactivo

**Seguridad**:
- Cambio de contraseña
- Generación automática de contraseña segura

---

## Interfaz de Usuario

### Vista de Lista de Usuarios

Cada usuario en la lista muestra:
- ✅ Nombre completo
- ✅ Email
- ✅ Teléfono (si está disponible)
- ✅ Badge de rol con código de color:
  - 🔴 Administrador (rojo)
  - 🔵 Instalador (azul)
  - 🟢 Supervisor (verde)
  - ⚪ Regular (gris)
- ✅ Badge de estado "Inactivo" si aplica

### Acciones Disponibles

Cada usuario tiene dos botones de acción:

1. **Botón Editar** (icono de lápiz, azul)
   - Abre modal de edición completa
   - Permite modificar todos los campos del usuario

2. **Botón Activar/Desactivar** (icono de ojo)
   - Toggle rápido del estado activo
   - Sin necesidad de abrir modal

---

## Modal de Edición de Usuario

### Secciones del Formulario

#### 1. Información Personal
```
- Nombre Completo * (requerido)
- Email * (requerido)
- Teléfono (opcional)
```

#### 2. Configuración de Rol y Acceso
```
- Rol * (requerido)
  • Regular: Usuario básico con acceso limitado
  • Instalador: Acceso a proyectos asignados
  • Supervisor: Supervisión de cuadrillas
  • Administrador: Acceso completo al sistema

- Asignar a Cuadrilla (opcional)
  • Lista desplegable con todas las cuadrillas disponibles
  • Opción "Sin asignar"
```

#### 3. Estado de Cuenta
```
☑️ Usuario Activo
  - Checkbox para activar/desactivar la cuenta
  - Usuarios inactivos no pueden iniciar sesión
```

#### 4. Cambio de Contraseña
```
☑️ Cambiar Contraseña
  - Cuando está marcado, muestra campo de contraseña
  - Campo de texto para nueva contraseña (mínimo 6 caracteres)
  - Botón "Generar" para contraseña automática

🔄 Generador de Contraseña:
  - Genera contraseña segura de 12 caracteres
  - Incluye mayúsculas, minúsculas, números y símbolos
  - Muestra advertencia destacada con la contraseña generada
  - Recordatorio para copiar y compartir de forma segura
```

---

## Generación Automática de Contraseñas

### Características

**Longitud**: 12 caracteres

**Conjunto de caracteres**:
- Letras minúsculas (a-z)
- Letras mayúsculas (A-Z)
- Números (0-9)
- Símbolos especiales (!@#$%^&*)

**Ejemplo de contraseña generada**: `aB3#xY9@mK1$`

### Flujo de Uso

1. Marcar checkbox "Cambiar Contraseña"
2. Hacer clic en botón "Generar"
3. Sistema genera contraseña segura automáticamente
4. Contraseña se muestra en campo de texto y en banner amarillo de advertencia
5. Admin debe copiar la contraseña antes de guardar
6. Al guardar, la contraseña se muestra en el mensaje de confirmación

**Mensaje de éxito con contraseña**:
```
Usuario actualizado. Nueva contraseña: aB3#xY9@mK1$
```

---

## Seguridad

### Edge Function para Cambio de Contraseñas

Se implementó una Edge Function dedicada (`update-user-password`) para manejar cambios de contraseña de forma segura.

**Características de Seguridad**:

1. ✅ **Autenticación requerida**: Solo usuarios autenticados
2. ✅ **Autorización**: Solo administradores pueden cambiar contraseñas
3. ✅ **Validación**: Contraseña mínimo 6 caracteres
4. ✅ **Service Role**: Usa credenciales de servicio de Supabase
5. ✅ **CORS configurado**: Acepta peticiones del frontend
6. ✅ **Audit trail**: Registra todos los cambios en audit_log

**Endpoint**:
```
POST /functions/v1/update-user-password
```

**Headers requeridos**:
```json
{
  "Authorization": "Bearer {access_token}",
  "Content-Type": "application/json"
}
```

**Body**:
```json
{
  "userId": "uuid-del-usuario",
  "newPassword": "nueva-contraseña"
}
```

**Respuestas**:

Éxito (200):
```json
{
  "success": true,
  "data": { ... }
}
```

Error (400/401/403):
```json
{
  "error": "Mensaje de error descriptivo"
}
```

---

## Flujo Completo de Edición

### Paso a Paso

1. **Admin navega a Configuración**
   - Click en menú lateral "Configuración"
   - Selecciona tab "Gestión de Usuarios"

2. **Selecciona usuario a editar**
   - Click en botón "Editar" (icono de lápiz azul)
   - Modal se abre con datos actuales del usuario

3. **Realiza cambios deseados**
   - Modifica cualquier campo necesario
   - Opcionalmente marca "Cambiar Contraseña"
   - Genera contraseña automática o ingresa una manual

4. **Guarda los cambios**
   - Click en "Guardar Cambios"
   - Sistema valida datos
   - Actualiza perfil en `user_profiles`
   - Si hay cambio de contraseña, llama a Edge Function
   - Registra acción en audit_log

5. **Confirmación**
   - Mensaje de éxito con contraseña (si aplica)
   - Modal se cierra
   - Lista de usuarios se actualiza automáticamente

---

## Validaciones

### Campos Requeridos
- ❌ No se puede guardar sin nombre completo
- ❌ No se puede guardar sin email válido
- ❌ No se puede guardar sin rol seleccionado

### Validación de Contraseña
- ❌ Mínimo 6 caracteres si se marca cambio de contraseña
- ❌ No se puede guardar con checkbox marcado pero campo vacío

### Validación de Permisos
- ❌ Solo administradores pueden acceder a gestión de usuarios
- ❌ Solo administradores pueden editar otros usuarios
- ❌ Solo administradores pueden cambiar contraseñas

---

## Registro de Auditoría

Todas las acciones de edición de usuarios se registran en `audit_log`:

```sql
INSERT INTO audit_log (
  user_id,          -- ID del admin que hizo el cambio
  user_email,       -- Email del admin
  action_type,      -- 'update'
  entity_type,      -- 'user'
  entity_id,        -- ID del usuario editado
  description       -- 'Actualizó usuario: [nombre]'
)
```

Esto permite:
- ✅ Rastrear quién modificó cada usuario
- ✅ Ver historial completo de cambios
- ✅ Auditorías de seguridad
- ✅ Cumplimiento regulatorio

---

## Roles y sus Permisos

### Regular
- Acceso básico a la aplicación
- Ve solo sus propios datos
- Puede crear proyectos e inventario propio

### Instalador
- Todo lo de Regular, más:
- Acceso a proyectos de la cuadrilla asignada
- Puede subir evidencias y actualizar progreso

### Supervisor
- Todo lo de Instalador, más:
- Gestión de cuadrillas
- Supervisión de múltiples proyectos

### Administrador
- Acceso completo al sistema
- Gestión de usuarios
- Ve todos los proyectos e inventario
- Acceso a auditoría y configuración

---

## Casos de Uso Comunes

### Caso 1: Cambiar Rol de Usuario

**Escenario**: Un instalador ha sido promovido a supervisor

1. Abrir edición del usuario
2. Cambiar rol de "Instalador" a "Supervisor"
3. Guardar cambios
4. El usuario verá nuevas opciones en su próximo login

### Caso 2: Resetear Contraseña de Usuario

**Escenario**: Usuario olvidó su contraseña

1. Abrir edición del usuario
2. Marcar "Cambiar Contraseña"
3. Click en "Generar"
4. Copiar contraseña generada
5. Guardar cambios
6. Compartir nueva contraseña con el usuario de forma segura

### Caso 3: Desactivar Usuario Temporal

**Escenario**: Usuario está de vacaciones o licencia

1. Click en botón de activar/desactivar (ojo)
2. Usuario queda inactivo inmediatamente
3. No puede iniciar sesión hasta reactivación

### Caso 4: Asignar Usuario a Cuadrilla

**Escenario**: Nuevo instalador se une a una cuadrilla

1. Abrir edición del usuario
2. Seleccionar cuadrilla en desplegable
3. Guardar cambios
4. Usuario ahora tiene acceso a proyectos de esa cuadrilla

---

## Mejores Prácticas

### Para Administradores

1. **Contraseñas**:
   - Siempre usar el generador automático
   - Compartir contraseñas por canal seguro (no email)
   - Pedir al usuario cambiar contraseña en primer login

2. **Roles**:
   - Asignar el rol mínimo necesario (principio de menor privilegio)
   - Revisar periódicamente roles de usuarios
   - No crear múltiples administradores innecesariamente

3. **Cuadrillas**:
   - Asignar instaladores a cuadrillas específicas
   - Mantener cuadrillas organizadas por proyecto
   - Reasignar cuando cambien proyectos

4. **Estados**:
   - Desactivar usuarios que ya no trabajan en la empresa
   - Desactivar temporalmente usuarios de licencia
   - Nunca eliminar usuarios (mantener historial)

### Para Seguridad

1. ✅ Cambiar contraseña generada en primer uso
2. ✅ Usar contraseñas de al menos 12 caracteres
3. ✅ No compartir contraseñas por chat o email
4. ✅ Revisar audit logs periódicamente
5. ✅ Mantener lista de administradores actualizada

---

## Limitaciones Conocidas

1. **Cambio de Email**:
   - Puede requerir verificación adicional
   - El usuario debe confirmar nuevo email

2. **Eliminación de Usuarios**:
   - No implementada (por diseño)
   - Usar desactivación en su lugar
   - Mantiene integridad de datos históricos

3. **Auto-registro**:
   - Usuarios no pueden auto-registrarse
   - Solo admins pueden crear nuevos usuarios

---

## Troubleshooting

### "No se pudo actualizar la contraseña"

**Causa**: Problema con Edge Function o permisos

**Solución**:
1. Verificar que el usuario actual es admin
2. Verificar conectividad
3. Revisar logs de Edge Function
4. Intentar de nuevo

### "Usuario no aparece en lista"

**Causa**: Perfil no creado correctamente

**Solución**:
1. Usuario debe cerrar sesión y volver a entrar
2. Trigger creará perfil automáticamente
3. Si persiste, revisar tabla user_profiles

### "No puedo cambiar rol a admin"

**Causa**: Solo admins pueden crear otros admins

**Solución**:
1. Verificar que estás logueado como admin
2. Tu rol debe ser "admin" en user_profiles
3. Si eres el único admin, contactar soporte técnico

---

## Resumen de Funcionalidades

✅ Edición completa de usuarios
✅ Generación automática de contraseñas seguras
✅ Cambio manual de contraseñas
✅ Edición de roles y permisos
✅ Asignación a cuadrillas
✅ Activación/desactivación rápida
✅ Registro de auditoría completo
✅ Validaciones de seguridad
✅ Edge Function segura para contraseñas
✅ Interfaz intuitiva y fácil de usar

---

## Próximas Mejoras Sugeridas

1. **Envío automático de email con contraseña**
   - Integración con servicio de email
   - Template profesional
   - Link de cambio de contraseña

2. **Historial de cambios por usuario**
   - Ver todos los cambios históricos
   - Quién hizo cada cambio
   - Restaurar valores anteriores

3. **Importación masiva de usuarios**
   - CSV upload
   - Validación de datos
   - Creación en lote

4. **Expiración de contraseñas**
   - Políticas de expiración
   - Forzar cambio periódico
   - Notificaciones de expiración

5. **2FA / MFA**
   - Autenticación de dos factores
   - Códigos TOTP
   - Backup codes
