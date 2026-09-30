import { ApiProperty } from '@nestjs/swagger';
import { ReadNomencladorDto } from './read-nomenclador.dto';
import { DetalleTiposDto } from './detalle-tipos.dto';

export class ReadRegistroDiarioDto {
  @ApiProperty({ description: 'Nombre del objeto', example: 'Objeto 1' })
  dtoToString: string;

  @ApiProperty({
    description: 'id del registro diario.',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'Fecha del registro',
    example: '2024-01-15',
  })
  fecha: Date;

  @ApiProperty({
    description: 'Relacion con la entidad almacen',
    example: ReadNomencladorDto,
  })
  almacen: ReadNomencladorDto;

  @ApiProperty({
    description: 'Estado del registro.',
    example: 'cerrado o abierto',
  })
  estado: string;

  @ApiProperty({
    description: 'Total de medios atendidos en el día',
    example: '150',
  })
  totalEntradas: number;

  @ApiProperty({
    description: 'Total de unidades salidas del día',
    example: '1500.50',
  })
  totalSalidas: number;

  @ApiProperty({
    description: 'Detalle por tipos de medios',
    example: [DetalleTiposDto],
  })
  detalleCategorias: DetalleTiposDto[];

  constructor(
    dtoToString: string,
    id: string,
    fecha: Date,
    almacen: ReadNomencladorDto,
    estado: string,
    totalEntradas: number,
    totalSalidas: number,
    detalleCategorias: DetalleTiposDto[],
  ) {
    this.dtoToString = dtoToString;
    this.id = id;
    this.fecha = fecha;
    this.almacen = almacen;
    this.estado = estado;
    this.totalEntradas = totalEntradas;
    this.totalSalidas = totalSalidas;
    this.detalleCategorias = detalleCategorias;
  }
}
