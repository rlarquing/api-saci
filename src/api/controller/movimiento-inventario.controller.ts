import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { GetUser, IpAddress } from '../decorator';
import { PermissionGuard, RolGuard } from '../guard';
import { MovimientoInventarioEntity, UserEntity } from '../../persistence/entity';
import { MovimientoInventarioService } from '../../core/service';
import {
  CreateAjusteDto,
  CreateEntradaDto,
  CreateSalidaDto,
  CreateTrasladoDto,
  ResponseDto,
} from '../../shared/dto';
import { AppConfig } from '../../app.keys';
import { ConfigService } from '@nestjs/config';
import { Pagination } from '../../shared/pagination';

@ApiTags('Movimientos de inventario')
@Controller('movimiento-inventario')
@UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
@ApiBearerAuth()
@UsePipes(ValidationPipe)
export class MovimientoInventarioController {
  constructor(
    protected movimientoInventarioService: MovimientoInventarioService,
    protected configService: ConfigService,
  ) {}

  @Get('/')
  @ApiOperation({
    summary: 'Kardex paginado de movimientos (filtros: productoId, almacenId)',
  })
  @ApiQuery({ name: 'productoId', required: false })
  @ApiQuery({ name: 'almacenId', required: false })
  @ApiResponse({ status: 200, description: 'Kardex' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('productoId') productoId?: string,
    @Query('almacenId') almacenId?: string,
  ): Promise<Pagination<any> | any[]> {
    limit = limit && limit > 100 ? 100 : limit;
    const url = this.configService.get(AppConfig.URL);
    if (productoId || almacenId) {
      return await this.movimientoInventarioService.listarKardex(
        { page, limit, route: url + '/api/movimiento-inventario' },
        productoId,
        almacenId,
      );
    }
    return await this.movimientoInventarioService.findAll(
      { page, limit, route: url + '/api/movimiento-inventario' },
    );
  }

  @Get('/stock')
  @ApiOperation({ summary: 'Stock derivado por producto y/o almacén' })
  @ApiQuery({ name: 'productoId', required: false })
  @ApiQuery({ name: 'almacenId', required: false })
  async stock(
    @Query('productoId') productoId?: string,
    @Query('almacenId') almacenId?: string,
  ) {
    return await this.movimientoInventarioService.stock(productoId, almacenId);
  }

  @Get('/bajo-minimo')
  @ApiOperation({ summary: 'Productos por debajo del stock mínimo (alertas)' })
  @ApiQuery({ name: 'almacenId', required: false })
  async bajoMinimo(@Query('almacenId') almacenId?: string) {
    return await this.movimientoInventarioService.bajoMinimo(almacenId);
  }

  @Get('/exportar')
  @ApiOperation({
    summary: 'Descargar kardex completo en CSV (filtros: almacenId, tipo) — hasta 10.000 filas',
  })
  @ApiQuery({ name: 'almacenId', required: false })
  @ApiQuery({ name: 'tipo', required: false, example: 'ENTRADA' })
  async exportarMovimientos(
    @Query('almacenId') almacenId?: string,
    @Query('tipo') tipo?: string,
    @Res() res?: Response,
  ): Promise<void> {
    const buffer = await this.movimientoInventarioService.exportarMovimientosCsv(
      almacenId,
      tipo,
    );
    res!.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res!.setHeader('Content-Disposition', 'attachment; filename="movimientos-inventario.csv"');
    res!.setHeader('Content-Length', buffer.length);
    res!.status(HttpStatus.OK).send(buffer);
  }

  @Get('/stock/exportar')
  @ApiOperation({
    summary: 'Descargar stock derivado en CSV (filtro opcional: almacenId)',
  })
  @ApiQuery({ name: 'almacenId', required: false })
  async exportarStock(
    @Query('almacenId') almacenId?: string,
    @Res() res?: Response,
  ): Promise<void> {
    const buffer = await this.movimientoInventarioService.exportarStockCsv(almacenId);
    res!.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res!.setHeader('Content-Disposition', 'attachment; filename="stock-inventario.csv"');
    res!.setHeader('Content-Length', buffer.length);
    res!.status(HttpStatus.OK).send(buffer);
  }

  @Post('/entrada')
  @ApiOperation({ summary: 'Registrar ENTRADA (escaneo o manual)' })
  @ApiResponse({ status: 201, description: 'Entrada registrada', type: ResponseDto })
  async entrada(
    @GetUser() user: UserEntity,
    @Body() dto: CreateEntradaDto,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.movimientoInventarioService.entrada(user, dto, ip);
  }

  @Post('/salida')
  @ApiOperation({ summary: 'Registrar SALIDA (valida stock suficiente)' })
  @ApiResponse({ status: 201, description: 'Salida registrada', type: ResponseDto })
  async salida(
    @GetUser() user: UserEntity,
    @Body() dto: CreateSalidaDto,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.movimientoInventarioService.salida(user, dto, ip);
  }

  @Post('/ajuste')
  @ApiOperation({ summary: 'Registrar AJUSTE de conteo físico (JEFE/ADMIN)' })
  @ApiResponse({ status: 201, description: 'Ajuste registrado', type: ResponseDto })
  async ajuste(
    @GetUser() user: UserEntity,
    @Body() dto: CreateAjusteDto,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.movimientoInventarioService.ajuste(user, dto, ip);
  }

  @Post('/traslado')
  @ApiOperation({ summary: 'Registrar TRASLADO entre almacenes (par compensado)' })
  @ApiResponse({ status: 201, description: 'Traslado registrado', type: ResponseDto })
  async traslado(
    @GetUser() user: UserEntity,
    @Body() dto: CreateTrasladoDto,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.movimientoInventarioService.traslado(user, dto, ip);
  }
}
