import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserMapper } from '../mapper';
import { GenericNomencladorRepository } from '../../persistence/repository';
import { LogHistoryService } from './log-history.service';
import { SyncRelationService } from './sync-relation.service';
import { genSalt, hash } from 'bcryptjs';
import {
  FuncionRepository,
  RolRepository,
  UserRepository,
} from '../../persistence/repository';
import {
  BuscarDto,
  ChangePasswordDto,
  CreateUserDto,
  FiltroGenericoDto,
  LogHistoryDto,
  ReadUserDto,
  ResponseDto,
  SelectDto,
  UpdateUserDto,
} from '../../shared/dto';
import { UserEntity } from '../../persistence/entity';
import { HISTORY_ACTION } from '../../persistence/entity/log-history.entity';
import { PaginationOptions, Pagination } from '../../shared/pagination';
import { RolType, NomencladorTypeEnum } from '../../shared/enum';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../app.keys';

@Injectable()
export class UserService {
  private readonly isProductionEnv: boolean;
  constructor(
    private configService: ConfigService,
    private userRepository: UserRepository,
    private rolRepository: RolRepository,
    private funcionRepository: FuncionRepository,
    private logHistoryService: LogHistoryService,
    private userMapper: UserMapper,
    private syncRelationService: SyncRelationService,
    private genericNomencladorRepository: GenericNomencladorRepository,
  ) {
    this.isProductionEnv =
      this.configService.get(AppConfig.NODE_ENV) === 'production';
  }

  /**
   * Crea el usuario administrador por defecto si no existe
   * Se llama al iniciar la aplicación en modo desarrollo
   */
  async crearUsuarioAdmin(): Promise<void> {
    const usuarioAdmin = 'admin';

    // Verificar si ya existe el usuario admin
    const existeAdmin = await this.userRepository.existe(usuarioAdmin);
    if (existeAdmin) {
      return;
    }

    // Obtener el rol ADMINISTRADOR
    const rolAdmin = await this.rolRepository.findByNombre(
      RolType.ADMINISTRADOR,
    );
    if (!rolAdmin) {
      throw new Error('El rol ADMINISTRADOR no existe');
    }

    // Obtener todas las funciones del rol admin
    const funciones = rolAdmin.funcionIds || [];

    // Crear el usuario admin
    const adminUser = new UserEntity({
      userName: usuarioAdmin,
      email: 'admin@sistema.cu',
    });
    adminUser.salt = await genSalt();
    adminUser.password = await UserService.hashPassword(
      'Admin1234*',
      adminUser.salt,
    );
    adminUser.roleIds = [rolAdmin.getIdString()];
    adminUser.funcionIds = funciones;

    const userEntity = await this.userRepository.create(adminUser);

    // Sincronizar relaciones bidireccionales
    await this.syncRelationService.agregarRolAUsuario(
      userEntity.getIdString(),
      rolAdmin.getIdString(),
    );
  }

  async findAll(options: PaginationOptions): Promise<Pagination<ReadUserDto>> {
    const users: Pagination<UserEntity> =
      await this.userRepository.findAll(options);
    const readUserDto: ReadUserDto[] = [];
    for (const user of users.items) {
      readUserDto.push(await this.userMapper.entityToDto(user));
    }
    return new Pagination(readUserDto, users.meta, users.links);
  }

  async findById(id: string): Promise<ReadUserDto> {
    if (!id) {
      throw new BadRequestException('El id no puede ser vacio');
    }
    const user: UserEntity = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('El usuario no se encuentra.');
    }
    return await this.userMapper.entityToDto(user);
  }

  async findByName(userName: string): Promise<ReadUserDto> {
    if (!userName) {
      throw new BadRequestException('El userName no puede ser vacio');
    }
    const user: UserEntity = await this.userRepository.findByName(userName);
    if (!user) {
      throw new NotFoundException('El usuario no se encuentra.');
    }
    return await this.userMapper.entityToDto(user);
  }

  /**
   * Indica si el usuario tiene el rol JEFE_DE_ALMACEN
   */
  private esJefe(user: UserEntity): boolean {
    return (
      user.roles?.some((rol) => rol.nombre === RolType.JEFE_DE_ALMACEN) ||
      false
    );
  }

  /**
   * Valida que un JEFE pueda gestionar al trabajador: debe ser rol OPERARIO
   * y pertenecer a al menos un almacen que el jefe administra.
   */
  private async validarJefeGestionaTrabajador(
    jefe: UserEntity,
    trabajador: UserEntity,
  ): Promise<void> {
    const rolUsuario = await this.rolRepository.findByNombre(RolType.OPERARIO);
    const esTrabajador =
      trabajador.roleIds?.includes(rolUsuario.getIdString()) ||
      trabajador.roles?.some((rol) => rol.nombre === RolType.OPERARIO);
    if (!esTrabajador) {
      throw new ForbiddenException(
        'El jefe de almacenes solo puede gestionar trabajadores con rol OPERARIO',
      );
    }
    const comparteAlmacen = (trabajador.almacenIds || []).some((p) =>
      jefe.almacenIds?.includes(p),
    );
    if (!comparteAlmacen) {
      throw new ForbiddenException(
        'El trabajador no pertenece a los almacenes que usted administra',
      );
    }
  }

  async create(
    user: UserEntity,
    createUserDto: CreateUserDto,
    ip: string,
  ): Promise<ResponseDto> {
    // JEFE_DE_ALMACEN: solo puede crear trabajadores (rol OPERARIO) para sus almacenes
    if (user.roles?.some((rol) => rol.nombre === RolType.JEFE_DE_ALMACEN)) {
      const rolUsuario = await this.rolRepository.findByNombre(RolType.OPERARIO);
      const rolesValidos =
        createUserDto.roles &&
        createUserDto.roles.length === 1 &&
        createUserDto.roles[0] === rolUsuario?.getIdString();
      if (!rolesValidos) {
        throw new ForbiddenException(
          'El jefe de almacenes solo puede crear trabajadores con rol OPERARIO',
        );
      }
      const almacenesAsignados = createUserDto.almacenes || [];
      const fueraDeAlcance = almacenesAsignados.some(
        (p) => !user.almacenIds?.includes(p),
      );
      if (almacenesAsignados.length === 0 || fueraDeAlcance) {
        throw new ForbiddenException(
          'Debe asignar el trabajador solo a almacenes que usted administra',
        );
      }
    }

    const result = new ResponseDto();
    try {
      const newUser = this.userMapper.dtoToEntity(createUserDto);
      const { password, roles, funciones } = createUserDto;
      newUser.salt = await genSalt();
      newUser.password = await UserService.hashPassword(password, newUser.salt);

      if (roles && roles.length > 0) {
        newUser.roles = await this.rolRepository.findByIds(roles);
        newUser.roleIds = roles;
      }
      if (funciones && funciones.length > 0) {
        newUser.funciones = await this.funcionRepository.findByIds(funciones);
        newUser.funcionIds = funciones;
      }

      let userEntity: UserEntity = null;
      const existe: UserEntity = await this.userRepository.existe(
        newUser.userName,
      );
      if (!existe) {
        userEntity = await this.userRepository.create(newUser);
      } else {
        newUser.id = existe.id;
        newUser.activo = true;
        await this.userRepository.update(newUser);
        userEntity = newUser;
      }

      // Sincronizar relaciones bidireccionales
      if (roles && roles.length > 0) {
        for (const rolId of roles) {
          await this.syncRelationService.agregarRolAUsuario(
            userEntity.getIdString(),
            rolId,
          );
        }
      }
      if (funciones && funciones.length > 0) {
        for (const funcionId of funciones) {
          await this.syncRelationService.agregarFuncionAUsuario(
            userEntity.getIdString(),
            funcionId,
          );
        }
      }
      // Para el log, creamos una copia sin datos sensibles
      const logUser = { ...userEntity } as Partial<UserEntity>;
      delete logUser.salt;
      delete logUser.password;
      const tabla: string = this.userRepository.getTabla();
      if (this.isProductionEnv) {
        const logHistoryDto: LogHistoryDto = new LogHistoryDto(
          null,
          user.userName,
          new Date(),
          tabla,
          HISTORY_ACTION.ADD,
          logUser,
          null,
          userEntity.id.toHexString(),
          ip,
        );
        await this.logHistoryService.create(logHistoryDto);
      }
      result.successStatus = true;
      result.message = 'success';
    } catch (error) {
      result.message = error.response;
      result.successStatus = false;
      return result;
    }
    return result;
  }

  async update(
    user: UserEntity,
    id: string,
    updateUserDto: UpdateUserDto,
    ip: string,
  ): Promise<ResponseDto> {
    const result = new ResponseDto();
    const foundUser: UserEntity = await this.userRepository.findById(id);
    if (!foundUser) {
      throw new NotFoundException('No existe el user');
    }
    // JEFE: solo puede editar trabajadores (OPERARIO) de sus almacenes
    if (this.esJefe(user)) {
      await this.validarJefeGestionaTrabajador(user, foundUser);
      const rolUsuario = await this.rolRepository.findByNombre(RolType.OPERARIO);
      const { roles } = updateUserDto;
      if (
        roles &&
        (roles.length !== 1 || roles[0] !== rolUsuario?.getIdString())
      ) {
        throw new ForbiddenException(
          'El jefe de almacenes solo puede mantener el rol OPERARIO en sus trabajadores',
        );
      }
      if (
        updateUserDto.almacenes &&
        updateUserDto.almacenes.some((p) => !user.almacenIds?.includes(p))
      ) {
        throw new ForbiddenException(
          'Solo puede asignar almacenes que usted administra',
        );
      }
    }
    try {
      const updateUser: UserEntity = this.userMapper.dtoToUpdateEntity(
        updateUserDto,
        foundUser,
      );
      const { roles, funciones } = updateUserDto;
      if (roles && roles.length > 0) {
        foundUser.roles = await this.rolRepository.findByIds(roles);
        // Sincronizar roles con bidireccionalidad
        await this.syncRelationService.setRolesDeUsuario(id, roles);
      }
      if (funciones && funciones.length > 0) {
        foundUser.funciones = await this.funcionRepository.findByIds(funciones);
        // Sincronizar funciones con bidireccionalidad
        await this.syncRelationService.setFuncionesDeUsuario(id, funciones);
      }
      await this.userRepository.update(foundUser);

      // Para el log, creamos una copia sin datos sensibles
      const logUser = { ...updateUser } as Partial<UserEntity>;
      delete logUser.salt;
      delete logUser.password;
      const logFoundUser = { ...foundUser } as Partial<UserEntity>;
      delete logUser.salt;
      delete logUser.password;
      const tabla: string = this.userRepository.getTabla();
      if (this.isProductionEnv) {
        const logHistoryDto: LogHistoryDto = new LogHistoryDto(
          null,
          user.userName,
          new Date(),
          tabla,
          HISTORY_ACTION.MOD,
          logUser,
          logFoundUser,
          updateUser.id.toHexString(),
          ip,
        );
        await this.logHistoryService.create(logHistoryDto);
      }
      result.successStatus = true;
      result.message = 'success';
    } catch (error) {
      result.message = error.response;
      result.successStatus = false;
      return result;
    }
    return result;
  }

  async delete(user: UserEntity, id: string, ip: string): Promise<ResponseDto> {
    const result = new ResponseDto();
    if (user.getIdString() === id) {
      result.message = 'Usuario autenticado no se puede eliminar.';
      result.successStatus = false;
      return result;
    }
    const userEntity: UserEntity = await this.userRepository.findById(id);
    // JEFE: solo puede eliminar trabajadores (OPERARIO) de sus almacenes
    if (this.esJefe(user)) {
      await this.validarJefeGestionaTrabajador(user, userEntity);
    }
    const deleteEntity: UserEntity = (await this.userRepository.findById(
      id,
    )) as UserEntity;
    deleteEntity.activo = false;
    delete deleteEntity.salt;
    delete deleteEntity.password;
    if (userEntity) {
      // Para el log, creamos una copia sin datos sensibles
      const logUser = { ...userEntity } as Partial<UserEntity>;
      delete logUser.salt;
      delete logUser.password;
      if (this.isProductionEnv) {
        const tabla: string = this.userRepository.getTabla();
        const logHistoryDto: LogHistoryDto = new LogHistoryDto(
          null,
          user.userName,
          new Date(),
          tabla,
          HISTORY_ACTION.DEL,
          deleteEntity,
          logUser,
          userEntity.id.toHexString(),
          ip,
        );
        await this.logHistoryService.create(logHistoryDto);
      }
    }
    return await this.userRepository.delete(id);
  }

  private static async hashPassword(
    password: string,
    salt: string,
  ): Promise<string> {
    return hash(password, salt);
  }

  async deleteMultiple(
    user: UserEntity,
    ids: string[],
    ip: string,
  ): Promise<ResponseDto> {
    let result = new ResponseDto();
    try {
      for (const id of ids) {
        result = await this.delete(user, id, ip);
      }
    } catch (error) {
      result.message = error.detail;
      result.successStatus = false;
      return result;
    }
    return result;
  }

  async filter(
    options: PaginationOptions,
    filtroGenericoDto: FiltroGenericoDto,
  ): Promise<Pagination<ReadUserDto>> {
    const items: Pagination<UserEntity> = await this.userRepository.filter(
      options,
      filtroGenericoDto.clave,
      filtroGenericoDto.valor,
    );
    const readDto: any[] = [];
    for (const item of items.items) {
      readDto.push(await this.userMapper.entityToDto(item));
    }
    return new Pagination(readDto, items.meta, items.links);
  }

  async search(
    options: PaginationOptions,
    buscarDto: BuscarDto,
  ): Promise<Pagination<ReadUserDto>> {
    const items: Pagination<UserEntity> = await this.userRepository.search(
      options,
      buscarDto.search,
    );
    const readDto: any[] = [];
    for (const item of items.items) {
      const user = await this.userRepository.findById(item.getIdString());
      readDto.push(await this.userMapper.entityToDto(user));
    }
    return new Pagination(readDto, items.meta, items.links);
  }

  async changePassword(
    user: UserEntity,
    id: string,
    changePasswordDto: ChangePasswordDto,
    ip: string,
  ): Promise<ResponseDto> {
    const result = new ResponseDto();
    const updateUser: UserEntity = (await this.userRepository.findById(
      id,
    )) as UserEntity;
    const foundUser: UserEntity = await this.userRepository.findById(id);
    if (!foundUser) {
      throw new NotFoundException('No existe el user');
    }
    // JEFE: solo puede cambiar la contraseña de sus trabajadores (OPERARIO)
    if (this.esJefe(user)) {
      await this.validarJefeGestionaTrabajador(user, foundUser);
    }
    try {
      const { password } = changePasswordDto;
      foundUser.password = await UserService.hashPassword(
        password,
        foundUser.salt,
      );
      await this.userRepository.update(foundUser);
      // Para el log, creamos una copia sin datos sensibles
      const logUser = { ...foundUser } as Partial<UserEntity>;
      delete logUser.salt;
      delete logUser.password;
      const logUpdateUser = { ...updateUser } as Partial<UserEntity>;
      delete logUpdateUser.salt;
      delete logUpdateUser.password;
      const tabla: string = this.userRepository.getTabla();
      if (this.isProductionEnv) {
        const logHistoryDto: LogHistoryDto = new LogHistoryDto(
          null,
          user.userName,
          new Date(),
          tabla,
          HISTORY_ACTION.MOD,
          logUpdateUser,
          logUser,
          foundUser.id.toHexString(),
          ip,
        );
        await this.logHistoryService.create(logHistoryDto);
      }
      result.successStatus = true;
      result.message = 'success';
    } catch (error) {
      result.message = error.response;
      result.successStatus = false;
      return result;
    }
    return result;
  }

  async createSelect(): Promise<SelectDto[]> {
    const items: any[] = await this.userRepository.createSelect();
    const selectDto: SelectDto[] = [];
    for (const item of items) {
      selectDto.push(new SelectDto(item.id, item.toString()));
    }
    return selectDto;
  }

  async createSelectAlmacenes(user: UserEntity): Promise<SelectDto[]> {
    const isAdmin =
      user.roles?.some((rol) => rol.nombre === RolType.ADMINISTRADOR) || false;
    const selectDto: SelectDto[] = [];

    if (isAdmin) {
      const almacenes = await this.genericNomencladorRepository.get(
        NomencladorTypeEnum.ALMACEN,
      );
      for (const almacen of almacenes) {
        selectDto.push(new SelectDto(almacen.id, almacen.toString()));
      }
    } else {
      if (!user.almacenIds || user.almacenIds.length === 0) {
        return selectDto;
      }
      for (const id of user.almacenIds) {
        try {
          const almacen = await this.genericNomencladorRepository.findById(
            NomencladorTypeEnum.ALMACEN,
            id,
          );
          if (almacen) {
            selectDto.push(new SelectDto(almacen.id, almacen.toString()));
          }
        } catch {
          // Ignorar almacenes no encontrados
        }
      }
    }
    return selectDto;
  }

  async createSelectCategoria(): Promise<SelectDto[]> {
    const tiposMedio = await this.genericNomencladorRepository.get(
      NomencladorTypeEnum.CATEGORIA,
    );
    const selectDto: SelectDto[] = [];
    for (const tipo of tiposMedio) {
      selectDto.push(new SelectDto(tipo.id, tipo.toString()));
    }
    return selectDto;
  }
}
