import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import {
  BadRequestException,
  NotFoundException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  isBoolean,
  isDate,
  isEmpty,
  isNumber,
  isString,
} from 'class-validator';
import {
  PaginationOptions,
  paginateMongo,
  Pagination,
} from '../../shared/pagination';
import { DeleteResult } from 'mongodb';
import { NomencladorTypeEnum } from '../../shared/enum';
import { AlmacenEntity, CategoriaEntity } from '../entity';

const isValidObjectId = (id: string): boolean => {
  if (!id || typeof id !== 'string') return false;
  return /^[a-fA-F0-9]{24}$/.test(id);
};

@Injectable()
export class GenericNomencladorRepository {
  // Mapa: enumValue -> MongoRepository
  private registry: Map<string, MongoRepository<any>> = new Map();

  constructor(
    @InjectRepository(CategoriaEntity)
    categoriaRepository: MongoRepository<CategoriaEntity>,
    @InjectRepository(AlmacenEntity)
    almacenRepository: MongoRepository<AlmacenEntity>,
  ) {
    // Registro automático basado en el enum
    this.register(NomencladorTypeEnum.CATEGORIA, categoriaRepository);
    this.register(NomencladorTypeEnum.ALMACEN, almacenRepository);
  }

  // ============ REGISTRO ============
  /**
   * Obtiene el nombre de la tabla de la entidad
   */
  getTabla(name: string): string {
    const repo = this.getRepository(name);
    return repo.metadata?.name || '';
  }
  /**
   * Registra un repositorio en el mapa
   */
  private register(enumValue: string, repository: MongoRepository<any>): void {
    this.registry.set(enumValue, repository);
  }

  /**
   * Obtiene repositorio por nombre (del enum)
   */
  private getRepository(name: string): MongoRepository<any> {
    const repo = this.registry.get(name);
    if (!repo) {
      const disponibles = Array.from(this.registry.keys()).join(', ');
      throw new NotFoundException(
        `Nomenclador '${name}' no existe. Disponibles: ${disponibles}`,
      );
    }
    return repo;
  }

  /**
   * Verifica si existe el nomenclador
   */
  exists(name: string): boolean {
    return this.registry.has(name);
  }

  /**
   * Lista todos los nomencladores registrados
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.registry.keys());
  }

  // ============ UTILIDADES MONGODB ============

  private toObjectId(id: string): ObjectId {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(
        'El ID debe ser un ObjectId válido de MongoDB (24 caracteres hex)',
      );
    }
    try {
      return new ObjectId(id);
    } catch {
      throw new NotFoundException(`ID inválido: ${id}`);
    }
  }

  private buildDateFilter(dateValue: Date): any {
    const start = new Date(dateValue);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateValue);
    end.setHours(23, 59, 59, 999);
    return { $gte: start, $lte: end };
  }

  // ============ CRUD ============

  async findById(name: string, id: string): Promise<any> {
    const repo = this.getRepository(name);
    const objectId = this.toObjectId(id);

    const obj = await repo.findOne({
      where: { _id: objectId, activo: true } as any,
    });

    if (!obj) {
      throw new NotFoundException(`No existe '${name}' con id '${id}'`);
    }

    return obj;
  }

  async get(name: string): Promise<any[]> {
    const repo = this.getRepository(name);
    return await repo.find({ where: { activo: true } as any });
  }

  async findAll(
    name: string,
    options: PaginationOptions,
  ): Promise<Pagination<any>> {
    const repo = this.getRepository(name);
    return await paginateMongo<any>(repo, options, {
      where: { activo: true } as any,
    });
  }

  async findAllEntities(name: string): Promise<any[]> {
    const repo = this.getRepository(name);
    return await repo.find({
      where: {
        activo: true,
      } as any,
    });
  }

  async findOne(name: string, id: string): Promise<any> {
    const repo = this.getRepository(name);
    const objectId = this.toObjectId(id);

    const obj = await repo.findOne({
      where: { _id: objectId } as any,
    });

    if (!obj) {
      throw new NotFoundException(`No existe '${name}' con id '${id}'`);
    }

    return obj;
  }

  async findByIds(name: string, ids: string[]): Promise<any[]> {
    const repo = this.getRepository(name);
    const objectIds = ids.map((id) => this.toObjectId(id));

    return await repo.find({
      where: {
        _id: { $in: objectIds },
        activo: true,
      } as any,
    });
  }

  async create(name: string, newObj: any): Promise<any> {
    const repo = this.getRepository(name);
    return await repo.save(newObj);
  }

  async createSelect(name: string): Promise<any[]> {
    const repo = this.getRepository(name);
    return await repo.find({ where: { activo: true } as any });
  }

  async update(name: string, updateObj: any): Promise<any> {
    const repo = this.getRepository(name);

    // Convertir id string a ObjectId si es necesario
    if (updateObj.id && typeof updateObj.id === 'string') {
      updateObj._id = new ObjectId(updateObj.id);
      delete updateObj.id;
    }

    return await repo.save(updateObj);
  }

  async delete(name: string, id: string): Promise<any> {
    const repo = this.getRepository(name);
    const obj = await this.findById(name, id);

    obj.activo = false;
    return await repo.save(obj);
  }

  async remove(name: string, ids: string[]): Promise<DeleteResult> {
    const repo = this.getRepository(name);
    const objectIds = ids.map((id) => this.toObjectId(id));

    return await repo.deleteMany({
      _id: { $in: objectIds },
    } as any);
  }

  async count(name: string): Promise<number> {
    const repo = this.getRepository(name);
    return await repo.count({ where: { activo: true } as any });
  }

  // ============ FILTROS ============

  async filter(
    name: string,
    options: PaginationOptions,
    claves: string[],
    valores: any[],
  ): Promise<Pagination<any>> {
    const repo = this.getRepository(name);
    const wheres: any = { activo: true };

    for (let i = 0; i < claves.length; i++) {
      const clave = claves[i];
      const valor = valores[i];

      if (isNumber(valor)) {
        wheres[clave] = valor;
      } else if (isDate(valor)) {
        wheres[clave] = this.buildDateFilter(valor);
      } else if (isBoolean(valor)) {
        wheres[clave] = valor;
      } else if (isString(valor)) {
        wheres[clave] = { $regex: new RegExp(valor, 'i') };
      } else {
        wheres[clave] = valor;
      }
    }

    return await paginateMongo<any>(repo, options, {
      where: wheres as any,
    });
  }

  async search(
    name: string,
    options: PaginationOptions,
    search: any,
  ): Promise<Pagination<any>> {
    const repo = this.getRepository(name);

    if (isEmpty(search)) {
      return await paginateMongo<any>(repo, options, {
        where: { activo: true } as any,
      });
    }

    const sample = await repo.findOne({ where: {} as any });
    if (!sample) {
      return await paginateMongo<any>(repo, options, {
        where: { activo: true } as any,
      });
    }

    const orConditions: any[] = [];
    const excluidos = ['_id', 'id', 'activo', 'createdAt', 'updatedAt'];

    for (const key of Object.keys(sample)) {
      if (excluidos.includes(key)) continue;

      const value = sample[key];

      if (isString(value) && isString(search)) {
        orConditions.push({ [key]: { $regex: new RegExp(search, 'i') } });
      } else if (isNumber(value) && isNumber(search)) {
        orConditions.push({ [key]: search });
      } else if (isDate(value) && isDate(search)) {
        orConditions.push({ [key]: this.buildDateFilter(search) });
      } else if (isBoolean(value) && isBoolean(search)) {
        orConditions.push({ [key]: search });
      }
    }

    const where =
      orConditions.length > 0
        ? { $and: [{ activo: true }, { $or: orConditions }] }
        : { activo: true };

    return await paginateMongo<any>(repo, options, { where: where as any });
  }

  async findBy(
    name: string,
    claves: string[],
    valores: any[],
    order?: any,
    take?: number,
  ): Promise<any[]> {
    const repo = this.getRepository(name);
    const wheres: any = { activo: true };

    for (let i = 0; i < claves.length; i++) {
      const clave = claves[i];
      const valor = valores[i];

      if (isNumber(valor)) {
        wheres[clave] = valor;
      } else if (isDate(valor)) {
        wheres[clave] = this.buildDateFilter(valor);
      } else if (isBoolean(valor)) {
        wheres[clave] = valor;
      } else if (isString(valor)) {
        wheres[clave] = { $regex: new RegExp(valor, 'i') };
      } else {
        wheres[clave] = valor;
      }
    }

    return await repo.find({
      where: wheres as any,
      order,
      take,
    });
  }

  async findOneBy(
    name: string,
    claves: string[],
    valores: any[],
    order?: any,
  ): Promise<any> {
    const repo = this.getRepository(name);
    const wheres: any = { activo: true };

    for (let i = 0; i < claves.length; i++) {
      const clave = claves[i];
      const valor = valores[i];

      if (isNumber(valor)) {
        wheres[clave] = valor;
      } else if (isDate(valor)) {
        wheres[clave] = this.buildDateFilter(valor);
      } else if (isBoolean(valor)) {
        wheres[clave] = valor;
      } else if (isString(valor)) {
        wheres[clave] = { $regex: new RegExp(valor, 'i') };
      } else {
        wheres[clave] = valor;
      }
    }

    return await repo.findOne({
      where: wheres as any,
      order,
    });
  }
}
