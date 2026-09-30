import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ResponseDto } from '../../shared/dto';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import * as PDFDocument from 'pdfkit';
import { ObjectId } from 'mongodb';
import { QrRepository } from '../../persistence/repository/qr.repository';
import { QrMapper } from '../mapper/qr.mapper';
import { LogHistoryService } from './log-history.service';
import {
  AlmacenEntity,
  QrEntity,
  ProductoEntity,
  UserEntity,
} from '../../persistence/entity';
import {
  GenerateQrDto,
  GenerateQrResponseDto,
  ReadQrDto,
  LoteInfoDto,
  LogHistoryDto,
  ValidarQrResponseDto,
  MovimientoActivoInfoDto,
} from '../../shared/dto';
import {
  GenericNomencladorRepository,
  MovimientoInventarioRepository,
  ProductoRepository,
} from '../../persistence/repository';
import { PaginationOptions, Pagination } from '../../shared/pagination';
import { NomencladorTypeEnum } from '../../shared/enum';
import { AppConfig } from '../../app.keys';
import { HISTORY_ACTION } from '../../persistence/entity/log-history.entity';
import { SocketService } from './socket.service';

@Injectable()
export class QrService {
  private readonly isProductionEnv: boolean;
  constructor(
    protected configService: ConfigService,
    protected qrRepository: QrRepository,
    protected qrMapper: QrMapper,
    protected logHistoryService: LogHistoryService,
    protected genericNomencladorRepository: GenericNomencladorRepository,
    protected movimientoInventarioRepository: MovimientoInventarioRepository,
    protected productoRepository: ProductoRepository,
    private readonly socketService: SocketService,
  ) {
    this.isProductionEnv =
      this.configService.get(AppConfig.NODE_ENV) === 'production';
  }

  /**
   * Valida que el USUARIO tenga acceso al almacen especificado
   * @param user Usuario autenticado
   * @param almacenId ID del almacen a validar
   * @throws ForbiddenException si el usuario no tiene acceso al almacen
   */
  private validarAccesoAlmacen(user: UserEntity, almacenId: string): void {
    if (!user.almacenIds || user.almacenIds.length === 0) {
      throw new BadRequestException('El usuario no tiene almacenes asignados');
    }
    if (!user.almacenIds.includes(almacenId)) {
      throw new ForbiddenException(
        'No tiene autorización para operar sobre este almacen',
      );
    }
  }

  /**
   * Genera un lote de QRs para un tipo de medio específico
   * - ADMINISTRADOR: debe enviar almacenId en el DTO (puede ser cualquier almacen)
   * - USUARIO: debe enviar almacenId en el DTO (debe ser uno de sus almacenes asignados)
   * @param user Usuario que genera los QRs
   * @param generateQrDto Datos para la generación
   * @returns Información del lote generado
   */
  async generateQrs(
    user: UserEntity,
    generateQrDto: GenerateQrDto,
    ip: string,
  ): Promise<GenerateQrResponseDto> {
    const { producto, cantidad, almacen } = generateQrDto;

    // Validar que se envíe el almacenId
    if (!almacen) {
      throw new BadRequestException(
        'Debe especificar el almacenId para generar QRs',
      );
    }

    // Validar que el usuario tenga acceso al almacen
    this.validarAccesoAlmacen(user, almacen);
    // Obtener entidad del almacen para el nombre
    const almacenEntity = await this.genericNomencladorRepository.findById(
      NomencladorTypeEnum.ALMACEN,
      almacen,
    );

    // Obtener el tipo de medio usando el repositorio de nomencladores
    const productoEntity: ProductoEntity =
      await this.productoRepository.findById(producto);
    if (!productoEntity) {
      throw new NotFoundException(
        `Producto con ID ${producto} no encontrado`,
      );
    }

    // Obtener el último consecutivo
    const ultimoConsecutivo =
      await this.qrRepository.obtenerUltimoConsecutivo();
    const numeroInicial = ultimoConsecutivo + 1;
    const numeroFinal = numeroInicial + cantidad - 1;

    // Generar ID del lote
    const fecha = new Date();
    const loteId = `lote-${fecha.toISOString().split('T')[0]}-${Date.now()}`;

    // Crear los QRs con el almacenId determinado
    const qrEntities: QrEntity[] = [];
    for (let i = numeroInicial; i <= numeroFinal; i++) {
      const codigo = this.generarCodigoQr(i);
      const contenido = this.generarContenidoQr(
        productoEntity,
        almacenEntity?.nombre || 'SIN_NOMBRE',
        i,
      );

      const qrEntity = new QrEntity({
        codigo,
        numeroConsecutivo: i,
        productoId: producto,
        productoNombre: productoEntity.nombre,
        productoCodigo: productoEntity.codigo,
        contenido: JSON.stringify(contenido),
        fechaGeneracion: fecha,
        loteId,
        almacenId: almacen,
        almacenNombre: almacenEntity?.nombre || 'SIN_NOMBRE',
        estado: 'disponible',
        activo: true,
      });

      qrEntities.push(qrEntity);
    }

    // Guardar todos los QRs
    for (const entity of qrEntities) {
      const objEntity: QrEntity = await this.qrRepository.create(entity);
      if (this.isProductionEnv) {
        const tabla: string = this.qrRepository.getTabla();
        const logHistoryDto: LogHistoryDto = new LogHistoryDto(
          null,
          user.userName,
          new Date(),
          tabla,
          HISTORY_ACTION.ADD,
          objEntity,
          null,
          objEntity.id.toHexString(),
          ip,
        );
        await this.logHistoryService.create(logHistoryDto);
      }
    }

    // Preparar respuesta
    const response = new GenerateQrResponseDto();
    response.loteId = loteId;
    response.cantidadGenerada = cantidad;
    response.numeroInicial = numeroInicial;
    response.numeroFinal = numeroFinal;
    response.fechaGeneracion = fecha;
    response.productoNombre = productoEntity.nombre;
    response.mensaje = 'QRs generados exitosamente';

    return response;
  }

  /**
   * Genera el código único del QR
   * @param numeroConsecutivo Número consecutivo
   * @returns Código formateado
   */
  private generarCodigoQr(numeroConsecutivo: number): string {
    return `QR-${numeroConsecutivo.toString().padStart(6, '0')}`;
  }

  /**
   * Genera el contenido del QR
   * @param producto Producto etiquetado
   * @param numeroConsecutivo Número consecutivo
   * @returns Objeto con el contenido
   */
  private generarContenidoQr(
    producto: ProductoEntity,
    almacenNombre: string,
    numeroConsecutivo: number,
  ): any {
    return {
      productoId:
        producto.id?.toHexString?.() || producto.id?.toString?.() || '',
      productoCodigo: producto.codigo,
      productoNombre: producto.nombre,
      numeroQr: numeroConsecutivo,
      codigo: this.generarCodigoQr(numeroConsecutivo),
    };
  }

  /**
   * Genera un PDF con las tarjetas de QR
   * - ADMINISTRADOR: puede descargar cualquier lote
   * - USUARIO: solo puede descargar lotes de sus almacenes
   * @param loteId ID del lote
   * @param user Usuario autenticado
   * @returns Buffer del PDF
   */
  async generatePdf(loteId: string, user: UserEntity): Promise<Buffer> {
    const almacenIds = user.almacenIds;

    const qrs = await this.qrRepository.findByLote(loteId, almacenIds);
    if (!qrs || qrs.length === 0) {
      throw new NotFoundException(
        `No se encontraron QRs para el lote ${loteId}`,
      );
    }

    return await this.createPdfWithCards(qrs);
  }

  /**
   * Crea el PDF con las tarjetas de QR
   * @param qrs Lista de QRs
   * @returns Buffer del PDF
   */
  private async createPdfWithCards(qrs: QrEntity[]): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        // Configuración de la tarjeta (más cuadrada: ~63mm x ~70mm)
        const cardWidth = 180; // ~63mm en puntos - más angosta
        const cardHeight = 180; // ~70mm en puntos - más alta
        const qrSize = 120; // mismo tamaño

        // Crear documento PDF
        const doc = new (PDFDocument as any)({
          size: 'letter',
          margins: {
            top: 35,
            bottom: 35,
            left: 35,
            right: 35,
          },
        });

        const buffers: Buffer[] = [];
        doc.on('data', (buffer: Buffer) => buffers.push(buffer));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Configuración de página
        const pageWidth = doc.page.width - 70; // Ancho disponible (con márgenes)
        const pageHeight = doc.page.height - 70;
        const cardsPerRow = Math.floor(pageWidth / cardWidth);
        const cardsPerColumn = Math.floor(pageHeight / cardHeight);
        const cardsPerPage = cardsPerRow * cardsPerColumn;

        let cardCount = 0;

        for (const qr of qrs) {
          // Si es una nueva página (excepto la primera)
          if (cardCount > 0 && cardCount % cardsPerPage === 0) {
            doc.addPage();
          }

          // Calcular posición de la tarjeta
          const positionInPage = cardCount % cardsPerPage;
          const row = Math.floor(positionInPage / cardsPerRow);
          const col = positionInPage % cardsPerRow;

          const x = 35 + col * cardWidth;
          const y = 35 + row * cardHeight;

          // Dibujar borde de la tarjeta
          doc.rect(x, y, cardWidth - 5, cardHeight - 5).stroke('#cccccc');

          // Generar QR como imagen
          const contenido = JSON.parse(qr.contenido);
          const qrDataUrl = await QRCode.toDataURL(JSON.stringify(contenido), {
            width: qrSize,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          });

          // Convertir data URL a buffer
          const qrBase64 = qrDataUrl.split(',')[1];
          const qrBuffer = Buffer.from(qrBase64, 'base64');

          // Centrar QR horizontalmente en la tarjeta
          const qrX = x + (cardWidth - 5 - qrSize) / 2;
          const qrY = y + 10;

          // Insertar imagen QR
          doc.image(qrBuffer, qrX, qrY, {
            width: qrSize,
            height: qrSize,
          });

          // Texto debajo del QR - centrado en el espacio restante de la tarjeta
          const textY = qrY + qrSize + 12;

          // Nombre del tipo de medio
          doc.fontSize(9);
          doc.font('Helvetica-Bold');
          const nombreMedio = qr.productoNombre;
          const textWidth = doc.widthOfString(nombreMedio);
          const textX = x + (cardWidth - 5 - textWidth) / 2;
          doc.text(nombreMedio, textX, textY);

          // Nombre del almacen
          doc.font('Helvetica');
          doc.fontSize(8);
          const almacenText = qr.almacenNombre || '';
          const almacenWidth = doc.widthOfString(almacenText);
          const almacenX = x + (cardWidth - 5 - almacenWidth) / 2;
          doc.text(almacenText, almacenX, textY + 10);

          // Número del QR
          doc.fontSize(8);
          const numeroText = `Nº ${qr.numeroConsecutivo}`;
          const numeroWidth = doc.widthOfString(numeroText);
          const numeroX = x + (cardWidth - 5 - numeroWidth) / 2;
          doc.text(numeroText, numeroX, textY + 20);

          cardCount++;
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Obtiene todos los QRs con paginación
   * - ADMINISTRADOR: ve todos los QRs
   * - USUARIO: ve los QRs de todos sus almacenes asignados
   * @param options Opciones de paginación
   * @param user Usuario autenticado
   * @returns Lista paginada de QRs
   */
  async findAll(
    options: PaginationOptions,
    user: UserEntity,
  ): Promise<Pagination<ReadQrDto>> {
    // El usuario ve los QRs de todos sus almacenes
    if (!user.almacenIds || user.almacenIds.length === 0) {
      throw new BadRequestException('El usuario no tiene almacenes asignados');
    }
    const result = await this.qrRepository.findAllByAlmacenes(
      options,
      user.almacenIds,
    );

    const items: ReadQrDto[] = [];
    for (const item of result.items) {
      items.push(await this.qrMapper.entityToDto(item));
    }

    return new Pagination(items, result.meta, result.links || {});
  }

  /**
   * Obtiene un QR por ID
   * @param id ID del QR
   * @returns DTO del QR
   */
  async findById(id: string): Promise<ReadQrDto> {
    const qr = await this.qrRepository.findById(id);
    if (!qr) {
      throw new NotFoundException(`QR con ID ${id} no encontrado`);
    }
    return await this.qrMapper.entityToDto(qr);
  }

  /**
   * Obtiene QRs por lote
   * - ADMINISTRADOR: puede ver cualquier lote
   * - USUARIO: solo puede ver lotes de sus almacenes
   * @param loteId ID del lote
   * @param user Usuario autenticado
   * @returns Lista de QRs del lote
   */
  async findByLote(loteId: string, user: UserEntity): Promise<ReadQrDto[]> {
    const almacenIds = user.almacenIds;

    const qrs = await this.qrRepository.findByLote(loteId, almacenIds);
    return await this.qrMapper.entitiesToDtos(qrs);
  }

  /**
   * Obtiene información de todos los lotes
   * - ADMINISTRADOR: ve todos los lotes
   * - USUARIO: ve los lotes de todos sus almacenes
   * @param user Usuario autenticado
   * @returns Lista de lotes
   */
  async getLotes(user: UserEntity): Promise<LoteInfoDto[]> {
    const almacenIds = user.almacenIds;

    const lotes = await this.qrRepository.obtenerLotes(almacenIds);
    return lotes.map((lote) => ({
      loteId: lote._id,
      fechaGeneracion: lote.fechaGeneracion,
      productoNombre: lote.productoNombre,
      productoCodigo: lote.productoCodigo,
      cantidad: lote.cantidad,
      primerNumero: lote.primerNumero,
      ultimoNumero: lote.ultimoNumero,
      almacenNombre: lote.almacenNombre,
    }));
  }

  /**
   * Obtiene un QR por su código
   * - ADMINISTRADOR: puede buscar cualquier QR
   * - USUARIO: solo puede buscar QRs de sus almacenes
   * @param codigo Código del QR
   * @param user Usuario autenticado
   * @returns DTO del QR
   */
  async findByCodigo(codigo: string, user: UserEntity): Promise<ReadQrDto> {
    const almacenIds = user.almacenIds;

    const qr = await this.qrRepository.findByCodigo(codigo, almacenIds);
    if (!qr) {
      throw new NotFoundException(`QR con código ${codigo} no encontrado`);
    }
    return await this.qrMapper.entityToDto(qr);
  }

  /**
   * Marca un QR como usado
   * @param codigo Código del QR
   * @returns QR actualizado
   */
  async marcarComoUsado(codigo: string): Promise<ReadQrDto> {
    return await this.cambiarEstado(codigo, 'usado');
  }

  /**
   * Libera un QR al registrar la salida para que la tarjeta física pueda reutilizarse
   * @param codigo Código del QR
   * @returns QR actualizado
   */
  async liberarQR(codigo: string): Promise<ReadQrDto> {
    return await this.cambiarEstado(codigo, 'disponible');
  }

  /**
   * Cambia el estado de un QR. Es idempotente: no falla si ya está en ese estado,
   * porque la validación de reuso vive en validarQR/MovimientoService.
   * Un QR anulado nunca cambia de estado por esta vía.
   * @param codigo Código del QR
   * @param estado Nuevo estado
   * @returns QR actualizado
   */
  private async cambiarEstado(
    codigo: string,
    estado: 'disponible' | 'usado',
  ): Promise<ReadQrDto> {
    const qr: QrEntity = await this.qrRepository.findByCodigo(codigo);
    if (!qr) {
      throw new NotFoundException(`QR con código ${codigo} no encontrado`);
    }

    if (qr.estado === 'anulado') {
      throw new BadRequestException(`El QR ${codigo} está anulado`);
    }

    if (qr.estado !== estado) {
      qr.estado = estado;
      qr.fechaEstado = new Date();
      await this.qrRepository.update(qr);
      // Notifica por socket para que la web (y clientes futuros) actualicen el
      // estado del QR en tiempo real: devolución a disponible al salir, usado al entrar.
      this.socketService.emitQrEvent({
        qrCodigo: codigo,
        estado: estado as any,
        almacenId: qr.almacenId,
        timestamp: new Date().toISOString(),
      });
    }

    return await this.qrMapper.entityToDto(qr);
  }

  /**
   * Obtiene QRs por producto
   * - ADMINISTRADOR: ve todos los QRs del producto
   * - USUARIO: solo ve los de sus almacenes
   * @param productoId ID del producto
   * @param user Usuario autenticado
   * @returns Lista de QRs
   */
  async findByProducto(
    productoId: string,
    user: UserEntity,
  ): Promise<ReadQrDto[]> {
    const almacenIds = user.almacenIds;

    const qrs = await this.qrRepository.findByProducto(
      productoId,
      almacenIds,
    );
    return await this.qrMapper.entitiesToDtos(qrs);
  }

  /**
   * Cuenta QRs disponibles por producto
   * - ADMINISTRADOR: cuenta todos los disponibles
   * - USUARIO: solo cuenta los de sus almacenes
   * @param productoId ID del producto
   * @param user Usuario autenticado
   * @returns Cantidad de QRs disponibles
   */
  async countDisponiblesByProducto(
    productoId: string,
    user: UserEntity,
  ): Promise<number> {
    const almacenIds = user.almacenIds;

    const qrs = await this.qrRepository.findDisponiblesByProducto(
      productoId,
      almacenIds,
    );
    return qrs.length;
  }

  /**
   * Valida un QR por código y almacen
   * Verifica que el QR exista, pertenezca al almacen especificado, y esté disponible
   * Determina si puede entrar (disponible y sin movimiento activo) o salir (con movimiento activo)
   * - ADMINISTRADOR: puede validar QRs de cualquier almacen
   * - USUARIO: solo puede validar QRs de sus almacenes asignados
   * @param codigo Código del QR a validar
   * @param almacenId ID del almacen (string, se convierte a ObjectId)
   * @param user Usuario autenticado
   * @returns Resultado de la validación con datos del QR
   */
  async validarQR(
    codigo: string,
    almacenId: string,
    user: UserEntity,
  ): Promise<ValidarQrResponseDto> {
    // Validar que almacenId sea un ObjectId válido de MongoDB
    if (!ObjectId.isValid(almacenId)) {
      throw new BadRequestException(
        'El ID del almacen no es un ObjectId válido de MongoDB',
      );
    }

    // Validar que el almacen exista en el sistema
    const almacenEntity: AlmacenEntity =
      await this.genericNomencladorRepository.findById(
        NomencladorTypeEnum.ALMACEN,
        almacenId,
      );

    // Validar acceso del usuario al almacen
    this.validarAccesoAlmacen(user, almacenId);

    // Buscar QR por código Y almacen
    const qr: QrEntity = await this.qrRepository.findByCodigo(codigo, [
      almacenId,
    ]);
    if (!qr) {
      throw new NotFoundException(
        `No se encontró un QR con código ${codigo} para el almacen ${almacenEntity?.nombre || 'especificado'}`,
      );
    }

    // SACI: la etiqueta es REUTILIZABLE (no ticket). El estado solo distingue
    // disponible (sin asignar) / asignado (en uso) / anulado (terminal).
    const readDto: ReadQrDto = await this.qrMapper.entityToDto(qr);
    const response = new ValidarQrResponseDto();
    response.qr = readDto;

    if (qr.estado === 'anulado') {
      response.valido = false;
      response.mensaje = 'El QR ha sido anulado';
      response.puede_entrada = false;
      response.puede_salida = false;
      response.puede_ajuste = false;
      return response;
    }

    response.valido = true;
    response.puede_entrada = true;   // siempre: llegar más stock nunca rompe nada
    response.puede_salida = qr.estado === 'asignado';
    response.puede_ajuste = qr.estado === 'asignado';
    response.mensaje =
      qr.estado === 'disponible'
        ? 'QR válido — primera asignación (entrada)'
        : 'QR válido — entrada, salida o ajuste disponibles';
    response.movimiento_activo = null;
    return response;
  }

  /**
   * Elimina un QR (borrado virtual - establece activo = false)
   * Registra traza con HISTORY_ACTION.DEL
   * - ADMINISTRADOR: puede eliminar cualquier QR
   * - USUARIO: solo puede eliminar QRs de sus almacenes asignados
   * @param user Usuario que elimina
   * @param id ID del QR a eliminar
   * @param ip Dirección IP del solicitante
   * @returns Resultado de la operación
   */
  async delete(user: UserEntity, id: string, ip: string): Promise<ResponseDto> {
    const result = new ResponseDto();
    try {
      // Obtener la entidad antes de eliminar (para la traza - valorAnterior)
      const objEntity: QrEntity = await this.qrRepository.findById(id);

      // Validar acceso según rol
      if (!user.almacenIds || user.almacenIds.length === 0) {
        throw new BadRequestException('El usuario no tiene almacenes asignados');
      }
      if (!user.almacenIds.includes(objEntity.almacenId)) {
        throw new ForbiddenException(
          'No tiene autorización para eliminar QRs de este almacen',
        );
      }

      // Realizar borrado virtual (activo = false)
      const deleteEntity: QrEntity = await this.qrRepository.delete(id);

      // Registrar traza
      if (this.isProductionEnv) {
        const tabla: string = this.qrRepository.getTabla();
        const logHistoryDto: LogHistoryDto = new LogHistoryDto(
          null,
          user.userName,
          new Date(),
          tabla,
          HISTORY_ACTION.DEL,
          deleteEntity,
          objEntity,
          objEntity.id.toHexString(),
          ip,
        );
        await this.logHistoryService.create(logHistoryDto);
      }

      result.id = objEntity.id.toHexString();
      result.successStatus = true;
      result.message = 'QR eliminado exitosamente';
    } catch (error) {
      result.message = error.detail || error.message;
      result.successStatus = false;
    }
    return result;
  }

  /**
   * Elimina múltiples QRs (borrado virtual)
   * Registra traza por cada QR eliminado
   * @param user Usuario que elimina
   * @param ids Array de IDs de QRs a eliminar
   * @param ip Dirección IP del solicitante
   * @returns Resultado de la operación
   */
  async deleteMultiple(
    user: UserEntity,
    ids: string[],
    ip: string,
  ): Promise<ResponseDto> {
    const result = new ResponseDto();
    try {
      for (const id of ids) {
        await this.delete(user, id, ip);
      }
      result.successStatus = true;
      result.message = `${ids.length} QR(s) eliminado(s) exitosamente`;
    } catch (error) {
      result.message = error.detail || error.message;
      result.successStatus = false;
    }
    return result;
  }

  /**
   * Elimina todos los QRs de un lote (borrado virtual)
   * Registra traza por cada QR eliminado
   * - ADMINISTRADOR: puede eliminar cualquier lote
   * - USUARIO: solo puede eliminar lotes de sus almacenes asignados
   * @param user Usuario que elimina
   * @param loteId ID del lote a eliminar
   * @param ip Dirección IP del solicitante
   * @returns Resultado de la operación con cantidad de QRs eliminados
   */
  async deleteLote(
    user: UserEntity,
    loteId: string,
    ip: string,
  ): Promise<ResponseDto> {
    const result = new ResponseDto();
    try {
      const almacenIds = user.almacenIds;

      // Obtener todos los QRs del lote
      const qrs = await this.qrRepository.findByLote(loteId, almacenIds);
      if (!qrs || qrs.length === 0) {
        throw new NotFoundException(
          `No se encontraron QRs para el lote ${loteId}`,
        );
      }

      // Eliminar cada QR del lote
      for (const qr of qrs) {
        await this.delete(user, qr.id.toHexString(), ip);
      }

      result.successStatus = true;
      result.message = `Lote eliminado exitosamente. ${qrs.length} QR(s) eliminado(s)`;
    } catch (error) {
      result.message = error.detail || error.message;
      result.successStatus = false;
    }
    return result;
  }

  /**
   * Anula un QR (cambia estado a 'anulado')
   * Registra traza con HISTORY_ACTION.MOD
   * - ADMINISTRADOR: puede anular cualquier QR
   * - USUARIO: solo puede anular QRs de sus almacenes asignados
   * @param user Usuario que anula
   * @param id ID del QR a anular
   * @param ip Dirección IP del solicitante
   * @returns Resultado de la operación
   */
  async anular(user: UserEntity, id: string, ip: string): Promise<ResponseDto> {
    const result = new ResponseDto();
    try {
      // Obtener la entidad antes de anular (para la traza - valorAnterior)
      const objEntity: QrEntity = await this.qrRepository.findById(id);

      // Validar acceso según rol
      if (!user.almacenIds || user.almacenIds.length === 0) {
        throw new BadRequestException('El usuario no tiene almacenes asignados');
      }
      if (!user.almacenIds.includes(objEntity.almacenId)) {
        throw new ForbiddenException(
          'No tiene autorización para anular QRs de este almacen',
        );
      }

      // Verificar que no esté ya anulado
      if (objEntity.estado === 'anulado') {
        throw new BadRequestException(`El QR ya se encuentra anulado`);
      }

      // Guardar estado anterior para la traza
      const estadoAnterior = objEntity.estado;

      // Cambiar estado a anulado
      objEntity.estado = 'anulado';
      objEntity.fechaEstado = new Date();
      const updatedEntity: QrEntity = await this.qrRepository.update(objEntity);

      // Registrar traza
      if (this.isProductionEnv) {
        const tabla: string = this.qrRepository.getTabla();
        const logHistoryDto: LogHistoryDto = new LogHistoryDto(
          null,
          user.userName,
          new Date(),
          tabla,
          HISTORY_ACTION.MOD,
          updatedEntity,
          { ...objEntity, estado: estadoAnterior },
          objEntity.id.toHexString(),
          ip,
        );
        await this.logHistoryService.create(logHistoryDto);
      }

      result.id = objEntity.id.toHexString();
      result.successStatus = true;
      result.message = 'QR anulado exitosamente';
    } catch (error) {
      result.message = error.detail || error.message;
      result.successStatus = false;
    }
    return result;
  }

  /**
   * Anula múltiples QRs
   * Registra traza por cada QR anulado
   * @param user Usuario que anula
   * @param ids Array de IDs de QRs a anular
   * @param ip Dirección IP del solicitante
   * @returns Resultado de la operación
   */
  async anularMultiple(
    user: UserEntity,
    ids: string[],
    ip: string,
  ): Promise<ResponseDto> {
    const result = new ResponseDto();
    try {
      for (const id of ids) {
        await this.anular(user, id, ip);
      }
      result.successStatus = true;
      result.message = `${ids.length} QR(s) anulado(s) exitosamente`;
    } catch (error) {
      result.message = error.detail || error.message;
      result.successStatus = false;
    }
    return result;
  }
}
