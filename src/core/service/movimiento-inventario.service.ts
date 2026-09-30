import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ObjectId } from 'mongodb';
import { PaginationOptions } from '../../shared/pagination';
import { MovimientoInventarioMapper } from '../mapper';
import { LogHistoryService } from './log-history.service';
import { GenericService } from './generic.service';
import { SocketService } from './socket.service';
import {
  AlmacenEntity,
  MovimientoInventarioEntity,
  ProductoEntity,
  TipoMovimiento,
  UserEntity,
} from '../../persistence/entity';
import {
  MovimientoInventarioRepository,
  ProductoRepository,
  QrRepository,
  GenericNomencladorRepository,
  RegistroDiarioRepository,
} from '../../persistence/repository';
import { NomencladorTypeEnum, RolType } from '../../shared/enum';
import { AppConfig } from '../../app.keys';
import { ResponseDto } from '../../shared/dto';

/**
 * Motor de movimientos de inventario (SACI).
 *
 * Hereda de SACP el esqueleto operativo: pasos numerados con validaciones,
 * compensación manual (Mongo sin transacciones multi-doc), ventanas offline
 * de 7 días y verificación batch. Cambia el dominio: nada de cobros; aquí
 * la regla de oro es que NO puede quedar stock negativo y el stock real
 * se deriva de esta misma colección por agregación.
 */
@Injectable()
export class MovimientoInventarioService extends GenericService<MovimientoInventarioEntity> {
  /** Ventana máxima de antigüedad para movimientos offline (días). */
  private readonly DIAS_OFFLINE = 7;

  constructor(
    protected configService: ConfigService,
    protected movimientoInventarioRepository: MovimientoInventarioRepository,
    protected movimientoInventarioMapper: MovimientoInventarioMapper,
    protected logHistoryService: LogHistoryService,
    private productoRepository: ProductoRepository,
    private qrRepository: QrRepository,
    private genericNomencladorRepository: GenericNomencladorRepository,
    private registroDiarioRepository: RegistroDiarioRepository,
    private registroDiarioService: any,
    private socketService: SocketService,
  ) {
    super(
      configService,
      movimientoInventarioRepository,
      movimientoInventarioMapper,
      logHistoryService,
      true,
    );
  }

  // ================== CONSULTAS ==================

  /** Stock derivado (fuente única de verdad) por producto y/o almacén. */
  async stock(
    productoId?: string,
    almacenId?: string,
  ): Promise<
    Array<{
      productoId: string;
      almacenId: string;
      productoNombre: string;
      productoCodigo: string;
      almacenNombre: string;
      stock: number;
    }>
  > {
    return await this.movimientoInventarioRepository.calcularStock(
      productoId,
      almacenId,
    );
  }

  /** Productos por debajo del stock mínimo (alertas). */
  async bajoMinimo(almacenId?: string): Promise<
    Array<{
      productoId: string;
      productoCodigo: string;
      productoNombre: string;
      almacenId: string;
      almacenNombre: string;
      stock: number;
      stockMinimo: number;
    }>
  > {
    const filas = await this.movimientoInventarioRepository.calcularStock(
      undefined,
      almacenId,
    );
    const alertas: Array<any> = [];
    for (const fila of filas) {
      const producto: ProductoEntity =
        await this.productoRepository.findById(fila.productoId);
      if (!producto) continue;
      if (fila.stock < producto.stockMinimo) {
        alertas.push({
          productoId: fila.productoId,
          productoCodigo: fila.productoCodigo,
          productoNombre: fila.productoNombre,
          almacenId: fila.almacenId,
          almacenNombre: fila.almacenNombre,
          stock: fila.stock,
          stockMinimo: producto.stockMinimo,
        });
      }
    }
    return alertas;
  }

  // ================== OPERACIONES ==================

  /**
   * ENTRADA de stock (10 pasos, heredados del esqueleto de SACP).
   */
  async entrada(user: UserEntity, data: any, ip: string): Promise<ResponseDto> {
    // 1) Acceso al almacén
    await this.validarAccesoAlmacen(user, data.almacenId);
    // 2) QR válido (o movimiento manual sin QR solo para JEFE/ADMIN)
    let qr = null;
    if (data.qrCodigo) {
      qr = await this.qrRepository.findByCodigo(data.qrCodigo);
      if (!qr || qr.estado === 'anulado') {
        throw new ConflictException('El QR no existe o está anulado');
      }
    } else if (!data.productoId) {
      throw new BadRequestException('Se requiere qrCodigo o productoId');
    }
    // 3) Producto activo
    const productoId = data.productoId ?? qr?.productoId;
    const producto = await this.productoRepository.findById(productoId);
    if (!producto || !producto.activo) {
      throw new NotFoundException('El producto no existe o está inactivo');
    }
    // 4) Cantidad positiva
    const cantidad = Number(data.cantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor que cero');
    }
    // 5) Fecha efectiva (offline ≤ 7 días, nunca futura)
    const fecha = this.validarFecha(data.fecha);
    // 6) Día abierto
    await this.validarDiaAbierto(data.almacenId, fecha);
    // 7) Crear movimiento con denormalizados
    const almacen = await this.genericNomencladorRepository.findById(
      NomencladorTypeEnum.ALMACEN,
      data.almacenId,
    );
    const movimiento = new MovimientoInventarioEntity({
      tipo: TipoMovimiento.ENTRADA,
      productoId: producto.getIdString(),
      productoNombre: producto.nombre,
      productoCodigo: producto.codigo,
      cantidad,
      almacenId: data.almacenId,
      almacenNombre: almacen.nombre,
      qrId: qr ? qr.getIdString() : undefined,
      qrCodigo: qr ? qr.codigo : undefined,
      usuarioId: user.getIdString(),
      userName: user.userName,
      fecha,
      observaciones: data.observaciones,
    });
    // 8) Asignar QR (primera vez) — idempotente
    if (qr && qr.estado === 'disponible') {
      await this.qrRepository.update({
        ...qr,
        estado: 'asignado',
        fechaEstado: new Date(),
      } as any);
    }
    // 9) Registro diario + saldo informativo
    try {
      const stockActual = await this.movimientoInventarioRepository.stockDe(
        producto.getIdString(),
        data.almacenId,
      );
      movimiento.saldoResultante = stockActual + cantidad;
      const creado = await this.movimientoInventarioRepository.create(movimiento);
      const registro =
        await this.registroDiarioService.findOrCreateRegistroDiario(
          data.almacenId,
          fecha,
        );
      await this.registroDiarioService.actualizarRegistroConMovimiento(
        registro.getIdString(),
        producto.categoriaNombre,
        true,
        cantidad,
      );
      // 10) Tiempo real
      this.socketService.emitMovimientoEvent({
        tipo: 'ENTRADA',
        productoCodigo: producto.codigo,
        almacenId: data.almacenId,
        cantidad,
        movimientoId: creado.getIdString(),
        timestamp: new Date().toISOString(),
      });
      return this.respuesta(creado);
    } catch (error) {
      // Compensación manual: si el paso 9 falla, el movimiento no debe contar
      await this.revertirMovimiento(movimiento);
      throw error;
    }
  }

  /**
   * SALIDA de stock: valida stock suficiente (nunca queda stock negativo).
   */
  async salida(user: UserEntity, data: any, ip: string): Promise<ResponseDto> {
    await this.validarAccesoAlmacen(user, data.almacenId);
    let qr = null;
    if (data.qrCodigo) {
      qr = await this.qrRepository.findByCodigo(data.qrCodigo);
      if (!qr || qr.estado === 'anulado') {
        throw new ConflictException('El QR no existe o está anulado');
      }
    } else if (!data.productoId) {
      throw new BadRequestException('Se requiere qrCodigo o productoId');
    }
    const productoId = data.productoId ?? qr?.productoId;
    const producto = await this.productoRepository.findById(productoId);
    if (!producto || !producto.activo) {
      throw new NotFoundException('El producto no existe o está inactivo');
    }
    const cantidad = Number(data.cantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor que cero');
    }
    const fecha = this.validarFecha(data.fecha);
    await this.validarDiaAbierto(data.almacenId, fecha);

    // REGLA DE ORO: no dejar stock negativo
    const stockActual = await this.movimientoInventarioRepository.stockDe(
      producto.getIdString(),
      data.almacenId,
    );
    if (cantidad > stockActual) {
      throw new ConflictException(
        `Stock insuficiente: disponible ${stockActual}, solicitado ${cantidad}`,
      );
    }

    const almacen = await this.genericNomencladorRepository.findById(
      NomencladorTypeEnum.ALMACEN,
      data.almacenId,
    );
    const movimiento = new MovimientoInventarioEntity({
      tipo: TipoMovimiento.SALIDA,
      productoId: producto.getIdString(),
      productoNombre: producto.nombre,
      productoCodigo: producto.codigo,
      cantidad,
      almacenId: data.almacenId,
      almacenNombre: almacen.nombre,
      qrId: qr ? qr.getIdString() : undefined,
      qrCodigo: qr ? qr.codigo : undefined,
      usuarioId: user.getIdString(),
      userName: user.userName,
      fecha,
      observaciones: data.observaciones,
      saldoResultante: stockActual - cantidad,
    });
    try {
      const creado = await this.movimientoInventarioRepository.create(movimiento);
      const registro =
        await this.registroDiarioService.findOrCreateRegistroDiario(
          data.almacenId,
          fecha,
        );
      await this.registroDiarioService.actualizarRegistroConMovimiento(
        registro.getIdString(),
        producto.categoriaNombre,
        false,
        cantidad,
      );
      this.socketService.emitMovimientoEvent({
        tipo: 'SALIDA',
        productoCodigo: producto.codigo,
        almacenId: data.almacenId,
        cantidad,
        movimientoId: creado.getIdString(),
        timestamp: new Date().toISOString(),
      });
      return this.respuesta(creado);
    } catch (error) {
      await this.revertirMovimiento(movimiento);
      throw error;
    }
  }

  /**
   * AJUSTE de inventario (conteo físico): solo JEFE/ADMIN, con motivo obligatorio.
   */
  async ajuste(user: UserEntity, data: any, ip: string): Promise<ResponseDto> {
    if (!user.roles?.some(
      (r: any) => r.nombre === RolType.ADMINISTRADOR || r.nombre === RolType.JEFE_DE_ALMACEN,
    )) {
      throw new ForbiddenException('Solo un JEFE o ADMINISTRADOR puede ajustar stock');
    }
    await this.validarAccesoAlmacen(user, data.almacenId);
    if (!data.productoId) {
      throw new BadRequestException('El ajuste requiere productoId (inventario físico)');
    }
    const producto = await this.productoRepository.findById(data.productoId);
    if (!producto || !producto.activo) {
      throw new NotFoundException('El producto no existe o está inactivo');
    }
    const cantidad = Math.abs(Number(data.cantidad));
    if (!Number.isFinite(cantidad) || cantidad === 0) {
      throw new BadRequestException('La cantidad del ajuste no puede ser cero');
    }
    const signo = data.signo === -1 || data.signo === '-1' ? -1 : 1;
    if (signo === -1 && !data.observaciones) {
      throw new BadRequestException(
        'Los ajustes negativos requieren observaciones (motivo del conteo)',
      );
    }
    if (signo === -1) {
      const stockActual = await this.movimientoInventarioRepository.stockDe(
        producto.getIdString(),
        data.almacenId,
      );
      if (cantidad > stockActual) {
        throw new ConflictException(
          `Ajuste imposible: disponible ${stockActual}, a restar ${cantidad}`,
        );
      }
    }
    const fecha = this.validarFecha(data.fecha);
    await this.validarDiaAbierto(data.almacenId, fecha);
    const almacen = await this.genericNomencladorRepository.findById(
      NomencladorTypeEnum.ALMACEN,
      data.almacenId,
    );
    const movimiento = new MovimientoInventarioEntity({
      tipo: TipoMovimiento.AJUSTE,
      productoId: producto.getIdString(),
      productoNombre: producto.nombre,
      productoCodigo: producto.codigo,
      cantidad,
      almacenId: data.almacenId,
      almacenNombre: almacen.nombre,
      usuarioId: user.getIdString(),
      userName: user.userName,
      fecha,
      observaciones: data.observaciones,
      signoAjuste: signo,
    });
    try {
      const stockActual = await this.movimientoInventarioRepository.stockDe(
        producto.getIdString(),
        data.almacenId,
      );
      movimiento.saldoResultante = stockActual + signo * cantidad;
      const creado = await this.movimientoInventarioRepository.create(movimiento);
      const registro =
        await this.registroDiarioService.findOrCreateRegistroDiario(
          data.almacenId,
          fecha,
        );
      await this.registroDiarioService.actualizarRegistroConMovimiento(
        registro.getIdString(),
        producto.categoriaNombre,
        signo === 1,
        cantidad,
      );
      this.socketService.emitMovimientoEvent({
        tipo: 'AJUSTE',
        productoCodigo: producto.codigo,
        almacenId: data.almacenId,
        cantidad: signo * cantidad,
        movimientoId: creado.getIdString(),
        timestamp: new Date().toISOString(),
      });
      return this.respuesta(creado);
    } catch (error) {
      await this.revertirMovimiento(movimiento);
      throw error;
    }
  }

  /**
   * TRASLADO entre almacenes: par compensado SALIDA(origen) + ENTRADA(destino)
   * agrupados por trasladoId, con compensación manual del segundo paso.
   */
  async traslado(user: UserEntity, data: any, ip: string): Promise<ResponseDto> {
    if (!data.almacenOrigenId || !data.almacenDestinoId) {
      throw new BadRequestException('Se requieren almacén de origen y destino');
    }
    if (data.almacenOrigenId === data.almacenDestinoId) {
      throw new BadRequestException('El origen y el destino no pueden ser el mismo');
    }
    await this.validarAccesoAlmacen(user, data.almacenOrigenId);
    await this.validarAccesoAlmacen(user, data.almacenDestinoId);
    const producto = await this.productoRepository.findById(data.productoId);
    if (!producto || !producto.activo) {
      throw new NotFoundException('El producto no existe o está inactivo');
    }
    const cantidad = Number(data.cantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor que cero');
    }
    const stockOrigen = await this.movimientoInventarioRepository.stockDe(
      producto.getIdString(),
      data.almacenOrigenId,
    );
    if (cantidad > stockOrigen) {
      throw new ConflictException(
        `Stock insuficiente en origen: disponible ${stockOrigen}, solicitado ${cantidad}`,
      );
    }
    const fecha = this.validarFecha(data.fecha);
    await this.validarDiaAbierto(data.almacenOrigenId, fecha);
    await this.validarDiaAbierto(data.almacenDestinoId, fecha);

    const trasladoId = new ObjectId().toHexString();
    const origen = await this.genericNomencladorRepository.findById(
      NomencladorTypeEnum.ALMACEN,
      data.almacenOrigenId,
    );
    const destino = await this.genericNomencladorRepository.findById(
      NomencladorTypeEnum.ALMACEN,
      data.almacenDestinoId,
    );

    // Paso 1: SALIDA en origen
    const salida = new MovimientoInventarioEntity({
      tipo: TipoMovimiento.TRASLADO,
      productoId: producto.getIdString(),
      productoNombre: producto.nombre,
      productoCodigo: producto.codigo,
      cantidad,
      almacenId: data.almacenOrigenId,
      almacenNombre: origen.nombre,
      usuarioId: user.getIdString(),
      userName: user.userName,
      fecha,
      observaciones: data.observaciones ?? `Traslado a ${destino.nombre}`,
      trasladoId,
      saldoResultante: stockOrigen - cantidad,
    });
    const salidaCreada =
      await this.movimientoInventarioRepository.create(salida);

    // Paso 2: ENTRADA en destino (con compensación si falla)
    try {
      const stockDestino = await this.movimientoInventarioRepository.stockDe(
        producto.getIdString(),
        data.almacenDestinoId,
      );
      const entrada = new MovimientoInventarioEntity({
        tipo: TipoMovimiento.TRASLADO,
        productoId: producto.getIdString(),
        productoNombre: producto.nombre,
        productoCodigo: producto.codigo,
        cantidad,
        almacenId: data.almacenDestinoId,
        almacenNombre: destino.nombre,
        usuarioId: user.getIdString(),
        userName: user.userName,
        fecha,
        observaciones: data.observaciones ?? `Traslado desde ${origen.nombre}`,
        trasladoId,
        saldoResultante: stockDestino + cantidad,
      });
      const entradaCreada =
        await this.movimientoInventarioRepository.create(entrada);
      this.socketService.emitMovimientoEvent({
        tipo: 'TRASLADO',
        productoCodigo: producto.codigo,
        almacenId: data.almacenOrigenId,
        cantidad,
        movimientoId: salidaCreada.getIdString(),
        timestamp: new Date().toISOString(),
      });
      return this.respuesta(salidaCreada, entradaCreada);
    } catch (error) {
      // Compensación: revertir la salida del paso 1
      await this.revertirMovimiento(salidaCreada);
      throw error;
    }
  }

  // ================== HELPERS ==================

  /** Valida que el usuario tenga acceso al almacén (scoping por user.almacenIds). */
  private async validarAccesoAlmacen(user: UserEntity, almacenId: string): Promise<void> {
    const esAdmin = user.roles?.some(
      (r: any) => r.nombre === RolType.ADMINISTRADOR,
    );
    if (esAdmin) return;
    if (!user.almacenIds?.includes(almacenId)) {
      throw new ForbiddenException('No tienes acceso a este almacén');
    }
  }

  /**
   * Fecha efectiva: no futura; offline con antigüedad ≤ 7 días (anti-backdating).
   */
  private validarFecha(fechaStr?: string): Date {
    const fecha = fechaStr ? new Date(fechaStr) : new Date();
    if (Number.isNaN(fecha.getTime())) {
      throw new BadRequestException('Fecha inválida');
    }
    const ahora = new Date();
    if (fecha > ahora) {
      throw new BadRequestException('La fecha del movimiento no puede ser futura');
    }
    const limite = new Date(ahora);
    limite.setDate(limite.getDate() - this.DIAS_OFFLINE);
    if (fecha < limite) {
      throw new BadRequestException(
        `Los movimientos offline no pueden tener más de ${this.DIAS_OFFLINE} días de antigüedad`,
      );
    }
    return fecha;
  }

  /** El día del almacén debe estar abierto para registrar movimientos. */
  private async validarDiaAbierto(almacenId: string, fecha: Date): Promise<void> {
    const registro =
      await this.registroDiarioService.findRegistroDelDia(almacenId, fecha);
    if (registro && registro.estado === 'cerrado') {
      throw new ConflictException(
        'El día ya está cerrado para este almacén: no se pueden registrar movimientos',
      );
    }
  }

  /**
   * Compensación manual (Mongo sin transacciones multi-doc): marca el
   * movimiento como revertido (activo=false) para que NO cuente en el stock.
   */
  private async revertirMovimiento(movimiento: any): Promise<void> {
    if (!movimiento?.id) return;
    await this.movimientoInventarioRepository.update({
      ...movimiento,
      activo: false,
    } as any);
  }

  private respuesta(...creados: MovimientoInventarioEntity[]): ResponseDto {
    const result = new ResponseDto();
    result.successStatus = true;
    result.message =
      creados.length > 1
        ? 'Movimientos registrados correctamente'
        : 'Movimiento registrado correctamente';
    result.id = creados[0].getIdString();
    return result;
  }
}
