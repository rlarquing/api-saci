# Feature: apk-solo-jefe-cierra-dia

**Objective**: Quitar de la APK toda capacidad de hacer cierres diarios. El cliente indicó que por seguridad solo el jefe del parqueo cierra el día.

**Why**: Un usuario de la APK podía cerrar el registro diario desde el teléfono. La política del cliente: el cierre diario es exclusivo del jefe del parqueo.

**Scope**: APK (`D:\reactnativeprojects\apk-sacp`) — borrar la cadena de cierre; API (`D:\jsprojects\api-sacp`) — restringir el endpoint de cierre a solo JEFE. Subido a `origin/main` (el usuario autorizó el push).

## Tasks

- [x] **T1 — Quitar la lógica de cierre de la APK** (seguridad)
  - Borrada la cadena completa: `CerrarRegistroDiarioUseCase`, `RegistroDiarioRepository` (interface), `RegistroDiario` (entidad), `RegistroDiarioRepositoryImpl`, `RegistroDiarioRemoteDataSource` (GET `/actual` + PATCH `/cerrar/:id`), export de los 3 barrels del dominio, `RegistroDiarioDto` del barrel de dtos (el `DetallePorTipoDto` compartido con `ResumenParqueoDto` se conserva), y los 11 puntos del `ServiceContainer` (imports, campos, instanciación, getters `registroDiario` y `cerrarRegistroDiario`).
  - Pantalla `app/(main)/cierre-diario.tsx` borrada junto a sus accesos: `Stack.Screen name="cierre-diario"` en `app/(main)/_layout.tsx` y la entrada del menú (`goToCierreDiario` + `options.push`) en `app/(main)/index.tsx`.
  - La pantalla estaba en `app/` (Expo Router), NO en `src/presentation` — por eso el grep inicial en `src` no la veía. El tsc la delató.
- [x] **T2 — Restringir el cierre en el API a solo JEFE** (seguridad)
  - `registro-diario.controller.ts` — `@Patch('/cerrar/:id')`: `@Roles(JEFE_DE_PARQUEOS, USUARIO)` → `@Roles(JEFE_DE_PARQUEOS)`; summary actualizado.
  - La lectura (`GET /actual`, `GET /:id`) sigue permitiendo USUARIO (solo lectura, la política no la toca).

## Verification

- APK: `npx tsc --noEmit` → PASS; grep global de `RegistroDiario|registroDiario|registro-diario|cierre-diario|CierreDiario` → cero referencias.
- API: `npm run build` + `npm run lint -- --fix` → PASS.

## Constraints

- No commits ni push salvo pedido explícito del usuario.