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
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { PermissionGuard, RolGuard } from '../guard';
import { Roles, GetUser, IpAddress } from '../decorator';
import { UserEntity } from '../../persistence/entity';
import { ConteoInventarioService } from '../../core/service';
import {
  ConteoLineaDto,
  CreateConteoDto,
  ListadoDto,
  ReadConteoDto,
  ResponseDto,
} from '../../shared/dto';
import { RolType } from '../../shared/enum';
import { AppConfig } from '../../app.keys';
import { ConfigService } from '@nestjs/config';

/**
 * Conteo cíclico de inventario: abrir → contar → cerrar con ajustes.
 * ADMIN: todo. JEFE: crear/cerrar/cancelar en sus almacenes. OPERARIO: contar.
 */
@ApiTags('Conteos de inventario')
@Controller('conteo-inventario')
@UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
@ApiBearerAuth()
@UsePipes(ValidationPipe)
export class ConteoInventarioController {
  private header!: string[];
  private key!: string[];
  constructor(
    protected conteoInventarioService: ConteoInventarioService,
    protected configService: ConfigService,
  ) {
    this.header = [
      'id',
      'Almacén',
      'Estado',
      'Modo',
      'Líneas',
      'Contadas',
      'Abierto por',
      'Apertura',
      'Cierre',
    ];
    this.key = [
      'id',
      'almacenNombre',
      'estado',
      'esCiego',
      'totalLineas',
      'totalContadas',
      'userName',
      'fechaApertura',
      'fechaCierre',
    ];
  }

  @Get('/')
  @Roles(
    RolType.ADMINISTRADOR,
    RolType.JEFE_DE_ALMACEN,
    RolType.OPERARIO,
  )
  @ApiOperation({ summary: 'Listado paginado de conteos (filtro por almacén/estado)' })
  @ApiResponse({ status: 200, description: 'Listado', type: ListadoDto })
  @ApiQuery({ required: false, name: 'page', example: '1' })
  @ApiQuery({ required: false, name: 'limit', example: '10' })
  @ApiQuery({ required: false, name: 'almacenId' })
  @ApiQuery({ required: false, name: 'estado', example: 'ABIERTO' })
  @ApiQuery({ required: false, name: 'sinPaginacion', example: false })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('almacenId') almacenId?: string,
    @Query('estado') estado?: string,
    @Query('sinPaginacion') sinPaginacion = false,
  ): Promise<ListadoDto | ReadConteoDto[]> {
    limit = limit && limit > 100 ? 100 : limit;
    const url = this.configService.get(AppConfig.URL);
    const resultado = await this.conteoInventarioService.listar(
      { page, limit, route: url + '/api/conteo-inventario' },
      almacenId,
      estado,
      sinPaginacion,
    );

    if (Array.isArray(resultado)) return resultado;

    return new ListadoDto(this.header, this.key, resultado);
  }

  @Get('/:id')
  @Roles(
    RolType.ADMINISTRADOR,
    RolType.JEFE_DE_ALMACEN,
    RolType.OPERARIO,
  )
  @ApiOperation({ summary: 'Detalle de un conteo con todas sus líneas' })
  @ApiResponse({ status: 200, description: 'Detalle del conteo', type: ReadConteoDto })
  @ApiNotFoundResponse({ description: 'Conteo no encontrado' })
  async findById(@Param('id') id: string): Promise<ReadConteoDto> {
    return await this.conteoInventarioService.obtenerDetalle(id);
  }

  @Post('/')
  @Roles(RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN)
  @ApiOperation({
    summary:
      'Abrir conteo por almacén (snapshot de stock esperado; uno abierto por almacén)',
  })
  @ApiResponse({ status: 201, description: 'Conteo abierto', type: ResponseDto })
  async crear(
    @GetUser() user: UserEntity,
    @Body() dto: CreateConteoDto,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.conteoInventarioService.crear(user, dto, ip);
  }

  @Put('/:id/linea')
  @Roles(
    RolType.ADMINISTRADOR,
    RolType.JEFE_DE_ALMACEN,
    RolType.OPERARIO,
  )
  @ApiOperation({ summary: 'Registrar la cantidad contada de un producto' })
  @ApiResponse({ status: 200, description: 'Cantidad registrada', type: ResponseDto })
  async contar(
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: ConteoLineaDto,
  ): Promise<ResponseDto> {
    return await this.conteoInventarioService.contar(user, id, dto);
  }

  @Patch('/:id/cerrar')
  @Roles(RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN)
  @ApiOperation({
    summary:
      'Cerrar conteo: genera AJUSTES auditables por cada diferencia (requiere todo contado)',
  })
  @ApiResponse({ status: 200, description: 'Conteo cerrado con informe', type: ResponseDto })
  async cerrar(
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.conteoInventarioService.cerrar(user, id, ip);
  }

  @Patch('/:id/cancelar')
  @Roles(RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN)
  @ApiOperation({ summary: 'Cancelar un conteo abierto (sin ajustes)' })
  @ApiResponse({ status: 200, description: 'Conteo cancelado', type: ResponseDto })
  async cancelar(
    @GetUser() user: UserEntity,
    @Param('id') id: string,
  ): Promise<ResponseDto> {
    return await this.conteoInventarioService.cancelar(user, id);
  }

  @Get('/:id/exportar')
  @Roles(RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN)
  @ApiOperation({ summary: 'Descargar informe CSV del conteo (con diferencias)' })
  async exportar(
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.conteoInventarioService.exportarCsv(id);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="conteo-${id}.csv"`);
    res.setHeader('Content-Length', buffer.length);
    res.status(HttpStatus.OK).send(buffer);
  }
}
