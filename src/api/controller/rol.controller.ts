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
import { GetUser, IpAddress, Roles } from '../decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolGuard } from '../guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PermissionGuard } from '../guard';
import { ConfigService } from '@nestjs/config';
import { GenericController } from './generic.controller';
import { RolEntity, UserEntity } from '../../persistence/entity';
import { RolService } from '../../core/service';
import { RolType } from '../../shared/enum';
import {
  BadRequestDto,
  BuscarDto,
  CreateRolDto,
  FiltroGenericoDto,
  ListadoDto,
  ReadRolDto,
  ResponseDto,
  SelectDto,
  UpdateMultipleRolDto,
  UpdateRolDto,
} from '../../shared/dto';

@ApiTags('Roles')
@Controller('rol')
@UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
@ApiBearerAuth()
@UsePipes(ValidationPipe)
export class RolController extends GenericController<RolEntity> {
  private header!: string[];
  private key!: string[];
  constructor(
    protected rolService: RolService,
    protected configService: ConfigService,
  ) {
    super(rolService, configService, 'rol');
    this.header = ['id', 'Nombre', 'Descripción'];
    this.key = ['id', 'nombre', 'descripcion'];
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
    type: ReadRolDto,
  })
  @ApiNotFoundResponse({
    description: 'Elemento del conjunto no encontrado.',
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async findById(@Param('id') id: string): Promise<ReadRolDto> {
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
    type: [ReadRolDto],
  })
  @ApiNotFoundResponse({
    description: 'Elementos del conjunto no encontrados.',
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async findByIds(@Body() ids: string[]): Promise<ReadRolDto[]> {
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
    // Call base method to get all roles
    const allRoles = await super.createSelect();

    // Extract current user from request context
    const user = (this as any).request.user as UserEntity | undefined;

    // If caller is not ADMINISTRADOR, only allow JEFE_DE_ALMACEN and USUARIO roles
    if (!user?.roles?.some((r) => r.nombre === RolType.ADMINISTRADOR)) {
      return allRoles.filter(
        (r) =>
          r.label === RolType.JEFE_DE_ALMACEN || r.label === RolType.OPERARIO,
      );
    }

    // If caller is ADMINISTRADOR, return all roles
    return allRoles;
  }
  @Post('/crear/select/dependiente')
  @Roles(RolType.ADMINISTRADOR)
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
  @Roles(RolType.ADMINISTRADOR)
  @ApiOperation({ summary: 'Crear un elemento del conjunto.' })
  @ApiBody({
    description: 'Estructura para crear el elemento del conjunto.',
    type: CreateRolDto,
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
    @Body() createRoleDto: CreateRolDto,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await super.create(user, createRoleDto, ip);
  }
  @Post('/multiple')
  @Roles(RolType.ADMINISTRADOR)
  @ApiOperation({ summary: 'Crear un grupo de elementos del conjunto.' })
  @ApiBody({
    description: 'Estructura para crear el grupo de elementos del conjunto.',
    type: [CreateRolDto],
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
    @Body() createRoleDto: CreateRolDto[],
    @IpAddress() ip: string,
  ): Promise<ResponseDto[]> {
    return await super.createMultiple(user, createRoleDto, ip);
  }

  @Post('/importar/elementos')
  @Roles(RolType.ADMINISTRADOR)
  @ApiOperation({ summary: 'Importar un grupo de elementos del conjunto.' })
  @ApiBody({
    description: 'Estructura para crear el grupo de elementos del conjunto.',
    type: [CreateRolDto],
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
    @Body() createRoleDto: CreateRolDto[],
    @IpAddress() ip: string,
  ): Promise<ResponseDto[]> {
    return await super.import(user, createRoleDto, ip);
  }
  @Patch('/:id')
  @Roles(RolType.ADMINISTRADOR)
  @ApiOperation({ summary: 'Actualizar un elemento del conjunto.' })
  @ApiBody({
    description: 'Estructura para modificar el elemento del conjunto.',
    type: UpdateRolDto,
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
    @Body() updateRoleDto: UpdateRolDto,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await super.update(user, id, updateRoleDto, ip);
  }
  @Patch('/elementos/multiples')
  @Roles(RolType.ADMINISTRADOR)
  @ApiOperation({ summary: 'Actualizar un grupo de elementos del conjunto.' })
  @ApiBody({
    description:
      'Estructura para modificar el grupo de elementos del conjunto.',
    type: [UpdateMultipleRolDto],
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
    @Body() updateMultipleRolDto: UpdateMultipleRolDto[],
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await super.updateMultiple(user, updateMultipleRolDto, ip);
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
