# 🚀 A2 Hosting con Node.js - Deployment Guide

## ✅ Ventajas de A2 Hosting con Node.js

- ✅ Node.js ya instalado
- ✅ SSH access disponible
- ✅ Deployment directo sin FTP
- ✅ Control sobre el build process

---

## 📋 Configuración Inicial en A2 Hosting

### Paso 1: Habilitar SSH Access

1. **Accede a cPanel** de A2 Hosting
2. Ve a **"SSH Access"**
3. **Genera/importa SSH key** o usa password
4. **Anota los datos:**
   - Host: `ssh.ylevigroup.com` o `ts3.a2hosting.com`
   - Puerto: `22` (generalmente)
   - Usuario: Tu usuario de cPanel

### Paso 2: Conectarse por SSH

```powershell
# Desde tu máquina local
ssh usuario@ssh.ylevigroup.com
# O
ssh usuario@ts3.a2hosting.com
```

### Paso 3: Verificar Node.js

```bash
# Una vez conectado por SSH
node -v
npm -v

# Si Node.js no está en la versión correcta
# Contacta soporte de A2 para actualizar
```

### Paso 4: Configurar Directorio de la App

```bash
# Navegar al directorio del subdominio
cd ~/epc.ylevigroup.com

# Si no existe, crearlo
mkdir -p ~/epc.ylevigroup.com
cd ~/epc.ylevigroup.com

# Clonar el repositorio
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
# Build inicial
npm run build

# Verificar que se creó la carpeta dist
ls -la dist/
```

### Paso 5: Configurar el Subdominio en cPanel

1. **Ve a cPanel → Subdominios**
2. **Verifica que `epc` apunte a:**

   ```
   /home/usuario/epc.ylevigroup.com/dist
   ```

   **IMPORTANTE:** Debe apuntar a la carpeta `dist`, no a la raíz

3. Si no está correcto:
   - Edita el subdominio
   - Cambia "Document Root" a: `/home/usuario/epc.ylevigroup.com/dist`
   - Guarda

### Paso 6: Crear .htaccess en dist

```bash
# Crear .htaccess para React Router
cat > ~/epc.ylevigroup.com/dist/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
EOF
```

---

## 🤖 Configurar GitHub Actions

### Paso 1: Obtener Credenciales SSH

**Opción A: Con Password**

- Host: `ssh.ylevigroup.com` o `ts3.a2hosting.com`
- Usuario: Tu usuario de cPanel
- Password: Tu contraseña de cPanel
- Puerto: `22`

**Opción B: Con SSH Key (Más seguro)**

```powershell
# En tu máquina local
ssh-keygen -t ed25519 -C "deploy@epc" -f C:\Users\Administrator\.ssh\a2-deploy

# Copiar clave pública al servidor
type C:\Users\Administrator\.ssh\a2-deploy.pub | ssh usuario@ssh.ylevigroup.com "cat >> ~/.ssh/authorized_keys"
```

### Paso 2: Configurar GitHub Secrets

Ve a: https://github.com/ylccrm/epcapp/settings/secrets/actions

Agrega estos secrets:

#### Con Password:

- `SSH_HOST`: `ssh.ylevigroup.com` (o `ts3.a2hosting.com`)
- `SSH_USERNAME`: Tu usuario de cPanel
- `SSH_PASSWORD`: Tu contraseña de cPanel
- `SSH_PORT`: `22`

#### Con SSH Key (alternativa):

- `SSH_HOST`: `ssh.ylevigroup.com`
- `SSH_USERNAME`: Tu usuario de cPanel
- `SSH_PRIVATE_KEY`: Contenido de `C:\Users\Administrator\.ssh\a2-deploy`
- `SSH_PORT`: `22`

#### Secrets de Supabase (ya los tienes):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 🚀 Workflow de Deployment

Una vez configurado, el flujo será:

```
1. Haces cambios en Antigravity
2. Commit y push a GitHub
   git add .
   git commit -m "Cambios"
   git push origin main

3. GitHub Actions automáticamente:
   ✅ Hace checkout del código
   ✅ Instala dependencias
   ✅ Hace build
   ✅ Se conecta por SSH a A2 Hosting
   ✅ Actualiza el repositorio
   ✅ Hace build en el servidor
   ✅ Los cambios están en vivo

4. Visitas https://epc.ylevigroup.com
   ✅ Ves los cambios inmediatamente
```

---

## 📝 Comandos Útiles

### Deployment Manual (si GitHub Actions falla)

```bash
# Conectarse por SSH
ssh usuario@ssh.ylevigroup.com

# Navegar a la app
cd ~/epc.ylevigroup.com

# Actualizar código
git pull origin main

# Instalar dependencias nuevas (si hay)
npm install

# Build
npm run build

# Listo!
```

### Ver logs

```bash
# Ver archivos en dist
ls -la ~/epc.ylevigroup.com/dist/

# Ver contenido de index.html
cat ~/epc.ylevigroup.com/dist/index.html

# Ver .htaccess
cat ~/epc.ylevigroup.com/dist/.htaccess
```

### Limpiar y rebuild

```bash
cd ~/epc.ylevigroup.com
rm -rf dist node_modules
npm install
npm run build
```

---

## 🎯 Checklist de Setup

- [ ] SSH access habilitado en cPanel
- [ ] Conectado por SSH exitosamente
- [ ] Node.js verificado
- [ ] Repositorio clonado
- [ ] Dependencias instaladas
- [ ] Build inicial exitoso
- [ ] Subdominio apunta a `/dist`
- [ ] `.htaccess` creado en dist
- [ ] GitHub Secrets configurados
- [ ] GitHub Actions funcionando
- [ ] Sitio accesible en https://epc.ylevigroup.com

---

## 🆘 Troubleshooting

### Error: "npm: command not found"

```bash
# Verificar ruta de Node.js
which node
which npm

# Agregar al PATH si es necesario
export PATH=$PATH:/usr/local/bin
```

### Error: "Permission denied"

```bash
# Verificar permisos
ls -la ~/epc.ylevigroup.com

# Corregir permisos
chmod -R 755 ~/epc.ylevigroup.com
```

### Sitio muestra error 404

- Verifica que el subdominio apunte a `/dist`
- Verifica que `.htaccess` existe en dist
- Verifica que `index.html` existe en dist

### GitHub Actions falla en SSH

- Verifica que los secrets estén correctos
- Verifica que SSH access esté habilitado en cPanel
- Prueba conectarte manualmente por SSH primero

---

## 📞 Próximos Pasos

1. **Dame los datos de SSH:**
   - Host (ssh.ylevigroup.com o ts3.a2hosting.com)
   - Usuario
   - ¿Prefieres usar password o SSH key?

2. **Configuraremos GitHub Secrets juntos**

3. **Haremos el primer deployment automático**

---

**¿Cuál es el host SSH de A2 Hosting? (ssh.ylevigroup.com o ts3.a2hosting.com)**
