import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Categoría sincronizada al escáner offline. */
export class CategoriaSyncDto {
  @ApiProperty({ description: 'ID de la categoría' })
  id: string;
  @ApiProperty({ description: 'Nombre' })
  nombre: string;
  @ApiPropertyOptional({ description: 'Descripción' })
  descripcion?: string | null;
  @ApiProperty({ description: 'Activo' })
  activo: boolean;
  @ApiProperty({ description: 'Creado' })
  createdAt: string;
  @ApiProperty({ description: 'Actualizado' })
  updatedAt: string;
}
