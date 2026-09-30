import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../decorator';
import { Roles } from '../decorator';
import { RolGuard } from '../guard';
import { DeleteResult } from 'typeorm';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { RolType } from '../../shared/enum';
import { LogHistoryService } from '../../core/service';
import { FiltroDto, ListadoDto, LogHistoryDto } from '../../shared/dto';
import { AppConfig } from '../../app.keys';
import { UserEntity } from '../../persistence/entity';

@ApiTags('Log-histories')
@Controller('log-history')
@Roles(RolType.ADMINISTRADOR)
@UseGuards(AuthGuard('jwt'), RolGuard)
@ApiBearerAuth()
export class LogHistoryController {
  private header!: string[];
  private key!: string[];
  constructor(
    private logHistoryService: LogHistoryService,
    private configService: ConfigService,
  ) {
    this.header = ['id', 'Usuario', 'Fecha', 'Model', 'Acción', 'Registro'];
    this.key = ['id', 'user', 'date', 'model', 'action', 'record'];
  }
  @Get('/')
  @ApiOperation({ summary: 'Obtener el listado de las trazas' })
  @ApiResponse({
    status: 200,
    description: 'Listado de las trazas',
    type: ListadoDto,
  })
  @ApiNotFoundResponse({
    description: 'Trazas no encontradas.',
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servicor.' })
  @ApiQuery({ required: false, name: 'page', example: 1 })
  @ApiQuery({ required: false, name: 'limit', example: 10 })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<any> {
    limit = limit > 100 ? 100 : limit;
    const url = this.configService.get(AppConfig.URL);
    const data = await this.logHistoryService.findAll({
      page,
      limit,
      route: url + '/api/traza',
    });
    return new ListadoDto(this.header, this.key, data);
  }
  @Get('/:id')
  @ApiOperation({ summary: 'Obtener una traza' })
  @ApiResponse({
    status: 200,
    description: 'Muestra la información de una traza',
    type: LogHistoryDto,
  })
  @ApiNotFoundResponse({
    description: 'Traza no encontrada.',
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servicor.' })
  async findById(@Param('id') id: string): Promise<LogHistoryDto> {
    return await this.logHistoryService.findById(id);
  }
  @ApiOperation({ summary: 'Eliminar una traza' })
  @ApiResponse({
    status: 200,
    description: 'Elimina de una traza',
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servicor.' })
  @Delete('/:id')
  async delete(@Param('id') id: string): Promise<DeleteResult> {
    return await this.logHistoryService.delete(id);
  }
  @Post('/filtro/por')
  @ApiOperation({
    summary: 'Filtrar por un usuario y los parametros establecidos',
  })
  @ApiResponse({
    status: 201,
    description: 'Filtra por un usuario y parametros que se le puedan pasar',
  })
  @ApiBody({
    description: 'Estructura para crear el filtrado de la traza.',
    type: FiltroDto,
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servicor.' })
  async findByFiltrados(
    @GetUser() user: UserEntity,
    @Body() filtroDto: FiltroDto,
  ): Promise<any> {
    return await this.logHistoryService.findByFiltrados(user, filtroDto);
  }
}
