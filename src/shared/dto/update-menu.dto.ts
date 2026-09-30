import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoMenuTypeEnum } from '../enum';

export class UpdateMenuDto {
  @IsNotEmpty()
  @IsString({ message: 'El atributo label debe ser un texto' })
  @ApiProperty({
    description: 'Nombre del menu',
    example: 'Listado de los indicadores',
  })
  label!: string;

  @IsNotEmpty()
  @IsString({ message: 'El atributo icon debe ser un texto' })
  @ApiProperty({
    description: 'Icono del menu',
    example: 'Book',
  })
  icon!: string;

  @IsNotEmpty()
  @IsString({ message: 'El atributo to debe ser un texto' })
  @ApiProperty({
    description: 'Dirección hacia donde va el menu',
    example: '/home',
  })
  to!: string;

  @IsOptional()
  @IsString({ message: 'El atributo menu debe ser un string (ObjectId)' })
  @ApiPropertyOptional({
    description: 'ID del menú padre (MongoDB ObjectId como string)',
    example: '507f1f77bcf86cd799439011',
  })
  menu?: string;

  @IsNotEmpty()
  @IsString({ message: 'El atributo to debe ser un texto' })
  @ApiProperty({
    description: 'Tipo de menu',
    example: 'reporte',
  })
  tipo!: TipoMenuTypeEnum;

  @IsOptional()
  @IsString({ message: 'El atributo nomenclador debe ser un texto' })
  @ApiPropertyOptional({
    description: 'Nomenclador asociado al menu',
    example: 'tipos-usuario',
  })
  nomenclador?: string;
}
