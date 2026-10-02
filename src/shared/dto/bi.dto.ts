import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** KPIs del dashboard de inventario (SACI fase 1). */
export class DashboardBiDto {
  @ApiProperty({ description: 'Productos activos totales' })
  totalProductos: number;

  @ApiProperty({ description: 'Almacenes accesibles por el usuario' })
  totalAlmacenes: number;

  @ApiProperty({ description: 'Unidades totales en stock (suma de almacenes)' })
  stockTotal: number;

  @ApiProperty({ description: 'Entradas de hoy (unidades)' })
  entradasHoy: number;

  @ApiProperty({ description: 'Salidas de hoy (unidades)' })
  salidasHoy: number;

  @ApiProperty({ description: 'Alertas de stock bajo mínimo' })
  alertasBajoMinimo: number;

  @ApiProperty({
    description: 'Lotes con stock vivo vencidos o por vencer en 30 días (P3)',
  })
  lotesEnAlerta: number;

  @ApiProperty({ description: 'Stock por almacén' })
  stockPorAlmacen: Array<{ almacenId: string; almacenNombre: string; stock: number }>;

  @ApiProperty({ description: 'Últimos movimientos (kardex resumido)' })
  ultimosMovimientos: Array<{
    id: string;
    tipo: string;
    productoCodigo: string;
    productoNombre: string;
    cantidad: number;
    almacenNombre: string;
    userName: string;
    fecha: Date;
  }>;
}

/** Comparativa de movimientos entre almacenes. */
export class ComparativaAlmacenesBiDto {
  @ApiProperty({ description: 'Filas por almacén' })
  almacenes: Array<{
    almacenId: string;
    almacenNombre: string;
    entradas: number;
    salidas: number;
    movimientos: number;
  }>;
}

/** Tendencia de movimientos por día. */
export class TendenciaBiDto {
  @ApiProperty({ description: 'Puntos por día' })
  puntos: Array<{ fecha: string; entradas: number; salidas: number }>;
}

/** Consolidado de alertas de stock bajo mínimo. */
export class BajoMinimoBiDto {
  @ApiProperty({ description: 'Alertas' })
  alertas: Array<{
    productoId: string;
    productoCodigo: string;
    productoNombre: string;
    almacenId: string;
    almacenNombre: string;
    stock: number;
    stockMinimo: number;
  }>;
}

/** Filtro por rango de fechas. */
export class FiltroBiDto {
  @ApiPropertyOptional({ description: 'Fecha inicial (ISO)' })
  fechaInicio?: string;

  @ApiPropertyOptional({ description: 'Fecha final (ISO)' })
  fechaFin?: string;
}
