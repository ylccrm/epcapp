# 🎯 Resumen de Configuración - Sistema de Despliegue Automático

## ✅ Lo que ya está configurado

### 1. Archivos Actualizados

- ✅ `.github/workflows/deploy.yml` - GitHub Actions configurado para `crmylc.ylevigroup.com`
- ✅ `deploy.ps1` - Script de despliegue manual actualizado
- ✅ `.deploy-config.example.json` - Plantilla de configuración
- ✅ `setup-deploy.ps1` - Script de configuración interactiva
- ✅ `SETUP-AUTO-DEPLOY.md` - Documentación completa

### 2. Repositorio GitHub

- ✅ Conectado a: `https://github.com/ylccrm/epcapp.git`
- ✅ Cambios commiteados y listos para push

---

## 📋 Pasos que DEBES completar

### Paso 1: Configurar Credenciales FTP Locales (2 minutos)

Ejecuta el script de configuración:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup-deploy.ps1
```

Este script te pedirá:

- Servidor FTP de A2hosting
- Usuario FTP
- Contraseña FTP

### Paso 2: Crear Subdominio en A2 Hosting (3 minutos)

1. **Accede a cPanel** de A2 Hosting
2. Busca **"Subdominios"**
3. Crea el subdominio:
   - **Subdominio:** `crmylc`
   - **Dominio:** `ylevigroup.com`
   - **Raíz:** `/home/[tu-usuario]/public_html/crmylc`

### Paso 3: Configurar GitHub Secrets (5 minutos)

1. Ve a: https://github.com/ylccrm/epcapp/settings/secrets/actions

2. Haz clic en **"New repository secret"** para cada uno:

| Secret Name              | Valor                                      | Dónde obtenerlo       |
| ------------------------ | ------------------------------------------ | --------------------- |
| `FTP_SERVER`             | `ftp.ylevigroup.com`                       | cPanel → Cuentas FTP  |
| `FTP_USERNAME`           | `usuario@ylevigroup.com`                   | cPanel → Cuentas FTP  |
| `FTP_PASSWORD`           | Tu contraseña FTP                          | La que configuraste   |
| `VITE_SUPABASE_URL`      | `https://cjolwqqkymdrsibacsom.supabase.co` | Tu archivo .env local |
| `VITE_SUPABASE_ANON_KEY` | Tu clave anónima                           | Tu archivo .env local |

### Paso 4: Hacer Push a GitHub (1 minuto)

```powershell
git push origin main
```

Esto activará automáticamente el despliegue a `crmylc.ylevigroup.com`

---

## 🚀 Flujo de Trabajo (Después de la Configuración)

### Opción A: Despliegue Automático con GitHub (Recomendado)

```bash
# 1. Hacer cambios en tu código
# 2. Guardar archivos

# 3. Commit y push
git add .
git commit -m "Descripción de cambios"
git push origin main

# ✨ GitHub Actions despliega automáticamente
```

### Opción B: Despliegue Manual Rápido

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Message "Descripción"
```

---

## 📊 Diagrama del Flujo

```
┌─────────────────┐
│   Antigravity   │
│  (Tu código)    │
└────────┬────────┘
         │
         │ git push
         ▼
┌─────────────────┐
│     GitHub      │
│  (Repositorio)  │
└────────┬────────┘
         │
         │ GitHub Actions
         │ (Automático)
         ▼
┌─────────────────┐
│   A2 Hosting    │
│ crmylc.ylevi... │
└─────────────────┘
```

---

## 🔍 Verificar el Despliegue

### Ver el progreso en GitHub:

1. Ve a: https://github.com/ylccrm/epcapp/actions
2. Verás el workflow "Deploy to A2 Hosting" ejecutándose
3. Haz clic para ver detalles en tiempo real

### Ver el sitio web:

- URL: https://crmylc.ylevigroup.com
- (o http:// si aún no configuras SSL)

---

## 🎓 Comandos Útiles

### Ver estado de Git

```bash
git status
```

### Ver historial de commits

```bash
git log --oneline -5
```

### Ver configuración FTP local

```powershell
Get-Content .deploy-config.json
```

### Verificar conexión con GitHub

```bash
git remote -v
```

---

## 🆘 Solución de Problemas Comunes

### ❌ Error al hacer push

**Solución:**

```bash
git pull origin main
git push origin main
```

### ❌ GitHub Actions falla

**Causa:** Secrets no configurados correctamente
**Solución:** Verifica los secrets en GitHub Settings

### ❌ FTP manual falla

**Causa:** Credenciales incorrectas en `.deploy-config.json`
**Solución:** Ejecuta `setup-deploy.ps1` nuevamente

---

## 📞 Información de Contacto

- **Repositorio:** https://github.com/ylccrm/epcapp
- **Dominio:** crmylc.ylevigroup.com
- **Servidor:** A2 Hosting
- **Framework:** Vite + React + TypeScript + Supabase

---

## ✅ Checklist Final

Antes de hacer tu primer despliegue, verifica:

- [ ] Ejecuté `setup-deploy.ps1` y configuré FTP local
- [ ] Creé el subdominio `crmylc` en cPanel
- [ ] Agregué los 5 secrets en GitHub
- [ ] Hice `git push origin main`
- [ ] Vi el workflow ejecutándose en GitHub Actions
- [ ] Verifiqué que el sitio cargue en crmylc.ylevigroup.com

---

**¿Listo para comenzar?** 🚀

Ejecuta:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup-deploy.ps1
```
