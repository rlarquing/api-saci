import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEndPointDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @ApiProperty({
    description: 'Nombre del controlador.',
    example: 'UserController',
  })
  controller: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @ApiProperty({ description: 'Nombre del servicio.', example: 'users' })
  servicio: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @ApiProperty({ description: 'Ruta del endpoint.', example: '/users' })
  ruta: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @ApiProperty({
    description: 'Nombre descriptivo del endpoint.',
    example: 'Obtener todos los usuarios',
  })
  nombre: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  @ApiProperty({ description: 'Método HTTP.', example: 'GET' })
  metodo: string;
}
