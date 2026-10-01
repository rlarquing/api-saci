import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppConfig } from '../../app.keys';
import { UserRepository } from '../../persistence/repository';
import { UserEntity } from '../../persistence/entity';
import { MovimientoInventarioService } from './movimiento-inventario.service';
import { MailService } from '../../mail/mail.service';

interface FilaAlerta {
  productoCodigo: string;
  productoNombre: string;
  almacenNombre: string;
  stock: number;
  stockMinimo: number;
  puntoReorden: number;
  sugerido: number;
  estado: 'BAJO_MINIMO' | 'REORDEN';
}

/**
 * Digerido diario de stock por email (backlog P2 — nota de implementación).
 *
 * Cada mañana a las 7:00 construye la lista de productos por debajo del punto
 * de reorden y la envía por email a los usuarios ADMINISTRADOR activos.
 * Se activa SOLO con EMAIL_DIGEST=true en .env (necesita SMTP configurado);
 * sin flag no hace nada y no lanza errores. El push en vivo vive en el
 * evento socket 'notificacion'; esto es el resumen asíncrono.
 */
@Injectable()
export class DigestService {
  private readonly logger = new Logger(DigestService.name);

  constructor(
    private configService: ConfigService,
    private movimientoInventarioService: MovimientoInventarioService,
    private userRepository: UserRepository,
    private mailService: MailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async enviarDigestDiario(): Promise<void> {
    const flag = this.configService.get(AppConfig.EMAIL_DIGEST);
    if (String(flag) !== 'true') return;

    try {
      const alertas: FilaAlerta[] =
        await this.movimientoInventarioService.bajoMinimo();
      if (alertas.length === 0) {
        this.logger.log('Digest: sin productos bajo el punto de reorden');
        return;
      }

      const destinatarios = await this.destinatariosAdmin();
      if (destinatarios.length === 0) {
        this.logger.warn('Digest: no hay usuarios ADMINISTRADOR con email');
        return;
      }

      const html = this.construirHtml(alertas);
      await this.mailService.sendHtml(
        destinatarios,
        `SACI — Digerido diario: ${alertas.length} producto(s) requieren reposición`,
        html,
      );
      this.logger.log(
        `Digest enviado a ${destinatarios.length} admin(s): ${alertas.length} alerta(s)`,
      );
    } catch (error) {
      // El digest nunca debe tumbar la API.
      this.logger.error(`Digest diario falló: ${error?.message ?? error}`);
    }
  }

  /** Usuarios ADMINISTRADOR activos con email (el rol vive embebido). */
  private async destinatariosAdmin(): Promise<string[]> {
    try {
      const usuarios: UserEntity[] = await this.userRepository.createSelect();
      return usuarios
        .filter(
          (u) =>
            u.activo &&
            !!u.email &&
            u.roles?.some((r: any) => r?.nombre === 'ADMINISTRADOR'),
        )
        .map((u) => u.email);
    } catch {
      return [];
    }
  }

  private construirHtml(alertas: FilaAlerta[]): string {
    const filas = alertas
      .map(
        (a) => `<tr>
  <td style="padding:6px 10px;border:1px solid #e5e7eb">${a.productoCodigo}</td>
  <td style="padding:6px 10px;border:1px solid #e5e7eb">${a.productoNombre}</td>
  <td style="padding:6px 10px;border:1px solid #e5e7eb">${a.almacenNombre}</td>
  <td style="padding:6px 10px;border:1px solid #e5e7eb;text-align:right">${a.stock}</td>
  <td style="padding:6px 10px;border:1px solid #e5e7eb;text-align:right">${a.puntoReorden}</td>
  <td style="padding:6px 10px;border:1px solid #e5e7eb;text-align:right"><b>${a.sugerido}</b></td>
  <td style="padding:6px 10px;border:1px solid #e5e7eb">${
    a.estado === 'BAJO_MINIMO'
      ? '<span style="color:#b91c1c">BAJO MÍNIMO</span>'
      : '<span style="color:#b45309">REORDEN</span>'
  }</td>
</tr>`,
      )
      .join('');

    return `<div style="font-family:sans-serif;max-width:720px">
  <h2 style="color:#0F766E;margin-bottom:4px">SACI — Digerido diario de inventario</h2>
  <p style="color:#374151">Productos por debajo del punto de reorden (mínimo + seguridad):</p>
  <table style="border-collapse:collapse;font-size:13px">
    <thead>
      <tr style="background:#f3f4f6">
        <th style="padding:6px 10px;border:1px solid #e5e7eb">SKU</th>
        <th style="padding:6px 10px;border:1px solid #e5e7eb">Producto</th>
        <th style="padding:6px 10px;border:1px solid #e5e7eb">Almacén</th>
        <th style="padding:6px 10px;border:1px solid #e5e7eb">Stock</th>
        <th style="padding:6px 10px;border:1px solid #e5e7eb">Punto reorden</th>
        <th style="padding:6px 10px;border:1px solid #e5e7eb">Sugerido</th>
        <th style="padding:6px 10px;border:1px solid #e5e7eb">Estado</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>
  <p style="color:#6b7280;font-size:12px;margin-top:16px">
    Informe automático de SACI. Configúralo con EMAIL_DIGEST en el .env de la API.
  </p>
</div>`;
  }
}
