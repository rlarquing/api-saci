import { Injectable } from '@nestjs/common';
import { CreateMenuDto, ReadMenuDto, UpdateMenuDto } from '../../shared/dto';
import { MenuEntity } from '../../persistence/entity';
import { MenuRepository } from '../../persistence/repository';

@Injectable()
export class MenuMapper {
  constructor(private menuRepository: MenuRepository) {}

  async dtoToEntity(createMenuDto: CreateMenuDto): Promise<MenuEntity> {
    const menu = new MenuEntity({
      label: createMenuDto.label,
      icon: createMenuDto.icon,
      to: createMenuDto.to,
      tipo: createMenuDto.tipo,
      nomenclador: createMenuDto.nomenclador,
    });

    // Si viene el ID del padre, buscar y asignar
    if (createMenuDto.menu) {
      menu.padre = await this.menuRepository.findById(createMenuDto.menu);
      if (menu.padre) {
        menu.menuId = menu.padre.getIdString();
      }
    }

    return menu;
  }

  async dtoToUpdateEntity(
    updateMenuDto: UpdateMenuDto,
    updateMenuEntity: MenuEntity,
  ): Promise<MenuEntity> {
    updateMenuEntity.label = updateMenuDto.label;
    updateMenuEntity.icon = updateMenuDto.icon;
    updateMenuEntity.tipo = updateMenuDto.tipo;
    updateMenuEntity.to = updateMenuDto.to;
    if (updateMenuDto.nomenclador) {
      updateMenuEntity.nomenclador = updateMenuDto.nomenclador;
    }

    // Si viene el ID del padre, buscar y asignar
    if (updateMenuDto.menu) {
      updateMenuEntity.padre = await this.menuRepository.findById(
        updateMenuDto.menu,
      );
      if (updateMenuEntity.padre) {
        updateMenuEntity.menuId = updateMenuEntity.padre.getIdString();
      }
    }

    return updateMenuEntity;
  }

  async entityToDto(menuEntity: MenuEntity): Promise<ReadMenuDto> {
    const menu: MenuEntity = await this.menuRepository.findById(
      menuEntity.id.toHexString(),
    );
    const dtoToString: string = menuEntity.toString();
    const menuPadre = menu.padre?.toString();

    // Obtener menús hijos usando el menuId
    const menus: ReadMenuDto[] = [];
    if (menuEntity.id) {
      const hijos = await this.menuRepository.findBy(
        ['menuId'],
        [menuEntity.getIdString()],
      );
      for (const hijo of hijos) {
        menus.push(await this.entityToDto(hijo));
      }
    }
    const padre: any = {
      value: menu.padre?.id.toHexString(),
      label: menu.padre?.label,
      icon: menu.padre?.icon,
    };
    const nomenclador = menuEntity.nomenclador ? menuEntity.nomenclador : '';
    return new ReadMenuDto(
      dtoToString,
      menuEntity.getIdString(),
      menuEntity.label,
      menuEntity.icon,
      menuEntity.to,
      menuEntity.tipo,
      menuPadre,
      nomenclador,
      menus,
      padre,
    );
  }
}
