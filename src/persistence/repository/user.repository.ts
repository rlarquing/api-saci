import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { RolEntity, UserEntity } from '../entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import {
  isBoolean,
  isDate,
  isEmpty,
  isNumber,
  isString,
} from 'class-validator';
import { ResponseDto } from '../../shared/dto';
import {
  PaginationOptions,
  paginateMongo,
  Pagination,
} from '../../shared/pagination';
import { FuncionRepository } from './funcion.repository';
import * as dayjs from 'dayjs';

const isValidObjectId = (id: string): boolean => {
  if (!id || typeof id !== 'string') return false;
  return /^[a-fA-F0-9]{24}$/.test(id);
};

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: MongoRepository<UserEntity>,
    @InjectRepository(RolEntity)
    private rolRepository: MongoRepository<RolEntity>,
    private funcionRepository: FuncionRepository,
  ) {}
  /**
   * Obtiene el nombre de la tabla de la entidad
   */
  getTabla(): string {
    return this.userRepository.metadata?.name || '';
  }

  /**
   * Popula un rol con sus funciones desde la base de datos
   */
  private async populateRol(rolId: string): Promise<RolEntity> {
    if (!isValidObjectId(rolId)) {
      throw new BadRequestException(
        'El ID del rol debe ser un ObjectId válido de MongoDB (24 caracteres hex)',
      );
    }
    const objectId = new ObjectId(rolId);
    const options = {
      where: { _id: objectId, activo: true } as any,
    } as FindOneOptions<RolEntity>;
    const rol = await this.rolRepository.findOne(options);
    if (rol && rol.funcionIds?.length > 0) {
      rol.funciones = await this.funcionRepository.findByIds(rol.funcionIds);
    }
    return rol;
  }

  async signUp(userEntity: UserEntity): Promise<UserEntity> {
    // Buscar el rol por nombre en la colección de roles
    const rol = await this.rolRepository.findOne({
      where: { activo: true, nombre: 'OPERARIO' } as any,
    });
    if (!rol) {
      throw new NotFoundException('No existe el rol');
    }
    // Convertir ObjectId a string para MongoDB
    userEntity.roleIds = [rol.getIdString()];
    try {
      return await this.userRepository.save(userEntity);
    } catch (error) {
      if (error.code === 11000 || error.code === 11001) {
        throw new ConflictException(
          'El nombre del usuario ya existe en el sistema.',
        );
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async findAll(options: PaginationOptions): Promise<Pagination<UserEntity>> {
    const where = {
      where: { activo: true },
    } as FindManyOptions;
    return await paginateMongo<UserEntity>(this.userRepository, options, where);
  }

  async findById(id: string): Promise<UserEntity> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(
        'El ID debe ser un ObjectId válido de MongoDB (24 caracteres hex)',
      );
    }
    const objectId = new ObjectId(id);
    const options = {
      where: { _id: objectId, activo: true } as any,
    } as FindOneOptions<UserEntity>;
    const result: UserEntity = await this.userRepository.findOne(options);
    if (result.roleIds?.length > 0) {
      const roles: RolEntity[] = [];
      for (const rolId of result.roleIds) {
        // Usar populateRol para que se populen las funciones del rol
        roles.push(await this.populateRol(rolId));
      }
      result.roles = roles;
    }
    if (result.funcionIds?.length > 0) {
      result.funciones = await this.funcionRepository.findByIds(
        result.funcionIds,
      );
    }
    return result;
  }

  async findByIds(ids: string[]): Promise<UserEntity[]> {
    const invalidIds = ids.filter((id) => !isValidObjectId(id));
    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `Los siguientes IDs no son ObjectIds válidos: ${invalidIds.join(', ')}`,
      );
    }
    const objectIds = ids.map((id: string) => new ObjectId(id));
    const options = {
      where: { _id: { $in: objectIds }, activo: true } as any,
    } as FindManyOptions<UserEntity>;
    const result: UserEntity[] = await this.userRepository.find(options);
    for (const userEntity of result) {
      if (userEntity.roleIds?.length > 0) {
        const roles: RolEntity[] = [];
        for (const rolId of userEntity.roleIds) {
          // Usar populateRol para que se populen las funciones del rol
          roles.push(await this.populateRol(rolId));
        }
        userEntity.roles = roles;
      }
      if (userEntity.funcionIds?.length > 0) {
        userEntity.funciones = await this.funcionRepository.findByIds(
          userEntity.funcionIds,
        );
      }
    }
    return result;
  }

  async create(userEntity: UserEntity): Promise<UserEntity> {
    return await this.userRepository.save(userEntity);
  }

  async update(updatedUser: UserEntity): Promise<ResponseDto> {
    const result = new ResponseDto();
    try {
      await this.userRepository.save(updatedUser);
      result.successStatus = true;
      result.message = 'success';
    } catch (error) {
      result.message = error.response;
      result.successStatus = false;
      return result;
    }
    return result;
  }

  async delete(id: string): Promise<ResponseDto> {
    const result = new ResponseDto();
    if (!isValidObjectId(id)) {
      throw new BadRequestException(
        'El ID debe ser un ObjectId válido de MongoDB (24 caracteres hex)',
      );
    }
    const objectId = new ObjectId(id);
    const user = await this.userRepository.findOne({
      where: { _id: objectId, activo: true } as any,
    });
    if (!user) {
      throw new NotFoundException('No existe el usuario');
    }
    user.activo = false;
    try {
      await this.userRepository.save(user);
      result.successStatus = true;
      result.message = 'success';
    } catch (error) {
      result.message = error.response;
      result.successStatus = false;
    }
    return result;
  }

  async validateUserPassword(
    userName: string,
    password: string,
  ): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { userName: userName } as any,
    });
    if (user && (await user.validatePassword(password))) {
      return user.userName;
    } else {
      return null;
    }
  }
  async findOneByEmail(email: string): Promise<UserEntity> {
    const user: UserEntity = await this.userRepository.findOne({
      where: { email: email, activo: true } as any,
    });
    if (!user) {
      throw new NotFoundException(`Usuario con el email no se encuentra`);
    }
    if (user.roleIds?.length > 0) {
      const roles: RolEntity[] = [];
      for (const rolId of user.roleIds) {
        // Usar populateRol para que se populen las funciones del rol
        roles.push(await this.populateRol(rolId));
      }
      user.roles = roles;
    }
    if (user.funcionIds?.length > 0) {
      user.funciones = await this.funcionRepository.findByIds(user.funcionIds);
    }
    return user;
  }

  async findByName(userName: string): Promise<UserEntity> {
    const options = {
      where: { activo: true, userName: userName } as any,
    } as FindOneOptions<UserEntity>;
    const result: UserEntity = await this.userRepository.findOne(options);
    if (result.roleIds?.length > 0) {
      const roles: RolEntity[] = [];
      for (const rolId of result.roleIds) {
        // Usar populateRol para que se populen las funciones del rol
        roles.push(await this.populateRol(rolId));
      }
      result.roles = roles;
    }
    if (result.funcionIds?.length > 0) {
      result.funciones = await this.funcionRepository.findByIds(
        result.funcionIds,
      );
    }
    return result;
  }

  public async validateRefreshToken(
    userName: string,
    refreshToken: string,
  ): Promise<UserEntity> {
    // `refreshTokenExp` se persiste como STRING 'YYYY/MM/DD' (AuthService.getRefreshToken).
    // MongoDB aplica type bracketing: los operadores de comparación solo cruzan
    // valores del mismo tipo BSON, así que `{ $gte: new Date() }` contra un string
    // nunca casaba y TODO refresh terminaba en 'token expired'.
    // El formato es de ancho fijo y con ceros: su orden lexicográfico coincide
    // con el cronológico.
    const currentDate = dayjs().format('YYYY/MM/DD');
    const options = {
      where: {
        activo: true,
        userName: userName,
        refreshToken: refreshToken,
        refreshTokenExp: { $gte: currentDate },
      } as any,
    };
    const user = await this.userRepository.findOne(options);
    if (!user) {
      return null;
    }
    return user;
  }

  async filter(
    options: PaginationOptions,
    claves: string[],
    valores: any[],
  ): Promise<Pagination<UserEntity>> {
    const wheres: any = { activo: true };
    for (let i = 0; i < claves.length; i++) {
      if (isNumber(valores[i])) {
        wheres[claves[i]] = valores[i];
      } else if (isDate(valores[i])) {
        const datep = new Date(valores[i]);
        const start = new Date(datep.setHours(0, 0, 0, 0));
        const end = new Date(datep.setHours(23, 59, 59, 999));
        wheres[claves[i]] = { $gte: start, $lte: end };
      } else if (isBoolean(valores[i])) {
        wheres[claves[i]] = valores[i];
      } else {
        wheres[claves[i]] = { $regex: new RegExp(valores[i], 'i') };
      }
    }
    const where = {
      where: wheres,
    } as FindManyOptions;
    return await paginateMongo<UserEntity>(this.userRepository, options, where);
  }

  async search(
    options: PaginationOptions,
    search: any,
  ): Promise<Pagination<UserEntity>> {
    // Para MongoDB, usamos consultas directas en lugar de queryBuilder
    if (!isEmpty(search)) {
      // Buscar usuarios que contengan el término en cualquier campo
      const result = await this.userRepository.find({
        where: { activo: true } as any,
      });
      const matchingIds: string[] = [];

      for (const item of result) {
        const matches = Object.values(item).some((value) => {
          if (isString(value) && isString(search)) {
            return value.toLowerCase().indexOf(search.toLowerCase()) !== -1;
          }
          return false;
        });
        if (matches) {
          // Convertir ObjectId a string para MongoDB
          matchingIds.push(item.getIdString());
        }
      }

      if (matchingIds.length > 0) {
        return await paginateMongo<UserEntity>(this.userRepository, options, {
          where: { _id: { $in: matchingIds }, activo: true } as any,
        });
      }

      return await paginateMongo<UserEntity>(this.userRepository, options, {
        where: { activo: true, _id: null } as any,
      });
    }
    return await paginateMongo<UserEntity>(this.userRepository, options, {
      where: { activo: true },
    });
  }

  async createSelect(): Promise<UserEntity[]> {
    const options = {
      where: { activo: true },
    } as FindManyOptions;
    return await this.userRepository.find(options);
  }

  async existe(userName: string): Promise<UserEntity> {
    return await this.userRepository.findOne({
      where: { userName: userName } as any,
    } as FindOneOptions);
  }

  async findOneByResetPasswordCode(
    resetPasswordCode: number,
  ): Promise<UserEntity> {
    const user: UserEntity = await this.userRepository.findOne({
      where: { resetPasswordCode: resetPasswordCode, activo: true } as any,
    });
    if (!user) {
      throw new NotFoundException(`Usuario no se encuentra`);
    }
    return user;
  }

  async getResetPaswordCodeFor24Hours(): Promise<UserEntity[]> {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    return await this.userRepository.find({
      where: { activo: true, updatedAt: { $lte: twentyFourHoursAgo } } as any,
    });
  }
}
