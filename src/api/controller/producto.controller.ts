import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { GetUser, IpAddress, Roles } from '../decorator';
import { PermissionGuard, RolGuard } from '../guard';
import { GenericController } from './generic.controller';
import { ProductoEntity, UserEntity } from '../../persistence/entity';
import { ProductoService } from '../../core/service';
import { CreateProductoDto, FotoProductoDto, ListadoDto, ResponseDto, UpdateProductoDto } from '../../shared/dto';
import { Pagination } from '../../shared/pagination';
import { RolType } from '../../shared/enum';
import { AppConfig } from '../../app.keys';

@ApiTags('Productos')
@Controller('producto')
@UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
@ApiBearerAuth()
@UsePipes(ValidationPipe)
export class ProductoController extends GenericController<ProductoEntity> {
  private header!: string[];
  private key!: string[];
  constructor(
    protected productoService: ProductoService,
    protected configService: ConfigService,
  ) {
    super(productoService, configService, 'producto');
    this.header = [
      'id',
      'Código',
      'Nombre',
      'Categoría',
      'Unidad',
      'Stock mínimo',
    ];
    this.key = [
      'id',
      'codigo',
      'nombre',
      'categoriaNombre',
      'unidadNombre',
      'stockMinimo',
    ];
  }

  @Get('/')
  @ApiOperation({ summary: 'Listado paginado de productos' })
  @ApiResponse({ status: 200, description: 'Listado', type: ListadoDto })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sinPaginacion') sinPaginacion?: boolean,
  ): Promise<Pagination<any> | any[]> {
    limit = limit && limit > 100 ? 100 : limit;
    const url = this.configService.get(AppConfig.URL);
    return await this.productoService.findAll(
      { page, limit, route: url + '/api/producto' },
      sinPaginacion,
    );
  }

  @Get('/codigo/:codigo')
  @ApiOperation({ summary: 'Buscar producto por SKU (escáner manual)' })
  @ApiNotFoundResponse({ description: 'No existe un producto con ese SKU' })
  async findByCodigo(@Param('codigo') codigo: string): Promise<ProductoEntity> {
    return await this.productoService.findByCodigo(codigo);
  }

  @Post('/')
  @ApiOperation({ summary: 'Alta de producto (SKU autogenerado)' })
  @ApiResponse({ status: 201, description: 'Producto creado', type: ResponseDto })
  async create(
    @GetUser() user: UserEntity,
    @Body() createDto: CreateProductoDto,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.productoService.create(user, createDto, ip);
  }

  @Patch('/:id')
  @ApiOperation({ summary: 'Edición de producto' })
  @ApiResponse({ status: 200, description: 'Producto actualizado', type: ResponseDto })
  async update(
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @Body() updateDto: UpdateProductoDto,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.productoService.update(user, id, updateDto, ip);
  }

  @Put('/:id/foto')
  @Roles(RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN)
  @ApiOperation({
    summary: 'Subir/actualizar foto del producto (data URL base64 comprimida en cliente)',
  })
  @ApiResponse({ status: 200, description: 'Foto actualizada', type: ResponseDto })
  async subirFoto(
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: FotoProductoDto,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.productoService.guardarFoto(user, id, dto.foto, ip);
  }
}
