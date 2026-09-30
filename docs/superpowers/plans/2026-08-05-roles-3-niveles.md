# Roles de 3 Niveles (ADMINISTRADOR / JEFE_DE_PARQUEOS / USUARIO) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separar la administración del sistema (rol ADMINISTRADOR, sin acceso a datos de negocio) del negocio de parqueos (rol JEFE_DE_PARQUEOS, acceso completo solo a sus parqueos; rol USUARIO, solo operación: entrada/salida + validar QR + cierre diario).

**Architecture:** El gate `RolGuard` ya lee `@Roles` de cada handler y comprueba `user.roles[].nombre`. El cambio se hace en tres capas: (1) añadir `JEFE_DE_PARQUEOS` al enum y sembrarlo, (2) reetiquetar `@Roles(...)` en los controladores de negocio (bi, movimiento, qr, registro-diario, sync, precio) para quitar ADMINISTRADOR y distribuir entre JEFE_DE_PARQUEOS y USUARIO, (3) eliminar los bypass de `isAdministrador()` en los servicios de negocio para que todo acceso quede filtrado por `user.parqueoIds`. El modelo sigue siendo que JEFE y USUARIO ven/operan solo sobre sus parqueos asignados.

**Tech Stack:** NestJS, TypeScript, @nestjs/passport + RolGuard/PermissionGuard, decorador `@Roles`, Mongo (TypeORM ODM), Swagger.

**Spec:** `docs/superpowers/specs/2026-08-05-roles-3-niveles-design.md`

---

## Tabla de acceso (fuente de verdad para todas las tareas)

| Recurso / endpoint | ADMINISTRADOR | JEFE_DE_PARQUEOS | USUARIO |
| --- | --- | --- | --- |
| `bi/*` (todo) | ❌ | ✅ | ❌ |
| `sync/` + `sync/status` | ❌ | ✅ | ✅ |
| `precio/*` (todo) | ❌ | ✅ | ❌ |
| `movimiento/activos`, `movimiento/resumen/:parqueoId`, `movimiento/verificar/:qr`, `movimiento/:id`, `movimiento/crear/select`, `movimiento/` (POST), `movimiento/multiple` (POST), `movimiento/:id` (PATCH), `movimiento/filtrar`, `movimiento/buscar` | ❌ | ✅ | ✅ |
| `movimiento/` (GET listado), `movimiento/elementos/multiples`, `movimiento/importar/elementos`, `movimiento/elementos/multiples` (PATCH), `movimiento/:id` (DELETE), `movimiento/elementos/multiples` (DELETE) | ❌ | ✅ | ❌ |
| `qr/validar` | ❌ | ✅ | ✅ |
| `qr/generar`, `qr/`, `qr/lotes`, `qr/lote/:loteId`, `qr/pdf/:loteId`, `qr/:id`, `qr/codigo/:codigo`, `qr/tipo-medio/:tipoMedioId`, `qr/disponibles/:tipoMedioId`, `qr/:id` (DELETE), `qr/elementos/multiples` (DELETE), `qr/lote/:loteId` (DELETE), `qr/:id/anular`, `qr/anular/elementos/multiples` | ❌ | ✅ | ❌ |
| `registro-diario/` (GET), `registro-diario/:id`, `registro-diario/filtrar`, `registro-diario/buscar` | ❌ | ✅ | ❌ |
| `registro-diario/cerrar/:id`, `registro-diario/actual/:parqueoId` | ❌ | ✅ | ✅ |

**Principio de la transformación en servicios:** bajo el nuevo modelo nadie con acceso a un endpoint de negocio es ADMINISTRADOR, así que toda rama `isAdministrador` se elimina y el filtrado por `user.parqueoIds` se aplica siempre. JEFE y USUARIO tienen `parqueoIds` asignados.

---

### Task 1: Añadir `JEFE_DE_PARQUEOS` al enum

**Files:**
- Modify: `src/shared/enum/rol-type.enum.ts`

- [ ] **Step 1: Editar el enum**

Reemplazar todo el contenido por:

```ts
export enum RolType {
  ADMINISTRADOR = 'ADMINISTRADOR',
  JEFE_DE_PARQUEOS = 'JEFE_DE_PARQUEOS',
  USUARIO = 'USUARIO',
}
```

- [ ] **Step 2: Compilar**

Run: `npm run build`
Expected: PASS (sin errores).

- [ ] **Step 3: Commit**

```bash
git add src/shared/enum/rol-type.enum.ts
git commit -m "feat(roles): add JEFE_DE_PARQUEOS enum value"
```

---

### Task 2: Sembrar el rol `JEFE_DE_PARQUEOS`

**Files:**
- Modify: `src/core/service/rol.service.ts:28-49`

- [ ] **Step 1: Añadir el rol al seed en `crearRoles()`**

Reemplazar el bloque `crearRoles()` (líneas 28-49) por:

```ts
  async crearRoles(): Promise<void> {
    const rolAdmin: RolEntity = new RolEntity({
      nombre: RolType.ADMINISTRADOR,
      descripcion: 'Tiene todos los permisos de la administración del sistema',
    });
    const existeAdmin: RolEntity = await this.rolRepository.findByNombre(
      RolType.ADMINISTRADOR,
    );
    if (!existeAdmin) {
      await this.rolRepository.create(rolAdmin);
    }
    const rolJefe: RolEntity = new RolEntity({
      nombre: RolType.JEFE_DE_PARQUEOS,
      descripcion: 'Gestiona el negocio de parqueos (BI, precios, QRs, reportes)',
    });
    const existeJefe: RolEntity = await this.rolRepository.findByNombre(
      RolType.JEFE_DE_PARQUEOS,
    );
    if (!existeJefe) {
      await this.rolRepository.create(rolJefe);
    }
    const rolUsuario: RolEntity = new RolEntity({
      nombre: RolType.USUARIO,
      descripcion: 'Opera la entrada/salida, valida QRs y cierra el día',
    });
    const existeUsuario: RolEntity = await this.rolRepository.findByNombre(
      RolType.USUARIO,
    );
    if (!existeUsuario) {
      await this.rolRepository.create(rolUsuario);
    }
  }
```

> Nota operativa: `crearRoles()` corre en bootstrap dev; en el entorno real habrá que ejecutarlo una vez o crear el rol manualmente, y asignar `JEFE_DE_PARQUEOS` a los usuarios que hoy son ADMINISTRADOR y gestionan parqueos (ver Task de despliegue).

- [ ] **Step 2: Compilar**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/core/service/rol.service.ts
git commit -m "feat(roles): seed JEFE_DE_PARQUEOS role"
```

---

### Task 3: Reetiquetar `bi.controller.ts` → solo JEFE_DE_PARQUEOS

**Files:**
- Modify: `src/api/controller/bi.controller.ts`

- [ ] **Step 1: Reemplazar todas las anotaciones `@Roles(...)`**

Cada handler actualmente tiene `@Roles(RolType.ADMINISTRADOR, RolType.USUARIO)` (o similar con ADMINISTRADOR). Para **todos** los endpoints del controlador, reemplazar la línea por:

```ts
  @Roles(RolType.JEFE_DE_PARQUEOS)
```

Usa find/replace del literal `RolType.ADMINISTRADOR, RolType.USUARIO` → `RolType.JEFE_DE_PARQUEOS`, y revisa que no quede ninguna referencia a `ADMINISTRADOR` ni `USUARIO` en el archivo.

- [ ] **Step 2: Compilar**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/api/controller/bi.controller.ts
git commit -m "feat(roles): BI endpoints JEFE_DE_PARQUEOS only"
```

---

### Task 4: Quitar bypass de `isAdministrador` en `bi.service.ts`

**Files:**
- Modify: `src/core/service/bi.service.ts`

- [ ] **Step 1: Eliminar el helper `isAdministrador`**

Reemplazar (líneas 39-44):

```ts
  /**
   * Verifica si el usuario tiene el rol de ADMINISTRADOR
   */
  private isAdministrador(user: UserEntity): boolean {
    return user.roles?.some((rol) => rol.nombre === RolType.ADMINISTRADOR) || false;
  }
```

por nada (borrar el bloque). Si `RolType` deja de usarse en este archivo, quitar su import.

- [ ] **Step 2: Simplificar `validarAccesoParqueo`**

Reemplazar (líneas 46-59):

```ts
  private validarAccesoParqueo(user: UserEntity, parqueoId: string): void {
    if (this.isAdministrador(user)) {
      return; // Admin tiene acceso a todo
    }
    if (!user.parqueoIds || user.parqueoIds.length === 0) {
      throw new BadRequestException('El usuario no tiene parqueos asignados');
    }
    if (!user.parqueoIds.includes(parqueoId)) {
      throw new ForbiddenException('No tiene autorización para acceder a este parqueo');
    }
  }
```

por:

```ts
  private validarAccesoParqueo(user: UserEntity, parqueoId: string): void {
    if (!user.parqueoIds || user.parqueoIds.length === 0) {
      throw new BadRequestException('El usuario no tiene parqueos asignados');
    }
    if (!user.parqueoIds.includes(parqueoId)) {
      throw new ForbiddenException('No tiene autorización para acceder a este parqueo');
    }
  }
```

- [ ] **Step 3: Simplificar `filtrarParqueosUsuario`**

Reemplazar (líneas 61-67):

```ts
  private filtrarParqueosUsuario(user: UserEntity, parqueoIdsSolicitados?: string[]): string[] {
    if (this.isAdministrador(user)) {
      return parqueoIdsSolicitados || [];
    }
```

por:

```ts
  private filtrarParqueosUsuario(user: UserEntity, parqueoIdsSolicitados?: string[]): string[] {
```

(se elimina la rama admin; el resto de la función queda igual).

- [ ] **Step 4: Simplificar `getAllParqueos`**

Reemplazar (líneas 611-620):

```ts
  private async getAllParqueos(user: UserEntity): Promise<any[]> {
    if (this.isAdministrador(user)) {
      return await this.genericNomencladorRepository.get(NomencladorTypeEnum.PARQUEO);
    }
    
    if (!user.parqueoIds || user.parqueoIds.length === 0) {
      return [];
    }
    return await this.getParqueosByIds(user.parqueoIds);
  }
```

por:

```ts
  private async getAllParqueos(user: UserEntity): Promise<any[]> {
    if (!user.parqueoIds || user.parqueoIds.length === 0) {
      return [];
    }
    return await this.getParqueosByIds(user.parqueoIds);
  }
```

> Si al quitar estas ramas `NomencladorTypeEnum` deja de usarse en `bi.service.ts`, quitar su import. Verifica con el compilador.

- [ ] **Step 5: Compilar**

Run: `npm run build`
Expected: PASS (sin imports sin usar ni referencias colgadas).

- [ ] **Step 6: Commit**

```bash
git add src/core/service/bi.service.ts
git commit -m "fix(roles): remove admin bypass in BI service, scope by parqueoIds"
```

---

### Task 5: Reetiquetar `movimiento.controller.ts`

**Files:**
- Modify: `src/api/controller/movimiento.controller.ts`

- [ ] **Step 1: Endpoints operativos → `JEFE_DE_PARQUEOS, USUARIO`**

Para estos handlers, reemplazar `@Roles(RolType.ADMINISTRADOR, RolType.USUARIO)` por `@Roles(RolType.JEFE_DE_PARQUEOS, RolType.USUARIO)`:
`getVehiculosDentro` (GET /activos), `getResumenParqueo` (GET /resumen/:parqueoId), `verificarQr` (GET /verificar/:qrEscaneado), `findById` (GET /:id), `createSelect` (GET /crear/select), `create` (POST /), `createMultiple` (POST /multiple), `update` (PATCH /:id), `filter` (POST /filtrar), `search` (POST /buscar).

- [ ] **Step 2: Endpoints de gestión → solo `JEFE_DE_PARQUEOS`**

Para estos handlers, reemplazar `@Roles(RolType.ADMINISTRADOR)` (y cualquier `@Roles(RolType.ADMINISTRADOR, RolType.USUARIO)`) por `@Roles(RolType.JEFE_DE_PARQUEOS)`:
`findAll` (GET /), `findByIds` (POST /elementos/multiples), `import` (POST /importar/elementos), `updateMultiple` (PATCH /elementos/multiples), `delete` (DELETE /:id), `deleteMultiple` (DELETE /elementos/multiples).

- [ ] **Step 3: Verificar que no quede `ADMINISTRADOR` en el archivo**

Busca `ADMINISTRADOR` en `src/api/controller/movimiento.controller.ts`. No debe haber coincidencias.

- [ ] **Step 4: Compilar**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/controller/movimiento.controller.ts
git commit -m "feat(roles): split movimiento endpoints by JEFE/USUARIO"
```

---

### Task 6: Quitar bypass de `isAdministrador` en `movimiento.service.ts`

**Files:**
- Modify: `src/core/service/movimiento.service.ts`

- [ ] **Step 1: Eliminar helper y rama admin en `validarAccesoParqueo`**

Reemplazar (líneas 52-76):

```ts
  /**
   * Verifica si el usuario tiene el rol de ADMINISTRADOR
   */
  private isAdministrador(user: UserEntity): boolean {
    return (
      user.roles?.some((rol) => rol.nombre === RolType.ADMINISTRADOR) || false
    );
  }

  /**
   * Valida que el usuario tenga acceso al parqueo especificado
   */
  private validarAccesoParqueo(user: UserEntity, parqueoId: string): void {
    if (this.isAdministrador(user)) {
      return; // Admin tiene acceso a todo
    }
    if (!user.parqueoIds || user.parqueoIds.length === 0) {
      throw new BadRequestException('El usuario no tiene parqueos asignados');
    }
    if (!user.parqueoIds.includes(parqueoId)) {
      throw new ForbiddenException(
        'No tiene autorización para operar en este parqueo',
      );
    }
  }
```

por:

```ts
  /**
   * Valida que el usuario tenga acceso al parqueo especificado
   */
  private validarAccesoParqueo(user: UserEntity, parqueoId: string): void {
    if (!user.parqueoIds || user.parqueoIds.length === 0) {
      throw new BadRequestException('El usuario no tiene parqueos asignados');
    }
    if (!user.parqueoIds.includes(parqueoId)) {
      throw new ForbiddenException(
        'No tiene autorización para operar en este parqueo',
      );
    }
  }
```

Si `RolType` deja de usarse, quitar su import.

- [ ] **Step 2: Compilar**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/core/service/movimiento.service.ts
git commit -m "fix(roles): remove admin bypass in movimiento service"
```

---

### Task 7: Reetiquetar `qr.controller.ts`

**Files:**
- Modify: `src/api/controller/qr.controller.ts`

- [ ] **Step 1: `validarQR` → `JEFE_DE_PARQUEOS, USUARIO`**

En el handler `validarQR` (GET /validar), reemplazar `@Roles(RolType.ADMINISTRADOR, RolType.USUARIO)` por `@Roles(RolType.JEFE_DE_PARQUEOS, RolType.USUARIO)`.

- [ ] **Step 2: Todo lo demás → solo `JEFE_DE_PARQUEOS`**

Para todos los demás handlers (`generateQrs`, `findAll`, `getLotes`, `findByLote`, `downloadPdf`, `findById`, `findByCodigo`, `findByTipoMedio`, `countDisponibles`, `delete`, `deleteMultiple`, `deleteLote`, `anular`, `anularMultiple`), reemplazar `@Roles(RolType.ADMINISTRADOR, RolType.USUARIO)` por `@Roles(RolType.JEFE_DE_PARQUEOS)`.

- [ ] **Step 3: Verificar**

Busca `ADMINISTRADOR` y `USUARIO` en `src/api/controller/qr.controller.ts`. Deben quedar solo la línea de `validarQR` (con `USUARIO`), y ninguna con `ADMINISTRADOR`.

- [ ] **Step 4: Compilar**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/controller/qr.controller.ts
git commit -m "feat(roles): QR generate/manage JEFE only, validate JEFE+USUARIO"
```

---

### Task 8: Quitar bypass de `isAdministrador` en `qr.service.ts`

**Files:**
- Modify: `src/core/service/qr.service.ts`

- [ ] **Step 1: Eliminar el helper `isAdministrador`**

Reemplazar (líneas 56-59):

```ts
  private isAdministrador(user: UserEntity): boolean {
    return user.roles?.some((rol) => rol.nombre === RolType.ADMINISTRADOR) || false;
  }
```

por nada (borrar el bloque). Si `RolType` deja de usarse, quitar su import.

- [ ] **Step 2: Reemplazar los usos de `isAdmin` por scope fijo**

Para cada ocurrencia del patrón `const isAdmin = this.isAdministrador(user);` seguido de `const parqueoIds = isAdmin ? undefined : user.parqueoIds;`, reemplazar ambas líneas por una sola:

```ts
    const parqueoIds = user.parqueoIds;
```

Esto aplica en los métodos en estas líneas (actuales): 246-247, 380 (ver contexto), 430-431, 445-446, 470-471, 514-515, 536-537, 758-759. Lee cada bloque antes de editar para confirmar que el patrón es exacto.

- [ ] **Step 3: Reemplazar usos de `isAdmin` en `generateQrs` (línea 93)**

Lee el bloque alrededor de la línea 93. Donde se decida el parqueo (hoy `isAdmin ? ... : user.parqueoIds` o rama admin), eliminar la rama admin y usar siempre `user.parqueoIds` / el parqueo del DTO validado contra `user.parqueoIds`. El resultado debe ser que un JEFE solo puede generar QRs para sus parqueos.

- [ ] **Step 4: Simplificar los bloques con `isAdmin` en operaciones de anulado/eliminación (líneas 670, 800)**

Lee los bloques de `anular`, `delete`, etc. donde aparece `const isAdmin = this.isAdministrador(user);`. Elimina la rama `if (isAdmin) {...}` y conserva únicamente la validación por `user.parqueoIds` (el patrón `if (!user.parqueoIds || ...) throw` + `if (!user.parqueoIds.includes(objEntity.parqueoId)) throw`).

- [ ] **Step 5: Compilar**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/core/service/qr.service.ts
git commit -m "fix(roles): remove admin bypass in QR service, scope by parqueoIds"
```

---

### Task 9: Reetiquetar `registro-diario.controller.ts` y quitar bypass

**Files:**
- Modify: `src/api/controller/registro-diario.controller.ts`

- [ ] **Step 1: Listado/búsqueda → solo `JEFE_DE_PARQUEOS`**

Para `findAll` (GET /), `findById` (GET /:id), `filter` (POST /filtrar), `search` (POST /buscar), reemplazar `@Roles(RolType.ADMINISTRADOR)` por `@Roles(RolType.JEFE_DE_PARQUEOS)`.

- [ ] **Step 2: Cierre y actual → `JEFE_DE_PARQUEOS, USUARIO`**

Para `cerrarRegistro` (PATCH /cerrar/:id) y `getRegistroActual` (GET /actual/:parqueoId), reemplazar `@Roles(RolType.ADMINISTRADOR, RolType.USUARIO)` por `@Roles(RolType.JEFE_DE_PARQUEOS, RolType.USUARIO)`.

- [ ] **Step 3: Eliminar `isAdministrador` y simplificar `validarAccesoParqueo`**

Reemplazar (líneas 48-68):

```ts
  /**
   * Verifica si el usuario tiene el rol de ADMINISTRADOR
   */
  private isAdministrador(user: UserEntity): boolean {
    return user.roles?.some((rol) => rol.nombre === RolType.ADMINISTRADOR) || false;
  }

  /**
   * Valida que el USUARIO tenga acceso al parqueo especificado
   */
  private validarAccesoParqueo(user: UserEntity, parqueoId: string): void {
    if (this.isAdministrador(user)) {
      return; // Admin tiene acceso a todo
    }
    if (!user.parqueoIds || user.parqueoIds.length === 0) {
      throw new ForbiddenException('El usuario no tiene parqueos asignados');
    }
    if (!user.parqueoIds.includes(parqueoId)) {
      throw new ForbiddenException('No tiene autorización para acceder a este parqueo');
    }
  }
```

por:

```ts
  /**
   * Valida que el JEFE/USUARIO tenga acceso al parqueo especificado
   */
  private validarAccesoParqueo(user: UserEntity, parqueoId: string): void {
    if (!user.parqueoIds || user.parqueoIds.length === 0) {
      throw new ForbiddenException('El usuario no tiene parqueos asignados');
    }
    if (!user.parqueoIds.includes(parqueoId)) {
      throw new ForbiddenException('No tiene autorización para acceder a este parqueo');
    }
  }
```

Si `RolType` deja de usarse en el import de línea 27, verifica con el compilador y quítalo si es necesario (probablemente siga usándose en `@Roles`, así que se conserva).

- [ ] **Step 4: Compilar**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/controller/registro-diario.controller.ts
git commit -m "feat(roles): split registro-diario by JEFE/USUARIO, drop admin bypass"
```

---

### Task 10: Reetiquetar `sync.controller.ts`

**Files:**
- Modify: `src/api/controller/sync.controller.ts`

- [ ] **Step 1: Reemplazar roles en ambos handlers**

En `sincronizar` (POST /) y `getEstado` (GET /status), reemplazar `@Roles(RolType.ADMINISTRADOR, RolType.USUARIO)` por `@Roles(RolType.JEFE_DE_PARQUEOS, RolType.USUARIO)`.

- [ ] **Step 2: Compilar**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/api/controller/sync.controller.ts
git commit -m "feat(roles): sync endpoints JEFE+USUARIO"
```

---

### Task 11: Reetiquetar `precio.controller.ts`

**Files:**
- Modify: `src/api/controller/precio.controller.ts`

- [ ] **Step 1: Todos los handlers → solo `JEFE_DE_PARQUEOS`**

Para todos los handlers (`findAll`, `findById`, `findByIds`, `createSelect`, `create`, `createMultiple`, `import`, `update`, `updateMultiple`, `delete`, `deleteMultiple`, `filter`, `search`), reemplazar `@Roles(RolType.ADMINISTRADOR)` por `@Roles(RolType.JEFE_DE_PARQUEOS)`.

- [ ] **Step 2: Verificar y compilar**

Busca `ADMINISTRADOR` en `src/api/controller/precio.controller.ts` (no debe quedar). Run: `npm run build` — Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/api/controller/precio.controller.ts
git commit -m "feat(roles): precio endpoints JEFE_DE_PARQUEOS only"
```

---

### Task 12: Verificación integral y chequeo de referencias

**Files:**
- Modify: ninguno (verificación)

- [ ] **Step 1: Buscar `isAdministrador` residual en el negocio**

Run: `rg -n "isAdministrador" src`
Expected: ninguna coincidencia en `src/core/service/bi.service.ts`, `movimiento.service.ts`, `qr.service.ts`, ni en `src/api/controller/registro-diario.controller.ts`. (Puede quedar en otros módulos no de negocio; revisa cada match manualmente y, si es un bypass de admin de negocio, aplícale la misma transformación).

- [ ] **Step 2: Verificar que `ADMINISTRADOR` no quede en controladores de negocio**

Run: `rg -n "RolType.ADMINISTRADOR" src/api/controller`
Expected: solo en controladores de administración del sistema (nomenclador, users, roles, funciones, menús, endpoints, logs, auth no-business). No debe aparecer en `bi.controller.ts`, `movimiento.controller.ts`, `qr.controller.ts`, `registro-diario.controller.ts`, `sync.controller.ts`, `precio.controller.ts`.

- [ ] **Step 3: Build completo**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: (Opcional, si corre local) arrancar y validar el seed**

Run: `npm run start:dev` (local). Verificar en logs/DB que el rol `JEFE_DE_PARQUEOS` se creó. Esperado: rol presente sin duplicados en la colección `rol`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(roles): verify role matrix across business controllers"
```

---

## Self-Review (spec coverage)

- **Rol ADMINISTRADOR = solo sistema, sin negocio** → Tasks 3, 5, 7, 9, 10, 11 (se retira de todos los controladores de negocio) + Tasks 4, 6, 8, 9 (se eliminan los bypass de servicio).
- **Rol JEFE_DE_PARQUEOS = todo el negocio, solo sus parqueos** → enum+seed (Tasks 1-2) + se asigna a todos los endpoints de negocio; el scope por `user.parqueoIds` queda garantizado por la eliminación de los bypass admin.
- **Rol USUARIO = entrada/salida + validar QR + cierre diario, sin web/precios/generar QR** → Task 5 (movimiento operativo), Task 7 (solo `qr/validar`), Task 9 (`registro-diario/cerrar` y `/actual`), Task 10 (sync). Precios y generación/anulación de QR quedan fuera (Tasks 7, 11).
- **Permisos fino (funciones→endpoints) y menú dinámico desde el front** → sin cambios de backend en este plan (decisión de diseño: el front filtra por función; el `PermissionGuard` ya existe).

**Nota de despliegue (datos):** tras este cambio, los usuarios que hoy son `ADMINISTRADOR` y gestionan parqueos deben recibir el rol `JEFE_DE_PARQUEOS` (y su asignación de `parqueoIds`). El rol `ADMINISTRADOR` queda restringido a administración del sistema. Esto es una migración de datos/operación, no de código; coordinar con el responsable del entorno real (`http://srv895496.hstgr.cloud:3003`).
