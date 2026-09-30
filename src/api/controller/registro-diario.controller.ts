import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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
import { Roles, GetUser } from '../decorator';
import { RegistroDiarioService } from '../../core/service';
import { RolType } from '../../shared/enum';
import { UserEntity } from '../../persistence/entity';
import {
  BuscarDto,
  FiltroGenericoDto,
  ListadoDto,
  ReadRegistroDiarioDto,
  ResponseDto,
} from '../../shared/dto';

@ApiTags('RegistroDiarios')
@Controller('registro-diario')
@UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
@ApiBearerAuth()
@UsePipes(ValidationPipe)
export class RegistroDiarioController {
  private header!: string[];
  private key!: string[];
  constructor(protected registroDiarioService: RegistroDiarioService) {
    this.header = [
      'id',
      'Fecha',
      'Almacen',
      'Estado',
      'Total de medios',
      'Total de salidas',
    ];
    this.key = [
      'id',
      'fecha',
      'almacen',
      'estado',
      'totalEntradas',
      'totalSalidas',
    ];
  }

  /**
   * Valida que el JEFE/USUARIO tenga acceso al almacen especificado
   */
  private validarAccesoAlmacen(user: UserEntity, almacenId: string): void {
    if (!user.almacenIds || user.almacenIds.length === 0) {
      throw new ForbiddenException('El usuario no tiene almacenes asignados');
    }
    if (!user.almacenIds.includes(almacenId)) {
      throw new ForbiddenException(
        'No tiene autorización para acceder a este almacen',
      );
    }
  }

  @Get('/')
  @Roles(RolType.JEFE_DE_ALMACEN)
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
    const data = await this.registroDiarioService.findAll(
      { page, limit },
      sinPaginacion,
    );
    return new ListadoDto(this.header, this.key, data);
  }

  @Get('/:id')
  @Roles(RolType.JEFE_DE_ALMACEN)
  @ApiOperation({ summary: 'Obtener un elemento del conjunto' })
  @ApiResponse({
    status: 200,
    description: 'Muestra la información de un elemento del conjunto',
    type: ReadRegistroDiarioDto,
  })
  @ApiNotFoundResponse({
    description: 'Elemento del conjunto no encontrado.',
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async findById(@Param('id') id: string): Promise<ReadRegistroDiarioDto> {
    return await this.registroDiarioService.findById(id);
  }

  @Post('/filtrar')
  @Roles(RolType.JEFE_DE_ALMACEN)
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
    const data = await this.registroDiarioService.filter(
      { page, limit },
      filtroGenericoDto,
    );
    return new ListadoDto(this.header, this.key, data);
  }
  @Post('/buscar')
  @Roles(RolType.JEFE_DE_ALMACEN)
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
    const data = await this.registroDiarioService.search(
      { page, limit },
      buscarDto,
    );
    return new ListadoDto(this.header, this.key, data);
  }

  @Patch('/cerrar/:id')
  @Roles(RolType.JEFE_DE_ALMACEN)
  @ApiOperation({
    summary:
      'Cerrar un registro diario manualmente (solo el jefe del almacen cierra el día)',
  })
  @ApiResponse({
    status: 200,
    description: 'Registro diario cerrado exitosamente',
    type: ResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Registro diario no encontrado.',
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async cerrarRegistro(
    @GetUser() user: UserEntity,
    @Param('id') id: string,
  ): Promise<ResponseDto> {
    // Obtener el registro para validar acceso al almacen
    const registro = await this.registroDiarioService.findById(id);
    this.validarAccesoAlmacen(user, registro.almacenId);

    return await this.registroDiarioService.cerrarRegistro(id);
  }

  @Get('/actual/:almacenId')
  @Roles(RolType.JEFE_DE_ALMACEN, RolType.OPERARIO)
  @ApiOperation({
    summary: 'Obtener el registro diario actual de un almacen',
    description:
      'ADMINISTRADOR: cualquier almacen. USUARIO: solo sus almacenes asignados.',
  })
  @ApiResponse({
    status: 200,
    description: 'Registro diario actual',
    type: ReadRegistroDiarioDto,
  })
  @ApiNotFoundResponse({
    description: 'Registro diario no encontrado.',
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async getRegistroActual(
    @GetUser() user: UserEntity,
    @Param('almacenId') almacenId: string,
  ): Promise<ReadRegistroDiarioDto> {
    // Validar acceso al almacen
    this.validarAccesoAlmacen(user, almacenId);

    return await this.registroDiarioService.getRegistroActual(almacenId);
  }
}
