# Archivo de Tareas Completadas

Este directorio guarda el historial **granular** de tareas completadas por mes. Es complementario al `CHANGELOG.md` (que tiene historial de releases por feature): esta carpeta baja al nivel de tarea individual.

## Estructura

- **Un archivo por mes**, nombrado `YYMM.md`:
  - `2604.md` = abril 2026
  - `2603.md` = marzo 2026
  - `2512.md` = diciembre 2025
- Dentro de cada archivo, las tareas se agrupan por **fecha de completado** bajo un header `## YYYY-MM-DD: <descripción breve>`.

## Reglas

1. **Un archivo por mes** — todas las tareas completadas en ese mes van al mismo archivo.
2. **Fecha por sección** — agrupar por fecha de completado, `## YYYY-MM-DD: <descripción>`.
3. **Referenciar la task key** — si viene de `docs/TASK_TODO.md` con una key como `ACTIVITIES-CORE`, reusar la key para poder linkear.
4. **Detallar qué se hizo** — los items completados van como `- [x]` checkboxes bajo el subheader de la tarea.
5. **Incluir contexto** — una nota breve al final de cada sección con decisiones, alternativas descartadas, dependencias resueltas. Referencia commits con el hash corto (p. ej. `commit c8bb506`).
6. **Nada de bloques de código** — el código vive en git. En lugar de pegar código, referenciar rutas de archivos y nombres de funciones/componentes (ej: "modificado `convex/household.ts`, agregado `requireFamilyAccessFromSession` a `logActivity`").
7. **Mover, no copiar** — cuando una tarea pasa de pendiente a completada, se remueve de `TASK_TODO.md` y se agrega aquí. El estado es mutuamente exclusivo.
8. **Preservar `added:`** — al archivar, mantener la fecha original de creación de la tarea junto con la fecha de completado. Así queda visible cuánto vivió la tarea en el backlog.

## Relación con CHANGELOG.md

- `CHANGELOG.md` → historial de releases / versiones / features shipped, agrupado por fecha de release y orientado a un lector externo (usuarios, contributors nuevos).
- `TASK_COMPLETED/YYMM.md` → log granular de trabajo día a día, orientado a tracking interno y continuidad entre sesiones.

Ambas fuentes conviven: el CHANGELOG resume, el archivo mensual detalla.
