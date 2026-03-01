# Changelog

## [Unreleased] - 2026-03-01

### 🔐 Seguridad y Autorización
- Endurecimiento general de backend para requerir `sessionToken` y validar membresía familiar en módulos funcionales.
- Aislamiento por familia reforzado con validación por recurso (`familyId` derivado del documento) para evitar acceso cruzado.
- Módulo `games` migrado a autorización por sesión y acceso familiar estricto.
- Helpers del agente para gastos migrados a `internalQuery/internalMutation` para eliminar exposición pública.

### 👨‍👩‍👧‍👦 Invitaciones y Familias
- Flujo de invitación reforzado con validación combinada `inviteToken + email + familyId`.
- Bloqueo de aceptación cuando el correo de sesión no coincide con correo invitado.
- Invitaciones pendientes filtradas por vigencia (no mostrar expiradas).
- Mejora en UX de login con invitación inválida/expirada.
- Modal de invitación ajustado para compartir solo links seguros con token (no link genérico).

### 🧹 Refactor y Consistencia
- Utilidades legacy de familia alineadas al modelo de sesión actual (`sessionToken`).
- Homogeneización de patrones de auth/autorización entre módulos.
- Limpieza incremental de firmas y payloads para evitar campos sensibles enviados por frontend.

### ✅ Validación
- `npm run lint`: sin errores ni warnings.
- `npm run build`: correcto (warning conocido no bloqueante de DaisyUI `@property`).

## [Previous] - 2026-01-11

### ✨ Nuevas Funcionalidades
- **Panel de SuperAdmin**: Nuevo dashboard en `/admin` accesible solo para superadministradores.
  - **Resumen**: Estadísticas en tiempo real de familias, usuarios e invitaciones. Visualización de familias recientes.
  - **Gestión de Usuarios**: Tabla para listar todos los usuarios del sistema con opciones para eliminar usuarios (protegido).
- **Perfil de Usuario**: Nuevo acceso "Perfil" en el menú "Más" que redirige a la configuración de usuario.

### 🛡 Mejora de Código y Calidad
- **Corrección de Linting**: Se eliminaron usos de `any` en módulos administrativos, implementando tipos estrictos.
- **Optimización de Build**: Se solucionaron errores de resolución de módulos de Vite/Rollup eliminando dependencias externas en el código del cliente.
- **Refactorización de Tipos**: Definición local de tipos `Id` para compatibilidad estructural con Convex.

### 🐛 Correcciones
- **Autenticación**: Mejora en la lógica de aceptación automática de invitaciones.
- **Tipado**: Resolución de advertencias de TypeScript en componentes de administración.
