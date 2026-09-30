---
name: repo-structure
description: Repository structure and file placement conventions for api-navecopa. Use when creating, moving, or reviewing any source, test, or config file so it lands in the correct layer. Trigger: new file, moving files, where does X go, architecture layout, repo structure, donde va este archivo, estructura del repo.
license: MIT
metadata:
  author: api-navecopa team
  version: "1.0.0"
---

# Repo Structure — api-navecopa

Layered NestJS API. Every new or moved file must follow this map so the
architecture stays predictable for humans and agents.

## Source layers (`src/`)

| Layer | Contents | Rules |
| --- | --- | --- |
| `src/api/controller/` | HTTP controllers (`*.controller.ts`) | One controller per resource/route group. Controllers are thin: delegate to services, no business logic. |
| `src/api/guard/` | Guards, decorators | See Nest guard rule below. |
| `src/core/service/` | `@Injectable()` business services (`*.service.ts`) | **Only DI services live here.** Classes that need injected dependencies or extend `GenericService`. |
| `src/core/mapper/` | Entity → DTO mappers (`*.mapper.ts`) | |
| `src/core/strategy/` | Passport/strategy implementations | |
| `src/core/logger/` | Logging utilities | |
| `src/persistence/entity/` | TypeORM entities (`*.entity.ts`) | |
| `src/persistence/repository/` | Custom repositories (`*.repository.ts`) | |
| `src/shared/dto/` | Request/response DTOs (`*.dto.ts`) | Cross-layer data contracts. |
| `src/shared/enum/` | Enums shared across layers (`*.enum.ts`) | |
| `src/shared/interface/` | Interfaces shared across layers | |
| `src/shared/filter/` | Exception filters | |
| `src/shared/util/` | **Pure functions without DI** (`*.util.ts`) | Non-injectable helpers, no state, no Nest imports. Never in `src/core/service/` or `src/api/`. |
| `src/socket/` | WebSocket gateways | |
| `src/mail/` | Mailer templates/logic | |

## Test layout (`test/`)

| Path | Contents | Discovery |
| --- | --- | --- |
| `test/unit/**/*.spec.ts` | Unit tests, **mirroring `src/` paths** (`test/unit/core/service/foo.service.spec.ts` ↔ `src/core/service/foo.service.ts`) | `npm test` (jest config in `package.json` → `testRegex: test/unit/.*\.spec\.ts$`) |
| `test/*.e2e-spec.ts` | End-to-end tests | `npm run test:e2e` (`test/jest-e2e.json`) |

Rules:

- **Never** create spec files inside `src/` — the unit jest config will not find
  them (it scans only `test/unit/`), and colocated specs are a structural
  violation in this repo.
- Relative imports from a spec at `test/unit/<layer>/<sub>/<file>.spec.ts`
  must walk up to the repo root: `../../../../src/<layer>/...`
  (four `../` segments), then into `src`.
- `tsconfig.build.json` already excludes `test/` and `**/*spec.ts` — build is
  unaffected by test placement.

## Nest guard rule (critical)

**Nest guards compose; they do not subtract.** A global guard (e.g. JWT) or a
controller-level guard applies to every handler underneath. You cannot
"un-guard" one method by adding another guard.

If an endpoint must be public (no auth) while the rest of the API is guarded:

- Create a **separate controller** in its own route prefix (e.g.
  `TableroController` at `tablero` instead of reusing
  `OperacionPortuariaController`), and do **not** apply the guard to it.
- Do not bolt the public route onto a guarded controller.

Example that works:

```ts
// src/api/controller/tablero.controller.ts
@Controller('tablero') // no JwtAuthGuard, no RolesGuard → public
export class TableroController { ... }
```

Example that fails (route stays protected):

```ts
@Controller('operacion-portuaria')
@UseGuards(JwtAuthGuard)
export class OperacionPortuariaController {
  @Get('tablero/puertos') // still guarded — no way to subtract JwtAuthGuard here
  getPuertos() { ... }
}
```

## Decision flow for a new file

1. Is it a test? → `test/unit/` mirroring the source path, or `test/` root if e2e.
2. Is it a class with DI / `@Injectable()` / extends `GenericService`? → `src/core/service/`.
3. Is it a pure function, no DI, no state, no Nest imports? → `src/shared/util/`.
4. Does it touch HTTP routing? → `src/api/controller/`.
5. Is it a DTO/enum/interface/filter shared across layers? → `src/shared/`.
6. Is it a TypeORM entity or repository? → `src/persistence/`.
7. Otherwise, ask the maintainer before guessing — do not invent a new folder.