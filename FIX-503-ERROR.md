# 🔧 Solución al Error 503 Service Unavailable

## 🎯 Problema Identificado

El error **503 Service Unavailable** ocurre porque:

1. **Esta es una aplicación ESTÁTICA** (Vite/React compilado a HTML/CSS/JS)
2. **NO necesita Node.js en el servidor**
3. Solo necesita servir archivos estáticos como Apache/Nginx

---

## ✅ Solución: Verificar Configuración en A2 Hosting

### Paso 1: Verificar la Ruta del Subdominio

1. **Accede a cPanel** de A2 Hosting
2. Ve a **"Subdominios"**
3. Busca el subdominio **"epc"**
4. **Verifica que la ruta sea:**
   ```
   /home/ylevigro/epc.ylevigroup.com/epc_user
   ```

### Paso 2: Verificar que los Archivos Estén en la Raíz Correcta

Los archivos deben estar directamente en la raíz del subdominio:

```
/home/ylevigro/epc.ylevigroup.com/epc_user/
├── index.html          ← DEBE ESTAR AQUÍ
├── .htaccess           ← DEBE ESTAR AQUÍ
└── assets/
    ├── index-[hash].js
    └── index-[hash].css
```

**NO debe estar en una subcarpeta como:**

- ❌ `/home/ylevigro/epc.ylevigroup.com/epc_user/dist/`
- ❌ `/home/ylevigro/epc.ylevigroup.com/epc_user/public/`

### Paso 3: Verificar Permisos de Archivos

En cPanel → Administrador de Archivos:

1. Navega a `/home/ylevigro/epc.ylevigroup.com/epc_user/`
2. Verifica permisos:
   - **Carpetas:** 755
   - **Archivos:** 644
   - **`.htaccess`:** 644

---

## 🔍 Diagnóstico Rápido

### Prueba 1: Verificar si el servidor responde

Intenta acceder a:

```
https://epc.ylevigroup.com/test.html
```

- **Si ves "El servidor está funcionando"** → Los archivos están bien, el problema es con index.html
- **Si ves 503** → Los archivos no están en la ubicación correcta

### Prueba 2: Verificar .htaccess

Accede a cPanel → Administrador de Archivos:

1. Ve a `/home/ylevigro/epc.ylevigroup.com/epc_user/`
2. Verifica que existe `.htaccess`
3. Si no existe, créalo con este contenido:

```apache
# Disable directory browsing
Options -Indexes

# Set default index file
DirectoryIndex index.html

# Enable rewrite engine
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Don't rewrite files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d

  # Rewrite everything else to index.html for React Router
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 🛠️ Solución Manual (Si GitHub Actions no funciona)

### Opción A: Subir Archivos Manualmente por cPanel

1. **Construye la aplicación localmente:**

   ```powershell
   npm run build
   ```

2. **Comprime la carpeta dist:**

   ```powershell
   Compress-Archive -Path dist\* -DestinationPath epc-deploy.zip
   ```

3. **Sube por cPanel:**
   - Ve a Administrador de Archivos
   - Navega a `/home/ylevigro/epc.ylevigroup.com/epc_user/`
   - **Elimina todo** lo que haya ahí
   - Sube `epc-deploy.zip`
   - Extrae el archivo
   - Elimina el .zip

### Opción B: Usar FTP Manual (FileZilla)

1. **Descarga FileZilla:** https://filezilla-project.org/

2. **Conecta:**
   - Host: `ftp.ylevigroup.com`
   - Usuario: `epc_user@epc.ylevigroup.com`
   - Contraseña: `Israel2025@`
   - Puerto: 21

3. **Navega a:**

   ```
   /home/ylevigro/epc.ylevigroup.com/epc_user/
   ```

4. **Sube TODO el contenido de la carpeta `dist/`:**
   - Selecciona todos los archivos DENTRO de `dist/`
   - Arrástralos a la carpeta remota
   - **Asegúrate de que `.htaccess` se suba también**

---

## ⚠️ IMPORTANTE: NO Configurar Node.js

**Esta aplicación NO necesita Node.js en el servidor.**

- ❌ NO vayas a "Setup Node.js App" en cPanel
- ❌ NO configures ninguna aplicación Node.js
- ✅ Solo necesitas servir archivos estáticos con Apache

---

## 🔍 Verificar la Configuración del Subdominio

### En cPanel:

1. Ve a **"Subdominios"**
2. Verifica que el subdominio **"epc"** esté configurado así:

```
Subdominio: epc
Dominio: ylevigroup.com
Raíz del documento: /home/ylevigro/epc.ylevigroup.com/epc_user
```

3. Si la ruta es diferente, **edítala** o **recrea el subdominio**

---

## 📊 Estructura Correcta en el Servidor

```
/home/ylevigro/epc.ylevigroup.com/epc_user/
├── index.html                    ← Archivo principal
├── .htaccess                     ← Configuración Apache
├── test.html                     ← Archivo de prueba
├── vite.svg                      ← Favicon
└── assets/
    ├── index-[hash].js           ← JavaScript compilado
    ├── index-[hash].css          ← CSS compilado
    └── [otros archivos]
```

---

## 🎯 Próximos Pasos

1. **Verifica la ruta del subdominio** en cPanel
2. **Sube los archivos manualmente** usando cPanel o FileZilla
3. **Verifica que `.htaccess` esté presente**
4. **Prueba acceder a** https://epc.ylevigroup.com/test.html
5. **Si test.html funciona**, entonces accede a https://epc.ylevigroup.com

---

## 🆘 Si Sigue sin Funcionar

Revisa los logs de error en cPanel:

1. Ve a **"Métricas"** → **"Errores"**
2. Busca errores relacionados con `epc.ylevigroup.com`
3. Comparte el error conmigo para ayudarte mejor

---

**¿Quieres que te ayude a subir los archivos manualmente por cPanel?**
