import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { EndPointEntity } from '../entity';

const isValidObjectId = (id: string): boolean => {
  if (!id || typeof id !== 'string') return false;
  return /^[a-fA-F0-9]{24}$/.test(id);
};

@Injectable()
export class EndPointRepository {
  constructor(
    @InjectRepository(EndPointEntity)
    private endPointRepository: MongoRepository<EndPointEntity>,
  ) {}

  async findAll(): Promise<EndPointEntity[]> {
    return await this.endPointRepository.find();
  }

  async findById(id: string): Promise<EndPointEntity> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(
        'El ID debe ser un ObjectId válido de MongoDB (24 caracteres hex)',
      );
    }
    const objectId = new ObjectId(id);
    const result: EndPointEntity = await this.endPointRepository.findOne({
      where: { _id: objectId } as any,
    });

    if (!result) {
      throw new NotFoundException(`Entidad con ID ${id} no encontrada`);
    }
    return result;
  }

  async findByNombre(nombre: string): Promise<EndPointEntity> {
    const result: EndPointEntity = await this.endPointRepository.findOneBy({
      nombre,
    } as any);
    if (!result) {
      throw new NotFoundException(`Entidad con nombre ${nombre} no encontrada`);
    }
    return result;
  }

  async findByController(controller: string): Promise<EndPointEntity[]> {
    const result: EndPointEntity[] = await this.endPointRepository.findBy({
      controller,
    } as any);
    if (!result) {
      throw new NotFoundException(
        `Entidad con controller ${controller} no encontrada`,
      );
    }

    return result;
  }

  async findByIds(ids: string[]): Promise<EndPointEntity[]> {
    const invalidIds = ids.filter((id) => !isValidObjectId(id));
    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `Los siguientes IDs no son ObjectIds válidos: ${invalidIds.join(', ')}`,
      );
    }
    const objectIds = ids.map((id) => new ObjectId(id));
    return await this.endPointRepository.findBy({
      _id: { $in: objectIds },
    } as any);
  }

  async create(endPointEntity: EndPointEntity): Promise<EndPointEntity> {
    return await this.endPointRepository.save(endPointEntity);
  }

  async update(endPointEntity: EndPointEntity): Promise<void> {
    const endPoint: EndPointEntity = await this.findByNombre(
      endPointEntity.nombre,
    );
    if (endPoint) {
      endPointEntity.id = endPoint.id;
      await this.endPointRepository.save(endPointEntity);
    }
  }

  async remove(nombre: string): Promise<DeleteResult> {
    const endPoint: EndPointEntity = await this.findByNombre(nombre);
    return await this.endPointRepository.delete(new ObjectId(endPoint.id));
  }
}
