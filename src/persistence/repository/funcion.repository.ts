import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FuncionEntity, MenuEntity } from '../entity';
import { IRepository } from '../../shared/interface';
import { GenericRepository } from './generic.repository';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { EndPointRepository } from './end-point.repository';
import { MenuRepository } from './menu.repository';

const isValidObjectId = (id: string): boolean => {
  if (!id || typeof id !== 'string') return false;
  return /^[a-fA-F0-9]{24}$/.test(id);
};

@Injectable()
export class FuncionRepository
  extends GenericRepository<FuncionEntity>
  implements IRepository<FuncionEntity>
{
  constructor(
    @InjectRepository(FuncionEntity)
    private funcionRepository: MongoRepository<FuncionEntity>,
    private menuRepository: MenuRepository,
    private endPointRepository: EndPointRepository,
  ) {
    super(funcionRepository);
  }

  async findById(id: string): Promise<FuncionEntity> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(
        'El ID debe ser un ObjectId válido de MongoDB (24 caracteres hex)',
      );
    }
    const objectId = new ObjectId(id);
    const result: FuncionEntity = await this.funcionRepository.findOne({
      where: { _id: objectId } as any,
    });

    if (!result) {
      throw new NotFoundException(`Entidad con ID ${id} no encontrada`);
    }
    if (result.menuId) {
      result.menu = await this.menuRepository.findById(result.menuId);
    }

    if (result.endPointIds?.length > 0) {
      result.endPoints = await this.endPointRepository.findByIds(
        result.endPointIds,
      );
    }
    return result;
  }

  /**
   * Busca una función por menú asociado usando el campo menuId (MongoDB)
   * @param menu - Entidad del menú a buscar
   * @returns La función asociada al menú o undefined
   */
  async findByMenu(menu: MenuEntity): Promise<FuncionEntity | undefined> {
    const menuId = menu.getIdString();
    if (!menuId) {
      return undefined;
    }

    // En MongoDB, consultamos directamente por el campo menuId
    const result: FuncionEntity | null = await this.funcionRepository.findOne({
      where: {
        activo: true,
        menuId: menuId,
      } as any,
    });

    if (!result) {
      return undefined;
    }

    if (result.menuId) {
      result.menu = await this.menuRepository.findById(result.menuId);
    }

    if (result.endPointIds?.length > 0) {
      result.endPoints = await this.endPointRepository.findByIds(
        result.endPointIds,
      );
    }
    return result;
  }
}
