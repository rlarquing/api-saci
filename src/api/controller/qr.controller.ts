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
  Res,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PermissionGuard, RolGuard } from '../guard';
import { GetUser, IpAddress, Roles } from '../decorator';
import { QrService } from '../../core/service';
import { RolType } from '../../shared/enum';
import {
  GenerateQrDto,
  GenerateQrResponseDto,
  ReadQrDto,
  LoteInfoDto,
  ResponseDto,
  ValidarQrResponseDto,
} from '../../shared/dto';
import { UserEntity } from '../../persistence/entity';
import { Response } from 'express';

@ApiTags('QR')
@Controller('qr')
@UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
@ApiBearerAuth()
@UsePipes(ValidationPipe)
export class QrController {
  constructor(
    protected qrService: QrService,
    protected configService: ConfigService,
  ) {}

  @Post('/generar')
  @Roles(RolType.JEFE_DE_ALMACEN)
  @ApiOperation({
    summary: 'Generar un lote de QRs para un tipo de medio',
    description:
      'ADMINISTRADOR: debe enviar almacenId en el DTO. USUARIO: usa su almacen asignado automáticamente.',
  })
  @ApiResponse({
    status: 201,
    description: 'QRs generados exitosamente',
    type: GenerateQrResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos inválidos, administrador sin almacenId, o usuario sin almacen asignado',
  })
  @ApiResponse({ status: 401, description: 'Sin autorización' })
  @ApiResponse({
    status: 404,
    description: 'Tipo de medio o almacen no encontrado',
  })
  async generateQrs(
    @GetUser() user: UserEntity,
    @Body() generateQrDto: GenerateQrDto,
    @IpAddress() ip: string,
  ): Promise<GenerateQrResponseDto> {
    return await this.qrService.generateQrs(user, generateQrDto, ip);
  }

  @Get('/')
  @Roles(RolType.JEFE_DE_ALMACEN, RolType.OPERARIO)
  @ApiOperation({
    summary: 'Obtener listado de QRs generados',
    description:
      'ADMINISTRADOR: ve todos los QRs de todos los almacenes. USUARIO: solo ve los QRs de su almacen asignado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de QRs',
    type: [ReadQrDto],
  })
  @ApiQuery({ required: false, name: 'page', example: 1 })
  @ApiQuery({ required: false, name: 'limit', example: 10 })
  async findAll(
    @GetUser() user: UserEntity,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<any> {
    return await this.qrService.findAll({ page, limit }, user);
  }

  @Get('/lotes')
  @Roles(RolType.JEFE_DE_ALMACEN)
  @ApiOperation({
    summary: 'Obtener información de todos los lotes generados',
    description:
      'ADMINISTRADOR: ve todos los lotes de todos los almacenes. USUARIO: solo ve los lotes de su almacenes asignados.',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de lotes',
    type: [LoteInfoDto],
  })
  async getLotes(@GetUser() user: UserEntity): Promise<LoteInfoDto[]> {
    return await this.qrService.getLotes(user);
  }

  @Get('/lote/:loteId')
  @Roles(RolType.JEFE_DE_ALMACEN)
  @ApiOperation({
    summary: 'Obtener QRs de un lote específico',
    description:
      'ADMINISTRADOR: puede ver cualquier lote. USUARIO: solo puede ver lotes de su almacenes asignados.',
  })
  @ApiResponse({
    status: 200,
    description: 'QRs del lote',
    type: [ReadQrDto],
  })
  @ApiResponse({ status: 404, description: 'Lote no encontrado' })
  async findByLote(
    @GetUser() user: UserEntity,
    @Param('loteId') loteId: string,
  ): Promise<ReadQrDto[]> {
    return await this.qrService.findByLote(loteId, user);
  }

  @Get('/pdf/:loteId')
  @Roles(RolType.JEFE_DE_ALMACEN)
  @ApiOperation({
    summary: 'Descargar PDF con tarjetas de QR de un lote',
    description:
      'ADMINISTRADOR: puede descargar cualquier lote. USUARIO: solo puede descargar lotes de su almacen asignado.',
  })
  @ApiResponse({
    status: 200,
    description: 'PDF generado',
    content: { 'application/pdf': {} },
  })
  @ApiResponse({ status: 404, description: 'Lote no encontrado' })
  async downloadPdf(
    @GetUser() user: UserEntity,
    @Param('loteId') loteId: string,
    @Res() res: Response,
  ): Promise<void> {
    const pdfBuffer = await this.qrService.generatePdf(loteId, user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="qrs-${loteId}.pdf"`,
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    res.status(HttpStatus.OK).send(pdfBuffer);
  }

  @Get('/validar')
  @Roles(RolType.JEFE_DE_ALMACEN, RolType.OPERARIO)
  @ApiOperation({
    summary: 'Validar un QR por código y almacen',
    description:
      'Verifica que el QR exista, pertenezca al almacen especificado y esté disponible. ADMINISTRADOR: puede validar cualquier QR. USUARIO: solo puede validar QRs de sus almacenes asignados.',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado de la validación',
    type: ValidarQrResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'ID de almacen inválido o QR en estado no disponible',
  })
  @ApiResponse({ status: 401, description: 'Sin autorización' })
  @ApiResponse({
    status: 403,
    description: 'No tiene acceso al almacen especificado',
  })
  @ApiResponse({ status: 404, description: 'QR o almacen no encontrado' })
  @ApiQuery({
    name: 'codigo',
    required: true,
    description: 'Código del QR a validar',
  })
  @ApiQuery({
    name: 'almacen_id',
    required: true,
    description: 'ID del almacen (ObjectId de MongoDB)',
  })
  async validarQR(
    @GetUser() user: UserEntity,
    @Query('codigo') codigo: string,
    @Query('almacen_id') almacenId: string,
  ): Promise<ValidarQrResponseDto> {
    return await this.qrService.validarQR(codigo, almacenId, user);
  }

  @Get('/:id')
  @Roles(RolType.JEFE_DE_ALMACEN)
  @ApiOperation({ summary: 'Obtener un QR por ID' })
  @ApiResponse({
    status: 200,
    description: 'QR encontrado',
    type: ReadQrDto,
  })
  @ApiResponse({ status: 404, description: 'QR no encontrado' })
  async findById(@Param('id') id: string): Promise<ReadQrDto> {
    return await this.qrService.findById(id);
  }

  @Get('/codigo/:codigo')
  @Roles(RolType.JEFE_DE_ALMACEN)
  @ApiOperation({
    summary: 'Obtener un QR por su código',
    description:
      'ADMINISTRADOR: puede buscar cualquier QR. USUARIO: solo puede buscar QRs de su almacen asignado.',
  })
  @ApiResponse({
    status: 200,
    description: 'QR encontrado',
    type: ReadQrDto,
  })
  @ApiResponse({ status: 404, description: 'QR no encontrado' })
  async findByCodigo(
    @GetUser() user: UserEntity,
    @Param('codigo') codigo: string,
  ): Promise<ReadQrDto> {
    return await this.qrService.findByCodigo(codigo, user);
  }

  @Get('/producto/:productoId')
  @Roles(RolType.JEFE_DE_ALMACEN)
  @ApiOperation({
    summary: 'Obtener QRs por tipo de medio',
    description:
      'ADMINISTRADOR: ve todos los QRs del tipo de medio. USUARIO: solo ve los de su almacen asignado.',
  })
  @ApiResponse({
    status: 200,
    description: 'QRs del tipo de medio',
    type: [ReadQrDto],
  })
  async findByCategoria(
    @GetUser() user: UserEntity,
    @Param('productoId') productoId: string,
  ): Promise<ReadQrDto[]> {
    return await this.qrService.findByProducto(productoId, user);
  }

  @Get('/disponibles/:productoId')
  @Roles(RolType.JEFE_DE_ALMACEN)
  @ApiOperation({
    summary: 'Contar QRs disponibles por tipo de medio',
    description:
      'ADMINISTRADOR: cuenta todos los disponibles. USUARIO: solo cuenta los de su almacen asignado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cantidad de QRs disponibles',
  })
  async countDisponibles(
    @GetUser() user: UserEntity,
    @Param('productoId') productoId: string,
  ): Promise<{ cantidad: number }> {
    const cantidad = await this.qrService.countDisponiblesByProducto(
      productoId,
      user,
    );
    return { cantidad };
  }

  // ==========================================
  // ENDPOINTS DE ELIMINACIÓN Y ANULACIÓN
  // ==========================================

  @Delete('/:id')
  @Roles(RolType.JEFE_DE_ALMACEN)
  @ApiOperation({
    summary: 'Eliminar un QR (borrado virtual)',
    description:
      'Establece activo = false. ADMINISTRADOR: puede eliminar cualquier QR. USUARIO: solo puede eliminar QRs de sus almacenes asignados. Registra traza de auditoría.',
  })
  @ApiResponse({
    status: 200,
    description: 'QR eliminado exitosamente',
    type: ResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'El usuario no tiene almacenes asignados',
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene autorización para eliminar QRs de este almacen',
  })
  @ApiResponse({ status: 404, description: 'QR no encontrado' })
  async delete(
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.qrService.delete(user, id, ip);
  }

  @Delete('/elementos/multiples')
  @Roles(RolType.JEFE_DE_ALMACEN)
  @ApiOperation({
    summary: 'Eliminar múltiples QRs (borrado virtual)',
    description:
      'Elimina varios QRs estableciendo activo = false. Registra traza por cada QR eliminado.',
  })
  @ApiResponse({
    status: 200,
    description: 'QRs eliminados exitosamente',
    type: ResponseDto,
  })
  async deleteMultiple(
    @GetUser() user: UserEntity,
    @Body() ids: string[],
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.qrService.deleteMultiple(user, ids, ip);
  }

  @Delete('/lote/:loteId')
  @Roles(RolType.JEFE_DE_ALMACEN)
  @ApiOperation({
    summary: 'Eliminar todos los QRs de un lote (borrado virtual)',
    description:
      'Elimina todos los QRs del lote especificado. ADMINISTRADOR: puede eliminar cualquier lote. USUARIO: solo puede eliminar lotes de sus almacenes asignados. Registra traza por cada QR eliminado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lote eliminado exitosamente',
    type: ResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Lote no encontrado o sin QRs' })
  async deleteLote(
    @GetUser() user: UserEntity,
    @Param('loteId') loteId: string,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.qrService.deleteLote(user, loteId, ip);
  }

  @Patch('/:id/anular')
  @Roles(RolType.JEFE_DE_ALMACEN)
  @ApiOperation({
    summary: 'Anular un QR (cambiar estado a anulado)',
    description:
      'Cambia el estado del QR a "anulado" sin eliminarlo. El QR sigue activo en el sistema pero no puede ser usado. Registra traza de auditoría.',
  })
  @ApiResponse({
    status: 200,
    description: 'QR anulado exitosamente',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'El QR ya se encuentra anulado' })
  @ApiResponse({
    status: 403,
    description: 'No tiene autorización para anular QRs de este almacen',
  })
  @ApiResponse({ status: 404, description: 'QR no encontrado' })
  async anular(
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.qrService.anular(user, id, ip);
  }

  @Patch('/anular/elementos/multiples')
  @Roles(RolType.JEFE_DE_ALMACEN)
  @ApiOperation({
    summary: 'Anular múltiples QRs',
    description:
      'Cambia el estado de varios QRs a "anulado". Registra traza por cada QR anulado.',
  })
  @ApiResponse({
    status: 200,
    description: 'QRs anulados exitosamente',
    type: ResponseDto,
  })
  async anularMultiple(
    @GetUser() user: UserEntity,
    @Body() ids: string[],
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.qrService.anularMultiple(user, ids, ip);
  }
}
