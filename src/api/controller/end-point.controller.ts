import {
  Controller,
  UseGuards,
  Get,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PermissionGuard, RolGuard } from '../guard';
import { Roles } from '../decorator';
import { SelectDto } from '../../shared/dto';
import { EndPointService } from '../../core/service';
import { RolType } from '../../shared/enum';

@ApiTags('EndPoints')
@Controller('end-point')
@UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
@ApiBearerAuth()
@UsePipes(ValidationPipe)
export class EndPointController {
  constructor(private endPointService: EndPointService) {}

  @Get('/crear/select')
  @Roles(RolType.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Obtener los elementos del conjunto para crear un select',
  })
  @ApiResponse({
    status: 200,
    description:
      'Muestra la información de los elementos del conjunto para crear un select',
    type: [SelectDto],
  })
  @ApiNotFoundResponse({
    description: 'Elemento del conjunto no encontrado.',
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async createSelect(): Promise<SelectDto[]> {
    return await this.endPointService.createSelect();
  }
}
