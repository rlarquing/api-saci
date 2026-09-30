import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { SelectDto } from './select.dto';

/**
 * DTO para leer la información de un menú
 * Optimizado para MongoDB con ObjectId como string
 */
export class ReadMenuDto {
  @ApiProperty({
    description: 'Nombre del objeto',
    example: 'Gestión de Usuarios',
  })
  dtoToString: string;

  @ApiProperty({
    description: 'ID del menú en formato MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre del menú',
    example: 'Gestión de Usuarios',
  })
  label: string;

  @ApiProperty({ description: 'Icono del menú', example: 'user' })
  icon: string;

  @ApiProperty({ description: 'Ruta del menú', example: '/usuarios' })
  to: string;

  @ApiProperty({ description: 'Tipo de menú', example: 'interno' })
  tipo: string;

  @ApiPropertyOptional({
    description: 'ID del menú padre',
    example: '507f1f77bcf86cd799439011',
    nullable: true,
  })
  menuPadre: string;

  @ApiPropertyOptional({
    description: 'Nomenclador asociado',
    example: 'tipos-usuario',
    nullable: true,
  })
  nomenclador?: string;

  @ApiPropertyOptional({
    description: 'Menús hijos',
    type: [ReadMenuDto],
    nullable: true,
  })
  menus: ReadMenuDto[];

  @ApiPropertyOptional({
    description: 'Objeto para cargar el select',
    type: SelectDto,
    nullable: true,
  })
  padre?: any;

  /**
   * Constructor completo
   */
  constructor(
    dtoToString: string,
    id: string,
    label: string,
    icon: string,
    to: string,
    tipo: string,
    menuPadre?: string,
    nomenclador?: string,
    menus: ReadMenuDto[] = [],
    padre?: any,
  ) {
    this.dtoToString = dtoToString;
    this.id = id;
    this.label = label;
    this.icon = icon;
    this.to = to;
    this.tipo = tipo;
    this.menuPadre = menuPadre ?? '';
    this.nomenclador = nomenclador;
    this.menus = menus;
    this.padre = padre;
  }
}
