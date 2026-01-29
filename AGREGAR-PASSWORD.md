# 🔐 Agregar SSH_PASSWORD Secret

## ⚠️ Error Detectado

La SSH key está encriptada y necesita passphrase. Es más simple usar password.

## 📋 Agregar Nuevo Secret

Ve a: **https://github.com/ylccrm/epcapp/settings/secrets/actions**

### Agregar: SSH_PASSWORD

**Name:** `SSH_PASSWORD`

**Value:** La contraseña de tu cuenta de cPanel/SSH para el usuario `ylevigro`

Click **"Add secret"**

---

## ✅ Secrets Finales Necesarios:

- [x] `SSH_HOST` = `ftp.ylevigroup.com`
- [x] `SSH_USERNAME` = `ylevigro`
- [x] `SSH_PORT` = `22`
- [ ] `SSH_PASSWORD` = **TU CONTRASEÑA DE CPANEL** ← AGREGAR ESTE
- [x] `VITE_SUPABASE_URL` = (Ya configurado)
- [x] `VITE_SUPABASE_ANON_KEY` = (Ya configurado)

**Nota:** Puedes eliminar el secret `SSH_PRIVATE_KEY` ya que no lo usaremos.

---

## 🚀 Después de Agregar SSH_PASSWORD:

```bash
git add .
git commit -m "Actualizado workflow para usar password SSH"
git push origin main
```

GitHub Actions se ejecutará de nuevo y debería funcionar.

---

**¿Cuál es la contraseña de cPanel para agregar al secret SSH_PASSWORD?**
