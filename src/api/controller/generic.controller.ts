import {
  Body,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AppConfig } from '../../app.keys';
import { DeleteResult } from 'typeorm';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { IController } from '../../shared/interface';
import { GenericService } from '../../core/service';
import {
  BuscarDto,
  FiltroGenericoDto,
  ResponseDto,
  SelectDto,
} from '../../shared/dto';
import { GetUser, IpAddress, Servicio } from '../decorator';
import { PermissionGuard, RolGuard } from '../guard';
import { UserEntity } from '../../persistence/entity';
import { Pagination } from '../../shared/pagination';

export abstract class GenericController<ENTITY> implements IController {
  protected constructor(
    protected service: GenericService<ENTITY>,
    protected configService: ConfigService,
    protected ruta: string,
  ) {}

  /**
   * Helper to access the current user from JWT context
   * Returns undefined if no user is authenticated
   */
  protected getCurrentUser(): UserEntity | undefined {
    // @nestjs/jwt automatically attaches user to request.user
    // We'll handle this properly in the controller implementation
    return undefined;
  }

  @Get('/')
  @Get('/')
  async findAll(
    page?: number,
    limit?: number,
    sinPaginacion?: boolean,
  ): Promise<Pagination<any> | any[]> {
    limit = limit > 100 ? 100 : limit;
    const url = this.configService.get(AppConfig.URL);
    return await this.service.findAll(
      {
        page,
        limit,
        route: url + '/api/' + this.ruta,
      },
      sinPaginacion,
    );
  }
  @Get('/:id')
  async findById(@Param('id') id: string): Promise<any> {
    return await this.service.findById(id);
  }
  @Post('/elementos/multiples')
  async findByIds(@Body() ids: string[]): Promise<any[]> {
    return await this.service.findByIds(ids);
  }
  @Get('/crear/select')
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
    return await this.service.createSelect();
  }

  @Post('/crear/select/dependiente')
  @ApiOperation({
    summary:
      'Obtener los elementos del conjunto para crear un select dependiente',
  })
  @ApiResponse({
    status: 200,
    description:
      'Muestra la información de los elementos del conjunto para crear un select dependiente',
    type: [SelectDto],
  })
  @ApiBody({
    description:
      'Estructura para crear el filtrado que brinda información para el select.',
    type: FiltroGenericoDto,
  })
  @ApiNotFoundResponse({
    description: 'Elemento del conjunto no encontrado.',
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async createSelectFilter(
    @Body() filtroGenericoDto: FiltroGenericoDto,
  ): Promise<SelectDto[]> {
    return await this.service.createSelectFilter(filtroGenericoDto);
  }

  @Post('/')
  async create(
    @GetUser() user: UserEntity,
    @Body() object: any,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.service.create(user, object, ip);
  }
  @Post('/multiple')
  async createMultiple(
    @GetUser() user: UserEntity,
    @Body() objects: any[],
    @IpAddress() ip: string,
  ): Promise<ResponseDto[]> {
    return await this.service.createMultiple(user, objects, ip);
  }

  @Post('/importar/elementos')
  async import(
    @GetUser() user: UserEntity,
    @Body() objects: any[],
    @IpAddress() ip: string,
  ): Promise<ResponseDto[]> {
    return await this.service.import(user, objects, ip);
  }

  @Patch('/:id')
  async update(
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @Body() object: any,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.service.update(user, id, object, ip);
  }
  @Patch('/elementos/multiples')
  async updateMultiple(
    @GetUser() user: UserEntity,
    @Body() objects: any[],
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    let result = new ResponseDto();
    for (const item of objects) {
      result = await this.service.update(user, item.id, item, ip);
    }
    return result;
  }
  @Delete('/:id')
  @ApiOperation({
    summary: 'Eliminar un elemento del conjunto utilizando borrado virtual.',
  })
  @ApiResponse({ status: 201, description: 'El elemento se ha eliminado.' })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @Servicio(undefined, 'delete')
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  async delete(
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.service.deleteMultiple(user, [id], ip);
  }
  @Delete('/elementos/multiples')
  @ApiOperation({
    summary:
      'Eliminar un grupo de elementos del conjunto utilizando borrado virtual.',
  })
  @ApiBody({
    description: 'Estructura para eliminar el grupo de elementos del conjunto.',
    type: [Number],
  })
  @ApiResponse({ status: 201, description: 'El elemento se ha eliminado.' })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @Servicio(undefined, 'deleteMultiple')
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  async deleteMultiple(
    @GetUser() user: UserEntity,
    @Body() ids: string[],
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.service.deleteMultiple(user, ids, ip);
  }
  @Delete('/:id/delete/real')
  @ApiOperation({
    summary: 'Eliminar un elemento del conjunto utilizando borrado real.',
  })
  @ApiResponse({ status: 201, description: 'El elemento se ha eliminado.' })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @Servicio(undefined, 'remove')
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  async remove(
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @IpAddress() ip: string,
  ): Promise<DeleteResult> {
    return await this.service.removeMultiple(user, [id], ip);
  }
  @Delete('/delete/real/elementos/multiples')
  @ApiOperation({
    summary:
      'Eliminar un grupo de elementos del conjunto utilizando borrado real.',
  })
  @ApiBody({
    description: 'Estructura para eliminar el grupo de elementos del conjunto.',
    type: [Number],
  })
  @ApiResponse({ status: 201, description: 'El elemento se ha eliminado.' })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @Servicio(undefined, 'removeMultiple')
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  async removeMultiple(
    @GetUser() user: UserEntity,
    @Body() ids: string[],
    @IpAddress() ip: string,
  ): Promise<DeleteResult> {
    return await this.service.removeMultiple(user, ids, ip);
  }
  @ApiOperation({
    summary: 'Mostrar la cantidad de elementos que tiene el conjunto.',
  })
  @ApiResponse({
    status: 201,
    description: 'Muestra la cantidad de elementos del conjunto.',
    type: Number,
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @Servicio(undefined, 'count')
  @UseGuards(AuthGuard('jwt'), PermissionGuard)
  @Get('/cantidad/elementos')
  async count(): Promise<number> {
    return await this.service.count();
  }
  @Post('/filtrar')
  async filter(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Body() filtroGenericoDto: FiltroGenericoDto,
  ): Promise<Pagination<any>> {
    limit = limit > 100 ? 100 : limit;
    const url = this.configService.get(AppConfig.URL);
    return await this.service.filter(
      {
        page,
        limit,
        route: url + '/api/' + this.ruta + '/filtro/por',
      },
      filtroGenericoDto,
    );
  }
  @Post('/buscar')
  async search(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Body() buscarDto: BuscarDto,
  ): Promise<Pagination<any>> {
    limit = limit > 100 ? 100 : limit;
    const url = this.configService.get(AppConfig.URL);
    return await this.service.search(
      {
        page,
        limit,
        route: url + '/api/' + this.ruta + '/buscar',
      },
      buscarDto,
    );
  }
}
