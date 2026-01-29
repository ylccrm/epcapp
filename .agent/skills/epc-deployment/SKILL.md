# 🚀 EPC App - Deployment Architecture Skill

## 📊 Problema Actual

**A2 Hosting (Hosting Compartido)** tiene limitaciones:

- ❌ No soporta Node.js/PM2 directamente
- ❌ No permite control total del servidor
- ❌ Problemas con FTP y caché agresiva
- ❌ No es ideal para aplicaciones React/Vite

## ✅ Solución: Migrar a Arquitectura VPS

Tu arquitectura que **SÍ funciona** en otra app:

```
┌─────────────────────────────────────────┐
│  Antigravity (Local Development)       │
│  C:\Users\Administrator\.gemini\...    │
└─────────────────────────────────────────┘
                  │
                  │ git push
                  ▼
┌─────────────────────────────────────────┐
│  GitHub Repository                      │
│  https://github.com/ylccrm/epcapp      │
└─────────────────────────────────────────┘
                  │
                  │ GitHub Actions
                  ▼
┌─────────────────────────────────────────┐
│  VPS Server (ylevigroup.com)           │
│  ├─ Node.js + PM2                      │
│  ├─ Nginx (Reverse Proxy)              │
│  ├─ MySQL/Supabase Database            │
│  └─ SSL Certificate (Let's Encrypt)    │
└─────────────────────────────────────────┘
                  │
                  │ DNS
                  ▼
┌─────────────────────────────────────────┐
│  https://epc.ylevigroup.com            │
└─────────────────────────────────────────┘
```

---

## 🎯 Plan de Migración

### Opción 1: Usar VPS Existente (RECOMENDADO)

Si ya tienes un VPS donde funciona tu otra app:

**Ventajas:**

- ✅ Ya conoces la configuración
- ✅ Ya tienes Nginx/PM2 configurado
- ✅ Deployment probado y funcionando
- ✅ Control total del servidor

**Pasos:**

1. Crear subdominio `epc.ylevigroup.com` apuntando al VPS
2. Configurar Nginx para servir la app
3. Configurar PM2 para el proceso Node.js (si es SSR)
4. O servir archivos estáticos directamente con Nginx
5. Configurar GitHub Actions para deployment SSH

### Opción 2: Usar Plataforma Moderna (ALTERNATIVA)

**Vercel** (Gratis, ideal para React/Next.js):

- ✅ Deploy automático desde GitHub
- ✅ SSL gratis
- ✅ CDN global
- ✅ Dominio personalizado gratis
- ✅ Zero configuration

**Railway** (Gratis hasta $5/mes):

- ✅ Deploy automático desde GitHub
- ✅ Base de datos incluida
- ✅ SSL gratis
- ✅ Fácil configuración

---

## 📋 Información Necesaria

Para ayudarte a migrar, necesito saber:

### 1. ¿Tienes un VPS?

- [ ] Sí, tengo VPS donde corre mi otra app
- [ ] No, solo tengo A2 Hosting

### 2. Si tienes VPS:

- **IP del servidor:** ******\_\_\_******
- **Usuario SSH:** ******\_\_\_******
- **¿Ya tiene Nginx instalado?** Sí / No
- **¿Ya tiene PM2 instalado?** Sí / No
- **¿Qué otra app corre ahí?** ******\_\_\_******

### 3. Tipo de App:

- [ ] Solo frontend (React/Vite estático)
- [ ] Full-stack con backend Node.js
- [ ] Necesita base de datos

---

## 🚀 Quick Start (Si tienes VPS)

### Paso 1: Configurar DNS

En tu proveedor de dominio (ylevigroup.com):

```
Tipo: A
Nombre: epc
Valor: [IP de tu VPS]
TTL: 3600
```

### Paso 2: Configurar Nginx

```nginx
# /etc/nginx/sites-available/epc.ylevigroup.com
server {
    listen 80;
    server_name epc.ylevigroup.com;

    root /var/www/epc.ylevigroup.com;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### Paso 3: Deployment Script

```bash
#!/bin/bash
# deploy.sh

# Build locally
npm run build

# Upload to server
rsync -avz --delete dist/ user@your-vps:/var/www/epc.ylevigroup.com/

# Restart Nginx (if needed)
ssh user@your-vps "sudo systemctl reload nginx"

echo "✅ Deployment complete!"
echo "🌐 Visit: https://epc.ylevigroup.com"
```

### Paso 4: GitHub Actions (Automático)

```yaml
# .github/workflows/deploy-vps.yml
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Deploy to VPS
        uses: easingthemes/ssh-deploy@main
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
          REMOTE_USER: ${{ secrets.REMOTE_USER }}
          SOURCE: "dist/"
          TARGET: "/var/www/epc.ylevigroup.com"
```

---

## 🎯 Próximos Pasos

**Dime:**

1. **¿Tienes VPS donde corre tu otra app?**
2. **¿Cuál es la IP del VPS?**
3. **¿Prefieres migrar a VPS o usar Vercel/Railway?**

Con esa información, te configuro el deployment completo en 30 minutos.

---

## 📚 Archivos de Esta Skill

- `SKILL.md` - Este archivo (overview)
- `VPS_SETUP.md` - Guía completa para VPS
- `VERCEL_SETUP.md` - Guía para Vercel
- `RAILWAY_SETUP.md` - Guía para Railway
- `scripts/deploy-vps.sh` - Script de deployment VPS
- `templates/nginx.conf` - Configuración Nginx
- `.github/workflows/deploy-vps.yml` - GitHub Actions para VPS

---

**¿Cuál opción prefieres?**
