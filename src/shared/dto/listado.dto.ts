import { IsArray, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ListadoDto {
  @IsArray()
  @ApiProperty({ description: 'Header.', example: [] })
  header: string[];

  @IsArray()
  @ApiProperty({ description: 'Llaves.', example: [] })
  key: string[];

  @IsNotEmpty()
  @ApiProperty({
    description: 'Datos que se mostrarán.',
    example: {
      items: [{}],
      meta: {
        totalItems: 1,
        itemCount: 1,
        itemsPerPage: 10,
        totalPages: 1,
        currentPage: 1,
      },
      links: {
        first: '',
        previous: '',
        next: '',
        last: '',
      },
    },
  })
  data: object;

  constructor(header: string[], key: string[], data: object) {
    this.header = header;
    this.key = key;
    this.data = data;
  }
}
