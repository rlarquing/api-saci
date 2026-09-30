import { Injectable, ForbiddenException } from '@nestjs/common';
import { PaginationOptions } from '../../shared/pagination';
import { RolMapper } from '../mapper';
import { LogHistoryService } from './log-history.service';
import { GenericService } from './generic.service';
import { SyncRelationService } from './sync-relation.service';
import { FuncionEntity, RolEntity } from '../../persistence/entity';
import { FuncionRepository, RolRepository } from '../../persistence/repository';
import { ConfigService } from '@nestjs/config';
import { RolType } from '../../shared/enum';
import { UserEntity } from '../../persistence/entity';
import { LogHistoryDto, ResponseDto } from '../../shared/dto';
import { HISTORY_ACTION } from '../../persistence/entity/log-history.entity';

@Injectable()
export class RolService extends GenericService<RolEntity> {
  constructor(
    protected configService: ConfigService,
    protected rolRepository: RolRepository,
    protected rolMapper: RolMapper,
    protected logHistoryService: LogHistoryService,
    private funcionRepository: FuncionRepository,
    private syncRelationService: SyncRelationService,
  ) {
    super(configService, rolRepository, rolMapper, logHistoryService, true);
  }

  async crearRoles(): Promise<void> {
    const rolAdmin: RolEntity = new RolEntity({
      nombre: RolType.ADMINISTRADOR,
      descripcion: 'Tiene todos los permisos de la administración',
    });
    const existeAdmin: RolEntity = await this.rolRepository.findByNombre(
      RolType.ADMINISTRADOR,
    );
    if (!existeAdmin) {
      await this.rolRepository.create(rolAdmin);
    }
    const rolJefe: RolEntity = new RolEntity({
      nombre: RolType.JEFE_DE_ALMACEN,
      descripcion:
        'Gestiona sus almacenes: productos, QR, movimientos, ajustes y cierre del día',
    });
    const existeJefe: RolEntity = await this.rolRepository.findByNombre(
      RolType.JEFE_DE_ALMACEN,
    );
    if (!existeJefe) {
      await this.rolRepository.create(rolJefe);
    }
    const rolUsuario: RolEntity = new RolEntity({
      nombre: RolType.OPERARIO,
      descripcion: 'Registra entradas y salidas escaneando QR en sus almacenes',
    });
    const existeUsuario: RolEntity = await this.rolRepository.findByNombre(
      RolType.OPERARIO,
    );
    if (!existeUsuario) {
      await this.rolRepository.create(rolUsuario);
    }
  }

  /**
   * Crea un rol con sincronización bidireccional de funciones y usuarios
   */
  async create(
    user: UserEntity,
    createDto: any,
    ip: string,
  ): Promise<ResponseDto> {
    const result = new ResponseDto();
    const newEntity = await this.rolMapper.dtoToEntity(createDto);
    try {
      const { funciones, users } = createDto;

      // Validar que solo ADMINISTRADOR o JEFE_DE_ALMACEN puedan crear roles
      const allowedRoles: string[] = [
        RolType.ADMINISTRADOR,
        RolType.JEFE_DE_ALMACEN,
        RolType.OPERARIO,
      ];
      if (!allowedRoles.includes(newEntity.nombre)) {
        throw new ForbiddenException(
          'Solo ADMINISTRADOR, JEFE_DE_ALMACEN o USUARIO pueden crear roles',
        );
      }

      // Para JEFE_DE_ALMACEN, solo puede crear roles USUARIO
      if (
        user.roles?.some((r) => r.nombre === RolType.JEFE_DE_ALMACEN) &&
        newEntity.nombre === RolType.ADMINISTRADOR
      ) {
        throw new ForbiddenException(
          'JEFE_DE_ALMACEN no puede crear roles ADMINISTRADOR',
        );
      }

      // Guardar primero la entidad
      const objEntity: RolEntity =
        await this.genericRepository.create(newEntity);
      const rolId = objEntity.getIdString();

      // Sincronizar funciones si existen
      if (funciones && funciones.length > 0) {
        for (const funcionId of funciones) {
          await this.syncRelationService.agregarFuncionARol(rolId, funcionId);
        }
      }

      // Sincronizar usuarios si son creados por ADMINISTRADOR o JEFE
      if (users && users.length > 0) {
        for (const usuarioId of users) {
          await this.syncRelationService.agregarRolAUsuario(usuarioId, rolId);
        }
      }

      if (this.traza && this.isProductionEnv) {
        const tabla: string = this.genericRepository.getTabla();
        const logHistoryDto: LogHistoryDto = new LogHistoryDto(
          null,
          user.userName,
          new Date(),
          tabla,
          HISTORY_ACTION.ADD,
          objEntity,
          null,
          objEntity.id.toHexString(),
          ip,
        );
        await this.logHistoryService.create(logHistoryDto);
      }
      result.id = objEntity.getIdString();
      result.successStatus = true;
      result.message = 'success';
    } catch (error) {
      result.message = error;
      result.successStatus = false;
      return result;
    }
    return result;
  }

  /**
   * Actualiza un rol con sincronización bidireccional
   */
  async update(
    user: UserEntity,
    id: string,
    updateDto: any,
    ip: string,
  ): Promise<ResponseDto> {
    const result = new ResponseDto();
    const foundObj: RolEntity = await this.genericRepository.findById(id);
    if (!foundObj) {
      throw new Error('No existe');
    }
    const updateEntity = await this.rolMapper.dtoToUpdateEntity(
      updateDto,
      foundObj,
    );
    try {
      await this.genericRepository.update(updateEntity);

      // Sincronizar funciones si se proporcionan
      if (updateDto.funciones) {
        await this.syncRelationService.setFuncionesDeRol(
          id,
          updateDto.funciones,
        );
      }

      if (this.traza && this.isProductionEnv) {
        const tabla: string = this.genericRepository.getTabla();
        const logHistoryDto: LogHistoryDto = new LogHistoryDto(
          null,
          user.userName,
          new Date(),
          tabla,
          HISTORY_ACTION.MOD,
          updateEntity,
          foundObj,
          updateEntity.id.toHexString(),
          ip,
        );
        await this.logHistoryService.create(logHistoryDto);
      }
      result.successStatus = true;
      result.message = 'success';
    } catch (error) {
      result.message = error.detail;
      result.successStatus = false;
      return result;
    }
    return result;
  }

  /**
   * Asigna todas las funciones existentes al rol Administrador
   * Se llama después de crear el menú de administración para asegurar
   * que todas las funciones estén creadas
   */
  async asignarFuncionesAdmin(): Promise<void> {
    const rolAdmin = await this.rolRepository.findByNombre(
      RolType.ADMINISTRADOR,
    );
    if (!rolAdmin) {
      throw new Error('El rol Administrador no existe');
    }

    const opcionesVacias: PaginationOptions = { page: 1, limit: 1000 };
    const funciones = (await this.funcionRepository.findAll(
      opcionesVacias,
      true,
    )) as FuncionEntity[];
    const funcionesActivas = funciones.filter((f) => f.activo);

    if (funcionesActivas.length === 0) {
      return;
    }

    const funcionIds = funcionesActivas.map((f) => f.getIdString());
    await this.syncRelationService.setFuncionesDeRol(
      rolAdmin.getIdString(),
      funcionIds,
    );
  }
}
