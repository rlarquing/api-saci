import { ApiProperty } from '@nestjs/swagger';

export class TablaDto {
  @ApiProperty({ description: 'Nombre del objeto', example: 'Objeto 1' })
  head: string[];

  @ApiProperty({ description: 'Nombre del objeto', example: 'Objeto 1' })
  campos: any[];
}
