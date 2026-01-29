# 🔐 Configuración de GitHub Secrets - Instrucciones Exactas

## 📍 URL para configurar Secrets

Ve a esta URL en tu navegador:

**https://github.com/ylccrm/epcapp/settings/secrets/actions**

---

## ➕ Agregar los 5 Secrets

Haz clic en el botón **"New repository secret"** para cada uno de los siguientes:

---

### Secret 1: FTP_SERVER

- **Name:** `FTP_SERVER`
- **Secret:** `ftp.ylevigroup.com`

Haz clic en **"Add secret"**

---

### Secret 2: FTP_USERNAME

- **Name:** `FTP_USERNAME`
- **Secret:** `epc_user@epc.ylevigroup.com`

Haz clic en **"Add secret"**

---

### Secret 3: FTP_PASSWORD

- **Name:** `FTP_PASSWORD`
- **Secret:** `Israel2025@`

Haz clic en **"Add secret"**

---

### Secret 4: VITE_SUPABASE_URL

- **Name:** `VITE_SUPABASE_URL`
- **Secret:** `https://cjolwqqkymdrsibacsom.supabase.co`

Haz clic en **"Add secret"**

---

### Secret 5: VITE_SUPABASE_ANON_KEY

- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Secret:** (Copia el valor completo de tu archivo .env local)

Para obtener el valor:

```powershell
Get-Content .env | Select-String "VITE_SUPABASE_ANON_KEY"
```

Copia todo el texto después de `VITE_SUPABASE_ANON_KEY=` y pégalo en el campo Secret.

Haz clic en **"Add secret"**

---

## ✅ Verificar que todos los Secrets estén configurados

Después de agregar los 5 secrets, deberías ver esta lista en la página:

- ✅ FTP_PASSWORD
- ✅ FTP_SERVER
- ✅ FTP_USERNAME
- ✅ VITE_SUPABASE_ANON_KEY
- ✅ VITE_SUPABASE_URL

---

## 🚀 Siguiente Paso: Hacer Push

Una vez configurados todos los secrets, ejecuta:

```bash
git add .
git commit -m "Configuración final de despliegue"
git push origin main
```

Esto activará automáticamente el despliegue a **epc.ylevigroup.com**

---

## 📊 Ver el Progreso del Despliegue

1. Ve a: **https://github.com/ylccrm/epcapp/actions**
2. Verás el workflow "Deploy to A2 Hosting" ejecutándose
3. Haz clic en él para ver los detalles en tiempo real
4. El despliegue toma aproximadamente 2-3 minutos

---

## 🌐 Verificar el Sitio

Una vez completado el despliegue:

- **URL:** https://epc.ylevigroup.com
- **Subdominio:** epc
- **Dominio:** ylevigroup.com

---

## 📝 Resumen de Configuración

| Configuración    | Valor                                      |
| ---------------- | ------------------------------------------ |
| **Servidor FTP** | ftp.ylevigroup.com                         |
| **Usuario FTP**  | epc_user@epc.ylevigroup.com                |
| **Puerto FTP**   | 21                                         |
| **Ruta Remota**  | /home/ylevigro/epc.ylevigroup.com/epc_user |
| **Subdominio**   | epc                                        |
| **Dominio**      | ylevigroup.com                             |
| **URL Final**    | https://epc.ylevigroup.com                 |

---

## 🔧 Configuración Local Completada

✅ Archivo `.deploy-config.json` creado con tus credenciales
✅ Script `deploy.ps1` actualizado
✅ GitHub Actions workflow actualizado
✅ Todo listo para desplegar

---

**Siguiente acción:** Configura los GitHub Secrets y luego haz `git push origin main`
