import {
  IsOptional,
  IsString,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Crear el vínculo producto→bin por almacén (backlog P3). */
export class CreateProductoUbicacionDto {
  @ApiProperty({ description: 'ID del producto' })
  @IsString()
  productoId!: string;

  @ApiProperty({ description: 'ID del almacén' })
  @IsString()
  almacenId!: string;

  @ApiProperty({ description: 'ID de la ubicación (nom_ubicacion)' })
  @IsString()
  ubicacionId!: string;
}

/** Actualizar solo la ubicación del vínculo (producto y almacén no se cambian). */
export class UpdateProductoUbicacionDto {
  @ApiPropertyOptional({ description: 'Nueva ubicación (nom_ubicacion)' })
  @IsOptional()
  @IsString()
  ubicacionId?: string;
}

/** Lectura del vínculo producto→bin. */
export class ReadProductoUbicacionDto {
  @ApiProperty({ description: 'ID del vínculo' })
  id!: string;
  @ApiProperty({ description: 'ID del producto' })
  productoId!: string;
  @ApiProperty({ description: 'SKU del producto' })
  productoCodigo!: string;
  @ApiProperty({ description: 'Nombre del producto' })
  productoNombre!: string;
  @ApiProperty({ description: 'ID del almacén' })
  almacenId!: string;
  @ApiProperty({ description: 'Nombre del almacén' })
  almacenNombre!: string;
  @ApiProperty({ description: 'ID de la ubicación' })
  ubicacionId!: string;
  @ApiProperty({ description: 'Nombre de la ubicación (bin)' })
  ubicacionNombre!: string;
  @ApiProperty({ description: 'Activo' })
  activo!: boolean;
}

/** Bin resuelto para el escáner (GET /producto-ubicacion/resolver). */
export class BinResueltoDto {
  @ApiProperty({ description: 'ID del producto' })
  productoId!: string;
  @ApiProperty({ description: 'ID del almacén' })
  almacenId!: string;
  @ApiPropertyOptional({ description: 'Nombre del bin (null = sin bin asignado)' })
  ubicacionNombre?: string | null;
  @ApiPropertyOptional({ description: 'ID del vínculo (null = sin bin)' })
  id?: string | null;
}
