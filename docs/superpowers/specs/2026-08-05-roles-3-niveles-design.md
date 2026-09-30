# Design: Roles de seguridad de 3 niveles (ADMINISTRADOR / JEFE_DE_PARQUEOS / USUARIO)

**Date:** 2026-08-05
**Status:** Aprobado

## Contexto / Problema

Hoy existen solo dos roles: `ADMINISTRADOR` y `USUARIO`. El rol `ADMINISTRADOR`
cumple dos funciones a la vez: administrar el sistema **y** tener acceso a toda la
data de negocio (el BI lo trata como "ve todos los parqueos"). El admin de sistema
no tiene parqueos asignados (solo hace administración), por lo que entrar a la capa
de negocio es incorrecto y generó errores de scope (p.ej. el 400 de ObjectId en
`GET /bi/dashboard`).

Se define un modelo de **3 niveles de seguridad y funcionalidad**.

## Roles

| Rol               | Web | App (apk) | Alcance de datos        | Responsabilidad |
|-------------------|-----|-----------|-------------------------|-----------------|
| `ADMINISTRADOR`   | Sí  | No        | Sin negocio, sin parqueos | Usuarios, roles, funciones, menús, nomencladores, sync config, logs |
| `JEFE_DE_PARQUEOS`(nuevo) | Sí | Sí | Sus parqueos (muchos-a-muchos); BI general o por parqueo | BI, operación diaria, crear/modificar precios, generar/gestionar QR, reportes |
| `USUARIO` (trabajador) | No | Sí | Sus parqueos | Entrada/salida (incluye validar QR), cierre diario. NO precios, NO generar QR |

## Reglas de acceso por módulo

| Módulo | Rol(es) habilitado(s) |
|--------|-----------------------|
| BI (`bi.controller`) | `JEFE_DE_PARQUEOS` |
| QR — generar/gestionar (`qr.controller`) | `JEFE_DE_PARQUEOS` |
| QR — validar/usar (entrada/salida) (`qr.controller`) | `JEFE_DE_PARQUEOS`, `USUARIO` |
| Movimiento — entrada/salida + consultas operativas (`movimiento.controller`) | `JEFE_DE_PARQUEOS`, `USUARIO` |
| Registro diario — cierre/consulta (`registro-diario.controller`) | `JEFE_DE_PARQUEOS`, `USUARIO` |
| Sync (`sync.controller`) | `JEFE_DE_PARQUEOS`, `USUARIO` |
| Precio (`precio.controller`) | `JEFE_DE_PARQUEOS` |
| Sistema: nomenclador, users, roles, funciones, menús, endpoints, logs | `ADMINISTRADOR` |
| Auth `change-password` | `ADMINISTRADOR`, `JEFE_DE_PARQUEOS`, `USUARIO` |

El `PermissionGuard` (granularidad fino: `funciones → endpoints`) y el menú dinámico
se configuran desde el front por el administrador; no cambian en el backend.

## Alcance de datos (backend)

Eliminar el "el ADMIN ve todos los parqueos". Todo acceso de negocio se acota a
`user.parqueoIds` (JEFE y USUARIO ven solo sus parqueos). Se remueve el bypass de
negocio `isAdministrador()` de:

- `src/core/service/bi.service.ts`
- `src/core/service/movimiento.service.ts`
- `src/core/service/qr.service.ts`
- `src/api/controller/registro-diario.controller.ts`

El BI ya soporta "general vs por parqueo": el dashboard agrega el total consolidado
de los parqueos del usuario y entrega el desglose por parqueo (`parqueos[]`), y los
endpoints de KPIs/analisis/tendencias aceptan un `parqueoId` opcional restringido a
los parqueos del usuario. No requiere cambios estructurales.

## Cambios concretos

1. `src/shared/enum/rol-type.enum.ts` → agregar `JEFE_DE_PARQUEOS = 'JEFE_DE_PARQUEOS'`.
2. `src/core/service/rol.service.ts` → en `crearRoles()` sembrar el rol `JEFE_DE_PARQUEOS`
   (descripción: "Tiene acceso completo al negocio de sus parqueos asignados").
3. Actualizar decordadores `@Roles(...)` en los controladores según la tabla de acceso.
4. Remover el bypass `isAdministrador()` de negocio en los 4 puntos listados.
5. Permisos/menú del rol JEFE: asignados por el admin desde el front (sin código).

## Fuera de alcance

- No se cambia el modelo de permisos (`funciones`/`endpoints`, `PermissionGuard`).
- No se implementa frontend web (menú dinámico y asignación de permisos se configuran en la UI).
- No se migran datos: los roles existentes (`ADMINISTRADOR`, `USUARIO`) se conservan; el rol
  nuevo se crea al ejecutar `crearRoles()`.

## Verificación

- Compilar: `npm run build` (tsc sin errores).
- Reiniciar en dev para que `crearRoles()` siembre el rol nuevo.
- Login como cada rol y comprobar que solo alcanza sus endpoints/parqueos.