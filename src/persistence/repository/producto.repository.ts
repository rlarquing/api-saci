import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ProductoEntity } from '../entity';
import { GenericRepository } from './generic.repository';
import { IRepository } from '../../shared/interface';

@Injectable()
export class ProductoRepository
  extends GenericRepository<ProductoEntity>
  implements IRepository<ProductoEntity>
{
  constructor(
    @InjectRepository(ProductoEntity)
    productoRepository: MongoRepository<ProductoEntity>,
  ) {
    super(productoRepository);
  }

  /**
   * Obtiene el último número consecutivo de producto (SKU PRD-XXXXXX)
   * usando agregación nativa ($max) — mismo patrón atómico del QR de SACP.
   */
  async obtenerUltimoConsecutivo(): Promise<number> {
    const result = await this.repository
      .aggregate([
        { $match: { activo: true } },
        { $group: { _id: null, maxConsecutivo: { $max: '$numeroConsecutivo' } } },
      ])
      .toArray();
    if (result && result.length > 0 && result[0].maxConsecutivo !== undefined) {
      return result[0].maxConsecutivo;
    }
    return 0;
  }

  /** Genera el siguiente SKU del producto. */
  async generarCodigo(): Promise<string> {
    const n = (await this.obtenerUltimoConsecutivo()) + 1;
    return `PRD-${String(n).padStart(6, '0')}`;
  }

  /** Busca un producto por su SKU (escáner manual). */
  async findByCodigo(codigo: string): Promise<ProductoEntity | null> {
    return await this.repository.findOne({
      where: { codigo, activo: true } as any,
    });
  }

  /** Cuenta productos activos (KPI del dashboard). */
  async contarProductos(): Promise<number> {
    return await this.repository.count({ where: { activo: true } as any });
  }

  /** Variantes activas de un producto padre (backlog P3). */
  async findVariantesDe(padreId: string): Promise<ProductoEntity[]> {
    return await this.repository.find({
      where: { productoPadreId: padreId, activo: true } as any,
      order: { atributosResumen: 'ASC' as any },
    });
  }
}
