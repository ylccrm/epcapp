# 🚀 EPC App - VPS Deployment Guide

## 📊 Arquitectura

```
Antigravity → GitHub → GitHub Actions → VPS → epc.ylevigroup.com
```

---

## 🎯 Setup Completo del VPS

### Paso 1: Crear Usuario SSH

```bash
# Conectarse como root
ssh root@YOUR_VPS_IP

# Crear usuario para deployment
sudo adduser epc-deploy
sudo usermod -aG sudo epc-deploy

# Configurar SSH key
sudo mkdir -p /home/epc-deploy/.ssh
sudo chmod 700 /home/epc-deploy/.ssh
sudo chown epc-deploy:epc-deploy /home/epc-deploy/.ssh
```

### Paso 2: Generar SSH Key (En tu máquina local)

```powershell
# Generar nueva SSH key
ssh-keygen -t ed25519 -C "epc-deploy@ylevigroup.com" -f C:\Users\Administrator\.ssh\epc-deploy

# Copiar la clave pública al servidor
type C:\Users\Administrator\.ssh\epc-deploy.pub | ssh root@YOUR_VPS_IP "cat >> /home/epc-deploy/.ssh/authorized_keys"

# Ajustar permisos en el servidor
ssh root@YOUR_VPS_IP "chmod 600 /home/epc-deploy/.ssh/authorized_keys && chown epc-deploy:epc-deploy /home/epc-deploy/.ssh/authorized_keys"
```

### Paso 3: Instalar Software Necesario

```bash
# Conectarse como epc-deploy
ssh epc-deploy@YOUR_VPS_IP

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Nginx
sudo apt install nginx -y

# Instalar Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2

# Instalar Git
sudo apt install git -y

# Verificar instalaciones
nginx -v
node -v
npm -v
pm2 -v
git --version
```

### Paso 4: Configurar Directorio de la App

```bash
# Crear directorio para la app
sudo mkdir -p /var/www/epc.ylevigroup.com
sudo chown -R epc-deploy:epc-deploy /var/www/epc.ylevigroup.com

# Navegar al directorio
cd /var/www/epc.ylevigroup.com
```

### Paso 5: Configurar Nginx

```bash
# Crear configuración de Nginx
sudo nano /etc/nginx/sites-available/epc.ylevigroup.com
```

Pega esta configuración:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name epc.ylevigroup.com;

    root /var/www/epc.ylevigroup.com;
    index index.html;

    # Logs
    access_log /var/log/nginx/epc.access.log;
    error_log /var/log/nginx/epc.error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Don't cache index.html
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires 0;
    }
}
```

Guardar y salir (Ctrl+X, Y, Enter)

```bash
# Habilitar el sitio
sudo ln -s /etc/nginx/sites-available/epc.ylevigroup.com /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

# Habilitar Nginx al inicio
sudo systemctl enable nginx
```

### Paso 6: Configurar SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL
sudo certbot --nginx -d epc.ylevigroup.com

# Seguir las instrucciones (ingresar email, aceptar términos)

# Verificar renovación automática
sudo certbot renew --dry-run
```

### Paso 7: Configurar Firewall

```bash
# Permitir SSH, HTTP y HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Verificar estado
sudo ufw status
```

---

## 🔄 Deployment Manual (Primera vez)

```bash
# En el servidor
cd /var/www/epc.ylevigroup.com

# Clonar repositorio
git clone https://github.com/ylccrm/epcapp.git .

# Instalar dependencias
npm install

# Crear archivo .env
nano .env.production
```

Contenido del `.env.production`:

```env
VITE_SUPABASE_URL=https://cjolwqqkymdrsibacsom.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_aqui
```

```bash
# Build de producción
npm run build

# Copiar archivos build a la raíz
cp -r dist/* .

# Verificar
ls -la
```

---

## 🤖 Deployment Automático con GitHub Actions

### Paso 1: Agregar SSH Key a GitHub Secrets

```powershell
# En tu máquina local, copiar la clave privada
Get-Content C:\Users\Administrator\.ssh\epc-deploy
```

1. Ve a: https://github.com/ylccrm/epcapp/settings/secrets/actions
2. Click "New repository secret"
3. Nombre: `VPS_SSH_KEY`
4. Valor: Pega el contenido de la clave privada
5. Click "Add secret"

### Paso 2: Agregar otros Secrets

Agrega estos secrets en GitHub:

- `VPS_HOST`: La IP de tu VPS
- `VPS_USER`: `epc-deploy`
- `VPS_TARGET`: `/var/www/epc.ylevigroup.com`

### Paso 3: Crear GitHub Actions Workflow

Ya está creado en `.github/workflows/deploy-vps.yml`

---

## 📝 Comandos Útiles

### Ver logs de Nginx

```bash
sudo tail -f /var/log/nginx/epc.access.log
sudo tail -f /var/log/nginx/epc.error.log
```

### Reiniciar Nginx

```bash
sudo systemctl restart nginx
```

### Actualizar manualmente

```bash
cd /var/www/epc.ylevigroup.com
git pull origin main
npm install
npm run build
cp -r dist/* .
```

### Verificar SSL

```bash
sudo certbot certificates
```

---

## 🎯 Checklist de Setup

- [ ] Usuario SSH creado
- [ ] SSH key configurada
- [ ] Nginx instalado
- [ ] Node.js instalado
- [ ] Directorio creado
- [ ] Nginx configurado
- [ ] SSL configurado
- [ ] Firewall configurado
- [ ] Repositorio clonado
- [ ] Primera build exitosa
- [ ] GitHub Secrets configurados
- [ ] GitHub Actions funcionando

---

## 🆘 Troubleshooting

### Nginx no inicia

```bash
sudo nginx -t  # Ver errores de configuración
sudo systemctl status nginx
```

### Permisos incorrectos

```bash
sudo chown -R epc-deploy:epc-deploy /var/www/epc.ylevigroup.com
sudo chmod -R 755 /var/www/epc.ylevigroup.com
```

### SSL no funciona

```bash
sudo certbot --nginx -d epc.ylevigroup.com --force-renewal
```

---

**Siguiente paso: Dame la IP del VPS para crear el workflow de GitHub Actions**
