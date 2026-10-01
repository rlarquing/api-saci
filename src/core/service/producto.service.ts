import { Injectable, NotFoundException } from '@nestjs/common';
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
 * la unicidad de SKU y la búsqueda por código para el escáner manual.
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
}
