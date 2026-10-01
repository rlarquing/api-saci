import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PermissionGuard, RolGuard } from '../guard';
import { Roles, GetUser, IpAddress } from '../decorator';
import { UserEntity } from '../../persistence/entity';
import { NivelStockService } from '../../core/service';
import {
  CreateNivelStockDto,
  ListadoDto,
  ReadNivelStockDto,
  ResponseDto,
  UpdateNivelStockDto,
} from '../../shared/dto';
import { RolType } from '../../shared/enum';
import { AppConfig } from '../../app.keys';
import { ConfigService } from '@nestjs/config';
import { Pagination } from '../../shared/pagination';

/**
 * Niveles de stock por producto/almacén (safety stock — backlog P2).
 * Lectura para todos los roles; configuración solo ADMIN/JEFE.
 */
@ApiTags('Niveles de stock')
@Controller('nivel-stock')
@UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
@ApiBearerAuth()
@UsePipes(ValidationPipe)
export class NivelStockController {
  private header!: string[];
  private key!: string[];
  constructor(
    protected nivelStockService: NivelStockService,
    protected configService: ConfigService,
  ) {
    this.header = [
      'id',
      'SKU',
      'Producto',
      'Almacén',
      'Stock mínimo',
      'Stock seguridad',
      'Punto de reorden',
    ];
    this.key = [
      'id',
      'productoCodigo',
      'productoNombre',
      'almacenNombre',
      'stockMinimo',
      'stockSeguridad',
      'puntoReorden',
    ];
  }

  @Get('/')
  @Roles(RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN, RolType.OPERARIO)
  @ApiOperation({
    summary: 'Listado paginado de niveles (filtros: almacenId, productoId)',
  })
  @ApiResponse({ status: 200, description: 'Listado', type: ListadoDto })
  @ApiQuery({ required: false, name: 'page', example: '1' })
  @ApiQuery({ required: false, name: 'limit', example: '10' })
  @ApiQuery({ required: false, name: 'almacenId' })
  @ApiQuery({ required: false, name: 'productoId' })
  @ApiQuery({ required: false, name: 'sinPaginacion', example: false })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('almacenId') almacenId?: string,
    @Query('productoId') productoId?: string,
    @Query('sinPaginacion') sinPaginacion = false,
  ): Promise<ListadoDto | ReadNivelStockDto[]> {
    limit = limit && limit > 100 ? 100 : limit;
    const url = this.configService.get(AppConfig.URL);
    const resultado = await this.nivelStockService.listar(
      { page, limit, route: url + '/api/nivel-stock' },
      almacenId,
      productoId,
      sinPaginacion,
    );

    if (Array.isArray(resultado)) return resultado;

    return new ListadoDto(this.header, this.key, resultado);
  }

  @Get('/:id')
  @Roles(RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN, RolType.OPERARIO)
  @ApiOperation({ summary: 'Detalle de un nivel' })
  @ApiResponse({ status: 200, description: 'Detalle', type: ReadNivelStockDto })
  @ApiNotFoundResponse({ description: 'Nivel no encontrado' })
  async findById(@Param('id') id: string): Promise<ReadNivelStockDto> {
    return await this.nivelStockService.findById(id);
  }

  @Post('/')
  @Roles(RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN)
  @ApiOperation({
    summary: 'Crear nivel por producto+almacén (1 activo por par)',
  })
  @ApiResponse({ status: 201, description: 'Nivel creado', type: ResponseDto })
  async crear(
    @GetUser() user: UserEntity,
    @Body() dto: CreateNivelStockDto,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.nivelStockService.crear(user, dto, ip);
  }

  @Put('/:id')
  @Roles(RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN)
  @ApiOperation({ summary: 'Actualizar umbrales de un nivel' })
  @ApiResponse({ status: 200, description: 'Nivel actualizado', type: ResponseDto })
  async actualizar(
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: UpdateNivelStockDto,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.nivelStockService.actualizar(user, id, dto, ip);
  }

  @Delete('/:id')
  @Roles(RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN)
  @ApiOperation({ summary: 'Eliminar un nivel (soft-delete)' })
  @ApiResponse({ status: 200, description: 'Nivel eliminado', type: ResponseDto })
  async eliminar(
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.nivelStockService.eliminar(user, id, ip);
  }
}
