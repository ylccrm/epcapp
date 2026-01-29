# 🔐 GitHub Secrets - Configuración Final

## ✅ Información Confirmada

- **SSH_HOST:** `ftp.ylevigroup.com`
- **SSH_USERNAME:** `ylevigro`
- **SSH_PORT:** `22`
- **SSH_PRIVATE_KEY:** La clave RSA que me diste

---

## 📋 PASO A PASO: Configurar GitHub Secrets

### 1. Ve a GitHub Secrets

Abre: **https://github.com/ylccrm/epcapp/settings/secrets/actions**

### 2. Agrega Estos 4 Secrets

Haz clic en **"New repository secret"** para cada uno:

---

#### Secret 1: SSH_HOST

**Name:** `SSH_HOST`

**Value:**

```
ftp.ylevigroup.com
```

Click **"Add secret"**

---

#### Secret 2: SSH_USERNAME

**Name:** `SSH_USERNAME`

**Value:**

```
ylevigro
```

Click **"Add secret"**

---

#### Secret 3: SSH_PORT

**Name:** `SSH_PORT`

**Value:**

```
22
```

Click **"Add secret"**

---

#### Secret 4: SSH_PRIVATE_KEY

**Name:** `SSH_PRIVATE_KEY`

**Value:** (Copia TODO esto, incluyendo las líneas BEGIN y END)

```
-----BEGIN RSA PRIVATE KEY-----
Proc-Type: 4,ENCRYPTED
DEK-Info: AES-128-CBC,9758CFAEB954D0B3DF7CF78AA9C3A479

7CxuU3tSBZnvx6wamIaZ2nQ79GMUnMzWQW0+9k9wRzobW7dd8OnOaeJ8o+3CHENH
m8Nrl2JYGnzXzi3VQ66nVha7SWYyzJMnps5qUUuOypfR4lnD1Rt3QSSxvYyHcHa8
afbc089yzod3BM0mlfQtKJkP65wLVh9KqaTBKxQ/F3bz923YrE6V6uPgcLWkMTXl
ixf5e8Wd7QCnLMjdvZCmm0nCr7I8huVZm/giRGl6hxe3Q1pVP3SheszAMDDx4gYw
sHLEfwMX42HfyZ+f1z8HH+ZUuAFFMhMs+b+SrJWbpF1kyOroG4r7jkZk1aNPs5Ym
lQ3FvNoO6jYFQR9pmxR7ZE+JEUC2ngLVmsGOG1pPoPgeGbMdXAuA/NJlJUR9YEsu
K66049Cvmtf+kex9vuVxL47pqc70qHbBOl1iiRuFvMjSuPEVNre25oGkUCmzO7Ro
Zlm/PMSmNqqx9kLDHsuRHwyowcYHUt3vGJxJN5J888f9+CCGIu47qeREMYI0GXPk
+Sv62HfNtcD7A6Zyx+Z3mYgFYdGUBtoXhNnn+tVn5ngjdwLdj+b7aZrDULACsvN5
LzQ1pZaIlTYeh7xXzEc86B1N5y+xUYrc5F7UU5sqn1K3jW3uEwZMhhj3VEy/h7Ka
88wIAoNIJPtLrd92oM9aFpNMQ3+exAkMwlaA9uF+l7eK28SgJnUenzcLuCy8Z85n
ja1dj0Qsrl8+th4ch8U5HVEpUfSB06UdtHjdfVY+lK6b/iYvb/z6Lm8mRdDJbC8G
9Ez2UP46Q7T/MHhOjG1WH3I7kh+8PC2Ei36V4Mnh7vzSnfWzwx+GjGQ1ogYLP+kL
nY/Nv1942qgDRerhIGaeGa2YfsPTnibt0rNJcmergwHQ52kPogXl0H/gpWQFxFrO
UE+pKSPTJtPSavaiseARcdYjtFfZ1C9lWI99sdt/XeDwbDhO0PlJrBdsxEqlCTs+
UD6SJd6pzmrL63DhPMUw7ezV9e2tWu25YnJOi9EYOmPrgtJG0udHRY6GDO0ZqmKu
7r7ygWnZHei/tvUwEh8mio5c47tnaqxxXrKbfw1/KZyCuHUa/AZ4rayLGxPFRTUu
vxhV7W9nXFXr63mh+dToGXszESa1tZ5r4kyaeYnh3FASuywLHaELb29XRR7hvzvu
4sZ798YJ14YLKXnl2CvqONfjSaULOeBZwKkDexYEvImm/1mqBW85X4Uqpncr9LrO
o4Yh+yuSsBM3amLt8StDSvfe6/49B6VA67QtTbpARBSn7U7CZOBR1Od+g5MxiEkD
DObEULl/lDVocPL1txyvZA2ztyZq9m/E9WQpnKk58dZSCcxPlRR4XU2dpVUT4n6l
dWCMhWBCBZFz6/OEjfiqyU/tdeyv/PdNXCVPAmfna0HR4jefoWHqOf1h2UreY+eo
TBxtdvjAZuDrCFhckMS7OBtz6g8IcWoKHrNlz+vvEu4xg/GBx39haC8YTNCylsma
C/WzsCb0hlAC5FKEk9UhKcRYNO0/lyvYFTv5GQt3MJGDDLHUe1tvwCvgZwdhYZRM
TMk5ctC5SCAjMhYohzsvGfK/39ejeisxzSOdBO00u5bVuiPA4ofaEKSH5ctsD9MU
-----END RSA PRIVATE KEY-----
```

Click **"Add secret"**

---

## ✅ Verificar Secrets

Deberías tener estos 6 secrets en total:

- [x] `SSH_HOST` = `ftp.ylevigroup.com`
- [x] `SSH_USERNAME` = `ylevigro`
- [x] `SSH_PORT` = `22`
- [x] `SSH_PRIVATE_KEY` = (La clave RSA completa)
- [x] `VITE_SUPABASE_URL` = (Ya lo tienes)
- [x] `VITE_SUPABASE_ANON_KEY` = (Ya lo tienes)

---

## 🚀 Probar el Deployment

Una vez configurados todos los secrets:

1. **Ve a:** https://github.com/ylccrm/epcapp/actions

2. **Verás el workflow** "Deploy to A2 Hosting via SSH" ejecutándose

3. **Espera 2-3 minutos** a que complete

4. **Si es exitoso (✅):**
   - Abre https://epc.ylevigroup.com
   - Deberías ver la aplicación funcionando

5. **Si falla (❌):**
   - Haz clic en el workflow
   - Revisa los logs
   - Dime qué error aparece

---

## 📝 Próximos Deployments

Cada vez que hagas cambios:

```bash
# 1. Editas archivos en Antigravity
# 2. Guardas

# 3. Commit y push
git add .
git commit -m "Descripción de cambios"
git push origin main

# ✨ GitHub Actions despliega automáticamente
# ⏱️ Espera 2-3 minutos
# 🌐 Visita https://epc.ylevigroup.com
```

---

**¿Ya configuraste los 4 secrets en GitHub?**
