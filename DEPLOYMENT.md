# 🚀 Despliegue de EPC App en A2 Hosting

## ✅ Archivos Preparados

Tu aplicación ha sido construida exitosamente para producción. Los siguientes archivos están listos:

- **📁 `dist/`** - Carpeta con todos los archivos de producción
- **📦 `epc-dist.zip`** - Archivo ZIP con todo el contenido (0.15 MB)
- **⚙️ `.htaccess`** - Ya incluido en dist/ para configuración de Apache

## 📋 Pasos para Desplegar en epc.ylevigroup.com

### 1️⃣ Configurar el Subdominio en A2 Hosting

1. **Accede a tu cPanel** de A2 Hosting
   - URL: `https://my.a2hosting.com` o la URL que te proporcionó A2 Hosting
   - Usuario y contraseña de tu cuenta

2. **Busca la sección "Dominios"** y haz clic en **"Subdominios"**

3. **Crea el subdominio:**
   - **Subdominio:** `epc`
   - **Dominio:** `ylevigroup.com`
   - **Raíz del documento:** `/home/[tu-usuario]/public_html/epc`
   - Haz clic en **"Crear"**

### 2️⃣ Subir los Archivos

Tienes **3 opciones** para subir los archivos:

#### 🅰️ Opción A: Administrador de Archivos de cPanel (Más Fácil)

1. En cPanel, ve a **"Archivos"** → **"Administrador de archivos"**
2. Navega a la carpeta: `/public_html/epc/`
3. Haz clic en **"Cargar"** en la barra superior
4. Arrastra y suelta el archivo **`epc-dist.zip`** (está en la carpeta del proyecto)
5. Espera a que se complete la carga
6. Vuelve al administrador de archivos
7. Haz **clic derecho** en `epc-dist.zip` → **"Extraer"**
8. Confirma la extracción
9. **Elimina** el archivo `epc-dist.zip` después de extraer

#### 🅱️ Opción B: FTP (FileZilla, WinSCP, etc.)

1. **Descarga un cliente FTP** si no tienes uno:
   - FileZilla: https://filezilla-project.org/
   - WinSCP: https://winscp.net/

2. **Conecta a tu servidor:**
   - **Host:** `ftp.ylevigroup.com` o la IP de tu servidor
   - **Usuario:** Tu usuario de cPanel
   - **Contraseña:** Tu contraseña de cPanel
   - **Puerto:** 21 (FTP) o 22 (SFTP - más seguro)

3. **Navega** en el servidor a: `/public_html/epc/`

4. **Sube TODO el contenido** de la carpeta `dist`:
   - Selecciona todos los archivos dentro de `dist/` (NO la carpeta dist en sí)
   - Arrástralos a la carpeta `/public_html/epc/` en el servidor
   - Espera a que se complete la transferencia

#### 🅲 Opción C: SSH (Para usuarios avanzados)

Si tienes acceso SSH habilitado:

```bash
# Conectar por SSH
ssh tu-usuario@tu-servidor.a2hosting.com

# Navegar a la carpeta
cd ~/public_html/epc

# Desde tu máquina local, usar SCP para subir
scp -r dist/* tu-usuario@tu-servidor:/home/tu-usuario/public_html/epc/
```

### 3️⃣ Verificar los Archivos

Asegúrate de que en `/public_html/epc/` tengas:

```
/public_html/epc/
├── index.html
├── .htaccess
└── assets/
    ├── index-[hash].js
    ├── index-[hash].css
    └── [otros archivos]
```

**⚠️ IMPORTANTE:** El archivo `.htaccess` debe estar presente para que las rutas funcionen correctamente.

### 4️⃣ Configurar SSL/HTTPS (Recomendado)

A2 Hosting ofrece SSL gratuito:

1. En cPanel, ve a **"Seguridad"** → **"SSL/TLS Status"**
2. Busca `epc.ylevigroup.com` en la lista
3. Haz clic en **"Run AutoSSL"** o **"Issue"**
4. Espera unos minutos a que se instale el certificado

Alternativamente:

- Ve a **"Seguridad"** → **"Let's Encrypt SSL"**
- Selecciona `epc.ylevigroup.com`
- Haz clic en **"Issue"**

### 5️⃣ Verificar el Despliegue

1. **Abre tu navegador** y ve a: `https://epc.ylevigroup.com`
   (Si aún no tienes SSL, usa: `http://epc.ylevigroup.com`)

2. **Verifica que:**
   - ✅ La página carga correctamente
   - ✅ Puedes navegar entre secciones (Proyectos, Inventario, etc.)
   - ✅ El cambio de idioma funciona (Configuración)
   - ✅ No hay errores en la consola del navegador (F12)

## 🔧 Solución de Problemas

### ❌ Error 404 - Página no encontrada

**Causa:** El archivo `.htaccess` no está presente o no funciona
**Solución:**

- Verifica que `.htaccess` esté en `/public_html/epc/`
- Asegúrate de que el módulo `mod_rewrite` esté habilitado (A2 Hosting lo tiene por defecto)

### ❌ Los estilos no se cargan

**Causa:** La carpeta `assets` no se subió correctamente
**Solución:**

- Verifica que la carpeta `assets` esté completa en el servidor
- Revisa la consola del navegador (F12) para ver qué archivos faltan

### ❌ Las rutas no funcionan (404 al recargar)

**Causa:** Problema con `.htaccess`
**Solución:**

- Verifica el contenido del archivo `.htaccess`
- Asegúrate de que no haya espacios o caracteres extraños

### ❌ Error de conexión a Supabase

**Causa:** Variables de entorno no configuradas
**Solución:**

- Crea un archivo `.env.production` con tus credenciales de Supabase
- Reconstruye la aplicación con `.\build-prod.ps1`

## 🔄 Actualizaciones Futuras

Cuando hagas cambios en tu aplicación:

1. **Haz los cambios** en tu código local
2. **Reconstruye** la aplicación:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\build-prod.ps1
   ```
3. **Sube los nuevos archivos** a `/public_html/epc/` (sobrescribe los existentes)
4. **Limpia la caché** del navegador (Ctrl + Shift + R) para ver los cambios

## 📞 Soporte

Si tienes problemas:

- **Soporte de A2 Hosting:** https://www.a2hosting.com/support
- **Documentación de cPanel:** Disponible en tu panel de control
- **Logs del servidor:** En cPanel → "Métricas" → "Errores"

## 📝 Notas Importantes

- ✅ El archivo `.htaccess` incluye configuración de caché y compresión GZIP
- ✅ La aplicación pesa solo **0.61 MB** (muy ligera)
- ✅ Todas las rutas de React Router funcionarán correctamente
- ✅ El archivo ZIP facilita la subida por cPanel
- ⚠️ Recuerda configurar SSL para mayor seguridad
- ⚠️ Las variables de entorno de Supabase se incluyen en el build (usa solo claves públicas)

---

**¡Tu aplicación está lista para desplegarse! 🎉**
