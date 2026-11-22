# Integración QR

API para recibir notificaciones de pago QR y un panel para consultarlas. Next.js en Vercel y PostgreSQL en Neon.

## Endpoints

`POST /api/qr/login`

```json
{ "userName": "BGAQRUSER", "password": "..." }
```

Respuesta correcta:

```json
{
  "result": "COD000",
  "message": "Token generado exitosamente",
  "token": "<jwt>"
}
```

El token dura 5 minutos (`JWT_EXPIRES_SECONDS`) y usa HS256. Los claims `unique_name` y `role` salen de `JWT_UNIQUE_NAME` y `JWT_ROLE`.

`POST /api/qr/payments`

Requiere `Authorization: Bearer <token>`. Obligatorios: `qrId`, `transactionId` y `payDate` (`DDMMYYYY`). Si llegan, también se guardan `payHour`, `originAccount`, `originBank` y `amount`.

```json
{
  "qrId": "26112201018000000620",
  "transactionId": "800288796",
  "payDate": "14112026"
}
```

Respuesta correcta:

```json
{
  "result": "COD000",
  "message": "Notificación de pago recibida."
}
```

Cada aviso se guarda en `payment_notifications`, incluyendo el JSON recibido.

## Variables de entorno

Copia `.env.example` a `.env.local` en local. En Vercel, carga las mismas claves en Project Settings → Environment Variables:

- `DATABASE_URL`
- `QR_API_USERNAME`
- `QR_API_PASSWORD`
- `JWT_SECRET` (mínimo 32 caracteres; el mismo valor firma y verifica)
- `JWT_ISSUER`
- `JWT_AUDIENCE`
- `JWT_UNIQUE_NAME`
- `JWT_ROLE`
- `JWT_EXPIRES_SECONDS`
- `DASHBOARD_PASSWORD`

El usuario inicial del panel es `admin`. `DASHBOARD_PASSWORD` solo se usa para crear esa cuenta la primera vez, guardando salt y hash scrypt. No vuelve a leerse en los ingresos siguientes. En el primer ingreso, admin y cualquier usuario nuevo deben cambiar la contraseña. El administrador crea usuarios con rol cobrador y puede restablecer contraseñas. Administrador y cobrador consultan notificaciones y, en Cobros QR, generan códigos y consultan su estado.

Para generar cobros contra Banco Ganadero también hacen falta:

- `BG_QR_USERNAME`
- `BG_QR_PASSWORD`
- `BG_QR_API_KEY` (máximo 300 caracteres)
- `BG_QR_ACCOUNT_REFERENCE` (cuenta que recibe el abono)
- `BG_QR_BASE_URL` (termina en `/qrcode`; no tiene valor por defecto)

A esa base se le agrega el nombre de cada operación: `access`, `collections` y `status`. Una operación nueva se arma igual, sin otra variable.

El panel pide el token en `access` con `X-Api-Key`, genera el QR en `collections` y consulta `status` con `Authorization: Bearer` y `type` 2. El token se reutiliza hasta poco antes de su vencimiento. Cada generación y cada consulta de estado aceptan como máximo 20 y 30 solicitudes por minuto por usuario.

El login del panel acepta como máximo 10 intentos cada 30 minutos por dirección IP. El usuario y la contraseña solo pueden ser alfanuméricos; cualquier otro carácter se rechaza y la consulta sigue siendo parametrizada. `POST /api/qr/login` y `POST /api/qr/payments` aceptan como máximo 20 solicitudes por minuto cada uno, también por IP. Al superar el límite responden `COD429`.

## Base de datos

```bash
pnpm db:push
```

Eso crea la tabla en Neon. El driver HTTP de Neon (`@neondatabase/serverless`) se usa en runtime para que las funciones de Vercel no mantengan un pool TCP.

## Local

```bash
pnpm dev
```

## Vercel

El proyecto usa el runtime Node por defecto, sin Edge. Importa el repositorio en Vercel, define las variables y despliega. La tabla tiene que existir antes: ejecuta `pnpm db:push` contra la misma `DATABASE_URL`.

## Estructura

- `src/app/api/qr` — adaptadores HTTP, sin lógica de negocio
- `src/modules/qr-auth` — login y JWT
- `src/modules/qr-payments` — validación, persistencia y consulta
- `src/modules/bg-qr` — token, generación y estado en Banco Ganadero
- `src/modules/dashboard` — sesión del panel
- `src/shared` — entorno, base de datos y respuestas HTTP
- `src/components` — interfaz con shadcn/ui

Un endpoint nuevo entra como otro módulo y una ruta delgada en `src/app/api`.
