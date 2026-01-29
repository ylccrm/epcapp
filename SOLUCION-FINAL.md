# SOLUCION FINAL - Subir por cPanel File Manager

## El Problema

La cuenta FTP `epc_user@epc.ylevigroup.com` NO tiene permisos para escribir en `/epc.ylevigroup.com`.

Error: "553 File name not allowed"

## SOLUCION: Usar cPanel File Manager

### Paso 1: Preparar el Archivo ZIP

Ya tienes el archivo listo: `epc-deploy.zip` en la carpeta del proyecto.

### Paso 2: Subir por cPanel

1. **Accede a cPanel** de A2 Hosting

2. **Ve a "File Manager"** (Administrador de Archivos)

3. **Navega a la carpeta:**

   ```
   /epc.ylevigroup.com
   ```

4. **Elimina todo** lo que haya en esa carpeta (si hay algo)

5. **Haz clic en "Upload"** (Subir)

6. **Arrastra el archivo** `epc-deploy.zip` desde tu computadora
   - Ubicación: `C:\Users\Administrator\.gemini\antigravity\scratch\epcapp\epc-deploy.zip`

7. **Espera** a que se complete la subida

8. **Vuelve al File Manager**

9. **Haz clic derecho** en `epc-deploy.zip` → **"Extract"** (Extraer)

10. **Confirma** la extracción

11. **Elimina** el archivo `epc-deploy.zip`

12. **Verifica** que veas:
    ```
    /epc.ylevigroup.com/
    ├── index.html
    └── assets/
        ├── index-*.css
        └── index-*.js
    ```

### Paso 3: Verificar

Abre tu navegador y ve a: **https://epc.ylevigroup.com**

Debería funcionar inmediatamente.

---

## Alternativa: Cambiar Permisos de la Cuenta FTP

Si prefieres usar FTP en el futuro:

1. En cPanel → **"FTP Accounts"**
2. Busca `epc_user@epc.ylevigroup.com`
3. Haz clic en **"Change Quota"** o **"Configure"**
4. Cambia el **"Directory"** a `/epc.ylevigroup.com`
5. Guarda los cambios

Luego podrás usar FTP normalmente.

---

## Actualizar Configuración para GitHub Actions

Una vez que funcione, actualiza `.deploy-config.json`:

```json
{
  "ftp_host": "ftp.ylevigroup.com",
  "ftp_user": "epc_user@epc.ylevigroup.com",
  "ftp_pass": "Israel2025@",
  "ftp_remote_path": "/epc.ylevigroup.com"
}
```

Y en `.github/workflows/deploy.yml`:

```yaml
server-dir: /epc.ylevigroup.com/
```

---

## Resumen

**AHORA:** Sube manualmente por cPanel File Manager (5 minutos)

**DESPUÉS:** Configura la cuenta FTP para que apunte a `/epc.ylevigroup.com`

**RESULTADO:** Despliegue automático funcionando

---

**¿Puedes subir el archivo `epc-deploy.zip` por cPanel File Manager ahora?**

La ruta del archivo es:

```
C:\Users\Administrator\.gemini\antigravity\scratch\epcapp\epc-deploy.zip
```
