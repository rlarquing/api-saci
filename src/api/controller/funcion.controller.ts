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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PermissionGuard, RolGuard } from '../guard';
import { GetUser, IpAddress, Roles } from '../decorator';
import { GenericController } from './generic.controller';
import { FuncionEntity, UserEntity } from '../../persistence/entity';
import { FuncionService } from '../../core/service';
import { RolType } from '../../shared/enum';
import {
  BadRequestDto,
  BuscarDto,
  CreateFuncionDto,
  FiltroGenericoDto,
  ListadoDto,
  ReadFuncionDto,
  ResponseDto,
  SelectDto,
  UpdateFuncionDto,
  UpdateMultipleFuncionDto,
} from '../../shared/dto';

@ApiTags('Funcions')
@Controller('funcion')
@UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
@ApiBearerAuth()
@UsePipes(ValidationPipe)
export class FuncionController extends GenericController<FuncionEntity> {
  private header!: string[];
  private key!: string[];
  constructor(
    protected funcionService: FuncionService,
    protected configService: ConfigService,
  ) {
    super(funcionService, configService, 'funcion');
    this.header = ['id', 'Nombre', 'Descripción', 'EndPoints', 'Menu'];
    this.key = ['id', 'nombre', 'descripcion', 'endPoints', 'menu'];
  }

  @Get('/')
  @Roles(RolType.ADMINISTRADOR)
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
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('sinPaginacion') sinPaginacion = false,
  ): Promise<any> {
    const data = await super.findAll(page, limit, sinPaginacion);
    return new ListadoDto(this.header, this.key, data);
  }

  @Get('/:id')
  @Roles(RolType.ADMINISTRADOR)
  @ApiOperation({ summary: 'Obtener un elemento del conjunto' })
  @ApiResponse({
    status: 200,
    description: 'Muestra la información de un elemento del conjunto',
    type: ReadFuncionDto,
  })
  @ApiNotFoundResponse({
    description: 'Elemento del conjunto no encontrado.',
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async findById(@Param('id') id: string): Promise<ReadFuncionDto> {
    return await super.findById(id);
  }

  @Post('/elementos/multiples')
  @Roles(RolType.ADMINISTRADOR)
  @ApiOperation({ summary: 'Obtener multiples elementos del conjunto' })
  @ApiBody({
    description:
      'Estructura para mostrar los multiples elementos del conjunto.',
    type: [Number],
  })
  @ApiResponse({
    status: 200,
    description: 'Muestra la información de multiples elementos del conjunto',
    type: [ReadFuncionDto],
  })
  @ApiNotFoundResponse({
    description: 'Elementos del conjunto no encontrados.',
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async findByIds(@Body() ids: string[]): Promise<ReadFuncionDto[]> {
    return await super.findByIds(ids);
  }
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
    return await super.createSelect();
  }

  @Post('/')
  @Roles(RolType.ADMINISTRADOR)
  @ApiOperation({ summary: 'Crear un elemento del conjunto.' })
  @ApiBody({
    description: 'Estructura para crear el elemento del conjunto.',
    type: CreateFuncionDto,
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
  async create(
    @GetUser() user: UserEntity,
    @Body() createFuncionDto: CreateFuncionDto,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await super.create(user, createFuncionDto, ip);
  }

  @Post('/multiple')
  @Roles(RolType.ADMINISTRADOR)
  @ApiOperation({ summary: 'Crear un grupo de elementos del conjunto.' })
  @ApiBody({
    description: 'Estructura para crear el grupo de elementos del conjunto.',
    type: [CreateFuncionDto],
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
  async createMultiple(
    @GetUser() user: UserEntity,
    @Body() createFuncionDto: CreateFuncionDto[],
    @IpAddress() ip: string,
  ): Promise<ResponseDto[]> {
    return await super.createMultiple(user, createFuncionDto, ip);
  }

  @Post('/importar/elementos')
  @Roles(RolType.ADMINISTRADOR)
  @ApiOperation({ summary: 'Importar un grupo de elementos del conjunto.' })
  @ApiBody({
    description: 'Estructura para crear el grupo de elementos del conjunto.',
    type: [CreateFuncionDto],
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
  async import(
    @GetUser() user: UserEntity,
    @Body() createFuncionDto: CreateFuncionDto[],
    @IpAddress() ip: string,
  ): Promise<ResponseDto[]> {
    return await super.import(user, createFuncionDto, ip);
  }

  @Patch('/:id')
  @Roles(RolType.ADMINISTRADOR)
  @ApiOperation({ summary: 'Actualizar un elemento del conjunto.' })
  @ApiBody({
    description: 'Estructura para modificar el elemento del conjunto.',
    type: UpdateFuncionDto,
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
  async update(
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @Body() updateFuncionDto: UpdateFuncionDto,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await super.update(user, id, updateFuncionDto, ip);
  }

  @Patch('/elementos/multiples')
  @Roles(RolType.ADMINISTRADOR)
  @ApiOperation({ summary: 'Actualizar un grupo de elementos del conjunto.' })
  @ApiBody({
    description:
      'Estructura para modificar el grupo de elementos del conjunto.',
    type: [UpdateMultipleFuncionDto],
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
  async updateMultiple(
    @GetUser() user: UserEntity,
    @Body() updateMultipleFuncioneDto: UpdateMultipleFuncionDto[],
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await super.updateMultiple(user, updateMultipleFuncioneDto, ip);
  }

  @Delete('/:id')
  @Roles(RolType.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Eliminar un elemento del conjunto utilizando borrado virtual.',
  })
  @ApiResponse({ status: 201, description: 'El elemento se ha eliminado.' })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
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
  async deleteMultiple(
    @GetUser() user: UserEntity,
    @Body() ids: string[],
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await super.deleteMultiple(user, ids, ip);
  }

  @Post('/filtrar')
  @Roles(RolType.ADMINISTRADOR)
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
  async filter(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Body() filtroGenericoDto: FiltroGenericoDto,
  ): Promise<any> {
    const data = await super.filter(page, limit, filtroGenericoDto);
    return new ListadoDto(this.header, this.key, data);
  }
  @Post('/buscar')
  @Roles(RolType.ADMINISTRADOR)
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
  async search(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Body() buscarDto: BuscarDto,
  ): Promise<any> {
    const data = await super.search(page, limit, buscarDto);
    return new ListadoDto(this.header, this.key, data);
  }
}
