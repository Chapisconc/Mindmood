# 🛠️ Solución a errores de Registro en Supabase

Si intentaste registrar `m@m.com` y la app te dijo "Ocurrió un error", en realidad fue Supabase bloqueando el intento por **límites de seguridad (Rate Limits)** y **Confirmación de Correo**.

Sigue estos pasos en el [Dashboard de Supabase](https://supabase.com/dashboard) para dejar tu base de datos lista y poder crear usuarios de prueba libremente:

### Paso 1: Desactivar la Confirmación por Correo Obligatoria
De manera predeterminada, Supabase te exige enviar un correo para verificar las cuentas. Como no tenemos un servidor de correos (SMTP) configurado, esto siempre va a fallar.
1. Abre tu proyecto en Supabase.
2. Ve al menú lateral izquierdo y haz clic en **Authentication**.
3. Selecciona **Providers**.
4. Haz clic en **Email**.
5. **Apaga** el switch que dice **"Confirm email"** (y "Secure email change").
6. Haz clic en **Save** abajo a la derecha.

### Paso 2: Crear el usuario m@m.com desde el Dashboard
Ya que las pruebas superaron el límite de intentos (Rate Limit), la forma más fácil de meter a este usuario hoy es directamente desde la consola:
1. Sigue en el menú de **Authentication**.
2. Ve a la pestaña **Users**.
3. Arriba a la derecha, haz clic en **Add User** -> **Create new user**.
4. Email: `m@m.com`
5. Contraseña: `mmmmmm`
6. Asegúrate de marcar **"Auto Confirm User"**.
7. Haz clic en **Create user**.

¡Listo! Ya puedes ir a `http://localhost:5173/auth`, meter `m@m.com` y `mmmmmm` y te dejará entrar inmediatamente.

### Paso 3 (Opcional): Desactivar Rate Limits (Para Desarrollo)
Si quieres poder registrar a 100 usuarios seguidos desde tu app web sin que Supabase te bloquee:
1. Ve a **Authentication** -> **Rate Limits**.
2. Donde dice "Email Provider", cambia el límite de "Signups" a un número grande (ej. 100 por hora).

---
*PD: He actualizado la aplicación web (`AuthScreen`) para que si llega a fallar algo de Supabase, en lugar de un error en inglés o un "Ocurrió un error", te muestre el mensaje exacto en español (ej. "Has intentado registrarte demasiadas veces", "La contraseña es muy corta", etc).*
