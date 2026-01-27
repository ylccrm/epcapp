# 🚀 Sistema de Despliegue Automático - EPC App

¡Tu aplicación ahora tiene **despliegue automático** como Bolt, Vercel o Netlify!

## 🎯 ¿Qué puedes hacer ahora?

Con un solo comando, puedes:

- ✅ Construir la aplicación para producción
- ✅ Subirla automáticamente a `epc.ylevigroup.com`
- ✅ Ver el resultado en segundos

## 🚀 Uso Rápido

### Primera vez (Configuración - 2 minutos)

1. **Copia el archivo de configuración:**

```powershell
Copy-Item .deploy-config.example.json .deploy-config.json
```

2. **Edita `.deploy-config.json`** con tus credenciales FTP de A2 Hosting:

```json
{
  "ftp_host": "ftp.ylevigroup.com",
  "ftp_user": "tu-usuario@ylevigroup.com",
  "ftp_pass": "tu-contraseña-real",
  "ftp_remote_path": "/public_html/epc"
}
```

### Desplegar (Cada vez que hagas cambios)

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Message "Descripción de cambios"
```

**Ejemplos:**

```powershell
# Despliegue simple
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Message "Corrección de bugs"

# Nuevo feature
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Message "Agregué módulo de reportes"

# Actualización de diseño
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Message "Nuevo diseño del dashboard"
```

## 📋 Tres Opciones de Despliegue

### 🔵 Opción 1: Script Manual (Más Simple)

**Ideal para:** Empezar rápido, control total

**Ventajas:**

- ✅ Configuración en 2 minutos
- ✅ No necesitas GitHub
- ✅ Funciona offline
- ✅ Control total del proceso

**Uso:**

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Message "Mi cambio"
```

---

### 🟢 Opción 2: GitHub Actions (Automático)

**Ideal para:** Trabajo en equipo, CI/CD profesional

**Ventajas:**

- ✅ Totalmente automático
- ✅ Se despliega al hacer `git push`
- ✅ Historial completo en GitHub
- ✅ Notificaciones de errores

**Configuración:**

1. **Sube tu código a GitHub:**

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/tu-usuario/epcapp.git
git push -u origin main
```

2. **Configura Secrets en GitHub:**
   - Ve a: `Settings → Secrets and variables → Actions`
   - Agrega:
     - `FTP_SERVER`: `ftp.ylevigroup.com`
     - `FTP_USERNAME`: `tu-usuario@ylevigroup.com`
     - `FTP_PASSWORD`: `tu-contraseña`
     - `VITE_SUPABASE_URL`: Tu URL de Supabase
     - `VITE_SUPABASE_ANON_KEY`: Tu clave de Supabase

3. **¡Listo! Ahora cada push despliega automáticamente:**

```bash
git add .
git commit -m "Nuevos cambios"
git push  # ← Esto despliega automáticamente
```

---

### 🟡 Opción 3: Alias Personalizado (Más Rápido)

**Ideal para:** Desarrolladores que despliegan frecuentemente

**Configuración:**

```powershell
# Agregar al perfil de PowerShell
notepad $PROFILE

# Pega esto:
function Deploy-EPC {
    param([string]$msg = "Actualización")
    Set-Location "C:\Users\Administrator\.gemini\antigravity\scratch\epcapp"
    powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Message $msg
}
Set-Alias deploy Deploy-EPC
```

**Uso:**

```powershell
deploy "Mi mensaje"
```

## 📊 Comparación de Opciones

| Característica    | Script Manual | GitHub Actions | Alias      |
| ----------------- | ------------- | -------------- | ---------- |
| Configuración     | 2 min         | 10 min         | 5 min      |
| Velocidad         | ⚡⚡⚡        | ⚡⚡           | ⚡⚡⚡⚡   |
| Automático        | ❌            | ✅             | ❌         |
| Requiere GitHub   | ❌            | ✅             | ❌         |
| Historial         | ✅ (local)    | ✅ (GitHub)    | ✅ (local) |
| Trabajo en equipo | ❌            | ✅             | ❌         |

## 🔄 Flujo de Trabajo Completo

### Desarrollo → Prueba → Despliegue

```powershell
# 1. Inicia el servidor de desarrollo
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1

# 2. Haz tus cambios en el código
# 3. Prueba en http://localhost:5173

# 4. Cuando estés listo, despliega:
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Message "Descripción"

# 5. Verifica en https://epc.ylevigroup.com
```

## 📁 Archivos Creados

```
epcapp/
├── deploy.ps1                      # Script de despliegue principal
├── .deploy-config.example.json     # Plantilla de configuración
├── .deploy-config.json             # Tu configuración (no se sube a Git)
├── .deploy-log.json                # Historial de despliegues
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions workflow
└── .agent/
    └── workflows/
        └── auto-deploy.md          # Documentación completa
```

## 🔐 Seguridad

- ✅ `.deploy-config.json` está en `.gitignore` (no se sube a GitHub)
- ✅ Las credenciales FTP están protegidas localmente
- ✅ GitHub Secrets están encriptados
- ✅ Solo tú tienes acceso a las credenciales

## 🆘 Obtener Credenciales FTP de A2 Hosting

1. **Accede a cPanel** (`https://my.hosting.com`)
2. Ve a **"Cuentas FTP"** o **"FTP Accounts"**
3. Busca tu cuenta o crea una nueva:
   - **Usuario:** Generalmente es `usuario@ylevigroup.com`
   - **Contraseña:** La que configuraste
   - **Servidor:** `ftp.ylevigroup.com` o la IP del servidor

## 📝 Ver Historial de Despliegues

```powershell
# Ver todos los despliegues
Get-Content .deploy-log.json

# Ver en formato tabla
Get-Content .deploy-log.json | ConvertFrom-Json | Format-Table
```

## 🔧 Solución de Problemas

### ❌ Error: "Credenciales incorrectas"

**Solución:** Verifica tu `.deploy-config.json`

### ❌ Error: "No se puede conectar al servidor"

**Solución:**

- Verifica que el servidor FTP esté activo en cPanel
- Comprueba el firewall de Windows
- Intenta con la IP del servidor en lugar del dominio

### ❌ Error: "WinSCP no encontrado"

**Solución:** El script usa FTP nativo de PowerShell automáticamente (no necesitas hacer nada)

### ❌ Los cambios no se ven en el sitio

**Solución:**

- Limpia la caché del navegador (Ctrl + Shift + R)
- Verifica que los archivos se hayan subido correctamente
- Espera 1-2 minutos para la propagación

## 💡 Consejos Pro

1. **Prueba siempre localmente primero**

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
   ```

2. **Usa mensajes descriptivos**

   ```powershell
   # ✅ Bueno
   deploy "Agregué validación de formularios en la página de usuarios"

   # ❌ Malo
   deploy "cambios"
   ```

3. **Haz backups antes de cambios grandes**
   - En cPanel → "Backup" → "Download a Full Account Backup"

4. **Considera usar GitHub Actions para producción**
   - Más profesional
   - Historial completo
   - Rollback fácil

## 🎓 Próximos Pasos

1. ✅ Configura tu `.deploy-config.json`
2. ✅ Haz un despliegue de prueba
3. ✅ Configura GitHub Actions (opcional)
4. ✅ Crea un alias para despliegues rápidos (opcional)

## 📚 Documentación Adicional

- **Despliegue manual:** `DEPLOYMENT.md`
- **Workflow completo:** `.agent/workflows/auto-deploy.md`
- **GitHub Actions:** `.github/workflows/deploy.yml`

---

**¿Listo para desplegar?** 🚀

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Message "Mi primer despliegue automático"
```
