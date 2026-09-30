import { IsDate, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { HISTORY_ACTION } from '../../persistence/entity/log-history.entity';

export class LogHistoryDto {
  @ApiProperty({ description: 'id de la traza.', example: 'uuid-aqui' })
  id: string;

  @ApiProperty({ description: 'Nombre del usuario.', example: 'Juan' })
  user: string;

  @IsDate()
  @ApiProperty({
    description: 'Fecha de la traza.',
    example: '2021-04-26 15:02:16.21585',
  })
  date: Date;

  @IsString()
  @ApiProperty({
    description: 'Nombre del la tabla que se modifico.',
    example: 'rol',
  })
  tabla: string;

  @IsNotEmpty()
  @ApiProperty({ description: 'Datos nuevos.' })
  valorNuevo?: object | null | undefined;

  @ApiProperty({ description: 'Datos viejos.' })
  valorAnterior?: object | null;

  @ApiProperty({
    description: 'Registro que se modifico.',
    example: 'record-id-123',
  })
  registroId?: string | null | undefined;

  @IsString()
  @ApiProperty({
    description: 'Direccion IP .',
    example: '192.168.1.1',
  })
  direccionIp?: string | null | undefined;

  @IsNotEmpty()
  @ApiProperty({ description: 'Acción que se realizó.', example: 'ADD' })
  action: HISTORY_ACTION;

  constructor(
    id: string,
    user: string,
    date: Date,
    tabla: string,
    action: HISTORY_ACTION,
    valorNuevo: object | null | undefined,
    valorAnterior: object | null,
    registroId: string | null | undefined,
    direccionIp: string | null | undefined,
  ) {
    this.id = id;
    this.user = user;
    this.date = date;
    this.tabla = tabla;
    this.action = action;
    this.valorNuevo = valorNuevo;
    this.valorAnterior = valorAnterior;
    this.registroId = registroId;
    this.direccionIp = direccionIp;
  }
}
