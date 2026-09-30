import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from './response.dto';

export class ResponsesDto {
  @ApiProperty({
    description: 'Respuestas mixtas.',
    example: [ResponseDto],
  })
  responses: any[];
  constructor(responses: any[]) {
    this.responses = responses;
  }
}
