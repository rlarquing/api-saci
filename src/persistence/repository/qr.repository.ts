import { MongoRepository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { QrEntity } from '../entity';
import { GenericRepository } from './generic.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { IRepository } from '../../shared/interface';

@Injectable()
export class QrRepository
  extends GenericRepository<QrEntity>
  implements IRepository<QrEntity>
{
  constructor(
    @InjectRepository(QrEntity)
    repository: MongoRepository<QrEntity>,
  ) {
    super(repository);
  }

  /**
   * Obtiene el último número consecutivo de QR generado
   * @returns El último número consecutivo o 0 si no hay registros
   */
  async obtenerUltimoConsecutivo(): Promise<number> {
    // Usar agregación nativa de MongoDB para obtener el máximo consecutivo
    const result = await this.repository
      .aggregate([
        { $match: { activo: true } },
        {
          $group: {
            _id: null,
            maxConsecutivo: { $max: '$numeroConsecutivo' },
          },
        },
      ])
      .toArray();

    if (result && result.length > 0 && result[0].maxConsecutivo !== undefined) {
      return result[0].maxConsecutivo;
    }

    return 0;
  }

  /**
   * Obtiene QRs por lote
   * @param loteId ID del lote
   * @param almacenIds Array de IDs de almacenes (opcional para filtrar)
   * @returns Lista de QRs del lote
   */
  async findByLote(loteId: string, almacenIds?: string[]): Promise<QrEntity[]> {
    const where: any = { loteId, activo: true };
    if (almacenIds && almacenIds.length > 0) {
      where.almacenId = { $in: almacenIds };
    }
    return await this.repository.find({
      where,
      order: { numeroConsecutivo: 'ASC' as any },
    });
  }

  /**
   * Obtiene QRs por tipo de medio
   * @param productoId ID del producto
   * @param almacenIds Array de IDs de almacenes (opcional para filtrar)
   * @returns Lista de QRs del producto
   */
  async findByProducto(
    productoId: string,
    almacenIds?: string[],
  ): Promise<QrEntity[]> {
    const where: any = { productoId, activo: true };
    if (almacenIds && almacenIds.length > 0) {
      where.almacenId = { $in: almacenIds };
    }
    return await this.repository.find({
      where,
      order: { numeroConsecutivo: 'DESC' as any },
    });
  }

  /**
   * Busca un QR por su código
   * @param codigo Código del QR
   * @param almacenIds Array de IDs de almacenes (opcional para filtrar)
   * @returns QR encontrado o null
   */
  async findByCodigo(
    codigo: string,
    almacenIds?: string[],
  ): Promise<QrEntity | null> {
    const where: any = { codigo, activo: true };
    if (almacenIds && almacenIds.length > 0) {
      where.almacenId = { $in: almacenIds };
    }
    return await this.repository.findOne({ where });
  }

  /**
   * Obtiene QRs disponibles por tipo de medio
   * @param productoId ID del producto
   * @param almacenIds Array de IDs de almacenes (opcional para filtrar)
   * @returns Lista de QRs disponibles
   */
  async findDisponiblesByProducto(
    productoId: string,
    almacenIds?: string[],
  ): Promise<QrEntity[]> {
    const where: any = {
      productoId,
      activo: true,
      estado: 'disponible',
    };
    if (almacenIds && almacenIds.length > 0) {
      where.almacenId = { $in: almacenIds };
    }
    return await this.repository.find({
      where,
      order: { numeroConsecutivo: 'ASC' as any },
    });
  }

  /**
   * Obtiene el conteo de QRs por lote
   * @param loteId ID del lote
   * @returns Número de QRs en el lote
   */
  async countByLote(loteId: string): Promise<number> {
    return await this.repository.count({
      where: { loteId: loteId, activo: true } as any,
    });
  }

  /**
   * Obtiene todos los lotes con su información resumida
   * @param almacenIds Array de IDs de almacenes (opcional para filtrar)
   * @returns Lista de lotes con conteo
   */
  async obtenerLotes(almacenIds?: string[]): Promise<any[]> {
    const match: any = { activo: true };
    if (almacenIds && almacenIds.length > 0) {
      match.almacenId = { $in: almacenIds };
    }
    const result = await this.repository
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: '$loteId',
            fechaGeneracion: { $first: '$fechaGeneracion' },
            productoNombre: { $first: '$productoNombre' },
            almacenNombre: { $max: '$almacenNombre' },
            productoCodigo: { $first: '$productoCodigo' },
            cantidad: { $sum: 1 },
            primerNumero: { $min: '$numeroConsecutivo' },
            ultimoNumero: { $max: '$numeroConsecutivo' },
          },
        },
        { $sort: { fechaGeneracion: -1 } },
      ])
      .toArray();

    return result;
  }

  /**
   * Obtiene todos los QRs con paginación filtrados por múltiples almacenes
   * @param options Opciones de paginación
   * @param almacenIds Array de IDs de almacenes para filtrar
   * @returns Lista paginada de QRs
   */
  async findAllByAlmacenes(options: any, almacenIds: string[]): Promise<any> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [items, total] = await this.repository.findAndCount({
      where: { almacenId: { $in: almacenIds }, activo: true } as any,
      order: { fechaGeneracion: 'DESC' as any },
      skip,
      take: limit,
    });

    return {
      items,
      meta: {
        totalItems: total,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }
}
