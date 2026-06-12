/**
 * Solo para builds nativos (Android / iOS con Capacitor).
 * Ejecutá: `npm run build:capacitor` antes de `npx cap sync`.
 *
 * En el celular NO existe el proxy de `ng serve`: `/api` se resolvería contra
 * el WebView (http://localhost) y terminaría mal. Por eso acá va URL absoluta.
 *
 * - Emulador Android (backend en la misma PC): `http://10.0.2.2:4000/api`
 * - Celular físico (misma Wi‑Fi): IP de tu PC, ej. `http://192.168.0.106:4000/api`
 * - Producción: `https://tu-api.com/api`
 */
export const environment = {
  production: true,
  apiBaseUrl: 'http://10.0.2.2:4000/api',
};
