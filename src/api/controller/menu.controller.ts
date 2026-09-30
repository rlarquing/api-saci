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
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
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
import { PermissionGuard, RolGuard } from '../guard';
import { GenericController } from './generic.controller';
import { MenuEntity, UserEntity } from '../../persistence/entity';
import { MenuService } from '../../core/service';
import { RolType } from '../../shared/enum';
import { GetUser, IpAddress, Roles } from '../decorator';
import {
  BadRequestDto,
  BuscarDto,
  CreateMenuDto,
  FiltroGenericoDto,
  ListadoDto,
  ReadMenuDto,
  ResponseDto,
  UpdateMenuDto,
  UpdateMultipleMenuDto,
} from '../../shared/dto';

@ApiTags('Menus')
@Controller('menu')
@UsePipes(ValidationPipe)
export class MenuController extends GenericController<MenuEntity> {
  private header!: string[];
  private key!: string[];
  constructor(
    protected menuService: MenuService,
    protected configService: ConfigService,
  ) {
    super(menuService, configService, 'menu');
    this.header = ['id', 'Label', 'Icon', 'To', 'Menu padre'];
    this.key = ['id', 'label', 'icon', 'to', 'menuPadre'];
  }

  @Get('/')
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
  @ApiQuery({ required: false, name: 'page', example: '1' })
  @ApiQuery({ required: false, name: 'limit', example: '10' })
  @ApiQuery({ required: false, name: 'sinPaginacion', example: false })
  @Roles(RolType.ADMINISTRADOR)
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('sinPaginacion') sinPaginacion = false,
  ): Promise<any> {
    const data = await super.findAll(page, limit, sinPaginacion);
    return new ListadoDto(this.header, this.key, data);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Obtener un elemento del conjunto' })
  @ApiResponse({
    status: 200,
    description: 'Muestra la información de un elemento del conjunto',
    type: ReadMenuDto,
  })
  @ApiNotFoundResponse({
    description: 'Elemento del conjunto no encontrado.',
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @ApiParam({ required: true, name: 'id', example: 1 })
  @Roles(RolType.ADMINISTRADOR)
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  async findById(@Param('id') id: string): Promise<ReadMenuDto> {
    return await super.findById(id);
  }

  @Get('/tipo/:tipo')
  @ApiOperation({
    summary: 'Obtener un elemento del conjunto por tipo',
  })
  @ApiResponse({
    status: 200,
    description: 'Muestra la información de un elemento del conjunto tipo',
    type: ReadMenuDto,
  })
  @ApiNotFoundResponse({
    description: 'Elemento del conjunto no encontrado.',
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @ApiParam({ required: true, name: 'tipo', example: 'reporte' })
  async findByTipo(@Param('tipo') tipo: string): Promise<ReadMenuDto[]> {
    return await this.menuService.findByTipo(tipo);
  }

  @Post('/elementos/multiples')
  @ApiOperation({ summary: 'Obtener multiples elementos del conjunto' })
  @ApiBody({
    description:
      'Estructura para mostrar los multiples elementos del conjunto.',
    type: [Number],
  })
  @ApiResponse({
    status: 200,
    description: 'Muestra la información de multiples elementos del conjunto',
    type: [ReadMenuDto],
  })
  @ApiNotFoundResponse({
    description: 'Elementos del conjunto no encontrados.',
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @Roles(RolType.ADMINISTRADOR)
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  async findByIds(@Body() ids: string[]): Promise<ReadMenuDto[]> {
    return await super.findByIds(ids);
  }

  @Post('/')
  @ApiOperation({ summary: 'Crear un elemento del conjunto.' })
  @ApiBody({
    description: 'Estructura para crear el elemento del conjunto.',
    type: CreateMenuDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Crea un elemento del conjunto.',
    type: ResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @ApiResponse({
    status: 400,
    description: 'Solicitud con errores.',
    type: BadRequestDto,
  })
  @Roles(RolType.ADMINISTRADOR)
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  async create(
    @GetUser() user: UserEntity,
    @Body() createMenuDto: CreateMenuDto,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await super.create(user, createMenuDto, ip);
  }

  @Post('/multiple')
  @ApiOperation({ summary: 'Crear un grupo de elementos del conjunto.' })
  @ApiBody({
    description: 'Estructura para crear el grupo de elementos del conjunto.',
    type: [CreateMenuDto],
  })
  @ApiResponse({
    status: 201,
    description: 'Crea un grupo de elementos del conjunto.',
    type: ResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @ApiResponse({
    status: 400,
    description: 'Solicitud con errores.',
    type: BadRequestDto,
  })
  @Roles(RolType.ADMINISTRADOR)
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  async createMultiple(
    @GetUser() user: UserEntity,
    @Body() createMenuDto: CreateMenuDto[],
    @IpAddress() ip: string,
  ): Promise<ResponseDto[]> {
    return await super.createMultiple(user, createMenuDto, ip);
  }

  @Post('/importar/elementos')
  @ApiOperation({ summary: 'Importar un grupo de elementos del conjunto.' })
  @ApiBody({
    description: 'Estructura para crear el grupo de elementos del conjunto.',
    type: [CreateMenuDto],
  })
  @ApiResponse({
    status: 201,
    description: 'Crea un grupo de elementos del conjunto.',
    type: ResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @ApiResponse({
    status: 400,
    description: 'Solicitud con errores.',
    type: BadRequestDto,
  })
  @Roles(RolType.ADMINISTRADOR)
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  async import(
    @GetUser() user: UserEntity,
    @Body() createMenuDto: CreateMenuDto[],
    @IpAddress() ip: string,
  ): Promise<ResponseDto[]> {
    return await super.import(user, createMenuDto, ip);
  }

  @Patch('/:id')
  @ApiOperation({ summary: 'Actualizar un elemento del conjunto.' })
  @ApiBody({
    description: 'Estructura para modificar el elemento del conjunto.',
    type: UpdateMenuDto,
  })
  @ApiResponse({
    status: 201,
    description: 'El elemento se ha actualizado.',
    type: ResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @ApiResponse({
    status: 400,
    description: 'Solicitud con errores.',
    type: BadRequestDto,
  })
  @Roles(RolType.ADMINISTRADOR)
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  async update(
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @Body() updateMenuDto: UpdateMenuDto,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await super.update(user, id, updateMenuDto, ip);
  }

  @Patch('/elementos/multiples')
  @ApiOperation({ summary: 'Actualizar un grupo de elementos del conjunto.' })
  @ApiBody({
    description:
      'Estructura para modificar el grupo de elementos del conjunto.',
    type: [UpdateMultipleMenuDto],
  })
  @ApiResponse({
    status: 201,
    description: 'El grupo de elementos se han actualizado.',
    type: ResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @ApiResponse({
    status: 400,
    description: 'Solicitud con errores.',
    type: BadRequestDto,
  })
  @Roles(RolType.ADMINISTRADOR)
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  async updateMultiple(
    @GetUser() user: UserEntity,
    @Body() updateMultipleMenueDto: UpdateMultipleMenuDto[],
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await super.updateMultiple(user, updateMultipleMenueDto, ip);
  }

  @Delete('/:id')
  @ApiOperation({
    summary: 'Eliminar un elemento del conjunto utilizando borrado virtual.',
  })
  @ApiResponse({ status: 201, description: 'El elemento se ha eliminado.' })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @Roles(RolType.ADMINISTRADOR)
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  async delete(
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await super.deleteMultiple(user, [id], ip);
  }
  @Delete('/elementos/multiples')
  @Roles(RolType.ADMINISTRADOR)
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
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  async deleteMultiple(
    @GetUser() user: UserEntity,
    @Body() ids: string[],
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await super.deleteMultiple(user, ids, ip);
  }

  @Post('/filtrar')
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
  @ApiQuery({ required: false, name: 'page', example: '1' })
  @ApiQuery({ required: false, name: 'limit', example: '10' })
  @Roles(RolType.ADMINISTRADOR)
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  async filter(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Body() filtroGenericoDto: FiltroGenericoDto,
  ): Promise<any> {
    const data = await super.filter(page, limit, filtroGenericoDto);
    return new ListadoDto(this.header, this.key, data);
  }
  @Post('/buscar')
  @ApiOperation({
    summary: 'Buscar en el conjunto por el parametro establecido',
  })
  @ApiResponse({
    status: 201,
    description: 'Busca en el conjunto en el parametros establecido',
    type: ListadoDto,
  })
  @ApiBody({
    description: 'Estructura para crear la busqueda.',
    type: BuscarDto,
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @ApiQuery({ required: false, name: 'page', example: '1' })
  @ApiQuery({ required: false, name: 'limit', example: '10' })
  @Roles(RolType.ADMINISTRADOR)
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  async search(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Body() buscarDto: BuscarDto,
  ): Promise<any> {
    const data = await super.search(page, limit, buscarDto);
    return new ListadoDto(this.header, this.key, data);
  }
}
