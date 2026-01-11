# Changelog

## [Unreleased] - 2026-01-11

### ✨ Nuevas Funcionalidades
-   **Panel de SuperAdmin**: Nuevo dashboard en `/admin` accesible solo para superadministradores.
    -   **Resumen**: Estadísticas en tiempo real de familias, usuarios e invitaciones. Visualización de familias recientes.
    -   **Gestión de Usuarios**: Tabla para listar todos los usuarios del sistema con opciones para eliminar usuarios (protegido).
-   **Perfil de Usuario**: Nuevo acceso "Perfil" en el menú "Más" que redirige a la configuración de usuario.

### 🛡 Mejora de Código y Calidad
-   **Corrección de Linting**: Se eliminaron todos los usos de `any` en el módulo de administración y dashboard, implementando tipos estrictos.
-   **Optimización de Build**: Se solucionaron errores de resolución de módulos de Vite/Rollup eliminando dependencias externas en el código del cliente.
-   **Refactorización de Tipos**: Definición local de tipos `Id` para asegurar compatibilidad estructural con Convex sin importar archivos generados fuera del scope de compilación.

### 🐛 Correcciones
-   **Autenticación**: Mejora en la lógica de aceptación automática de invitaciones.
-   **Tipado**: Resolución de advertencias de TypeScript en componentes de administración.
