import { Injectable } from '@nestjs/common';
import {
  CreateUserDto,
  ReadFuncionDto,
  ReadNomencladorDto,
  ReadRolDto,
  ReadUserDto,
  UpdateUserDto,
} from '../../shared/dto';
import { UserEntity } from '../../persistence/entity';
import { UserRepository } from '../../persistence/repository';
import { RolMapper } from './rol.mapper';
import { FuncionMapper } from './funcion.mapper';
import { GenericNomencladorMapper } from './generic-nomenclador.mapper';

@Injectable()
export class UserMapper {
  constructor(
    protected userRepository: UserRepository,
    protected rolMapper: RolMapper,
    protected funcionMapper: FuncionMapper,
    protected genericNomencladorMapper: GenericNomencladorMapper,
  ) {}
  dtoToEntity(userDto: CreateUserDto): UserEntity {
    const { userName, email } = userDto;
    const user = new UserEntity({ userName, email });

    user.roleIds = userDto.roles || [];
    user.funcionIds = userDto.funciones || [];
    user.almacenIds = userDto.almacenes || [];
    return user;
  }

  dtoToUpdateEntity(
    updateUserDto: UpdateUserDto,
    updateUserEntity: UserEntity,
  ): UserEntity {
    updateUserEntity.userName = updateUserDto.userName;
    updateUserEntity.email = updateUserDto.email;
    if (updateUserDto.roles) {
      updateUserEntity.roleIds = updateUserDto.roles;
    }
    if (updateUserDto.funciones) {
      updateUserEntity.funcionIds = updateUserDto.funciones;
    }
    if (updateUserDto.almacenes) {
      updateUserEntity.almacenIds = updateUserDto.almacenes;
    }
    return updateUserEntity;
  }

  async entityToDto(userEntity: UserEntity): Promise<ReadUserDto> {
    const dtoToString: string = userEntity.toString();
    const user: UserEntity = await this.userRepository.findById(
      userEntity.getIdString(),
    );
    // Obtener roles completas y mapearlas a ReadRolDto
    const roles: ReadRolDto[] = [];
    if (user.roles && user.roles.length > 0) {
      for (const rolEntity of user.roles) {
        roles.push(await this.rolMapper.entityToDto(rolEntity));
      }
    }
    // Obtener funciones completas y mapearlas a ReadFuncionDto
    const funciones: ReadFuncionDto[] = [];
    if (user.funciones && user.funciones.length > 0) {
      for (const funcionEntity of user.funciones) {
        funciones.push(await this.funcionMapper.entityToDto(funcionEntity));
      }
    }

    // Obtener almacenes completos y mapearlas a ReadNomencladorDto
    const almacenes: ReadNomencladorDto[] = [];
    if (user.almacenes && user.almacenes.length > 0) {
      for (const almacenEntity of user.almacenes) {
        almacenes.push(this.genericNomencladorMapper.entityToDto(almacenEntity));
      }
    }

    return new ReadUserDto(
      dtoToString,
      userEntity.getIdString(),
      userEntity.userName,
      userEntity.email,
      roles,
      funciones,
      almacenes,
    );
  }
}
