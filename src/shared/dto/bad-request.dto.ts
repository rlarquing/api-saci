import { ApiProperty } from '@nestjs/swagger';

export class BadRequestDto {
  @ApiProperty({ description: 'statusCode', example: '400' })
  statusCode: number;

  @ApiProperty({
    description: 'message',
    example: [
      {
        target: {},
        value: '',
        property: '',
        children: [],
        constraints: {},
      },
    ],
  })
  message: any[];

  @ApiProperty({ description: 'error', example: 'Bad Request' })
  error: string;
}
