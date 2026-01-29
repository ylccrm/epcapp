# 🚨 SOLUCIÓN URGENTE - Error 503 en Test.html

## 🎯 Problema Identificado

Si incluso `test.html` da error 503, el problema NO es con los archivos, sino con la **configuración del subdominio en A2 Hosting**.

---

## ✅ SOLUCIÓN: Reconfigurar el Subdominio

### Opción 1: Verificar Configuración Actual (RECOMENDADO)

1. **Accede a cPanel** de A2 Hosting

2. **Ve a "Subdominios"** (Subdomains)

3. **Busca el subdominio "epc"**

4. **Verifica estos datos:**
   - ✅ Subdominio: `epc`
   - ✅ Dominio: `ylevigroup.com`
   - ✅ Raíz del documento: `/home/ylevigro/public_html/epc`
     (NO `/home/ylevigro/epc.ylevigroup.com/epc_user`)

5. **Si la ruta es diferente**, haz clic en **"Manage"** o **"Edit"** y cámbiala a:
   ```
   /home/ylevigro/public_html/epc
   ```

---

### Opción 2: Eliminar y Recrear el Subdominio

Si la Opción 1 no funciona:

#### Paso 1: Eliminar el Subdominio Actual

1. En cPanel → **"Subdominios"**
2. Busca `epc.ylevigroup.com`
3. Haz clic en **"Remove"** o **"Eliminar"**
4. Confirma la eliminación

#### Paso 2: Crear Nuevo Subdominio

1. En la misma página de Subdominios
2. Haz clic en **"Create"** o **"Crear"**
3. Llena los campos:
   - **Subdominio:** `epc`
   - **Dominio:** `ylevigroup.com`
   - **Raíz del documento:** Déjalo automático (debería ser `/home/ylevigro/public_html/epc`)
4. Haz clic en **"Create"**

---

### Opción 3: Usar la Ruta Estándar de A2 Hosting

La ruta más común en A2 Hosting es:

```
/home/ylevigro/public_html/epc
```

**NO:**

- ❌ `/home/ylevigro/epc.ylevigroup.com/epc_user`
- ❌ `/home/ylevigro/epc_user`

---

## 📤 Subir Archivos a la Nueva Ruta

Una vez que tengas el subdominio configurado correctamente:

1. **Ve a Administrador de Archivos** en cPanel

2. **Navega a:**

   ```
   /home/ylevigro/public_html/epc
   ```

3. **Sube el archivo `epc-deploy.zip`**

4. **Extrae el archivo** (clic derecho → Extract)

5. **Elimina el .zip**

6. **Verifica que veas:**
   ```
   /home/ylevigro/public_html/epc/
   ├── index.html
   ├── .htaccess
   ├── test.html
   └── assets/
   ```

---

## 🔍 Verificar si hay Configuración de Node.js

El error 503 también puede ocurrir si el subdominio está configurado como aplicación Node.js:

### Paso 1: Verificar "Setup Node.js App"

1. En cPanel, busca **"Setup Node.js App"** o **"Setup Python App"**

2. **Si ves `epc.ylevigroup.com` en la lista:**
   - Haz clic en **"Remove"** o **"Delete"**
   - Confirma la eliminación

3. **NO debe haber ninguna aplicación Node.js/Python para este subdominio**

---

## 🎯 Configuración Correcta del Subdominio

### Datos que DEBEN estar en cPanel:

```
Tipo: Subdominio (NO aplicación Node.js)
Subdominio: epc
Dominio: ylevigroup.com
URL: epc.ylevigroup.com
Raíz: /home/ylevigro/public_html/epc
```

### Archivos que DEBEN estar en el servidor:

```
/home/ylevigro/public_html/epc/
├── index.html          ← Archivo principal de React
├── .htaccess           ← Configuración Apache
├── test.html           ← Archivo de prueba
└── assets/
    ├── index-*.js      ← JavaScript compilado
    └── index-*.css     ← CSS compilado
```

---

## 🔧 Actualizar Configuración de Despliegue

Una vez que sepas la ruta correcta, actualiza el archivo `.deploy-config.json`:

```json
{
  "ftp_host": "ftp.ylevigroup.com",
  "ftp_user": "epc_user@epc.ylevigroup.com",
  "ftp_pass": "Israel2025@",
  "ftp_remote_path": "/home/ylevigro/public_html/epc"
}
```

**Cambia la última línea a la ruta correcta que veas en cPanel.**

---

## 📞 Información que Necesito

Para ayudarte mejor, por favor dime:

1. **¿Cuál es la ruta exacta que ves en cPanel → Subdominios para "epc"?**

2. **¿Hay alguna aplicación Node.js configurada en "Setup Node.js App"?**

3. **¿Puedes acceder al Administrador de Archivos y navegar a la carpeta del subdominio?**

---

## 🆘 Si Nada Funciona

### Alternativa: Usar el Dominio Principal

Si el subdominio sigue dando problemas, podemos desplegar en:

```
https://ylevigroup.com/epc/
```

En lugar de:

```
https://epc.ylevigroup.com
```

Esto sería más simple y evitaría problemas de configuración de subdominios.

---

## 🎯 Próximo Paso INMEDIATO

1. **Ve a cPanel → Subdominios**
2. **Toma una captura de pantalla** de la configuración del subdominio "epc"
3. **Dime qué ruta exacta ves** en "Document Root" o "Raíz del documento"

Con esa información puedo darte la solución exacta.

---

**¿Qué ruta ves en cPanel para el subdominio "epc"?**
