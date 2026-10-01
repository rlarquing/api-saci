import { Injectable } from '@nestjs/common';
import { FuncionMapper, MenuMapper } from '../mapper';
import {
  EndPointEntity,
  FuncionEntity,
  MenuEntity,
  RolEntity,
  UserEntity,
} from '../../persistence/entity';
import {
  EndPointRepository,
  FuncionRepository,
  MenuRepository,
  RolRepository,
} from '../../persistence/repository';
import { GenericService } from './generic.service';
import {
  CreateFuncionDto,
  CreateMenuDto,
  ReadMenuDto,
  ResponseDto,
} from '../../shared/dto';
import { ConfigService } from '@nestjs/config';
import { RolType, TipoMenuTypeEnum } from '../../shared/enum';
import { aInicialMinuscula, formatearNombre } from '../../../lib';
import { LogHistoryService } from './log-history.service';
import { SocketService } from './socket.service';
import { MenuEventPayload, MenuEventType } from '../../shared/dto';

@Injectable()
export class MenuService extends GenericService<MenuEntity> {
  constructor(
    protected configService: ConfigService,
    protected menuRepository: MenuRepository,
    protected endPointRepository: EndPointRepository,
    protected funcionRepository: FuncionRepository,
    protected rolRepository: RolRepository,
    protected menuMapper: MenuMapper,
    protected funcionMapper: FuncionMapper,
    protected logHistoryService: LogHistoryService,
    private readonly socketService: SocketService,
  ) {
    super(configService, menuRepository, menuMapper, logHistoryService, true);
  }

  private emitMenuEvent(
    action: MenuEventType,
    menuId: string,
    userId: string,
  ): void {
    const event: MenuEventPayload = {
      action,
      menuId,
      userId,
      timestamp: new Date().toISOString(),
    };
    this.socketService.emitMenuChange(event);
  }

  async create(
    user: UserEntity,
    createDto: any,
    ip: string,
  ): Promise<ResponseDto> {
    const result = await super.create(user, createDto, ip);
    if (result.successStatus && result.id) {
      this.emitMenuEvent(
        MenuEventType.CREATED,
        result.id.toString(),
        user.getIdString(),
      );
    }
    return result;
  }

  async update(
    user: UserEntity,
    id: string,
    updateDto: any,
    ip: string,
  ): Promise<ResponseDto> {
    const result = await super.update(user, id, updateDto, ip);
    if (result.successStatus) {
      this.emitMenuEvent(MenuEventType.UPDATED, id, user.getIdString());
    }
    return result;
  }

  async deleteMultiple(
    user: UserEntity,
    ids: string[],
    ip: string,
  ): Promise<ResponseDto> {
    const result = await super.deleteMultiple(user, ids, ip);
    if (result.successStatus) {
      for (const id of ids) {
        this.emitMenuEvent(MenuEventType.DELETED, id, user.getIdString());
      }
    }
    return result;
  }
  async findByTipo(tipo: string): Promise<ReadMenuDto[]> {
    const menus: MenuEntity[] = await this.menuRepository.findBy(
      ['tipo'],
      [tipo],
    );
    const readMenusDto: ReadMenuDto[] = [];
    for (const menu of menus) {
      readMenusDto.push(await this.menuMapper.entityToDto(menu));
    }
    return readMenusDto;
  }
  async crearMenuNomenclador(nomencladores: string[]): Promise<void> {
    const menu: MenuEntity = new MenuEntity({
      label: 'Nomencladores',
      icon: 'layout_list',
      to: '/admin/nomenclators',
      tipo: TipoMenuTypeEnum.ADMINISTRACION,
    });
    const existeMenu: MenuEntity[] = await this.menuRepository.findBy(
      ['label'],
      [menu.label],
    );
    let menuPadre: MenuEntity;
    if (existeMenu.length > 0) {
      menuPadre = existeMenu[0];
    } else {
      menuPadre = await this.menuRepository.create(menu);
    }
    const endPoints: EndPointEntity[] =
      await this.endPointRepository.findByController('nomenclador');

    // Extraer los IDs de los endpoints como strings
    const endPointIds: string[] = endPoints
      .map((ep) => ep.id?.toHexString())
      .filter((id) => id);

    for (const element of nomencladores) {
      const existe: boolean =
        await this.menuRepository.existeNomenclador(element);
      if (!existe) {
        const nomMenu: MenuEntity = new MenuEntity({
          label: formatearNombre(element, ' '),
          icon: 'list',
          to: `/admin/nomenclators/${element}`,
          tipo: TipoMenuTypeEnum.ADMINISTRACION,
          nomenclador: element,
        });
        nomMenu.menuId = menuPadre.getIdString();
        const newMenu: MenuEntity = await this.menuRepository.create(nomMenu);

        // Usar el mapper como en crearMenuAdministracion para asegurar que se guarden los endPointIds
        const createFuncionDto: CreateFuncionDto = {
          nombre: `Gestión del nomenclador ${formatearNombre(element, ' ')}`,
          descripcion: `Gestión del nomenclador ${formatearNombre(element, ' ')}`,
          endPoints: endPointIds,
          menu: newMenu.getIdString(),
        };
        const funcion: FuncionEntity =
          await this.funcionMapper.dtoToEntity(createFuncionDto);
        const newFuncion: FuncionEntity =
          await this.funcionRepository.create(funcion);
        const rol: RolEntity = (await this.rolRepository.findByNombre(
          RolType.ADMINISTRADOR,
        )) as RolEntity;
        // Agregar el ID de la función al rol
        if (!rol.funciones) {
          rol.funciones = [];
        }
        rol.funciones.push(newFuncion);
        await this.rolRepository.update(rol);
      }
    }
  }
  async crearMenuAdministracion(): Promise<void> {
    const controllers: string[] = [
      'user',
      'rol',
      'logHistory',
      'funcion',
      'menu',
    ];
    const menuAdministracion: CreateMenuDto = {
      label: 'Administración',
      icon: 'settings',
      to: '/admin',
      tipo: TipoMenuTypeEnum.ADMINISTRACION,
    };
    const menu: MenuEntity =
      await this.menuMapper.dtoToEntity(menuAdministracion);
    const existe = await this.menuRepository.findOneBy(
      ['label'],
      ['Administración'],
    );
    if (!existe) {
      const administracion = await this.menuRepository.create(menu);
      const hijos: CreateMenuDto[] = [
        {
          label: 'Usuarios',
          icon: 'users',
          to: '/admin/users',
          tipo: TipoMenuTypeEnum.ADMINISTRACION,
        },
        {
          label: 'Roles',
          icon: 'user-cog',
          to: '/admin/roles',
          tipo: TipoMenuTypeEnum.ADMINISTRACION,
        },
        {
          label: 'Trazas',
          icon: 'history',
          to: '/admin/logs-history',
          tipo: TipoMenuTypeEnum.ADMINISTRACION,
        },
        {
          label: 'Funciones',
          icon: 'list-checks',
          to: '/admin/functions',
          tipo: TipoMenuTypeEnum.ADMINISTRACION,
        },
        {
          label: 'Menus',
          icon: 'menu',
          to: '/admin/menus',
          tipo: TipoMenuTypeEnum.ADMINISTRACION,
        },
      ];
      let pos = 0;
      for (const hijo of hijos) {
        const menuEntity = await this.menuMapper.dtoToEntity(hijo);
        // Asignar el menú padre
        menuEntity.menuId = administracion.getIdString();
        const menuCreado = await this.menuRepository.create(menuEntity);
        const endPoints: EndPointEntity[] =
          await this.endPointRepository.findByController(controllers[pos]);

        // Extraer los IDs de los endpoints como strings
        const endPointIds: string[] = endPoints
          .map((ep) => ep.id.toHexString())
          .filter((id) => id);

        const createFuncionDto: CreateFuncionDto = {
          nombre: `Gestión de ${aInicialMinuscula(menuCreado.label)}`,
          descripcion: `Gestión de ${aInicialMinuscula(menuCreado.label)}`,
          endPoints: endPointIds,
          menu: menuCreado.getIdString(),
        };
        const funcion: FuncionEntity =
          await this.funcionMapper.dtoToEntity(createFuncionDto);
        const newFuncion: FuncionEntity =
          await this.funcionRepository.create(funcion);
        const rol: RolEntity = (await this.rolRepository.findByNombre(
          RolType.ADMINISTRADOR,
        )) as RolEntity;
        // Agregar el ID de la función al rol
        if (!rol.funciones) {
          rol.funciones = [];
        }
        rol.funciones.push(newFuncion);
        await this.rolRepository.update(rol);
        pos = pos + 1;
      }
    } else {
      // Obtener hijos del menú existente usando menuId
      const hijos = await this.menuRepository.findBy(
        ['menuId'],
        [existe.getIdString()],
      );
      let pos = 0;
      for (const menu of hijos) {
        const funcion = await this.funcionRepository.findByMenu(menu);
        const endPoints = await this.endPointRepository.findByController(
          controllers[pos],
        );

        if (funcion) {
          // Extraer los IDs de los endpoints como strings
          funcion.endPointIds = endPoints
            .map((ep) => ep.id.toHexString())
            .filter((id) => id);
          funcion.endPoints = endPoints;
          await this.funcionRepository.update(funcion);
          pos = pos + 1;
        }
      }
    }
  }

  /**
   * SACI: menús del dominio de inventario + sus funciones (endpoints por
   * controlador) asignadas a ADMINISTRADOR, JEFE_DE_ALMACEN y OPERARIO.
   */
  async crearMenuInventario(): Promise<void> {
    const secciones: Array<{
      label: string;
      icon: string;
      to: string;
      controller: string;
      roles: RolType[];
    }> = [
      {
        label: 'Dashboard',
        icon: 'dashboard',
        to: '/admin/bi',
        controller: 'bi',
        roles: [RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN],
      },
      {
        label: 'Productos',
        icon: 'inventory_2',
        to: '/admin/productos',
        controller: 'producto',
        roles: [RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN],
      },
      {
        label: 'Movimientos',
        icon: 'swap_horiz',
        to: '/admin/movimientos',
        controller: 'movimiento-inventario',
        roles: [
          RolType.ADMINISTRADOR,
          RolType.JEFE_DE_ALMACEN,
          RolType.OPERARIO,
        ],
      },
      {
        label: 'Stock',
        icon: 'assessment',
        to: '/admin/stock',
        controller: 'movimiento-inventario',
        roles: [
          RolType.ADMINISTRADOR,
          RolType.JEFE_DE_ALMACEN,
          RolType.OPERARIO,
        ],
      },
      {
        label: 'Niveles',
        icon: 'tune',
        to: '/admin/niveles',
        controller: 'nivel-stock',
        roles: [RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN],
      },
      {
        label: 'Etiquetas QR',
        icon: 'qr_code_2',
        to: '/admin/qr',
        controller: 'qr',
        roles: [RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN],
      },
      {
        label: 'Registro diario',
        icon: 'event_note',
        to: '/admin/registro-diarios',
        controller: 'registro-diario',
        roles: [RolType.ADMINISTRADOR, RolType.JEFE_DE_ALMACEN],
      },
      {
        label: 'Conteos',
        icon: 'clipboard-check',
        to: '/admin/conteos',
        controller: 'conteo-inventario',
        roles: [
          RolType.ADMINISTRADOR,
          RolType.JEFE_DE_ALMACEN,
          RolType.OPERARIO,
        ],
      },
    ];

    for (const seccion of secciones) {
      const existeMenu: MenuEntity[] = await this.menuRepository.findBy(
        ['to'],
        [seccion.to],
      );
      let menuPadre: MenuEntity;
      if (existeMenu.length > 0) {
        menuPadre = existeMenu[0];
      } else {
        const nuevoMenu = new MenuEntity({
          label: seccion.label,
          icon: seccion.icon,
          to: seccion.to,
          tipo: TipoMenuTypeEnum.ADMINISTRACION,
        });
        menuPadre = await this.menuRepository.create(nuevoMenu);
      }

      const endPoints: EndPointEntity[] =
        await this.endPointRepository.findByController(seccion.controller);
      const endPointIds: string[] = endPoints
        .map((ep) => ep.id?.toHexString())
        .filter((id) => id);

      const nombreFuncion = `Gestión de ${seccion.label}`;
      const existeFuncion: FuncionEntity[] = await this.funcionRepository.findBy(
        ['nombre'],
        [nombreFuncion],
      );
      let funcion: FuncionEntity;
      if (existeFuncion.length > 0) {
        funcion = existeFuncion[0];
      } else {
        const createFuncionDto: CreateFuncionDto = {
          nombre: nombreFuncion,
          descripcion: `Acceso a ${seccion.label}`,
          endPoints: endPointIds,
          menu: menuPadre.getIdString(),
        };
        funcion = await this.funcionMapper.dtoToEntity(createFuncionDto);
        funcion = await this.funcionRepository.create(funcion);
      }

      for (const rolNombre of seccion.roles) {
        const rol: RolEntity = (await this.rolRepository.findByNombre(
          rolNombre,
        )) as RolEntity;
        if (!rol) continue;
        rol.funciones = rol.funciones || [];
        if (!rol.funciones.some((f) => f.getIdString() === funcion.getIdString())) {
          rol.funciones.push(funcion);
          await this.rolRepository.update(rol);
        }
      }
    }
  }
}
