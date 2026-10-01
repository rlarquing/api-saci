import { PartialType } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNivelStockDto {
  @ApiProperty({ description: 'ID del producto' })
  @IsString()
  productoId!: string;

  @ApiProperty({ description: 'ID del almacén' })
  @IsString()
  almacenId!: string;

  @ApiPropertyOptional({ description: 'Stock mínimo por ubicación', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  stockMinimo?: number;

  @ApiPropertyOptional({
    description: 'Stock de seguridad (colchón sobre el mínimo)',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  stockSeguridad?: number;
}

export class UpdateNivelStockDto extends PartialType(CreateNivelStockDto) {}

export class ReadNivelStockDto {
  @ApiProperty({ description: 'ID del nivel' })
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

  @ApiProperty({ description: 'Stock mínimo por ubicación' })
  stockMinimo!: number;

  @ApiProperty({ description: 'Stock de seguridad por ubicación' })
  stockSeguridad!: number;

  @ApiProperty({ description: 'Punto de reorden (minimo + seguridad)' })
  puntoReorden!: number;

  @ApiProperty({ description: 'Activo (soft-delete)' })
  activo!: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt!: Date;
}
