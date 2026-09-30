import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { MenuEntity } from '../entity';
import { GenericRepository } from './index';
import { IRepository } from '../../shared/interface';

const isValidObjectId = (id: string): boolean => {
  if (!id || typeof id !== 'string') return false;
  return /^[a-fA-F0-9]{24}$/.test(id);
};

@Injectable()
export class MenuRepository
  extends GenericRepository<MenuEntity>
  implements IRepository<MenuEntity>
{
  constructor(
    @InjectRepository(MenuEntity)
    private menuRepository: MongoRepository<MenuEntity>,
  ) {
    super(menuRepository);
  }
  async findById(id: string): Promise<MenuEntity> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(
        'El ID debe ser un ObjectId válido de MongoDB (24 caracteres hex)',
      );
    }
    const objectId = new ObjectId(id);
    const result: MenuEntity = (await this.menuRepository.findOne({
      where: { _id: objectId } as any,
    })) as MenuEntity;

    if (!result) {
      throw new NotFoundException(`Entidad con ID ${id} no encontrada`);
    }
    if (result.menuId) {
      result.padre = (await this.menuRepository.findOne({
        where: { _id: new ObjectId(result.menuId) } as any,
      })) as MenuEntity;
    } else {
      result.menus = await this.menuRepository.find({
        where: { menuId: result.menuId } as any,
      });
    }
    return result;
  }
  async existeNomenclador(nomenclador: string): Promise<boolean> {
    const wheres = {
      activo: true,
      nomenclador: nomenclador,
    } as FindOptionsWhere<MenuEntity>;
    const menu: MenuEntity = await this.menuRepository.findOneBy(wheres);
    return menu !== undefined && menu !== null;
  }
}
