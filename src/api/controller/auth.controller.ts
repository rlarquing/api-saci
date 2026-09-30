import {
  Body,
  Controller,
  Post,
  Get,
  ValidationPipe,
  UseGuards,
  Patch,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { GetUser, IpAddress, Roles } from '../decorator';
import { AuthService } from '../../core/service';
import {
  AuthCredentialsDto,
  ChangePasswordDto,
  ReadMenuDto,
  RefreshTokenDto,
  RequestResetPasswordDto,
  ResetPasswordDto,
  ResponseDto,
  SecretDataDto,
  UserDto,
} from '../../shared/dto';
import { UserEntity } from '../../persistence/entity';
import { PermissionGuard, RolGuard } from '../guard';
import { RolType } from '../../shared/enum';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  @Roles(RolType.ADMINISTRADOR)
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // 5 registros / minuto
  @ApiOperation({ summary: 'Registrar usuario (solo administradores)' })
  @ApiResponse({
    status: 201,
    description: 'Registro de los usuarios',
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador.' })
  @ApiBody({
    description: 'Estructura para crear el usuario.',
    type: UserDto,
  })
  async signUp(@Body(ValidationPipe) userDto: UserDto): Promise<ResponseDto> {
    return await this.authService.signUp(userDto);
  }

  @Post('/signin')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } }) // 10 intentos / minuto
  @ApiOperation({ summary: 'Logeo de usuarios' })
  @ApiResponse({
    status: 201,
    description: 'Login de los usuarios',
    type: SecretDataDto,
  })
  @ApiBody({
    description: 'Estructura para el logeo del usuario.',
    type: AuthCredentialsDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Mensaje de usuario o contraseña incorrecto',
  })
  async signIn(
    @Body(ValidationPipe) authCredentialsDto: AuthCredentialsDto,
  ): Promise<SecretDataDto> {
    return await this.authService.signIn(authCredentialsDto);
  }

  @Post('/refresh-tokens')
  @ApiOperation({ summary: 'Obtener el token nuevo para los usuarios' })
  @ApiResponse({
    status: 200,
    description: 'Token nuevo para de los usuarios',
    type: SecretDataDto,
  })
  @ApiBody({
    description: 'Estructura para el envio del refresh token.',
    type: RefreshTokenDto,
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @UseGuards(AuthGuard('refresh'))
  @ApiBearerAuth()
  async regenerateTokens(@GetUser() user: UserEntity): Promise<SecretDataDto> {
    return await this.authService.regenerateTokens(user);
  }

  @Post('/logout')
  @ApiOperation({ summary: 'Desloguear un usuario' })
  @ApiResponse({
    status: 200,
    description: 'Deslogear un usuario',
    type: ResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @UseGuards(AuthGuard('jwt'))
  async logout(@GetUser() user: UserEntity): Promise<ResponseDto> {
    return await this.authService.logout(user);
  }

  @Patch('/request/reset/password')
  @Throttle({ default: { limit: 3, ttl: 300_000 } }) // 3 solicitudes / 5 minutos
  @ApiOperation({
    summary:
      'Enviar correo de recuperación de contraseña de la cuenta de usuario',
  })
  @ApiBody({
    description: 'Estructura para enviar el correo de recuperación.',
    type: RequestResetPasswordDto,
  })
  @ApiResponse({
    status: 200,
    description:
      'Envia un correo de recuperación de la contraseña de la cuenta de un usuario',
    type: ResponseDto,
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  requestResetPassword(
    @Body() requestResetPasswordDto: RequestResetPasswordDto,
  ): Promise<ResponseDto> {
    return this.authService.requestResetPasword(requestResetPasswordDto);
  }

  @Patch('/reset/password')
  @Throttle({ default: { limit: 5, ttl: 300_000 } }) // 5 intentos / 5 minutos
  @ApiOperation({ summary: 'Recuperar contraseña de la cuenta de usuario' })
  @ApiBody({
    description: 'Estructura para recuperar la contra.',
    type: ResetPasswordDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Recupera la contraseña de la cuenta de un usuario',
    type: ResponseDto,
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<ResponseDto> {
    return this.authService.resetPasword(resetPasswordDto);
  }

  @Patch('/change/password')
  @Roles(RolType.OPERARIO)
  @UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar password a un usuario' })
  @ApiBody({
    description: 'Estructura para cambiar el password del usuario.',
    type: ChangePasswordDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Cambia el password de un usuario',
    type: ResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  @ApiResponse({ status: 403, description: 'Sin autorizacion al recurso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async changePassword(
    @GetUser() user: UserEntity,
    @Body() changePasswordDto: ChangePasswordDto,
    @IpAddress() ip: string,
  ): Promise<ResponseDto> {
    return await this.authService.changePassword(user, changePasswordDto, ip);
  }

  @Get('/mis-menus')
  @ApiOperation({ summary: 'Obtener menús del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Menús del usuario',
    type: ReadMenuDto,
  })
  @UseGuards(AuthGuard('jwt'))
  async getMisMenus(@GetUser() user: UserEntity): Promise<ReadMenuDto[]> {
    return this.authService.getUserMenus(user);
  }
}
