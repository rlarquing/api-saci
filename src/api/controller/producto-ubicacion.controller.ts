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
import { ProductoUbicacionService } from '../../core/service';
import {
  BinResueltoDto,
  CreateProductoUbicacionDto,
  ListadoDto,
  ReadProductoUbicacionDto,
  ResponseDto,
  UpdateProductoUbicacionDto,
} from '../../shared/dto';
import { RolType } from '../../shared/enum';
import { AppConfig } from '../../app.keys';
import { ConfigService } from '@nestjs/config';
import { Pagination } from '../../shared/pagination';

/**
 * Bins por producto/almacén (ubicación interna — backlog P3).
 * Lectura para todos los roles; configuración solo ADMIN/JEFE.
 */
@ApiTags('Ubicaciones de producto')
@Controller('producto-ubicacion')
@UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
@ApiBearerAuth()
@UsePipes(ValidationPipe)
export class ProductoUbicacionController {
  private header!: string[];
  private key!: string[];
  constructor(
    protected productoUbicacionService: ProductoUbicacionService,
    protected configService: ConfigService,
  ) {
    this.header = [
      'id',
      'SKU',
      'Producto',
      'Almacén',
      'Bin (ubicación)',
    ];
    this.key = [
      'id',
      'productoCodigo',
      'productoNombre',
      'almacenNombre',
      'ubicacionNombre',
    ];
  }

  @Get('/')
  @Roles(RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN, RolType.OPERARIO)
  @ApiOperation({
    summary: 'Listado paginado de bins (filtros: almacenId, productoId)',
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
  ): Promise<ListadoDto | ReadProductoUbicacionDto[]> {
    limit = limit && limit > 100 ? 100 : limit;
    const url = this.configService.get(AppConfig.URL);
    const resultado = await this.productoUbicacionService.listar(
      { page, limit, route: url + '/api/producto-ubicacion' },
      almacenId,
      productoId,
      sinPaginacion,
    );

    if (Array.isArray(resultado)) return resultado;

    return new ListadoDto(this.header, this.key, resultado);
  }

  @Get('/resolver')
  @Roles(RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN, RolType.OPERARIO)
  @ApiOperation({
    summary: 'Bin de un producto en un almacén (ficha del escáner — P3)',
  })
  @ApiQuery({ required: true, name: 'productoId' })
  @ApiQuery({ required: true, name: 'almacenId' })
  @ApiResponse({ status: 200, description: 'Bin resuelto', type: BinResueltoDto })
  async resolver(
    @Query('productoId') productoId: string,
    @Query('almacenId') almacenId: string,
  ): Promise<BinResueltoDto> {
    return await this.productoUbicacionService.resolverBin(
      productoId,
      almacenId,
    );
  }

  @Get('/producto/:productoId')
  @Roles(RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN, RolType.OPERARIO)
  @ApiOperation({ summary: 'Bins de un producto en todos sus almacenes' })
  @ApiResponse({ status: 200, description: 'Bins del producto' })
  async porProducto(
    @Param('productoId') productoId: string,
  ): Promise<ReadProductoUbicacionDto[]> {
    return await this.productoUbicacionService.listarPorProducto(productoId);
  }

  @Get('/select-ubicaciones')
  @Roles(RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN, RolType.OPERARIO)
  @ApiOperation({ summary: 'Select de ubicaciones activas (filtro opcional por almacén)' })
  @ApiQuery({ required: false, name: 'almacenId' })
  async selectUbicaciones(@Query('almacenId') almacenId?: string) {
    return await this.productoUbicacionService.selectUbicaciones(almacenId);
  }

  @Get('/:id')
  @Roles(RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN, RolType.OPERARIO)
  @ApiOperation({ summary: 'Detalle de un vínculo producto→bin' })
  @ApiResponse({ status: 200, description: 'Detalle', type: ReadProductoUbicacionDto })
  @ApiNotFoundResponse({ description: 'Vínculo no encontrado' })
  async findById(@Param('id') id: string): Promise<ReadProductoUbicacionDto> {
    return await this.productoUbicacionService.findById(id);
  }

  @Post('/')
  @Roles(RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN)
  @ApiOperation({
    summary: 'Asignar bin a un producto en un almacén (1 activo por par)',
  })
  @ApiResponse({ status: 201, description: 'Bin asignado', type: ResponseDto })
  async crear(
    @GetUser() user: UserEntity,
    @Body() dto: CreateProductoUbicacionDto,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.productoUbicacionService.crear(user, dto, ip);
  }

  @Put('/:id')
  @Roles(RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN)
  @ApiOperation({ summary: 'Reasignar la ubicación de un vínculo' })
  @ApiResponse({ status: 200, description: 'Vínculo actualizado', type: ResponseDto })
  async actualizar(
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: UpdateProductoUbicacionDto,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.productoUbicacionService.actualizar(user, id, dto, ip);
  }

  @Delete('/:id')
  @Roles(RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN)
  @ApiOperation({ summary: 'Quitar el bin de un producto (soft-delete)' })
  @ApiResponse({ status: 200, description: 'Vínculo eliminado', type: ResponseDto })
  async eliminar(
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.productoUbicacionService.eliminar(user, id, ip);
  }
}
