---
description: Cómo desplegar la aplicación EPC en A2 Hosting (epc.ylevigroup.com)
---

# Despliegue en A2 Hosting - epc.ylevigroup.com

## Requisitos Previos

- Acceso a cPanel de A2 Hosting
- Dominio `ylevigroup.com` configurado en A2 Hosting
- Acceso FTP o SSH al servidor

## Paso 1: Construir la Aplicación para Producción

// turbo

1. Construir la aplicación:

```bash
powershell -ExecutionPolicy Bypass -File .\build-prod.ps1
```

Esto generará una carpeta `dist` con todos los archivos estáticos optimizados.

## Paso 2: Configurar el Subdominio en A2 Hosting

1. Accede a tu **cPanel** de A2 Hosting
2. Ve a la sección **Dominios** → **Subdominios**
3. Crea un nuevo subdominio:
   - **Subdominio**: `epc`
   - **Dominio**: `ylevigroup.com`
   - **Raíz del documento**: `/home/tu-usuario/public_html/epc` (o la ruta que prefieras)
4. Haz clic en **Crear**

## Paso 3: Subir los Archivos al Servidor

### Opción A: Usando FTP (FileZilla, WinSCP, etc.)

1. Conecta a tu servidor FTP:
   - **Host**: `ftp.ylevigroup.com` o la IP del servidor
   - **Usuario**: Tu usuario de cPanel
   - **Contraseña**: Tu contraseña de cPanel
   - **Puerto**: 21 (FTP) o 22 (SFTP)

2. Navega a la carpeta del subdominio: `/public_html/epc/`

3. Sube **TODO** el contenido de la carpeta `dist` (no la carpeta dist en sí, sino su contenido):
   - `index.html`
   - `assets/` (carpeta completa)
   - Todos los demás archivos

### Opción B: Usando el Administrador de Archivos de cPanel

1. En cPanel, ve a **Archivos** → **Administrador de archivos**
2. Navega a `/public_html/epc/`
3. Haz clic en **Cargar**
4. Sube el archivo `epc-dist.zip` que hemos creado
5. Haz clic derecho en el archivo ZIP → **Extraer**
6. Elimina el archivo ZIP después de extraer

### Opción C: Usando SSH (si tienes acceso)

1. Conecta por SSH:

```bash
ssh tu-usuario@tu-servidor.a2hosting.com
```

2. Navega a la carpeta del subdominio:

```bash
cd ~/public_html/epc
```

3. Sube el archivo usando SCP desde tu máquina local:

```bash
scp -r dist/* tu-usuario@tu-servidor:/home/tu-usuario/public_html/epc/
```

## Paso 4: Configurar el Archivo .htaccess

Es **CRUCIAL** crear un archivo `.htaccess` para que las rutas de React funcionen correctamente.

1. En la carpeta `/public_html/epc/`, crea un archivo llamado `.htaccess`
2. Copia el contenido del archivo `.htaccess` que hemos generado

Este archivo redirige todas las peticiones a `index.html` para que React Router funcione correctamente.

## Paso 5: Configurar Variables de Entorno (Supabase)

Si tu aplicación usa Supabase, necesitas configurar las variables de entorno:

1. Crea un archivo `.env.production` en la raíz del proyecto antes de construir
2. Agrega tus credenciales de Supabase:

```
VITE_SUPABASE_URL=tu-url-de-supabase
VITE_SUPABASE_ANON_KEY=tu-clave-anonima
```

3. Reconstruye la aplicación con estas variables

**IMPORTANTE**: Las variables de entorno se incluyen en el build, así que asegúrate de usar solo la clave anónima pública.

## Paso 6: Verificar el Despliegue

1. Abre tu navegador y ve a: `https://epc.ylevigroup.com`
2. Verifica que:
   - La página carga correctamente
   - Puedes navegar entre secciones
   - El cambio de idioma funciona
   - La conexión a Supabase funciona (si aplica)

## Paso 7: Configurar SSL/HTTPS (Recomendado)

A2 Hosting ofrece SSL gratuito con Let's Encrypt:

1. En cPanel, ve a **Seguridad** → **SSL/TLS Status**
2. Busca `epc.ylevigroup.com`
3. Haz clic en **Run AutoSSL**
4. Espera a que se complete la instalación del certificado

Alternativamente:

1. Ve a **Seguridad** → **Let's Encrypt SSL**
2. Selecciona el dominio `epc.ylevigroup.com`
3. Haz clic en **Issue**

## Solución de Problemas

### La página muestra un error 404

- Verifica que el archivo `.htaccess` esté presente y configurado correctamente
- Asegúrate de que los archivos estén en la carpeta correcta

### Los estilos no se cargan

- Verifica que la carpeta `assets` se haya subido completamente
- Revisa la consola del navegador para ver errores de carga

### Error de conexión a Supabase

- Verifica que las variables de entorno estén configuradas correctamente
- Asegúrate de que la URL de Supabase sea accesible desde el servidor

### La página carga pero las rutas no funcionan

- Verifica el archivo `.htaccess`
- Asegúrate de que el módulo `mod_rewrite` esté habilitado en Apache

## Actualizaciones Futuras

Para actualizar la aplicación:

1. Haz cambios en tu código local
2. Ejecuta `powershell -ExecutionPolicy Bypass -File .\build-prod.ps1`
3. Sube solo los archivos modificados o toda la carpeta `dist` nuevamente
4. Limpia la caché del navegador para ver los cambios

## Notas Adicionales

- **Rendimiento**: A2 Hosting tiene buena velocidad, pero considera usar su CDN si tienes tráfico internacional
- **Backups**: A2 Hosting hace backups automáticos, pero considera hacer backups manuales antes de actualizaciones grandes
- **Caché**: Puedes configurar caché del navegador en el `.htaccess` para mejorar el rendimiento
