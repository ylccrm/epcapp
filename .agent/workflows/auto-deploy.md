---
description: Cómo usar el sistema de despliegue automático
---

# 🚀 Sistema de Despliegue Automático

## Opción 1: Despliegue Manual Rápido (Recomendado para empezar)

### Configuración Inicial (Solo una vez)

1. Copia el archivo de configuración de ejemplo:

```powershell
Copy-Item .deploy-config.example.json .deploy-config.json
```

2. Edita `.deploy-config.json` con tus credenciales FTP de A2 Hosting:

```json
{
  "ftp_host": "ftp.ylevigroup.com",
  "ftp_user": "tu-usuario@ylevigroup.com",
  "ftp_pass": "tu-contraseña-real",
  "ftp_remote_path": "/public_html/epc"
}
```

**IMPORTANTE:** Este archivo NO se subirá a GitHub (está en .gitignore)

### Desplegar

Cada vez que quieras publicar cambios:

// turbo

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Message "Descripción de los cambios"
```

Ejemplo:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Message "Agregué nueva funcionalidad de reportes"
```

El script automáticamente:

1. ✅ Construye la aplicación
2. ✅ Sube los archivos al servidor
3. ✅ Registra el despliegue en un log

---

## Opción 2: Despliegue Automático con GitHub Actions

### Configuración Inicial

1. **Sube tu código a GitHub:**

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/tu-usuario/epcapp.git
git push -u origin main
```

2. **Configura los Secrets en GitHub:**
   - Ve a tu repositorio en GitHub
   - Settings → Secrets and variables → Actions
   - Agrega estos secrets:
     - `FTP_SERVER`: `ftp.ylevigroup.com`
     - `FTP_USERNAME`: `tu-usuario@ylevigroup.com`
     - `FTP_PASSWORD`: `tu-contraseña`
     - `VITE_SUPABASE_URL`: Tu URL de Supabase
     - `VITE_SUPABASE_ANON_KEY`: Tu clave anónima de Supabase

### Uso

Cada vez que hagas push a la rama `main`, se desplegará automáticamente:

```bash
git add .
git commit -m "Nuevos cambios"
git push
```

GitHub Actions automáticamente:

1. ✅ Construye la aplicación
2. ✅ Ejecuta tests (si los tienes)
3. ✅ Despliega a producción
4. ✅ Te notifica si algo falla

---

## Opción 3: Despliegue con un Solo Comando (Alias)

Crea un alias para desplegar más rápido:

```powershell
# Agregar al perfil de PowerShell
function Deploy-EPC {
    param([string]$msg = "Actualización")
    Set-Location "C:\Users\Administrator\.gemini\antigravity\scratch\epcapp"
    powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Message $msg
}

Set-Alias deploy Deploy-EPC
```

Luego solo necesitas:

```powershell
deploy "Mi mensaje"
```

---

## 📊 Ver Historial de Despliegues

El archivo `.deploy-log.json` guarda un registro de todos los despliegues:

```powershell
Get-Content .deploy-log.json | ConvertFrom-Json | Format-Table
```

---

## 🔧 Solución de Problemas

### Error: WinSCP no encontrado

**Solución:** El script usa FTP nativo de PowerShell automáticamente

### Error: Credenciales incorrectas

**Solución:** Verifica tu `.deploy-config.json`

### Error: No se puede conectar al servidor

**Solución:**

- Verifica que el servidor FTP esté activo
- Comprueba el firewall
- Intenta con SFTP si está disponible

---

## 🎯 Flujo de Trabajo Recomendado

1. **Desarrollo local:**

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
   ```

2. **Prueba tus cambios** en `http://localhost:5173`

3. **Despliega a producción:**

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Message "Descripción"
   ```

4. **Verifica** en `https://epc.ylevigroup.com`

---

## 💡 Consejos

- ✅ Siempre prueba localmente antes de desplegar
- ✅ Usa mensajes descriptivos en tus despliegues
- ✅ Mantén un backup antes de despliegues grandes
- ✅ Considera usar GitHub Actions para despliegues automáticos
- ✅ Revisa los logs si algo falla
