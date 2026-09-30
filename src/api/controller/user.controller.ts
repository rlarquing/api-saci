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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser, IpAddress } from '../decorator';
import { Roles } from '../decorator';
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
import { ConfigService } from '@nestjs/config';
import { RolType } from '../../shared/enum';
import { UserService } from '../../core/service';
import {
  BuscarDto,
  ChangePasswordDto,
  CreateUserDto,
  FiltroGenericoDto,
  ListadoDto,
  ReadUserDto,
  ResponseDto,
  SelectDto,
  UpdateUserDto,
} from '../../shared/dto';
import { AppConfig } from '../../app.keys';
import { UserEntity } from '../../persistence/entity';

@ApiTags('Users')
@Controller('user')
export class UserController {
  private header!: string[];
  private key!: string[];
  constructor(
    protected userService: UserService,
    protected configService: ConfigService,
  ) {
    this.header = ['id', 'Nombre', 'Email', 'Roles', 'Almacenes', 'Funciones'];
    this.key = ['id', 'userName', 'email', 'roles', 'almacenes', 'funciones'];
  }

  @Get('/')
  @Roles(RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN)
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener el listado de los usuarios' })
  @ApiResponse({
    status: 200,
    description: 'Listado de los usuarios',
    type: ListadoDto,
  })
  @ApiNotFoundResponse({
    description: 'Usuarios no encontrados.',
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @ApiQuery({ required: false, name: 'page', example: '1' })
  @ApiQuery({ required: false, name: 'limit', example: '10' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<ListadoDto> {
    limit = limit > 100 ? 100 : limit;
    const url = this.configService.get(AppConfig.URL);
    const data = await this.userService.findAll({
      page,
      limit,
      route: url + '/user',
    });

    return new ListadoDto(this.header, this.key, data);
  }

  @Get('/:id')
  @Roles(RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN)
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener un usuario' })
  @ApiResponse({
    status: 200,
    description: 'Muestra la información de un usuario',
    type: ReadUserDto,
  })
  @ApiNotFoundResponse({
    description: 'Usuario no encontrado.',
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async findById(@Param('id') id: string): Promise<ReadUserDto> {
    return await this.userService.findById(id);
  }

  @Post('/')
  @Roles(RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN)
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un usuario' })
  @ApiBody({
    description: 'Estructura para crear el usuario.',
    type: CreateUserDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Crea un usuario',
    type: ResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async create(
    @GetUser() user: UserEntity,
    @Body() createUserDto: CreateUserDto,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.userService.create(user, createUserDto, ip);
  }

  @Patch('/:id')
  @Roles(RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN)
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un usuario' })
  @ApiBody({
    description: 'Estructura para modificar el usuario.',
    type: UpdateUserDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Actualiza un usuario',
    type: ResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async update(
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.userService.update(user, id, updateUserDto, ip);
  }

  @Delete('/:id')
  @Roles(RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN)
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un usuario' })
  @ApiResponse({
    status: 200,
    description: 'Elimina un usuario',
    type: ResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async delete(
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.userService.delete(user, id, ip);
  }

  @Delete('/elementos/multiples')
  @Roles(RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN)
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un grupo de usuarios.' })
  @ApiBody({
    description: 'Estructura para eliminar el grupo de usuarios.',
    type: [Number],
  })
  @ApiResponse({ status: 201, description: 'El elemento se ha eliminado.' })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async deleteMultiple(
    @GetUser() user: UserEntity,
    @Body() ids: string[],
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.userService.deleteMultiple(user, ids, ip);
  }

  @Post('/filtrar')
  @Roles(RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN)
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
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
  ): Promise<ListadoDto> {
    limit = limit > 100 ? 100 : limit;
    const url = this.configService.get(AppConfig.URL);
    const data = await this.userService.filter(
      {
        page,
        limit,
        route: url + '/user',
      },
      filtroGenericoDto,
    );
    return new ListadoDto(this.header, this.key, data);
  }

  @Post('/buscar')
  @Roles(RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN)
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
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
  @ApiQuery({ required: false, name: 'page', example: '1' })
  @ApiQuery({ required: false, name: 'limit', example: '10' })
  async search(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Body() buscarDto: BuscarDto,
  ): Promise<ListadoDto> {
    limit = limit > 100 ? 100 : limit;
    const url = this.configService.get(AppConfig.URL);
    const data = await this.userService.search(
      {
        page,
        limit,
        route: url + '/user',
      },
      buscarDto,
    );
    return new ListadoDto(this.header, this.key, data);
  }

  @Patch('/:id/change/password')
  @Roles(RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN)
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar password a un usuario' })
  @ApiBody({
    description: 'Estructura para cambiar el password del usuario.',
    type: ChangePasswordDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Cambia el password de un usuario',
    type: ResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async changePassword(
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.userService.changePassword(
      user,
      id,
      changePasswordDto,
      ip,
    );
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
  async createSelect(): Promise<SelectDto[]> {
    return await this.userService.createSelect();
  }
}
