# Performance Optimization — API SACP

**Date:** 2026-05-27
**Context:** Optimizar consumo de recursos en laptop i3 7ma gen (16GB RAM) para desarrollo, y servidor para producción.

## Goals

- Reducir tiempo de build en desarrollo (laptop i3)
- Reducir consumo de RAM/CPU en runtime (dev y prod)
- Separar perfiles de configuración por entorno
- Eliminar dependencias pesadas innecesarias en producción

## Changes

### 1. Entorno y Configuración

- **Swagger condicional**: Solo cargar SwaggerModule si `NODE_ENV !== 'production'`.
- **.env separados**: Crear `.env.development` y `.env.production` con valores distintos.
- **Seed data**: Mantener `parseController` solo en desarrollo.

### 2. Compilación (Build)

- **Builder SWC**: Cambiar `nest-cli.json` a `builder: "swc"` con `typeCheck: true`. Build ~20x más rápido en i3.
- **Source maps condicionales**: `tsconfig.build.json` → `sourceMap: false`.
- **Target ES2022**: Cambiar de `es2017` a `es2022` (Node 20+).

### 3. Logging

- **Niveles restringidos**: Dev → `error,warn,log`. Prod → `error,warn`.
- **Pino**: Reemplazar `ConsoleLogger` por `@nestjs/pino` para logging async y estructurado.

### 4. Dependencias

- **moment → dayjs**: Reemplazar moment (~300KB) por dayjs (~2KB). API compatible.
- **Lazy Socket.IO**: Cargar `SocketGateway` solo si `SOCKET_ENABLED=true`.
- **Entities explícitas**: Reemplazar glob pattern en TypeORM por imports directos de las 14 entidades.

## Non-Goals

- No cambiar framework (NestJS se queda)
- No migrar base de datos
- No agregar tests (no existían previamente)

## Files Affected

| File | Change |
|---|---|
| `nest-cli.json` | Agregar builder SWC |
| `tsconfig.json` | target → es2022 |
| `tsconfig.build.json` | sourceMap: false |
| `src/main.ts` | Swagger condicional, seed condicional |
| `src/app.service.ts` | Socket condicional |
| `src/core/logger/logger.provider.ts` | Reemplazar por Pino |
| `.env.development` | Nuevo |
| `.env.production` | Nuevo |
| `src/database/database.service.ts` | Entities explícitas |
| `orm.config.ts` | Entities explícitas |
| `src/core/service/auth.service.ts` | moment → dayjs |
| `package.json` | Agregar pino/@nestjs/pino, dayjs; sacar moment |

## Rollback Plan

- Cada cambio es atómico y reversible.
- SWC builder: volver al default (tsc) descomentando la opción.
- Pino: volver a ConsoleLogger cambiando `app.useLogger`.
- dayjs: volver a moment instalando moment y cambiando el import.
