# Cierre diario automático (00:00)

- **Estado**: completo
- **Rama**: main
- **Commit**: `47310a0` feat(registro-diario): cierre diario automatico a las 00:00
- **Objetivo**: que el servidor cierre automáticamente a las 00:00 los registros diarios que hayan quedado abiertos, para que al día siguiente todo esté cerrado sin depender de que alguien cierre manualmente.

## Problema / Por qué

- El cierre manual existe (`PATCH /registro-diario/cerrar/:id`), pero si nadie cierra el día, el registro queda `abierto` para siempre.
- Ya hay una llamada **sin commitear** (sesión previa) a `cerrarRegistrosAnteriores(fecha, parqueoId)` en `findOrCreateRegistroDiario`, pero el método **no existe** → el build está roto en main.
- `@nestjs/schedule` ya está instalado y `ScheduleModule.forRoot()` activo vía `SharedModule` → solo falta el job.

## Alcance

- Implementar `cerrarRegistrosAnteriores(fecha, parqueoId?)` en `RegistroDiarioRepository` (arregla el call pendiente).
- Añadir método `@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)` en `RegistroDiarioService` (sin archivos ni providers nuevos).
- Fuera de alcance: cerrar movimientos abiertos (los movimientos cobran a la entrada; el cierre manual no los toca → paridad).

## Tareas

- [x] T1 Implementar `cerrarRegistrosAnteriores` en el repositorio (cierra `abierto` con `fecha < hoy`; `parqueoId` opcional = global).
- [x] T2 Añadir `@Cron` 00:00 en `RegistroDiarioService` que cierre todos los abiertos anteriores y loguee la cantidad.
- [x] T3 Verificar: `npm run build` + `npm run lint` (generated files excluidos).

## Checks aplicables

- Build: `npm run build`
- Lint: `npm run lint`

## Criterios de aceptación

- Al abrir un día nuevo, los días anteriores del parqueo quedan cerrados (backstop).
- A las 00:00 (hora del servidor), todos los registros `abierto` con fecha anterior se cierran automáticamente.
- Un registro del día actual abierto NO se cierra.
- Build y lint pasan.

## Decisiones

- El cron usa hora local del servidor (`CronExpression.EVERY_DAY_AT_MIDNIGHT`), igual que el resto de la lógica de fechas (`new Date()` con setHours local).
- `updatedAt` se setea manualmente en el updateMany porque los hooks de TypeORM no corren en operaciones crudas de MongoDB.

## Progreso

- T1 ✅ Implementado `cerrarRegistrosAnteriores(fecha, parqueoId?)` (count + updateMany, `$set estado:'cerrado'` + `updatedAt`).
- T2 ✅ Cron `EVERY_DAY_AT_MIDNIGHT` (00:00 hora servidor) en `RegistroDiarioService.cierreDiarioAutomatico()`; loguea cantidad cerrada.
- T3 ✅ `npm run lint` limpio y `npm run build` OK.
- Nota: `npm run lint --fix` normalizó 5 archivos ajenos con autofixes de estilo preexistentes (health.controller, 3 DTOs de eventos, spec movimiento) — churn de formateo, no lógica.