import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RegistroDiarioMapper } from '../mapper';
import { LogHistoryService } from './log-history.service';
import { GenericService } from './generic.service';
import { RegistroDiarioEntity } from '../../persistence/entity';
import { RegistroDiarioRepository } from '../../persistence/repository';
import { ConfigService } from '@nestjs/config';
import { ResponseDto, ReadRegistroDiarioDto } from '../../shared/dto';

@Injectable()
export class RegistroDiarioService extends GenericService<RegistroDiarioEntity> {
  constructor(
    protected configService: ConfigService,
    protected registroDiarioRepository: RegistroDiarioRepository,
    protected registroDiarioMapper: RegistroDiarioMapper,
    protected logHistoryService: LogHistoryService,
  ) {
    super(
      configService,
      registroDiarioRepository,
      registroDiarioMapper,
      logHistoryService,
      true,
    );
  }

  /**
   * Cierra un registro diario manualmente (el jefe decide cerrar el día)
   * @param id ID del registro diario
   * @returns Confirmación de cierre
   */
  async cerrarRegistro(id: string): Promise<ResponseDto> {
    const registro = await this.registroDiarioRepository.findById(id);

    if (registro.estado === 'cerrado') {
      throw new BadRequestException('El registro diario ya está cerrado');
    }

    await this.registroDiarioRepository.cerrarRegistro(id);

    const response = new ResponseDto();
    response.message = 'Registro diario cerrado exitosamente';
    return response;
  }

  /**
   * Cierre diario automático a las 00:00 (hora del servidor): cierra los
   * registros diarios que hayan quedado abiertos de días anteriores.
   * El cierre manual es la vía normal; este cron es el respaldo para días
   * que nadie cerró, de modo que al día siguiente todo esté cerrado.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'cierre-diario-automatico',
  })
  async cierreDiarioAutomatico(): Promise<void> {
    const cerrados =
      await this.registroDiarioRepository.cerrarRegistrosAnteriores(new Date());
    if (cerrados > 0) {
      Logger.log(
        `[Cron 00:00] Cierre diario automático: ${cerrados} registro(s) diario(s) cerrado(s)`,
        RegistroDiarioService.name,
      );
    }
  }

  /**
   * Obtiene el registro diario actual de un almacen
   * @param almacenId ID del almacen
   * @returns Registro diario actual como DTO
   */
  async getRegistroActual(almacenId: string): Promise<ReadRegistroDiarioDto> {
    const entity =
      await this.registroDiarioRepository.findOrCreateRegistroDiario(almacenId);
    return await this.registroDiarioMapper.entityToDto(entity);
  }

  /**
   * Busca o crea el registro diario para un almacen en una fecha específica
   * @param almacenId ID del almacen
   * @param fecha Fecha del registro (por defecto hoy)
   * @returns Registro diario encontrado o creado
   */
  async findOrCreateRegistroDiario(
    almacenId: string,
    fecha: Date = new Date(),
  ): Promise<RegistroDiarioEntity> {
    return await this.registroDiarioRepository.findOrCreateRegistroDiario(
      almacenId,
      fecha,
    );
  }

  /**
   * Busca el registro diario de un almacen sin crearlo si no existe.
   * Se usa en lecturas (resumen, reportes) para no crear registros como
   * efecto secundario de un GET.
   * @param almacenId ID del almacen
   * @param fecha Fecha del registro (por defecto hoy)
   * @returns Registro diario o null si ese día no tuvo movimientos
   */
  async findRegistroDelDia(
    almacenId: string,
    fecha: Date = new Date(),
  ): Promise<RegistroDiarioEntity | null> {
    return await this.registroDiarioRepository.findByAlmacenAndFecha(
      almacenId,
      fecha,
    );
  }

  /**
   * SUMA un movimiento de inventario al registro diario (SACI).
   * @param registroId ID del registro
   * @param categoriaNombre Categoría del producto movido
   * @param esEntrada true = ENTRADA, false = SALIDA
   * @param cantidad Unidades movidas
   */
  async actualizarRegistroConMovimiento(
    registroId: string,
    categoriaNombre: string,
    esEntrada: boolean,
    cantidad: number,
  ): Promise<RegistroDiarioEntity> {
    return await this.registroDiarioRepository.actualizarRegistroConMovimiento(
      registroId,
      categoriaNombre,
      esEntrada,
      cantidad,
    );
  }
}
