# SOLUCION DEFINITIVA - Error 503

## El Problema

El error 503 persiste porque el subdominio "epc.ylevigroup.com" está mal configurado en A2 Hosting.
Los archivos están subidos correctamente, pero el servidor no los está sirviendo.

---

## SOLUCION: Reconfigurar en cPanel

### Opción 1: Eliminar Configuración de Node.js (MUY IMPORTANTE)

1. **Accede a cPanel** de A2 Hosting

2. **Busca "Setup Node.js App"** o **"Setup Python App"**

3. **Si ves "epc.ylevigroup.com" en la lista:**
   - Haz clic en el icono de **ELIMINAR** (papelera/trash)
   - Confirma la eliminación
   - **ESTO ES CRÍTICO** - Esta app NO necesita Node.js

---

### Opción 2: Verificar/Recrear el Subdominio

#### Paso 1: Eliminar el Subdominio Actual

1. En cPanel → **"Subdominios"** (Subdomains)

2. Busca `epc` en la lista

3. Haz clic en **"Remove"** o **"Eliminar"**

4. Confirma

#### Paso 2: Crear Nuevo Subdominio Correctamente

1. En la misma página, haz clic en **"Create"**

2. Llena los campos:

   ```
   Subdominio: epc
   Dominio: ylevigroup.com
   ```

3. **IMPORTANTE:** En "Document Root" o "Raíz del documento":
   - Fíjate qué ruta sugiere automáticamente
   - Debería ser algo como: /home/ylevigro/public_html/epc
   - **Anota esta ruta exacta**

4. Haz clic en **"Create"**

---

### Opción 3: Verificar la Ruta del Subdominio

1. En cPanel → **"Subdominios"**

2. Busca `epc.ylevigroup.com`

3. Verifica la columna **"Document Root"** o **"Raíz"**

4. **Anota la ruta exacta que ves**

5. Dime cuál es esa ruta

---

## Después de Reconfigurar

Una vez que tengas la ruta correcta del subdominio:

### Si la ruta es diferente a la raíz FTP:

Necesitaremos subir los archivos a esa ruta específica.

**Ejemplo:**

- Si la ruta es: `/home/ylevigro/public_html/epc`
- Ejecuta:
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\upload-ftp.ps1 -RemotePath "/public_html/epc"
  ```

---

## Verificación Rápida

### Prueba 1: Archivo Estático Simple

Crea un archivo de prueba en cPanel:

1. Ve a **Administrador de Archivos**

2. Navega a la ruta del subdominio (la que anotaste)

3. Crea un archivo nuevo llamado `prueba.html`

4. Contenido:

   ```html
   <h1>Funciona!</h1>
   ```

5. Guarda

6. Abre: https://epc.ylevigroup.com/prueba.html

**Resultado:**

- Si ves "Funciona!" → El subdominio está bien, solo falta subir archivos a la ruta correcta
- Si ves 503 → El subdominio está mal configurado (probablemente como app Node.js)

---

## Información que Necesito

Por favor, dime:

1. **¿Hay alguna aplicación Node.js configurada para epc.ylevigroup.com?**
   (Revisa en "Setup Node.js App")

2. **¿Cuál es la ruta exacta del subdominio?**
   (La que ves en cPanel → Subdominios)

3. **¿Funciona el archivo prueba.html?**

Con esta información puedo darte la solución exacta.

---

## Alternativa Temporal

Si quieres ver la app funcionando YA mientras arreglas el subdominio:

### Usar el dominio principal:

Sube los archivos a `/public_html/` y accede a:

```
https://ylevigroup.com/
```

Esto te permitirá ver la app funcionando mientras arreglamos el subdominio.

---

**¿Qué ruta ves en cPanel para el subdominio "epc"?**
