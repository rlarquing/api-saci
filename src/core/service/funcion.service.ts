import { Injectable } from '@nestjs/common';
import { FuncionMapper } from '../mapper';
import { LogHistoryService } from './log-history.service';
import { GenericService } from './generic.service';
import { SyncRelationService } from './sync-relation.service';
import { FuncionEntity, UserEntity } from '../../persistence/entity';
import { FuncionRepository } from '../../persistence/repository';
import { ConfigService } from '@nestjs/config';
import { LogHistoryDto, ResponseDto } from '../../shared/dto';
import { HISTORY_ACTION } from '../../persistence/entity/log-history.entity';

@Injectable()
export class FuncionService extends GenericService<FuncionEntity> {
  constructor(
    protected configService: ConfigService,
    protected funcionRepository: FuncionRepository,
    protected funcionMapper: FuncionMapper,
    protected logHistoryService: LogHistoryService,
    private syncRelationService: SyncRelationService,
  ) {
    super(
      configService,
      funcionRepository,
      funcionMapper,
      logHistoryService,
      true,
    );
  }

  /**
   * Crea una función con sincronización bidireccional de endpoints y usuarios
   */
  async create(
    user: UserEntity,
    createDto: any,
    ip: string,
  ): Promise<ResponseDto> {
    const result = new ResponseDto();
    const newEntity = await this.funcionMapper.dtoToEntity(createDto);
    try {
      const { endPoints, roleIds } = createDto;

      // Guardar primero la entidad
      const objEntity: FuncionEntity =
        await this.genericRepository.create(newEntity);
      const funcionId = objEntity.getIdString();

      // Sincronizar endpoints si existen
      if (endPoints && endPoints.length > 0) {
        for (const endPointId of endPoints) {
          await this.syncRelationService.agregarEndpointAFuncion(
            funcionId,
            endPointId,
          );
        }
      }

      // Sincronizar roles si existen (cada rol tendra esta funcion)
      if (roleIds && roleIds.length > 0) {
        for (const rolId of roleIds) {
          await this.syncRelationService.agregarFuncionARol(rolId, funcionId);
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
   * Actualiza una función con sincronización bidireccional
   */
  async update(
    user: UserEntity,
    id: string,
    updateDto: any,
    ip: string,
  ): Promise<ResponseDto> {
    const result = new ResponseDto();
    const foundObj: FuncionEntity = await this.genericRepository.findById(id);
    if (!foundObj) {
      throw new Error('No existe');
    }
    const updateEntity = await this.funcionMapper.dtoToUpdateEntity(
      updateDto,
      foundObj,
    );
    try {
      await this.genericRepository.update(updateEntity);

      // Sincronizar endpoints si se proporcionan
      if (updateDto.endPoints) {
        // Para endpoints, necesitamos quitar todos y agregar los nuevos
        // Esto es más complejo, así que por ahora solo agregamos
        for (const endPointId of updateDto.endPoints) {
          try {
            await this.syncRelationService.agregarEndpointAFuncion(
              id,
              endPointId,
            );
          } catch {
            // Si ya existe, ignorar
          }
        }
      }

      // Sincronizar roles si se proporcionan
      if (updateDto.roleIds) {
        await this.syncRelationService.setFuncionesDeRol(id, updateDto.roleIds);
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
}
