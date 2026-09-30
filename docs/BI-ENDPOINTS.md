# Business Intelligence API Endpoints

## Descripción General

El módulo de Business Intelligence (BI) proporciona endpoints para análisis de datos del parqueo, permitiendo a los jefes tomar decisiones informadas sobre precios, estrategias y rendimiento de sus múltiples parqueos.

## Base URL
```
/bi
```

---

## 1. Dashboard Consolidado

### GET `/bi/dashboard`

Obtiene un resumen consolidado de todos los parqueos del jefe.

**Parámetros Query:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| fechaInicio | string (YYYY-MM-DD) | No | Fecha de inicio del período. Default: hace 1 mes |
| fechaFin | string (YYYY-MM-DD) | No | Fecha de fin del período. Default: hoy |
| tipoPeriodo | string | No | Tipo: dia, semana, mes, trimestre, anio. Default: mes |

**Respuesta:**
```json
{
  "totalIngresosGeneral": 5000.00,
  "totalMediosGeneral": 500,
  "ticketPromedioGeneral": 10.00,
  "parqueos": [
    {
      "parqueoId": "507f1f77bcf86cd799439011",
      "parqueoNombre": "Parqueo Central",
      "totalIngresos": 2500.00,
      "totalMedios": 250,
      "vehiculosDentro": 15,
      "ticketPromedio": 10.00,
      "detallePorTipo": [
        {
          "tipoMedio": "Automóvil",
          "cantidad": 100,
          "ingreso": 1500.00,
          "porcentaje": 60.00
        }
      ]
    }
  ],
  "periodo": {
    "fechaInicio": "2024-01-01",
    "fechaFin": "2024-01-31",
    "tipoPeriodo": "mes"
  }
}
```

**Uso en Frontend:**
- Mostrar tarjetas con totales generales
- Gráfico de barras comparando parqueos
- Tabla con detalle por parqueo
- Filtros de fecha en la parte superior

---

## 2. Dashboard con Filtros Avanzados

### POST `/bi/dashboard/filtrado`

Igual que el dashboard GET pero permite seleccionar parqueos específicos.

**Body:**
```json
{
  "fechaInicio": "2024-01-01",
  "fechaFin": "2024-01-31",
  "parqueoIds": ["id1", "id2"],
  "tipoPeriodo": "mes"
}
```

**Uso en Frontend:**
- Selector múltiple de parqueos
- Comparar solo parqueos seleccionados

---

## 3. Reporte de Ingresos por Parqueo

### GET `/bi/ingresos/:parqueoId`

Reporte detallado de ingresos diarios de un parqueo específico.

**Parámetros de Ruta:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| parqueoId | string | Sí | ID del parqueo |

**Parámetros Query:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| fechaInicio | string | No | Fecha inicio |
| fechaFin | string | No | Fecha fin |

**Respuesta:**
```json
{
  "parqueoId": "507f1f77bcf86cd799439011",
  "parqueoNombre": "Parqueo Central",
  "ingresosPorDia": [
    {
      "fecha": "2024-01-15",
      "ingresos": 150.00,
      "cantidadMedios": 15
    }
  ],
  "totalIngresos": 1500.00,
  "promedioDiario": 50.00,
  "diaMayorIngreso": {
    "fecha": "2024-01-20",
    "ingresos": 200.00,
    "cantidadMedios": 20
  },
  "diaMenorIngreso": {
    "fecha": "2024-01-10",
    "ingresos": 20.00,
    "cantidadMedios": 2
  }
}
```

**Uso en Frontend:**
- Gráfico de líneas mostrando ingresos diarios
- Indicadores de día mejor/peor
- Tabla con detalle por día
- KPIs: total, promedio diario

---

## 4. Comparativa entre Parqueos

### GET `/bi/comparativa-parqueos`

Compara el rendimiento de todos los parqueos del jefe.

**Parámetros Query:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| fechaInicio | string | No | Fecha inicio |
| fechaFin | string | No | Fecha fin |
| tipoPeriodo | string | No | Tipo de período |

**Respuesta:**
```json
{
  "parqueos": [
    {
      "parqueoId": "id1",
      "parqueoNombre": "Parqueo Central",
      "totalIngresos": 2500.00,
      "totalMedios": 250,
      "porcentajeTotal": 50.00,
      "ticketPromedio": 10.00,
      "variacionPorcentual": 15.50
    }
  ],
  "totalGeneral": 5000.00,
  "mejorParqueo": { "parqueoId": "id1", "parqueoNombre": "Parqueo Central", "totalIngresos": 2500.00 },
  "periodo": { "fechaInicio": "2024-01-01", "fechaFin": "2024-01-31", "tipoPeriodo": "mes" }
}
```

**Uso en Frontend:**
- Tabla comparativa ordenada por ingresos
- Gráfico de pie mostrando participación
- Indicador de variación (flecha arriba/abajo)
- Destacar el mejor parqueo

---

## 5. Análisis por Tipo de Medio

### GET `/bi/analisis-tipo-medio`

Analiza el rendimiento por tipo de vehículo (automóvil, moto, bicicleta, etc).

**Parámetros Query:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| parqueoId | string | No | Si se omite, analiza todos los parqueos |
| fechaInicio | string | No | Fecha inicio |
| fechaFin | string | No | Fecha fin |
| tipoPeriodo | string | No | Tipo de período |

**Respuesta:**
```json
{
  "parqueoId": null,
  "parqueoNombre": null,
  "tiposMedio": [
    {
      "tipoMedioId": "automovil",
      "tipoMedioNombre": "Automóvil",
      "cantidadServicios": 200,
      "totalIngresos": 3000.00,
      "porcentajeIngresos": 60.00,
      "porcentajeCantidad": 40.00,
      "precioPromedio": 15.00
    }
  ],
  "tipoMasRentable": { "tipoMedioNombre": "Automóvil", "totalIngresos": 3000.00 },
  "tipoMasFrecuente": { "tipoMedioNombre": "Moto", "cantidadServicios": 250 },
  "periodo": { "fechaInicio": "2024-01-01", "fechaFin": "2024-01-31", "tipoPeriodo": "mes" }
}
```

**Uso en Frontend:**
- Gráfico de barras horizontales por tipo
- Gráfico de dona para distribución
- Tabla con todos los tipos
- Destacar el más rentable y más frecuente
- **Importante para decisiones de precios**: si un tipo tiene poco volumen pero alto ingreso, podría subir precio

---

## 6. Tendencia de Ingresos

### GET `/bi/tendencias`

Muestra la evolución de ingresos en el tiempo.

**Parámetros Query:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| parqueoId | string | No | Si se omite, muestra tendencia global |
| fechaInicio | string | No | Fecha inicio |
| fechaFin | string | No | Fecha fin |
| tipoPeriodo | string | No | Tipo de período |

**Respuesta:**
```json
{
  "parqueoId": null,
  "tendencia": [
    {
      "fecha": "2024-01-01T00:00:00.000Z",
      "valor": 150.00,
      "etiqueta": "2024-01-01"
    }
  ],
  "tendenciaGeneral": "creciente",
  "variacionTotal": 25.50,
  "promedioPeriodo": 160.00
}
```

**Valores de tendenciaGeneral:** `creciente`, `decreciente`, `estable`

**Uso en Frontend:**
- Gráfico de líneas con la evolución
- Indicador de tendencia (flecha y texto)
- Color según tendencia (verde/rojo/gris)
- Promedio como línea de referencia

---

## 7. Comparación entre Períodos

### GET `/bi/comparacion-periodos/:parqueoId`

Compara el período actual con el período anterior equivalente.

**Parámetros de Ruta:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| parqueoId | string | Sí | ID del parqueo |

**Parámetros Query:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| fechaInicio | string | No | Inicio período actual |
| fechaFin | string | No | Fin período actual |

**Respuesta:**
```json
{
  "parqueoId": "id1",
  "parqueoNombre": "Parqueo Central",
  "periodoActual": {
    "fechaInicio": "2024-02-01",
    "fechaFin": "2024-02-29",
    "totalIngresos": 2000.00,
    "totalMedios": 200,
    "ticketPromedio": 10.00,
    "promedioDiario": 68.97
  },
  "periodoAnterior": {
    "fechaInicio": "2024-01-01",
    "fechaFin": "2024-01-31",
    "totalIngresos": 1500.00,
    "totalMedios": 150,
    "ticketPromedio": 10.00,
    "promedioDiario": 48.39
  },
  "variacionIngresos": 500.00,
  "variacionPorcentualIngresos": 33.33,
  "variacionMedios": 50,
  "variacionPorcentualMedios": 33.33,
  "interpretacion": "Los ingresos han aumentado significativamente. Considere mantener las estrategias actuales."
}
```

**Interpretaciones automáticas:**
- `> 10%`: "Los ingresos han aumentado significativamente..."
- `> 0%`: "Los ingresos muestran un crecimiento moderado..."
- `> -10%`: "Los ingresos han disminuido ligeramente..."
- `<= -10%`: "Los ingresos han caído significativamente..."

**Uso en Frontend:**
- Dos tarjetas lado a lado (período actual vs anterior)
- Flechas indicando subida/bajada
- Porcentaje de cambio destacado
- Interpretación automática como consejo

---

## 8. KPIs del Negocio

### GET `/bi/kpis`

Indicadores clave de rendimiento consolidados.

**Parámetros Query:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| parqueoId | string | No | Si se omite, KPIs globales |
| fechaInicio | string | No | Fecha inicio |
| fechaFin | string | No | Fecha fin |
| tipoPeriodo | string | No | Tipo de período |

**Respuesta:**
```json
{
  "parqueoId": null,
  "ingresoTotal": 5000.00,
  "ticketPromedio": 10.00,
  "totalServicios": 500,
  "serviciosDiariosPromedio": 16.67,
  "ingresoDiarioPromedio": 166.67,
  "diaMayorActividad": "sábado",
  "tipoMedioMasAtendido": "Automóvil",
  "tasaCrecimiento": 15.50
}
```

**Uso en Frontend:**
- Tarjetas de KPIs en el dashboard
- Indicador de crecimiento con color
- Día de mayor actividad para planificación
- Tipo de medio más atendido para decisiones

---

## Notas Importantes para el Frontend

### Autenticación
Todos los endpoints requieren:
- Header: `Authorization: Bearer <token>`
- Rol: `ADMINISTRADOR`

### Formato de Fechas
- Enviar como string: `"2024-01-15"` o `"2024-01-15T00:00:00Z"`
- Recibir como ISO string o Date

### Manejo de Errores
```json
{
  "statusCode": 404,
  "message": "Parqueo no encontrado",
  "error": "Not Found"
}
```

### Consideraciones de UX

1. **Filtros de fecha**: Usar date pickers con rango predefinido (última semana, último mes, etc.)

2. **Gráficos recomendados**:
   - Dashboard: Barras para comparar parqueos
   - Tendencias: Línea temporal
   - Análisis tipo medio: Dona/pie para distribución
   - Comparativa: Barras horizontales

3. **Colores sugeridos**:
   - Verde: Crecimiento positivo
   - Rojo: Decrecimiento
   - Gris: Estable
   - Azul: Datos neutros

4. **Actualización en tiempo real**:
   - Los datos de vehículos dentro son en tiempo real
   - Los demás datos son históricos del registro diario

---

## Relación con Otras Entidades

```
Usuario (Jefe) ──── tiene ────> Múltiples Parqueos
                                        │
                                        ├──> Movimientos (entrada/salida)
                                        │
                                        └──> RegistroDiario (totales por día)
                                                  │
                                                  └──> DetalleTipos (desglose por tipo)
```

**Flujo de datos:**
1. Cada salida genera un `Movimiento` con precio cobrado
2. El `RegistroDiario` acumula totales del día
3. Los endpoints de BI consultan `RegistroDiario` para análisis

---

## Endpoints de Movimientos (Operativos)

### POST `/movimiento/entrada`
Registra la entrada de un vehículo al parqueo.

**Body:**
```json
{
  "qrEscaneado": "QR-000001",
  "parqueoId": "507f1f77bcf86cd799439011"
}
```

### POST `/movimiento/salida`
Registra la salida de un vehículo (precio fijo, sin cálculo de tiempo).

**Body:**
```json
{
  "qrEscaneado": "QR-000001",
  "parqueoId": "507f1f77bcf86cd799439011"
}
```

**Nota importante:** El precio es FIJO. No se calcula por tiempo transcurrido. Sea 1 hora o 24 horas, se cobra el precio configurado.

### GET `/movimiento/activos`
Lista vehículos actualmente dentro del parqueo.

### GET `/movimiento/resumen/:parqueoId`
Resumen operacional (vehículos dentro, ingresos de hoy, detalle por tipo).

---

## Endpoints de Registro Diario

### GET `/registro-diario/actual/:parqueoId`
Obtiene el registro diario actual del parqueo.

### PATCH `/registro-diario/cerrar/:id`
Cierra el registro diario manualmente (el jefe decide cerrar el día).

**Nota:** El registro también puede cerrarse automáticamente a las 12 de la noche.
