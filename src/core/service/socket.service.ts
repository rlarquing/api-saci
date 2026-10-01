import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import {
  MenuEventPayload,
  QrEventPayload,
  MovimientoEventPayload,
  NotificacionPayload,
} from '../../shared/dto';

@Injectable()
export class SocketService {
  private readonly menuEvents$ = new Subject<MenuEventPayload>();
  private readonly qrEvents$ = new Subject<QrEventPayload>();
  private readonly movimientoEvents$ = new Subject<MovimientoEventPayload>();
  private readonly notificacionEvents$ = new Subject<NotificacionPayload>();

  getHello(): string {
    return 'Hello World!';
  }

  emitMenuChange(event: MenuEventPayload): void {
    this.menuEvents$.next(event);
  }

  onMenuChange(): Observable<MenuEventPayload> {
    return this.menuEvents$.asObservable();
  }

  emitQrEvent(event: QrEventPayload): void {
    this.qrEvents$.next(event);
  }

  onQrEvent(): Observable<QrEventPayload> {
    return this.qrEvents$.asObservable();
  }

  emitMovimientoEvent(event: MovimientoEventPayload): void {
    this.movimientoEvents$.next(event);
  }

  onMovimientoEvent(): Observable<MovimientoEventPayload> {
    return this.movimientoEvents$.asObservable();
  }

  /** Push de umbrales de stock (campana del panel y alertas del escáner). */
  emitNotificacion(event: NotificacionPayload): void {
    this.notificacionEvents$.next(event);
  }

  onNotificacion(): Observable<NotificacionPayload> {
    return this.notificacionEvents$.asObservable();
  }
}
