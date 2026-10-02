import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductoMapper } from '../mapper';
import { LogHistoryService } from './log-history.service';
import { GenericService } from './generic.service';
import { ProductoEntity, UserEntity } from '../../persistence/entity';
import { ProductoRepository } from '../../persistence/repository';
import { ResponseDto } from '../../shared/dto';

/**
 * Servicio de productos. El CRUD completo (create/update/delete/audit con
 * trazas) lo aporta GenericService; aquí vive solo lo específico del dominio:
 * la unicidad de SKU, la búsqueda por código para el escáner manual, la foto
 * y las VARIANTES de catálogo (backlog P3 — patrón Zoho/BoxHero).
 */
@Injectable()
export class ProductoService extends GenericService<ProductoEntity> {
  constructor(
    protected configService: ConfigService,
    protected productoRepository: ProductoRepository,
    protected productoMapper: ProductoMapper,
    protected logHistoryService: LogHistoryService,
  ) {
    super(configService, productoRepository, productoMapper, logHistoryService, true);
  }

  /** Búsqueda por SKU para el escáner manual. */
  async findByCodigo(codigo: string): Promise<ProductoEntity> {
    const producto = await this.productoRepository.findByCodigo(codigo);
    if (!producto) {
      throw new NotFoundException(`No existe un producto activo con el código ${codigo}`);
    }
    return producto;
  }

  /** Guarda/actualiza la foto (data URL) de un producto. */
  async guardarFoto(
    user: UserEntity,
    id: string,
    foto: string,
    _ip: string,
  ): Promise<ResponseDto> {
    const producto = await this.productoRepository.findById(id);
    producto.foto = foto;
    producto.updatedAt = new Date();
    await this.productoRepository.update(producto);

    const response = new ResponseDto();
    response.id = producto.getIdString();
    response.successStatus = true;
    response.message = `Foto actualizada para ${producto.codigo} por ${user.userName}`;
    return response;
  }

  /** Devuelve el binario de la foto (para el endpoint público producto-foto). */
  async obtenerFoto(
    id: string,
  ): Promise<{ buffer: Buffer; contentType: string } | null> {
    const producto = await this.productoRepository.findById(id);
    if (!producto.foto) return null;

    const match = /^data:(image\/[a-z+]+);base64,(.+)$/.exec(producto.foto);
    if (match) {
      return { buffer: Buffer.from(match[2], 'base64'), contentType: match[1] };
    }
    // Compatibilidad: base64 crudo sin prefijo data URL
    return { buffer: Buffer.from(producto.foto, 'base64'), contentType: 'image/jpeg' };
  }

  // ================== VARIANTES (backlog P3) ==================

  private static resumirAtributos(
    atributos: Array<{ clave: string; valor: string }>,
  ): string {
    return atributos
      .map((a) => `${a.clave.trim()}: ${a.valor.trim()}`)
      .join(' · ')
      .slice(0, 200);
  }

  /**
   * Crea una VARIANTE bajo un producto padre: un producto completo (SKU,
   * stock y etiquetas propios) que hereda catálogo del padre y se distingue
   * por sus atributos (talla/color…). Solo un nivel de agrupación.
   */
  async crearVariante(
    user: UserEntity,
    padreId: string,
    atributos: Array<{ clave: string; valor: string }>,
    ip: string,
  ): Promise<ResponseDto> {
    const padre = await this.productoRepository.findById(padreId);
    if (!padre || !padre.activo) {
      throw new NotFoundException('El producto padre no existe o está inactivo');
    }
    if (padre.productoPadreId) {
      throw new ConflictException(
        'No se permiten variantes de una variante: agrupa bajo el producto padre',
      );
    }
    const resumen = ProductoService.resumirAtributos(atributos);
    if (!resumen) {
      throw new NotFoundException('La variante requiere al menos un atributo');
    }
    // Unicidad: no duplicar la misma combinación de atributos bajo el padre
    const hermanas = await this.productoRepository.findVariantesDe(padreId);
    const claveNueva = resumen.toLowerCase();
    if (
      hermanas.some(
        (h) => (h.atributosResumen ?? '').toLowerCase() === claveNueva,
      )
    ) {
      throw new ConflictException(
        `Ya existe una variante «${resumen}» para ${padre.codigo}`,
      );
    }

    const consecutivo =
      (await this.productoRepository.obtenerUltimoConsecutivo()) + 1;
    const variante = new ProductoEntity({
      numeroConsecutivo: consecutivo,
      codigo: `PRD-${String(consecutivo).padStart(6, '0')}`,
      nombre: `${padre.nombre} (${resumen})`.slice(0, 100),
      descripcion: padre.descripcion,
      categoriaId: padre.categoriaId,
      categoriaNombre: padre.categoriaNombre,
      unidadId: padre.unidadId,
      unidadNombre: padre.unidadNombre,
      stockMinimo: padre.stockMinimo ?? 0,
      stockSeguridad: padre.stockSeguridad ?? 0,
      productoPadreId: padre.getIdString(),
      atributosResumen: resumen,
      atributosJson: JSON.stringify(atributos),
    });
    const creado = await this.productoRepository.create(variante);

    const response = new ResponseDto();
    response.id = creado.getIdString();
    response.successStatus = true;
    response.message = `Variante ${creado.codigo} creada para ${padre.codigo} por ${user.userName}`;
    return response;
  }

  /** Variantes activas de un producto padre (ficha web). */
  async listarVariantes(padreId: string): Promise<ProductoEntity[]> {
    return await this.productoRepository.findVariantesDe(padreId);
  }

  /** Actualiza los atributos de una variante (recalcula resumen y nombre). */
  async actualizarAtributos(
    user: UserEntity,
    id: string,
    atributos: Array<{ clave: string; valor: string }>,
    ip: string,
  ): Promise<ResponseDto> {
    const variante = await this.productoRepository.findById(id);
    if (!variante || !variante.activo) {
      throw new NotFoundException('La variante no existe o está inactiva');
    }
    if (!variante.productoPadreId) {
      throw new ConflictException(
        'Solo se pueden editar atributos de una variante (producto con padre)',
      );
    }
    const resumen = ProductoService.resumirAtributos(atributos);
    if (!resumen) {
      throw new NotFoundException('La variante requiere al menos un atributo');
    }
    const padre = await this.productoRepository.findById(
      variante.productoPadreId,
    );
    if (!padre) {
      throw new NotFoundException('El producto padre no existe');
    }
    variante.atributosResumen = resumen;
    variante.atributosJson = JSON.stringify(atributos);
    variante.nombre = `${padre.nombre} (${resumen})`.slice(0, 100);
    variante.updatedAt = new Date();
    await this.productoRepository.update(variante);

    const response = new ResponseDto();
    response.id = variante.getIdString();
    response.successStatus = true;
    response.message = `Atributos actualizados para ${variante.codigo} por ${user.userName}`;
    return response;
  }
}
