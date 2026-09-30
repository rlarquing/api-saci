import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { genSalt, hash } from 'bcryptjs';
import * as randomToken from 'rand-token';
import * as dayjs from 'dayjs';
import {
  FuncionRepository,
  MenuRepository,
  RolRepository,
  UserRepository,
} from '../../persistence/repository';
import {
  AuthCredentialsDto,
  ChangePasswordDto,
  LogHistoryDto,
  ReadFuncionDto,
  ReadMenuDto,
  RequestResetPasswordDto,
  ResetPasswordDto,
  ResponseDto,
  SecretDataDto,
  SelectDto,
  UserDto,
} from '../../shared/dto';
import { FuncionEntity, UserEntity } from '../../persistence/entity';
import { IJwtPayload } from '../../shared/interface';
import { FuncionMapper, MenuMapper } from '../mapper';
import { MailService } from '../../mail/mail.service';
import { LogHistoryService } from './log-history.service';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../app.keys';
import { HISTORY_ACTION } from '../../persistence/entity/log-history.entity';
import { UserService } from './user.service';

@Injectable()
export class AuthService {
  private isProductionEnv;

  constructor(
    private configService: ConfigService,
    private userRepository: UserRepository,
    private userService: UserService,
    private rolRepository: RolRepository,
    private funcionRepository: FuncionRepository,
    private funcionMapper: FuncionMapper,
    private menuRepository: MenuRepository,
    private menuMapper: MenuMapper,
    private jwtService: JwtService,
    private mailService: MailService,
    private logHistoryService: LogHistoryService,
  ) {
    this.isProductionEnv =
      this.configService.get(AppConfig.NODE_ENV) === 'production';
  }

  async signUp(userDto: UserDto): Promise<ResponseDto> {
    const result = new ResponseDto();
    const { userName, password, email } = userDto;
    const userEntity: UserEntity = new UserEntity({ userName, email });
    userEntity.salt = await genSalt();
    userEntity.password = await AuthService.hashPassword(
      password,
      userEntity.salt,
    );
    try {
      await this.userRepository.signUp(userEntity);
      result.successStatus = true;
      result.message = 'success';
    } catch (error) {
      result.message = error.response;
      result.successStatus = false;
      return result;
    }
    return result;
  }

  async signIn(authCredentialsDto: AuthCredentialsDto): Promise<SecretDataDto> {
    const { userName, password } = authCredentialsDto;
    const credential = await this.userRepository.validateUserPassword(
      userName,
      password,
    );
    if (!credential) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }
    const user: UserEntity = await this.userRepository.findByName(userName);
    const funcions: FuncionEntity[] = user.funciones ? [...user.funciones] : [];

    for (const rol of user.roles || []) {
      if (rol.funciones) {
        funcions.push(...rol.funciones);
      }
    }
    const uniqueFuncions = funcions.filter(
      (v, i, a) => a.findIndex((t) => t.id === v.id) === i,
    );
    const readFuncionDtos: ReadFuncionDto[] = [];
    for (const funcion of uniqueFuncions) {
      readFuncionDtos.push(await this.funcionMapper.entityToDto(funcion));
    }
    const readMenuDtos: ReadMenuDto[] = [];
    for (const readFuncionDto of readFuncionDtos) {
      if (readFuncionDto.menu !== undefined) {
        readMenuDtos.push(readFuncionDto.menu);
      }
    }
    const payload: IJwtPayload = { userName };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.getRefreshToken(user.getIdString());
    const almacenes = await this.userService.createSelectAlmacenes(user);
    const categorias = await this.userService.createSelectCategoria();
    const roles = (user.roles || []).map(
      (rol) => new SelectDto(rol.getIdString(), rol.nombre),
    );
    return {
      accessToken,
      refreshToken,
      functions: readFuncionDtos,
      menus: readMenuDtos,
      almacenes,
      categorias,
      userId: user.getIdString(),
      userName: user.userName,
      email: user.email || '',
      roles,
    };
  }

  private static async hashPassword(
    password: string,
    salt: string,
  ): Promise<string> {
    return hash(password, salt);
  }

  public async getRefreshToken(id: string): Promise<string> {
    const userEntity: UserEntity = await this.userRepository.findById(id);
    userEntity.refreshToken = randomToken.generate(16);
    userEntity.refreshTokenExp = dayjs().add(1, 'day').format('YYYY/MM/DD');
    await this.userRepository.update(userEntity);
    return userEntity.refreshToken;
  }

  async regenerateTokens(user: UserEntity): Promise<SecretDataDto> {
    const userName = user.userName;
    const userEntity: UserEntity = await this.userRepository.findById(
      user.getIdString(),
    );

    const funcions: FuncionEntity[] = userEntity.funciones
      ? [...userEntity.funciones]
      : [];

    for (const rol of userEntity.roles || []) {
      if (rol.funciones) {
        funcions.push(...rol.funciones);
      }
    }

    const uniqueFuncions = funcions.filter(
      (v, i, a) => a.findIndex((t) => t.id === v.id) === i,
    );
    const readFuncionDtos: ReadFuncionDto[] = [];
    for (const funcion of uniqueFuncions) {
      readFuncionDtos.push(await this.funcionMapper.entityToDto(funcion));
    }
    const readMenuDtos: ReadMenuDto[] = [];
    for (const readFuncionDto of readFuncionDtos) {
      if (readFuncionDto.menu !== undefined) {
        readMenuDtos.push(readFuncionDto.menu);
      }
    }
    const payload: IJwtPayload = { userName };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.getRefreshToken(user.getIdString());
    const almacenes = await this.userService.createSelectAlmacenes(user);
    const categorias = await this.userService.createSelectCategoria();
    const roles = (userEntity.roles || []).map(
      (rol) => new SelectDto(rol.getIdString(), rol.nombre),
    );
    return {
      accessToken,
      refreshToken,
      functions: readFuncionDtos,
      menus: readMenuDtos,
      almacenes,
      categorias,
      userId: userEntity.getIdString(),
      userName: userEntity.userName,
      email: userEntity.email || '',
      roles,
    };
  }

  async logout(user: UserEntity): Promise<ResponseDto> {
    user.refreshToken = null;
    user.refreshTokenExp = null;
    await this.userRepository.update(user);
    const result = new ResponseDto();
    result.successStatus = true;
    result.message = 'success';
    return result;
  }

  async requestResetPasword(
    requestResetPasswordDto: RequestResetPasswordDto,
  ): Promise<ResponseDto> {
    const { email } = requestResetPasswordDto;
    const user: UserEntity = await this.userRepository.findOneByEmail(email);
    user.resetPasswordCode = Math.floor(Math.random() * 900000) + 100000;
    const response = await this.userRepository.update(user);
    if (response.successStatus) {
      response.message = `Enviado el código al correo: ${email}`;
    }
    await this.mailService.sendRequestResetPassword(user);
    return response;
  }

  async resetPasword(resetPasswordDto: ResetPasswordDto): Promise<ResponseDto> {
    const { resetPasswordCode, password } = resetPasswordDto;
    const user: UserEntity =
      await this.userRepository.findOneByResetPasswordCode(resetPasswordCode);
    user.password = await AuthService.hashPassword(password, user.salt);
    user.resetPasswordCode = null;
    const response = await this.userRepository.update(user);
    if (response.successStatus) {
      response.message = `Se ha cambiado su contraseña.`;
    }
    return response;
  }

  async changePassword(
    user: UserEntity,
    changePasswordDto: ChangePasswordDto,
    ip: string,
  ): Promise<ResponseDto> {
    const result = new ResponseDto();
    const updateUser: UserEntity = (await this.userRepository.findById(
      user.getIdString(),
    )) as UserEntity;
    const foundUser: UserEntity = await this.userRepository.findById(
      user.getIdString(),
    );
    if (!foundUser) {
      throw new NotFoundException('No existe el user');
    }

    let { password, oldPassword } = changePasswordDto;
    password = await AuthService.hashPassword(password, foundUser.salt);
    oldPassword = await AuthService.hashPassword(oldPassword, foundUser.salt);

    if (oldPassword === user.password) {
      foundUser.password = await AuthService.hashPassword(
        password,
        foundUser.salt,
      );
    } else {
      result.message = 'La contraseña anterior no coincide.';
      result.successStatus = false;
      return result;
    }
    try {
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

  async getUserMenus(user: UserEntity): Promise<ReadMenuDto[]> {
    const funcions: FuncionEntity[] = user.funciones ? [...user.funciones] : [];
    for (const rol of user.roles || []) {
      if (rol.funciones) {
        funcions.push(...rol.funciones);
      }
    }
    const uniqueFuncions = funcions.filter(
      (v, i, a) => a.findIndex((t) => t.id === v.id) === i,
    );
    const readFuncionDtos: ReadFuncionDto[] = [];
    for (const funcion of uniqueFuncions) {
      readFuncionDtos.push(await this.funcionMapper.entityToDto(funcion));
    }
    const readMenuDtos: ReadMenuDto[] = [];
    for (const readFuncionDto of readFuncionDtos) {
      if (readFuncionDto.menu !== undefined) {
        readMenuDtos.push(readFuncionDto.menu);
      }
    }
    return readMenuDtos;
  }
}
