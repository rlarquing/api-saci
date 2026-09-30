# Feature: fix-apk-offline-sync

**Objective**: Reparar la sincronización offline de la APK contra el API SACP.

**Why**: Auditoría APK↔API encontró integraciones rotas que impiden operar sin conexión (Cuba, cortes de luz). El cache local de QRs nunca se puebla, el sync de parqueos nunca refresca y la hora real de salida offline se pierde al sincronizar.

**Scope**: API (`D:\jsprojects\api-sacp`) + APK (`D:\reactnativeprojects\apk-sacp`). Subido a `origin/main` (el usuario autorizó el push).

## Tasks

- [x] **T1 — QR sync: abrir endpoint y corregir forma** (CRÍTICO)
  - API: `qr.controller.ts` `findAll` — permitir `USUARIO` en `@Roles` (el service ya filtra por parqueos asignados para USUARIO; solo falta el rol).
  - APK: `QRRemoteDataSource.obtenerQRsPaginados` — la respuesta es Pagination directa `{items, meta}` (NO ListadoDto); corregir tipo `QRListadoResponseDto` y `return response.data`.
  - APK: `QRRepositoryImpl.sincronizarQRs` — leer `result.items` (no `result.data`) y `result.meta.totalPages`.
  - Criterio: `npm run build` + `npm run lint` en ambos repos. → PASS (API build+lint, APK tsc --noEmit)
- [x] **T2 — Parqueo sync: corregir forma** (MEDIO)
  - APK: `ParqueoRemoteDataSource` — el listado devuelve `ListadoDto {header, key, data: Pagination}` → leer `result.data.items` y `result.data.meta.totalPages`; corregir `ParqueoListadoResponseDto`.
  - Criterio: build + lint APK. → PASS
- [x] **T3 — fechaSalida real en la salida sincronizada** (MEDIO)
  - API: `update-movimiento.dto.ts` — declarar `fechaSalida?: string` (el ValidationPipe global tiene `whitelist: true`, campos no declarados se descartan).
  - API: `movimiento.service.update()` — usar la `fechaSalida` enviada (validar ISO, no futura, <=7 días) en vez de estampar `new Date()`; default `new Date()` si no llega.
  - API: `movimiento.mapper.dtoToUpdateEntity` — copiar `fechaSalida` si viene.
  - APK: `RegistrarSalidaRequestDto` — añadir `fechaSalida?: string`; `MovimientoMapper.toRegistrarSalidaRequest` — incluirlo cuando exista.
  - Criterio: build + lint ambos. → PASS
- [x] **T4 — Código muerto QR** (MENOR)
  - APK: eliminar `obtenerQR`, `obtenerQRPorId`, `obtenerQRsPorLote` de `QRRepository` (interface), `QRRepositoryImpl` y `QRRemoteDataSource` (+ constante `INFO` del mapa de endpoints). Sin llamadores (grep verificado).
  - Criterio: build + lint APK. → PASS
- [x] **T5 — No descartar pendiente cuando la entrada no sincronizó** (MENOR)
  - APK: `SincronizarUseCase` — el abort "La entrada asociada aún no está sincronizada" NO debe incrementar `reintentos` (hoy sí lo hace → tras 5 intentos se borra el pendiente y el server queda con el movimiento abierto para siempre). El comentario del código ya dice que no debería contar.
  - Criterio: build + lint APK. → PASS
- [x] **T6 — Reconciliación salieronHoy: fecha salida real via batch** (diferido → resuelto con Opción A)
  - API: nuevo `POST /api/movimiento/estado` (`VerificarEstadoMovimientosDto {codigos: string[]}`, máx 100) → `EstadoMovimientoDto[] {codigo, dentro, fechaSalida}`. Query `findByCodigosQr` (`$in` + `fechaEntrada DESC`, último por QR). Roles JEFE+USUARIO. Sin validación por parqueo (consistente con `GET /verificar/:qr`).
  - APK: `MovimientoRemoteDataSource.verificarEstadoMovimientos` (POST batch); `MovimientoLocalDataSource.reconciliarActivos` — 3er param `consultarFechasRemotas?: (codigos) => Promise<Record<codigo, fechaSalida|null>>`, dos pasadas (recolecta discrepantes → una llamada batch → cierra con la fecha real). `MovimientoRepositoryImpl.reconciliarMovimientosActivos` inyecta el callback (catch → `{}` = cierra con `new Date()`, comportamiento previo).
  - Criterio: build + lint API (PASS), tsc --noEmit APK (PASS).

## Verification (cada tarea)

- `npm run build` en el repo correspondiente
- `npm run lint -- --fix` en el repo correspondiente

## Constraints

- No commits ni push salvo pedido explícito del usuario.
- No simplificar validación en fronteras de confianza (`esErrorDeRed`, guards del API).
- Comentarios de código y UI en inglés (artefacto técnico); conversación en español.