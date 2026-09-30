import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { RolEntity } from '../entity';
import { IRepository } from '../../shared/interface';
import { GenericRepository } from './generic.repository';
import { FuncionRepository } from './funcion.repository';
import { UserRepository } from './user.repository';

@Injectable()
export class RolRepository
  extends GenericRepository<RolEntity>
  implements IRepository<RolEntity>
{
  constructor(
    @InjectRepository(RolEntity)
    private rolRepository: MongoRepository<RolEntity>,
    private userRepository: UserRepository,
    private funcionRepository: FuncionRepository,
  ) {
    super(rolRepository);
  }
  async findById(id: string): Promise<RolEntity> {
    const objectId = this.toObjectId(id);
    const result: RolEntity = await this.repository.findOne({
      where: { _id: objectId, activo: true } as any,
    });

    if (!result) {
      throw new NotFoundException(`Entidad con ID ${id} no encontrada`);
    }
    if (result.userIds?.length > 0) {
      result.users = await this.userRepository.findByIds(result.userIds);
    }
    if (result.funcionIds?.length > 0) {
      result.funciones = await this.funcionRepository.findByIds(
        result.funcionIds,
      );
    }
    return result;
  }
  async findByNombre(nombre: string): Promise<RolEntity | null> {
    const result: RolEntity = await this.rolRepository.findOne({
      where: { nombre, activo: true },
    });
    if (!result) {
      return null;
    }
    if (result.userIds?.length > 0) {
      result.users = await this.userRepository.findByIds(result.userIds);
    }
    if (result.funcionIds?.length > 0) {
      result.funciones = await this.funcionRepository.findByIds(
        result.funcionIds,
      );
    }
    return result;
  }
}
