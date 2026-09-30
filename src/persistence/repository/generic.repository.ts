import {
  MongoRepository,
  FindManyOptions,
  FindOneOptions,
  DeleteResult,
} from 'typeorm';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  Pagination,
  PaginationOptions,
  paginateMongo,
} from '../../shared/pagination';

import { IRepository } from '../../shared/interface';
import {
  isBoolean,
  isDate,
  isEmpty,
  isNumber,
  isString,
} from 'class-validator';
import { ObjectId } from 'mongodb';

const isValidObjectId = (id: string): boolean => {
  if (!id || typeof id !== 'string') return false;
  return /^[a-fA-F0-9]{24}$/.test(id);
};

@Injectable()
export abstract class GenericRepository<ENTITY> implements IRepository<ENTITY> {
  protected constructor(protected repository: MongoRepository<ENTITY>) {}

  // ============ UTILIDADES MONGODB ============

  /**
   * Obtiene el nombre de la tabla de la entidad
   */
  getTabla(): string {
    return this.repository.metadata?.name || '';
  }

  /**
   * Convierte string ID a ObjectId de MongoDB
   */
  protected toObjectId(id: string): ObjectId {
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

  /**
   * Verifica si un campo es una relación (embedded document)
   */
  protected isEmbeddedRelation(_field: string): boolean {
    // En MongoDB, las relaciones son embebidas o referencias manuales
    // Por defecto, asumimos que no hay relaciones SQL-style
    return false;
  }

  // ============ MÉTODOS CRUD ============

  async findAll(
    options: PaginationOptions,
    sinPaginacion?: boolean,
  ): Promise<Pagination<ENTITY> | ENTITY[]> {
    const findOptions: FindManyOptions<ENTITY> = {
      where: { activo: true } as any,
    };

    if (sinPaginacion === true) {
      return await this.repository.find(findOptions);
    } else {
      return await paginateMongo<ENTITY>(this.repository, options, findOptions);
    }
  }

  async findById(id: string): Promise<ENTITY> {
    const objectId = this.toObjectId(id);
    const result = await this.repository.findOne({
      where: { _id: objectId, activo: true } as any,
    });

    if (!result) {
      throw new NotFoundException(`Entidad con ID ${id} no encontrada`);
    }

    return result;
  }

  async findOne(id: string): Promise<ENTITY> {
    const objectId = this.toObjectId(id);
    return await this.repository.findOne({
      where: { _id: objectId } as any,
    });
  }

  async findByIds(ids: string[]): Promise<ENTITY[]> {
    const objectIds: ObjectId[] = ids.map((id: string) => this.toObjectId(id));
    return await this.repository.find({
      where: {
        _id: { $in: objectIds },
        activo: true,
      } as any,
    });
  }

  async createSelect(): Promise<ENTITY[]> {
    return await this.repository.find({
      where: { activo: true } as any,
    });
  }

  async create(newObj: ENTITY): Promise<ENTITY> {
    // MongoDB usa insertOne o save
    return await this.repository.save(newObj);
  }

  async update(updateObj: ENTITY): Promise<ENTITY> {
    // MongoDB usa updateOne o save
    return await this.repository.save(updateObj);
  }

  async delete(id: string): Promise<ENTITY> {
    const objectId = this.toObjectId(id);

    const obj = await this.repository.findOne({
      where: { _id: objectId, activo: true } as any,
    });

    if (!obj) {
      throw new NotFoundException('No existe');
    }

    (obj as any).activo = false;
    return await this.repository.save(obj);
  }

  async remove(ids: string[]): Promise<DeleteResult> {
    return await this.repository.delete(ids);
  }

  async count(): Promise<number> {
    return await this.repository.count({
      where: { activo: true } as any,
    });
  }

  // ============ FILTROS AVANZADOS ============

  async filter(
    options: PaginationOptions,
    claves: string[],
    valores: any[],
  ): Promise<Pagination<ENTITY>> {
    const wheres: any = { activo: true };

    for (let i = 0; i < claves.length; i++) {
      const clave = claves[i];
      const valor = valores[i];

      // MongoDB soporta notación punto para campos anidados
      if (isNumber(valor)) {
        wheres[clave] = valor;
      } else if (isDate(valor)) {
        // Crear copias independientes para no mutar el Date original
        const start = new Date(valor);
        start.setHours(0, 0, 0, 0);
        const end = new Date(valor);
        end.setHours(23, 59, 59, 999);
        wheres[clave] = { $gte: start, $lte: end };
      } else if (isBoolean(valor)) {
        wheres[clave] = valor;
      } else if (isString(valor)) {
        // Sanitizar caracteres especiales de regex
        const escaped = this.escapeRegexSpecialChars(valor);
        wheres[clave] = { $regex: new RegExp(escaped, 'i') };
      } else {
        wheres[clave] = valor;
      }
    }

    const findOptions: FindManyOptions<ENTITY> = {
      where: wheres as any,
    };

    return await paginateMongo<ENTITY>(this.repository, options, findOptions);
  }

  async search(
    options: PaginationOptions,
    search: any,
  ): Promise<Pagination<ENTITY>> {
    if (isEmpty(search)) {
      return await paginateMongo<ENTITY>(this.repository, options, {
        where: { activo: true } as any,
      });
    }

    // MongoDB: búsqueda en múltiples campos con $or
    const sample = await this.repository.findOne({ where: {} as any });

    if (!sample) {
      return await paginateMongo<ENTITY>(this.repository, options, {
        where: { activo: true } as any,
      });
    }

    const orConditions: any[] = [];
    const camposExcluidos = ['_id', 'activo', 'createdAt', 'updatedAt', 'id'];

    // Sanitizar búsqueda para regex
    const searchEscaped = isString(search)
      ? this.escapeRegexSpecialChars(search)
      : search;

    for (const key of Object.keys(sample)) {
      if (camposExcluidos.includes(key)) continue;

      const value = (sample as any)[key];

      if (isString(value) && isString(search)) {
        orConditions.push({
          [key]: { $regex: new RegExp(searchEscaped, 'i') },
        });
      } else if (isNumber(value) && isNumber(search) && value === search) {
        orConditions.push({ [key]: search });
      } else if (isBoolean(value) && isBoolean(search) && value === search) {
        orConditions.push({ [key]: search });
      }
    }

    const where =
      orConditions.length > 0
        ? { $and: [{ activo: true }, { $or: orConditions }] }
        : { activo: true };

    return await paginateMongo<ENTITY>(this.repository, options, {
      where: where as any,
    });
  }

  /**
   * Escapa caracteres especiales de regex para búsquedas seguras
   */
  private escapeRegexSpecialChars(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async findBy(
    claves: string[],
    valores: any[],
    order?: any,
    take?: number,
    soloActivos: boolean = true,
  ): Promise<ENTITY[]> {
    const wheres: any = soloActivos ? { activo: true } : {};

    for (let i = 0; i < claves.length; i++) {
      const clave = claves[i];
      const valor = valores[i];

      // Notación punto para campos anidados (MongoDB nativo)
      if (isNumber(valor)) {
        wheres[clave] = valor;
      } else if (isDate(valor)) {
        // Crear copias independientes para no mutar el Date original
        const start = new Date(valor);
        start.setHours(0, 0, 0, 0);
        const end = new Date(valor);
        end.setHours(23, 59, 59, 999);
        wheres[clave] = { $gte: start, $lte: end };
      } else if (isBoolean(valor)) {
        wheres[clave] = valor;
      } else if (isString(valor)) {
        // Sanitizar caracteres especiales de regex antes de crear la expresión
        const escaped = this.escapeRegexSpecialChars(valor);
        wheres[clave] = { $regex: new RegExp(escaped, 'i') };
      } else {
        wheres[clave] = valor;
      }
    }

    const findOptions: FindManyOptions<ENTITY> = {
      where: wheres as any,
      order,
      take,
    };

    return await this.repository.find(findOptions);
  }

  async findOneBy(
    claves: string[],
    valores: any[],
    order?: any,
    soloActivos: boolean = true,
  ): Promise<ENTITY> {
    const wheres: any = soloActivos ? { activo: true } : {};

    for (let i = 0; i < claves.length; i++) {
      const clave = claves[i];
      const valor = valores[i];

      if (isNumber(valor)) {
        wheres[clave] = valor;
      } else if (isDate(valor)) {
        // Crear copias independientes para no mutar el Date original
        const start = new Date(valor);
        start.setHours(0, 0, 0, 0);
        const end = new Date(valor);
        end.setHours(23, 59, 59, 999);
        wheres[clave] = { $gte: start, $lte: end };
      } else if (isBoolean(valor)) {
        wheres[clave] = valor;
      } else if (isString(valor)) {
        // Sanitizar caracteres especiales de regex para búsquedas seguras
        const escaped = this.escapeRegexSpecialChars(valor);
        wheres[clave] = { $regex: new RegExp(escaped, 'i') };
      } else {
        wheres[clave] = valor;
      }
    }

    const findOptions: FindOneOptions<ENTITY> = {
      where: wheres as any,
      order,
    };

    return await this.repository.findOne(findOptions);
  }

  async createSelectFilter(
    claves: string[],
    valores: any[],
  ): Promise<ENTITY[]> {
    const wheres: any = { activo: true };

    for (let i = 0; i < claves.length; i++) {
      const clave = claves[i];
      const valor = valores[i];

      if (isNumber(valor)) {
        wheres[clave] = valor;
      } else if (isDate(valor)) {
        // Crear copias independientes para no mutar el Date original
        const start = new Date(valor);
        start.setHours(0, 0, 0, 0);
        const end = new Date(valor);
        end.setHours(23, 59, 59, 999);
        wheres[clave] = { $gte: start, $lte: end };
      } else if (isBoolean(valor)) {
        wheres[clave] = valor;
      } else if (isString(valor)) {
        // Sanitizar caracteres especiales de regex
        const escaped = this.escapeRegexSpecialChars(valor);
        wheres[clave] = { $regex: new RegExp(escaped, 'i') };
      } else {
        wheres[clave] = valor;
      }
    }

    return await this.repository.find({
      where: wheres as any,
    });
  }
}
