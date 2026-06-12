export const environment = {
  production: true,
  // Misma base que en dev: el navegador pide /api al mismo host (ng serve + proxy, o tu nginx en prod).
  // Antes de publicar en internet con API en otro dominio, cambiá esto a la URL absoluta del backend.
  apiBaseUrl: '/api',
};
