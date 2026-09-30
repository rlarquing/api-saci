import {
  Controller,
  Get,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PermissionGuard, RolGuard } from '../guard';
import { GetUser } from '../decorator';
import { BiService } from '../../core/service';
import { UserEntity } from '../../persistence/entity';
import {
  BajoMinimoBiDto,
  ComparativaAlmacenesBiDto,
  DashboardBiDto,
  TendenciaBiDto,
} from '../../shared/dto';

@ApiTags('Business Intelligence — Inventario')
@Controller('bi')
@UseGuards(AuthGuard('jwt'), RolGuard, PermissionGuard)
@ApiBearerAuth()
@UsePipes(ValidationPipe)
export class BiController {
  constructor(protected biService: BiService) {}

  @Get('/dashboard')
  @ApiOperation({ summary: 'KPIs de inventario (scoping por almacenes del usuario)' })
  @ApiResponse({ status: 200, description: 'Dashboard', type: DashboardBiDto })
  async getDashboard(@GetUser() user: UserEntity): Promise<DashboardBiDto> {
    return await this.biService.dashboard(user);
  }

  @Get('/comparativa-almacenes')
  @ApiOperation({ summary: 'Comparativa de movimientos entre almacenes' })
  @ApiQuery({ name: 'fechaInicio', required: false })
  @ApiQuery({ name: 'fechaFin', required: false })
  @ApiResponse({ status: 200, description: 'Comparativa', type: ComparativaAlmacenesBiDto })
  async getComparativaAlmacenes(
    @GetUser() user: UserEntity,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ): Promise<ComparativaAlmacenesBiDto> {
    return await this.biService.comparativaAlmacenes(user, fechaInicio, fechaFin);
  }

  @Get('/tendencia')
  @ApiOperation({ summary: 'Tendencia de entradas/salidas por día' })
  @ApiQuery({ name: 'dias', required: false })
  @ApiResponse({ status: 200, description: 'Tendencia', type: TendenciaBiDto })
  async getTendencia(
    @GetUser() user: UserEntity,
    @Query('dias') dias?: number,
  ): Promise<TendenciaBiDto> {
    return await this.biService.tendencia(user, dias ? Number(dias) : 14);
  }

  @Get('/bajo-minimo')
  @ApiOperation({ summary: 'Consolidado de alertas de stock bajo mínimo' })
  @ApiResponse({ status: 200, description: 'Alertas', type: BajoMinimoBiDto })
  async getBajoMinimo(@GetUser() user: UserEntity): Promise<BajoMinimoBiDto> {
    return await this.biService.bajoMinimo(user);
  }
}
