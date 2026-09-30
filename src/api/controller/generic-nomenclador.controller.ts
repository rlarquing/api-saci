import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DeleteResult } from 'mongodb';
import { ConfigService } from '@nestjs/config';
import { PermissionGuard, RolGuard } from '../guard';
import { GenericNomencladorService } from '../../core/service';
import {
  BuscarDto,
  CreateNomencladorDto,
  FiltroGenericoDto,
  ListadoDto,
  ReadNomencladorDto,
  ResponseDto,
  SelectDto,
  UpdateMultipleNomencladorDto,
  UpdateNomencladorDto,
} from '../../shared/dto';
import { GetUser, IpAddress, Servicio } from '../decorator';
import { AppConfig } from '../../app.keys';
import { UserEntity } from '../../persistence/entity';
import { NomencladorTypeEnum } from '../../shared/enum';

@ApiTags('Nomencladores')
@Controller('nomenclador')
@UsePipes(ValidationPipe)
export class GenericNomencladorController {
  private header!: string[];
  private key!: string[];
  constructor(
    protected nomencladorService: GenericNomencladorService,
    protected configService: ConfigService,
  ) {
    this.header = ['id', 'Nombre', 'Descripción'];
    this.key = ['id', 'nombre', 'descripcion'];
  }
  @Get('/:name/create/select')
  @ApiParam({ name: 'name', example: 'sector' })
  @ApiOperation({
    summary:
      'Obtener el listado de elementos del conjunto para crear un select.',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de elementos del conjunto para crear un select.',
    type: [SelectDto],
  })
  @ApiNotFoundResponse({
    description: 'Elementos del conjunto no encontrados.',
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async createSelect(@Param('name') name: string): Promise<SelectDto[]> {
    return await this.nomencladorService.createSelect(name);
  }
  @Get('/:name/:id')
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'name', example: 'sector' })
  @ApiOperation({ summary: 'Obtener un elemento del conjunto' })
  @ApiResponse({
    status: 200,
    description: 'Muestra la información de un elemento del conjunto',
    type: ReadNomencladorDto,
  })
  @ApiNotFoundResponse({
    description: 'Elemento del conjunto no encontrado.',
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @Servicio('nomenclador', 'findById')
  async findById(
    @Param('name') name: string,
    @Param('id') id: string,
  ): Promise<any> {
    return await this.nomencladorService.findById(name, id);
  }

  @Get('/:name/listado/elementos')
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'name', example: 'sector' })
  @ApiQuery({ required: false, name: 'page', example: '1' })
  @ApiQuery({ required: false, name: 'limit', example: '10' })
  @ApiOperation({ summary: 'Obtener el listado de elementos del conjunto' })
  @ApiResponse({
    status: 200,
    description: 'Listado de elementos del conjunto',
    type: ListadoDto,
  })
  @ApiNotFoundResponse({
    description: 'Elementos del conjunto no encontrados.',
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @Servicio('nomenclador', 'findAll')
  async findAll(
    @Param('name') name: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<ListadoDto> {
    limit = limit > 100 ? 100 : limit;
    const url = this.configService.get(AppConfig.URL);
    const data = await this.nomencladorService.findAll(name, {
      page,
      limit,
      route: url + '/api/nomenclador/' + name,
    });
    return new ListadoDto(this.header, this.key, data);
  }
  @Post('/:name/elementos/multiples')
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'name', example: 'sector' })
  @ApiOperation({ summary: 'Obtener multiples elementos del conjunto' })
  @ApiBody({
    description:
      'Estructura para mostrar los multiples elementos del conjunto.',
    type: [String],
  })
  @ApiResponse({
    status: 200,
    description: 'Muestra la información de multiples elementos del conjunto',
    type: [ReadNomencladorDto],
  })
  @ApiNotFoundResponse({
    description: 'Elementos del conjunto no encontrados.',
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @Servicio('nomenclador', 'findByIds')
  async findByIds(
    @Param('name') name: string,
    @Body() ids: string[],
  ): Promise<ReadNomencladorDto[]> {
    return await this.nomencladorService.findByIds(name, ids);
  }
  @Post('/:name')
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'name', example: 'sector' })
  @ApiOperation({ summary: 'Crear un elemento del conjunto.' })
  @ApiBody({
    description: 'Estructura para crear el elemento del conjunto.',
    type: CreateNomencladorDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Crea un elemento del conjunto.',
    type: ResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @Servicio('nomenclador', 'create')
  async create(
    @Param('name') name: string,
    @GetUser() user: UserEntity,
    @Body() createNomencladorDto: CreateNomencladorDto,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.nomencladorService.create(
      name,
      user,
      createNomencladorDto,
      ip,
    );
  }
  @Post('/:name/multiple')
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'name', example: 'sector' })
  @ApiOperation({ summary: 'Crear un grupo de elementos del conjunto.' })
  @ApiBody({
    description: 'Estructura para crear el grupo de elementos del conjunto.',
    type: [CreateNomencladorDto],
  })
  @ApiResponse({
    status: 201,
    description: 'Crea un grupo de elementos del conjunto.',
    type: ResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @Servicio('nomenclador', 'createMultiple')
  async createMultiple(
    @Param('name') name: string,
    @GetUser() user: UserEntity,
    @Body() createNomencladorDto: CreateNomencladorDto[],
    @IpAddress() ip: string,
  ): Promise<ResponseDto[]> {
    return await this.nomencladorService.createMultiple(
      name,
      user,
      createNomencladorDto,
      ip,
    );
  }

  @Post('/:name/importar/elementos')
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'name', example: 'sector' })
  @ApiOperation({ summary: 'Importar un grupo de elementos del conjunto.' })
  @ApiBody({
    description: 'Estructura para crear el grupo de elementos del conjunto.',
    type: [CreateNomencladorDto],
  })
  @ApiResponse({
    status: 201,
    description: 'Crea un grupo de elementos del conjunto.',
    type: ResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @Servicio('nomenclador', 'import')
  async import(
    @Param('name') name: string,
    @GetUser() user: UserEntity,
    @Body() createNomencladorDto: CreateNomencladorDto[],
    @IpAddress() ip: string,
  ): Promise<ResponseDto[]> {
    return await this.nomencladorService.importar(
      name,
      user,
      createNomencladorDto,
      ip,
    );
  }
  @Patch('/:name/:id')
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'name', example: 'sector' })
  @ApiOperation({ summary: 'Actualizar un elemento del conjunto.' })
  @ApiBody({
    description: 'Estructura para modificar el elemento del conjunto.',
    type: UpdateNomencladorDto,
  })
  @ApiResponse({
    status: 201,
    description: 'El elemento se ha actualizado.',
    type: ResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @Servicio('nomenclador', 'update')
  async update(
    @Param('name') name: string,
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @Body() updateNomencladorDto: UpdateNomencladorDto,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.nomencladorService.update(
      name,
      user,
      id,
      updateNomencladorDto,
      ip,
    );
  }
  @Patch('/:name/elementos/multiples')
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'name', example: 'sector' })
  @ApiOperation({ summary: 'Actualizar un grupo de elementos del conjunto.' })
  @ApiBody({
    description:
      'Estructura para modificar el grupo de elementos del conjunto.',
    type: [UpdateMultipleNomencladorDto],
  })
  @ApiResponse({
    status: 201,
    description: 'El grupo de elementos se han actualizado.',
    type: ResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @Servicio('nomenclador', 'updateMultiple')
  async updateMultiple(
    @Param('name') name: string,
    @GetUser() user: UserEntity,
    @Body() updateMultipleNomencladorDto: UpdateMultipleNomencladorDto[],
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    let result = new ResponseDto();
    for (const item of updateMultipleNomencladorDto) {
      result = await this.nomencladorService.update(
        name,
        user,
        String(item.id),
        item,
        ip,
      );
    }
    return result;
  }
  @Delete('/:name/:id')
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'name', example: 'sector' })
  @ApiOperation({
    summary: 'Eliminar un elemento del conjunto utilizando borrado virtual.',
  })
  @ApiResponse({ status: 201, description: 'El elemento se ha eliminado.' })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @Servicio('nomenclador', 'delete')
  async delete(
    @Param('name') name: string,
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.nomencladorService.deleteMultiple(name, user, [id], ip);
  }
  @Delete('/:name/elementos/multiples')
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'name', example: 'sector' })
  @ApiOperation({
    summary:
      'Eliminar un grupo de elementos del conjunto utilizando borrado virtual.',
  })
  @ApiBody({
    description: 'Estructura para eliminar el grupo de elementos del conjunto.',
    type: [String],
  })
  @ApiResponse({ status: 201, description: 'El elemento se ha eliminado.' })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @Servicio('nomenclador', 'deleteMultiple')
  async deleteMultiple(
    @Param('name') name: string,
    @GetUser() user: UserEntity,
    @Body() ids: string[],
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.nomencladorService.deleteMultiple(name, user, ids, ip);
  }
  @Delete('/:name/:id/delete/real')
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'name', example: 'sector' })
  @ApiOperation({
    summary: 'Eliminar un elemento del conjunto utilizando borrado real.',
  })
  @ApiResponse({ status: 201, description: 'El elemento se ha eliminado.' })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @Servicio('nomenclador', 'remove')
  async remove(
    @Param('name') name: string,
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @IpAddress() ip: string,
  ): Promise<DeleteResult> {
    return await this.nomencladorService.removeMultiple(name, user, [id], ip);
  }
  @Delete('/:name/delete/real/elementos/multiples')
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'name', example: 'sector' })
  @ApiOperation({
    summary:
      'Eliminar un grupo de elementos del conjunto utilizando borrado real.',
  })
  @ApiBody({
    description: 'Estructura para eliminar el grupo de elementos del conjunto.',
    type: [String],
  })
  @ApiResponse({ status: 201, description: 'El elemento se ha eliminado.' })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @Servicio('nomenclador', 'removeMultiple')
  async removeMultiple(
    @Param('name') name: string,
    @GetUser() user: UserEntity,
    @Body() ids: string[],
    @IpAddress() ip: string,
  ): Promise<DeleteResult> {
    return await this.nomencladorService.removeMultiple(name, user, ids, ip);
  }
  @Get('/:name/cantidad/elementos')
  @ApiParam({ name: 'name', example: 'sector' })
  @ApiParam({ required: false, name: 'page', example: '1' })
  @ApiParam({ required: false, name: 'limit', example: '10' })
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
  async count(@Param('name') name: string): Promise<number> {
    return await this.nomencladorService.count(name);
  }
  @Post('/:name/filtrar/por')
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'name', example: 'sector' })
  @ApiOperation({
    summary: 'Filtrar el conjunto por los parametros establecidos',
  })
  @ApiResponse({
    status: 201,
    description: 'Filtra el conjunto por los parametros que se le puedan pasar',
    type: ListadoDto,
  })
  @ApiBody({
    description: 'Estructura para crear el filtrado.',
    type: FiltroGenericoDto,
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @Servicio('nomenclador', 'filter')
  async filter(
    @Param('name') name: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Body() filtroGenericoDto: FiltroGenericoDto,
  ): Promise<ListadoDto> {
    limit = limit > 100 ? 100 : limit;
    const url = this.configService.get(AppConfig.URL);
    const data = await this.nomencladorService.filter(
      name,
      {
        page,
        limit,
        route: url + '/api/nomenclador' + name + '/filtrar/por',
      },
      filtroGenericoDto,
    );
    return new ListadoDto(this.header, this.key, data);
  }
  @Post('/:name/buscar')
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'name', example: 'sector' })
  @ApiParam({ required: false, name: 'page', example: '1' })
  @ApiParam({ required: false, name: 'limit', example: '10' })
  @ApiOperation({
    summary: 'Buscar en el conjunto por el parametro establecido',
  })
  @ApiResponse({
    status: 201,
    description: 'Busca en el conjunto en el parametros establecido',
    type: ListadoDto,
  })
  @ApiBody({
    description: 'Estructura para crear la búsqueda.',
    type: BuscarDto,
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @Servicio('nomenclador', 'search')
  async search(
    @Param('name') name: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Body() buscarDto: BuscarDto,
  ): Promise<ListadoDto> {
    limit = limit > 100 ? 100 : limit;
    const url = this.configService.get(AppConfig.URL);
    const data = await this.nomencladorService.search(
      name,
      {
        page,
        limit,
        route: url + '/api/nomenclador/' + name + '/buscar',
      },
      buscarDto,
    );
    return new ListadoDto(this.header, this.key, data);
  }
  @Get()
  @ApiOperation({ summary: 'Muestra todos los nombres de los nomencladores' })
  @ApiResponse({
    status: 200,
    description: 'Muestra todos los nombres de los nomencladores',
    type: [String],
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  nombreNomencladores(): string[] {
    const array: string[] = [];
    for (const [, propertyValue] of Object.entries(NomencladorTypeEnum)) {
      array.push(propertyValue);
    }
    return array;
  }

  @Post('/:name/create/select/dependiente')
  @ApiParam({ name: 'name', example: 'sector' })
  @ApiOperation({
    summary: 'Crear un select del conjunto por los parametros establecidos',
  })
  @ApiResponse({
    status: 201,
    description:
      'Crea un select del conjunto por los parametros que se le puedan pasar',
    type: [SelectDto],
  })
  @ApiBody({
    description:
      'Estructura para crear el filtrado que sera usado para crear el select.',
    type: FiltroGenericoDto,
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async createSelectDependiente(
    @Param('name') name: string,
    @Body() filtroGenericoDto: FiltroGenericoDto,
  ): Promise<SelectDto[]> {
    return await this.nomencladorService.createSelectDependiente(
      name,
      filtroGenericoDto,
    );
  }
}
