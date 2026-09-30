# api-saci — API de SACI

**SACI — Sistema Automatizado de Control de Inventarios usando QR**.
Backend NestJS 11 + TypeORM (MongoDB) heredado de la plataforma de `api-sacp`
(RBAC de 3 niveles, auditoría, nomencladores dinámicos, sync offline, sockets)
con el dominio de inventarios: productos, etiquetas QR reutilizables,
movimientos ENTRADA/SALIDA/AJUSTE/TRASLADO, stock derivado y alertas de mínimo.

## Documentación

- Modelo de datos y contratos: ver **docs-saci** (`04-modelo-datos.md`, `06-contratos-api.md`).
- Reglas de negocio (ciclo del QR, semántica de movimientos, roles): `05-reglas-negocio.md`.

## Arranque

```bash
cp .env.example .env          # ajusta SECRET, DB_USER/DB_PASS, EMAIL_* (fase 2)
docker compose up -d          # mongo:7 con healthcheck
npm ci
npm run start:dev             # en dev crea seeds: admin/Admin1234*
```

Swagger (solo fuera de producción): `http://localhost:3000/api/docs`.

## Módulos

| Bloque | Módulos |
|---|---|
| Admin | auth, user, rol, funcion, end-point (autodescubiertos), menu, log-history |
| Catálogos | nomenclador dinámico: almacen, categoria, unidad, ubicacion |
| Inventario | producto (SKU `PRD-XXXXXX`), qr (etiquetas por lote + PDF), movimiento-inventario (stock derivado), registro-diario (corte diario + cron 00:00) |
| Soporte | sync (offline ≤ 7 días), bi (dashboard/comparativa/tendencia/bajo mínimo), health, sockets |

## Roles

`ADMINISTRADOR` (todo) · `JEFE_DE_ALMACEN` (sus almacenes: productos, QR, ajustes, cierre) ·
`OPERARIO` (sus almacenes: entradas/salidas escaneando).

## Scripts

`start:dev` · `build` · `start:prod` · `lint` · `compodoc` · `repl`
