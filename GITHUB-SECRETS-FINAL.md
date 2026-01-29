# 📋 Configuración Final - GitHub Secrets

## ✅ Ya Tienes:

- SSH Private Key (id_depc)
- SSL configurado en epc.ylevigroup.com

## 🔐 GitHub Secrets a Configurar

Ve a: https://github.com/ylccrm/epcapp/settings/secrets/actions

### 1. SSH_PRIVATE_KEY

**Valor:** La clave privada completa que me diste (desde -----BEGIN hasta -----END)

### 2. SSH_HOST

**Valor:** ¿Cuál es? (Necesito que me lo confirmes)

- Opciones comunes:
  - `ssh.ylevigroup.com`
  - `ts3.a2hosting.com`
  - `ftp.ylevigroup.com`
  - Otra IP o hostname

### 3. SSH_USERNAME

**Valor:** Tu usuario de cPanel/SSH

- ¿Cuál es tu usuario? (ejemplo: `ylevigro`, `epc_user`, etc.)

### 4. SSH_PORT

**Valor:** `22` (puerto SSH estándar)

### 5. VITE_SUPABASE_URL

**Valor:** `https://cjolwqqkymdrsibacsom.supabase.co`
(Ya lo tienes configurado)

### 6. VITE_SUPABASE_ANON_KEY

**Valor:** Tu clave de Supabase
(Ya lo tienes configurado)

---

## 📝 Información que Necesito de Ti:

Por favor confírmame:

1. **SSH_HOST:** ******\_\_\_******
2. **SSH_USERNAME:** ******\_\_\_******
3. **Ruta del directorio en el servidor:** ******\_\_\_******
   - Ejemplo: `/home/ylevigro/epc.ylevigroup.com`
   - O: `~/epc.ylevigroup.com`
   - O: `~/public_html/epc.ylevigroup.com`

---

## 🚀 Una Vez que Tengas Esos Datos:

1. Configuraremos los GitHub Secrets
2. Actualizaré el workflow con la ruta correcta
3. Haremos commit y push
4. GitHub Actions desplegará automáticamente
5. ¡Funcionará!

---

**¿Cuál es el SSH_HOST y SSH_USERNAME de tu servidor A2 Hosting?**
