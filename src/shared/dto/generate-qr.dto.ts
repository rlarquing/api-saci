import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min, Max } from 'class-validator';

/**
 * DTO para solicitar la generación de QRs
 */
export class GenerateQrDto {
  @ApiProperty({
    description: 'ID del producto para el cual se generarán las etiquetas',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  producto: string;

  @ApiProperty({
    description: 'ID del almacen para el cual se generarán los QRs',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  almacen: string;

  @ApiProperty({
    description: 'Cantidad de QRs a generar',
    example: 10,
    minimum: 1,
    maximum: 1000,
  })
  @IsNumber()
  @Min(1)
  @Max(1000)
  cantidad: number;
}
