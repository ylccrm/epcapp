# 🚀 Configuración de Despliegue Automático - EPC App

## 🎯 Objetivo

Configurar un sistema de despliegue automático similar a Bolt.new donde:

- Los cambios que hagas en Antigravity se reflejen automáticamente en `crmylc.ylevigroup.com`
- El código se sincronice con GitHub
- Cada push a GitHub despliega automáticamente a A2 Hosting

---

## 📋 Paso 1: Configurar GitHub Secrets

Para que GitHub Actions pueda desplegar automáticamente, necesitas configurar las credenciales de forma segura.

### 1.1 Acceder a GitHub Secrets

1. Ve a tu repositorio: https://github.com/ylccrm/epcapp
2. Haz clic en **Settings** (Configuración)
3. En el menú lateral, ve a **Secrets and variables** → **Actions**
4. Haz clic en **New repository secret**

### 1.2 Agregar los siguientes Secrets:

#### Secret 1: FTP_SERVER

- **Name:** `FTP_SERVER`
- **Value:** `ftp.ylevigroup.com` (o la IP de tu servidor A2hosting)

#### Secret 2: FTP_USERNAME

- **Name:** `FTP_USERNAME`
- **Value:** Tu usuario FTP de A2hosting (ejemplo: `usuario@ylevigroup.com`)

#### Secret 3: FTP_PASSWORD

- **Name:** `FTP_PASSWORD`
- **Value:** Tu contraseña FTP de A2hosting

#### Secret 4: VITE_SUPABASE_URL

- **Name:** `VITE_SUPABASE_URL`
- **Value:** `https://cjolwqqkymdrsibacsom.supabase.co`

#### Secret 5: VITE_SUPABASE_ANON_KEY

- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Value:** Tu clave anónima de Supabase (la que está en tu .env local)

---

## 📋 Paso 2: Configurar el Subdominio en A2 Hosting

### 2.1 Crear el Subdominio

1. **Accede a cPanel** de A2 Hosting
2. Busca **"Subdominios"** o **"Subdomains"**
3. Crea el subdominio:
   - **Subdominio:** `crmylc`
   - **Dominio:** `ylevigroup.com`
   - **Raíz del documento:** `/home/[tu-usuario]/public_html/crmylc`
4. Haz clic en **"Crear"**

### 2.2 Configurar SSL (Opcional pero Recomendado)

1. En cPanel, ve a **"SSL/TLS Status"**
2. Busca `crmylc.ylevigroup.com`
3. Haz clic en **"Run AutoSSL"**

---

## 📋 Paso 3: Actualizar la Configuración de Despliegue

Necesitamos actualizar el archivo de GitHub Actions para usar el nuevo dominio.

---

## 📋 Paso 4: Configurar Git Local

Para que los cambios en Antigravity se sincronicen con GitHub:

### 4.1 Verificar Configuración de Git

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@ejemplo.com"
```

### 4.2 Verificar Conexión con GitHub

```bash
git remote -v
```

Deberías ver:

```
origin  https://github.com/ylccrm/epcapp.git (fetch)
origin  https://github.com/ylccrm/epcapp.git (push)
```

---

## 📋 Paso 5: Flujo de Trabajo Completo

### Opción A: Despliegue Automático (Recomendado)

Cada vez que hagas cambios:

```bash
# 1. Hacer cambios en el código
# 2. Guardar archivos

# 3. Hacer commit y push
git add .
git commit -m "Descripción de los cambios"
git push origin main

# ✨ GitHub Actions desplegará automáticamente a crmylc.ylevigroup.com
```

### Opción B: Despliegue Manual desde Antigravity

Si prefieres desplegar manualmente:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Message "Descripción de cambios"
```

---

## 📋 Paso 6: Verificar el Despliegue

### 6.1 Ver el Progreso en GitHub

1. Ve a tu repositorio: https://github.com/ylccrm/epcapp
2. Haz clic en la pestaña **Actions**
3. Verás el workflow "Deploy to A2 Hosting" ejecutándose
4. Haz clic en él para ver los detalles

### 6.2 Verificar el Sitio Web

1. Abre tu navegador
2. Ve a: `https://crmylc.ylevigroup.com` (o `http://` si no configuraste SSL)
3. Verifica que la aplicación cargue correctamente

---

## 🔧 Solución de Problemas

### ❌ Error: "Authentication failed"

**Causa:** Credenciales FTP incorrectas

**Solución:**

1. Verifica que los secrets en GitHub sean correctos
2. Prueba las credenciales FTP manualmente con FileZilla o WinSCP

### ❌ Error: "Directory not found"

**Causa:** La ruta del servidor es incorrecta

**Solución:**

1. Verifica que el subdominio esté creado en cPanel
2. Asegúrate de que la ruta sea `/public_html/crmylc/`

### ❌ Los cambios no se ven en el sitio

**Solución:**

1. Limpia la caché del navegador (Ctrl + Shift + R)
2. Verifica que el workflow de GitHub Actions se haya completado exitosamente
3. Espera 1-2 minutos para la propagación

---

## 📊 Comparación de Flujos de Trabajo

| Método         | Velocidad | Automático | Requiere Configuración |
| -------------- | --------- | ---------- | ---------------------- |
| GitHub Actions | ⚡⚡      | ✅ Sí      | ✅ Una vez             |
| Script Manual  | ⚡⚡⚡    | ❌ No      | ✅ Una vez             |
| cPanel Manual  | ⚡        | ❌ No      | ❌ No                  |

---

## 🎓 Próximos Pasos

1. ✅ Configurar GitHub Secrets (Paso 1)
2. ✅ Crear subdominio en A2 Hosting (Paso 2)
3. ✅ Actualizar configuración de despliegue (Paso 3)
4. ✅ Hacer un push de prueba
5. ✅ Verificar que el sitio funcione

---

## 📞 Información de Soporte

- **Repositorio GitHub:** https://github.com/ylccrm/epcapp
- **Dominio:** crmylc.ylevigroup.com
- **Servidor:** A2 Hosting
- **Framework:** Vite + React + TypeScript

---

**¿Listo para comenzar?** 🚀

Sigue los pasos en orden y tendrás tu sistema de despliegue automático funcionando en minutos.
