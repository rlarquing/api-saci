import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PermissionGuard, RolGuard } from '../guard';
import { GetUser, IpAddress, Roles } from '../decorator';
import { UserEntity } from '../../persistence/entity';
import { SyncService } from '../../core/service';
import { RolType } from '../../shared/enum';
import { SyncRequestDto, SyncResponseDto } from '../../shared/dto';

@ApiTags('Sincronización')
@Controller('sync')
@UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
@ApiBearerAuth()
@UsePipes(ValidationPipe)
export class SyncController {
  constructor(private syncService: SyncService) {}

  @Post('/')
  @Roles(RolType.JEFE_DE_ALMACEN, RolType.OPERARIO)
  @ApiOperation({ summary: 'Sincronizar movimientos pendientes desde el APK' })
  @ApiResponse({
    status: 200,
    description: 'Resultado de la sincronización',
    type: SyncResponseDto,
  })
  async sincronizar(
    @GetUser() user: UserEntity,
    @Body() request: SyncRequestDto,
    @IpAddress() ip: string,
  ): Promise<SyncResponseDto> {
    return await this.syncService.sincronizar(user, request, ip);
  }

  @Get('/status')
  @Roles(RolType.JEFE_DE_ALMACEN, RolType.OPERARIO)
  @ApiOperation({ summary: 'Obtener estado de sincronización' })
  @ApiResponse({
    status: 200,
    description: 'Estado de sincronización',
  })
  async getEstado(): Promise<{ ultimaSincronizacion: string | null }> {
    return await this.syncService.getEstado();
  }
}
