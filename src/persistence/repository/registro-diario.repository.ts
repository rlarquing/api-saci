import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { RegistroDiarioEntity } from '../entity';
import { GenericRepository } from './generic.repository';
import { IRepository } from '../../shared/interface';
import { GenericNomencladorRepository } from './generic-nomenclador.repository';
import { NomencladorTypeEnum } from '../../shared/enum';
import { DetalleTiposDto } from '../../shared/dto';

const isValidObjectId = (id: string): boolean => {
  if (!id || typeof id !== 'string') return false;
  return /^[a-fA-F0-9]{24}$/.test(id);
};

@Injectable()
export class RegistroDiarioRepository
  extends GenericRepository<RegistroDiarioEntity>
  implements IRepository<RegistroDiarioEntity>
{
  constructor(
    @InjectRepository(RegistroDiarioEntity)
    private registroDiarioRepository: MongoRepository<RegistroDiarioEntity>,
    private genericNomencladorRepository: GenericNomencladorRepository,
  ) {
    super(registroDiarioRepository);
  }
  async findById(id: string): Promise<RegistroDiarioEntity> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(
        'El ID debe ser un ObjectId válido de MongoDB (24 caracteres hex)',
      );
    }
    const objectId = new ObjectId(id);
    const result: RegistroDiarioEntity =
      await this.registroDiarioRepository.findOne({
        where: { _id: objectId } as any,
      });

    if (!result) {
      throw new NotFoundException(`Entidad con ID ${id} no encontrada`);
    }
    if (result.almacenId) {
      result.almacen = await this.genericNomencladorRepository.findById(
        NomencladorTypeEnum.ALMACEN,
        result.almacenId,
      );
    }
    return result;
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
    // Normalizar la fecha (sin horas)
    const fechaNormalizada = new Date(fecha);
    fechaNormalizada.setHours(0, 0, 0, 0);

    // Buscar registro existente
    let registro = await this.registroDiarioRepository.findOne({
      where: {
        almacenId: almacenId,
        fecha: fechaNormalizada,
        activo: true,
      } as any,
    });

    if (!registro) {
      // Crear nuevo registro
      registro = new RegistroDiarioEntity({
        fecha: fechaNormalizada,
        almacenId: almacenId,
        estado: 'abierto',
        totalEntradas: 0,
        totalSalidas: 0,
        detalleCategorias: [],
        activo: true,
      });
      registro = await this.registroDiarioRepository.save(registro);

      // Respaldo del cron: al abrir el día nuevo, cerrar días anteriores que
      // hayan quedado abiertos (por si el cierre automático de las 00:00 no
      // corrió, p. ej. servidor apagado a medianoche).
      await this.cerrarRegistrosAnteriores(fecha, almacenId);
    }

    // Cargar referencia del almacen
    if (registro.almacenId) {
      registro.almacen = await this.genericNomencladorRepository.findById(
        NomencladorTypeEnum.ALMACEN,
        registro.almacenId,
      );
    }

    return registro;
  }

  /**
   * Cierra los registros diarios abiertos de fechas anteriores a la dada.
   * Respaldo del cron 00:00 (p. ej. servidor apagado a medianoche): se invoca
   * al abrir un día nuevo. Si `almacenId` se omite, aplica a todos los almacenes.
   * @param fecha Fecha de referencia (se cierran los registros con `fecha` menor a este día)
   * @param almacenId Almacen específico (opcional; por defecto todos)
   * @returns Cantidad de registros cerrados
   */
  async cerrarRegistrosAnteriores(
    fecha: Date,
    almacenId?: string,
  ): Promise<number> {
    const fechaNormalizada = new Date(fecha);
    fechaNormalizada.setHours(0, 0, 0, 0);

    const filtro: any = {
      fecha: { $lt: fechaNormalizada },
      estado: 'abierto',
      activo: true,
    };
    if (almacenId) {
      filtro.almacenId = almacenId;
    }

    const pendientes = await this.registroDiarioRepository.count({
      where: filtro,
    } as any);
    if (pendientes > 0) {
      // updatedAt manual: los hooks de TypeORM no corren sobre updateMany crudo.
      await this.registroDiarioRepository.updateMany(filtro, {
        $set: { estado: 'cerrado', updatedAt: new Date() },
      } as any);
    }
    return pendientes;
  }

  /**
   * Busca el registro diario por almacen y fecha
   * @param almacenId ID del almacen
   * @param fecha Fecha del registro
   * @returns Registro diario o null
   */
  async findByAlmacenAndFecha(
    almacenId: string,
    fecha: Date,
  ): Promise<RegistroDiarioEntity | null> {
    const fechaNormalizada = new Date(fecha);
    fechaNormalizada.setHours(0, 0, 0, 0);

    const registro = await this.registroDiarioRepository.findOne({
      where: {
        almacenId: almacenId,
        fecha: fechaNormalizada,
        activo: true,
      } as any,
    });

    if (registro && registro.almacenId) {
      registro.almacen = await this.genericNomencladorRepository.findById(
        NomencladorTypeEnum.ALMACEN,
        registro.almacenId,
      );
    }

    return registro;
  }

  /**
   * Suma un movimiento al registro diario (cantidad + ingreso).
   * Se invoca en la entrada, que es donde se cobra.
   * @param registroId ID del registro
   * @param categoriaNombre Nombre del tipo de medio
   * @param cantidad Unidades movidas
   */
  /**
   * SUMA un movimiento de inventario al registro diario (SACI):
   * entradas/salidas totales + detalle por categoría.
   * @param registroId ID del registro
   * @param categoriaNombre Categoría del producto movido
   * @param esEntrada true = ENTRADA (suma), false = SALIDA (suma a salidas)
   * @param cantidad Unidades movidas
   */
  async actualizarRegistroConMovimiento(
    registroId: string,
    categoriaNombre: string,
    esEntrada: boolean,
    cantidad: number,
  ): Promise<RegistroDiarioEntity> {
    if (!isValidObjectId(registroId)) {
      throw new BadRequestException(
        'El ID del registro debe ser un ObjectId válido de MongoDB (24 caracteres hex)',
      );
    }
    const objectId = new ObjectId(registroId);
    const registro = await this.registroDiarioRepository.findOne({
      where: { _id: objectId } as any,
    });

    if (!registro) {
      throw new NotFoundException(
        `Registro diario con ID ${registroId} no encontrado`,
      );
    }

    // Actualizar totales
    if (esEntrada) {
      registro.totalEntradas += cantidad;
    } else {
      registro.totalSalidas += cantidad;
    }

    // Actualizar detalle por categoría
    let detalleEncontrado = false;
    for (const detalle of registro.detalleCategorias) {
      if (detalle.categoria === categoriaNombre) {
        if (esEntrada) {
          detalle.entradas += cantidad;
        } else {
          detalle.salidas += cantidad;
        }
        detalleEncontrado = true;
        break;
      }
    }

    if (!detalleEncontrado) {
      const nuevoDetalle = new DetalleTiposDto();
      nuevoDetalle.categoria = categoriaNombre;
      nuevoDetalle.entradas = esEntrada ? cantidad : 0;
      nuevoDetalle.salidas = esEntrada ? 0 : cantidad;
      registro.detalleCategorias.push(nuevoDetalle);
    }

    return await this.registroDiarioRepository.save(registro);
  }

  /**
   * Cierra el registro diario
   * @param registroId ID del registro
   * @returns Registro cerrado
   */
  async cerrarRegistro(registroId: string): Promise<RegistroDiarioEntity> {
    if (!isValidObjectId(registroId)) {
      throw new BadRequestException(
        'El ID del registro debe ser un ObjectId válido de MongoDB (24 caracteres hex)',
      );
    }
    const objectId = new ObjectId(registroId);
    const registro = await this.registroDiarioRepository.findOne({
      where: { _id: objectId } as any,
    });

    if (!registro) {
      throw new NotFoundException(
        `Registro diario con ID ${registroId} no encontrado`,
      );
    }

    registro.estado = 'cerrado';
    return await this.registroDiarioRepository.save(registro);
  }

  /**
   * Obtiene los registros por rango de fechas
   * @param almacenId ID del almacen
   * @param fechaInicio Fecha de inicio
   * @param fechaFin Fecha de fin
   * @returns Lista de registros
   */
  async findByFechaRange(
    almacenId: string,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<RegistroDiarioEntity[]> {
    const inicio = new Date(fechaInicio);
    inicio.setHours(0, 0, 0, 0);

    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);

    const results = await this.registroDiarioRepository.find({
      where: {
        almacenId: almacenId,
        fecha: { $gte: inicio, $lte: fin } as any,
        activo: true,
      } as any,
      order: { fecha: 'DESC' as any },
    });

    for (const result of results) {
      if (result.almacenId && isValidObjectId(result.almacenId)) {
        result.almacen = await this.genericNomencladorRepository.findById(
          NomencladorTypeEnum.ALMACEN,
          result.almacenId,
        );
      } else if (result.almacenId) {
        console.warn(
          `[BI] Registro con almacenId no válido (${result.almacenId}) se omite en findByFechaRange. Fecha: ${result.fecha}`,
        );
      }
    }

    return results;
  }
}
