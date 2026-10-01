import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pagination, PaginationOptions } from '../../shared/pagination';
import { ConteoInventarioMapper } from '../mapper';
import { LogHistoryService } from './log-history.service';
import { GenericService } from './generic.service';
import { MovimientoInventarioService } from './movimiento-inventario.service';
import {
  ConteoInventarioEntity,
  EstadoConteo,
  LineaConteo,
  ProductoEntity,
  UserEntity,
} from '../../persistence/entity';
import {
  ConteoInventarioRepository,
  MovimientoInventarioRepository,
  ProductoRepository,
  GenericNomencladorRepository,
} from '../../persistence/repository';
import { NomencladorTypeEnum, RolType } from '../../shared/enum';
import { ConteoLineaDto, CreateConteoDto, ReadConteoDto, ResponseDto } from '../../shared/dto';
import { fechaLegible, toCsvBuffer } from '../../shared/helper/csv.helper';

/**
 * Conteo cíclico de inventario (backlog P1 del análisis de apps).
 *
 * Flujo: abrir (snapshot de stock esperado por producto) → contar (operarios
 * registran cantidades físicas, opcionalmente a ciegas) → cerrar (recalcula el
 * stock real, compara y genera movimientos de AJUSTE auditables por diferencia).
 * Regla: un solo conteo ABIERTO por almacén; solo se cierra con todas las
 * líneas contadas; el ajuste apunta al stock REAL (no al snapshot) para que el
 * inventario quede exactamente igual a lo contado.
 */
@Injectable()
export class ConteoInventarioService extends GenericService<ConteoInventarioEntity> {
  constructor(
    protected configService: ConfigService,
    protected conteoInventarioRepository: ConteoInventarioRepository,
    protected conteoInventarioMapper: ConteoInventarioMapper,
    protected logHistoryService: LogHistoryService,
    private movimientoInventarioService: MovimientoInventarioService,
    private productoRepository: ProductoRepository,
    private movimientoInventarioRepository: MovimientoInventarioRepository,
    private genericNomencladorRepository: GenericNomencladorRepository,
  ) {
    super(
      configService,
      conteoInventarioRepository,
      conteoInventarioMapper,
      logHistoryService,
      true,
    );
  }

  /** ADMIN pasa siempre; el resto solo opera en sus almacenes asignados. */
  private validarAccesoAlmacen(user: UserEntity, almacenId: string): void {
    const esAdmin = user.roles?.some(
      (r: any) => r.nombre === RolType.ADMINISTRADOR,
    );
    if (esAdmin) return;
    if (!user.almacenIds || user.almacenIds.length === 0) {
      throw new ForbiddenException('El usuario no tiene almacenes asignados');
    }
    if (!user.almacenIds.includes(almacenId)) {
      throw new ForbiddenException(
        'No tiene autorización para operar en este almacén',
      );
    }
  }

  private respuesta(entity: ConteoInventarioEntity, message: string): ResponseDto {
    const response = new ResponseDto();
    response.id = entity.getIdString();
    response.successStatus = true;
    response.message = message;
    return response;
  }

  /** Listado paginado con conteo de líneas ya resuelto. */
  async listar(
    options: PaginationOptions,
    almacenId?: string,
    estado?: string,
    sinPaginacion?: boolean,
  ): Promise<Pagination<ReadConteoDto> | ReadConteoDto[]> {
    const resultado = await this.conteoInventarioRepository.listar(
      options,
      almacenId,
      estado,
      sinPaginacion,
    );

    if (Array.isArray(resultado)) {
      return await Promise.all(
        resultado.map((e) => this.conteoInventarioMapper.entityToDto(e)),
      );
    }

    const items = await Promise.all(
      resultado.items.map((e) => this.conteoInventarioMapper.entityToDto(e)),
    );
    return new Pagination<ReadConteoDto>(items, resultado.meta, resultado.links);
  }

  /** Detalle completo (con líneas) para la pantalla de conteo. */
  async obtenerDetalle(id: string): Promise<ReadConteoDto> {
    const entity = await this.conteoInventarioRepository.findById(id);
    return await this.conteoInventarioMapper.entityToDto(entity);
  }

  /**
   * Abre un conteo: snapshot del stock esperado de TODOS los productos activos
   * del catálogo para el almacén indicado.
   */
  async crear(user: UserEntity, dto: CreateConteoDto, _ip: string): Promise<ResponseDto> {
    this.validarAccesoAlmacen(user, dto.almacenId);

    const abierto = await this.conteoInventarioRepository.findAbiertoPorAlmacen(
      dto.almacenId,
    );
    if (abierto) {
      throw new ConflictException(
        'Ya existe un conteo ABIERTO para este almacén (ciérralo o cancélalo antes)',
      );
    }

    const almacen = await this.genericNomencladorRepository.findById(
      NomencladorTypeEnum.ALMACEN,
      dto.almacenId,
    );

    const productos = (await this.productoRepository.findAll(
      { page: 1, limit: 1, route: 'interno' },
      true,
    )) as ProductoEntity[];
    if (!productos || productos.length === 0) {
      throw new BadRequestException('No hay productos activos en el catálogo');
    }

    // Un único agregado para todo el almacén (no un stockDe por producto).
    const stockFilas = await this.movimientoInventarioRepository.calcularStock(
      undefined,
      dto.almacenId,
    );
    const stockPorProducto = new Map<string, number>();
    for (const fila of stockFilas) {
      stockPorProducto.set(fila.productoId, fila.stock);
    }

    const lineas = productos.map(
      (p) =>
        new LineaConteo({
          productoId: p.getIdString(),
          productoCodigo: p.codigo,
          productoNombre: p.nombre,
          cantidadEsperada: stockPorProducto.get(p.getIdString()) ?? 0,
          cantidadContada: null,
          stockAlCierre: null,
          diferencia: null,
          ajusteId: null,
        }),
    );

    const entity = new ConteoInventarioEntity({
      almacenId: dto.almacenId,
      almacenNombre: almacen.nombre,
      usuarioId: user.getIdString(),
      userName: user.userName,
      estado: EstadoConteo.ABIERTO,
      esCiego: dto.esCiego ?? false,
      fechaApertura: new Date(),
      lineas,
      resumen: null,
    });

    const creado = await this.conteoInventarioRepository.guardar(entity);
    return this.respuesta(
      creado,
      `Conteo abierto con ${lineas.length} producto(s)${dto.esCiego ? ' (a ciegas)' : ''}`,
    );
  }

  /** Registra/actualiza la cantidad física contada de una línea. */
  async contar(user: UserEntity, id: string, dto: ConteoLineaDto): Promise<ResponseDto> {
    const conteo = await this.conteoInventarioRepository.findById(id);
    if (conteo.estado !== EstadoConteo.ABIERTO) {
      throw new ConflictException('El conteo no está ABIERTO');
    }
    this.validarAccesoAlmacen(user, conteo.almacenId);

    const linea = conteo.lineas.find((l) => l.productoId === dto.productoId);
    if (!linea) {
      throw new NotFoundException('El producto no pertenece a este conteo');
    }

    linea.cantidadContada = dto.cantidadContada;
    linea.observaciones = dto.observaciones ?? null;

    await this.conteoInventarioRepository.guardar(conteo);
    return this.respuesta(
      conteo,
      `Contado ${dto.cantidadContada} × ${linea.productoCodigo}`,
    );
  }

  /**
   * Cierra el conteo: recalcula stock real, genera AJUSTES por diferencia y
   * congela el informe. Requiere todas las líneas contadas.
   */
  async cerrar(user: UserEntity, id: string, ip: string): Promise<ResponseDto> {
    const conteo = await this.conteoInventarioRepository.findById(id);
    if (conteo.estado !== EstadoConteo.ABIERTO) {
      throw new ConflictException('El conteo no está ABIERTO');
    }
    this.validarAccesoAlmacen(user, conteo.almacenId);

    const sinContar = conteo.lineas.filter(
      (l) => l.cantidadContada === null,
    ).length;
    if (sinContar > 0) {
      throw new ConflictException(
        `Faltan ${sinContar} producto(s) por contar antes de cerrar`,
      );
    }

    let sobrantes = 0;
    let faltantes = 0;
    let ajustesGenerados = 0;
    const errores: Array<{ productoCodigo: string; error: string }> = [];

    for (const linea of conteo.lineas) {
      const stockReal = await this.movimientoInventarioRepository.stockDe(
        linea.productoId,
        conteo.almacenId,
      );
      linea.stockAlCierre = stockReal;
      const diferencia = Number((linea.cantidadContada ?? 0) - stockReal);
      linea.diferencia = diferencia;

      if (diferencia === 0) {
        continue;
      }

      try {
        const ajuste = await this.movimientoInventarioService.ajuste(
          user,
          {
            productoId: linea.productoId,
            almacenId: conteo.almacenId,
            cantidad: Math.abs(diferencia),
            signo: diferencia > 0 ? 1 : -1,
            observaciones: `Conteo cíclico ${id}: esperado ${linea.cantidadEsperada}, contado ${linea.cantidadContada}`,
          },
          ip,
        );
        linea.ajusteId = ajuste.id ?? null;
        ajustesGenerados += 1;
        if (diferencia > 0) sobrantes += 1;
        else faltantes += 1;
      } catch (error: any) {
        errores.push({
          productoCodigo: linea.productoCodigo,
          error: error?.message ?? 'error desconocido',
        });
      }
    }

    conteo.estado = EstadoConteo.CERRADO;
    conteo.fechaCierre = new Date();
    conteo.resumen = {
      lineas: conteo.lineas.length,
      contadas: conteo.lineas.length,
      sinContar: 0,
      sobrantes,
      faltantes,
      ajustesGenerados,
      errores,
    };

    await this.conteoInventarioRepository.guardar(conteo);

    let message = `Conteo cerrado: ${ajustesGenerados} ajuste(s) generado(s) (${sobrantes} sobrante(s), ${faltantes} faltante(s))`;
    if (errores.length > 0) {
      message += ` — ${errores.length} diferencia(s) sin ajustar (revisar informe)`;
    }
    return this.respuesta(conteo, message);
  }

  /** Cancela un conteo abierto (no genera ajustes). */
  async cancelar(user: UserEntity, id: string): Promise<ResponseDto> {
    const conteo = await this.conteoInventarioRepository.findById(id);
    if (conteo.estado !== EstadoConteo.ABIERTO) {
      throw new ConflictException('Solo se puede cancelar un conteo ABIERTO');
    }
    this.validarAccesoAlmacen(user, conteo.almacenId);

    conteo.estado = EstadoConteo.CANCELADO;
    conteo.fechaCierre = new Date();
    await this.conteoInventarioRepository.guardar(conteo);
    return this.respuesta(conteo, 'Conteo cancelado');
  }

  /** Informe CSV del conteo (líneas con esperado, contado, diferencia y ajuste). */
  async exportarCsv(id: string): Promise<Buffer> {
    const conteo = await this.conteoInventarioRepository.findById(id);
    const filas = (conteo.lineas ?? []).map((l) => ({
      codigo: l.productoCodigo,
      producto: l.productoNombre,
      esperado: l.cantidadEsperada,
      contado: l.cantidadContada ?? '',
      stockAlCierre: l.stockAlCierre ?? '',
      diferencia: l.diferencia ?? '',
      ajustado: l.ajusteId ? 'Sí' : l.diferencia === null ? '' : 'No',
      observaciones: l.observaciones ?? '',
    }));

    const cabeceraExtra = [
      `Almacén;${conteo.almacenNombre}`,
      `Estado;${conteo.estado}`,
      `Abierto por;${conteo.userName}`,
      `Apertura;${fechaLegible(conteo.fechaApertura)}`,
      `Cierre;${fechaLegible(conteo.fechaCierre)}`,
      `Modo;${conteo.esCiego ? 'A ciegas' : 'Con stock esperado visible'}`,
      '',
    ].join('\r\n');

    const cuerpo = toCsvBuffer(
      ['SKU', 'Producto', 'Esperado', 'Contado', 'Stock al cierre', 'Diferencia', 'Ajustado', 'Observaciones'],
      ['codigo', 'producto', 'esperado', 'contado', 'stockAlCierre', 'diferencia', 'ajustado', 'observaciones'],
      filas,
    );

    return Buffer.concat([Buffer.from('\uFEFF' + cabeceraExtra + '\r\n', 'utf8'), cuerpo]);
  }
}
