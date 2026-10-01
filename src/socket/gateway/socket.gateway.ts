import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UserRepository, RolRepository } from '../../persistence/repository';
import { SocketService } from '../../core/service';
import { MenuEventPayload, NotificacionPayload } from '../../shared/dto';
import { Subscription } from 'rxjs';
import { UserEntity } from '../../persistence/entity';

@WebSocketGateway({ cors: { origin: '*' } })
export class SocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  protected clientes: Map<
    string,
    { socket: Socket; user: UserEntity; roles: string[] }
  > = new Map();
  private menuSubscription: Subscription;
  private qrSubscription: Subscription;
  private movimientoSubscription: Subscription;
  private notificacionSubscription: Subscription;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly rolRepository: RolRepository,
    private readonly socketService: SocketService,
  ) {}

  afterInit() {
    this.menuSubscription = this.socketService
      .onMenuChange()
      .subscribe((event) => {
        this.server.emit('menu:change', event);
      });
    this.qrSubscription = this.socketService.onQrEvent().subscribe((event) => {
      this.server.emit('qr:estado', event);
    });
    this.movimientoSubscription = this.socketService
      .onMovimientoEvent()
      .subscribe((event) => {
        this.server.emit('movimiento:change', event);
      });
    this.notificacionSubscription = this.socketService
      .onNotificacion()
      .subscribe((event: NotificacionPayload) => {
        this.server.emit('notificacion', event);
      });
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user: UserEntity = await this.userRepository.findByName(
        payload.userName,
      );

      if (!user) {
        client.disconnect();
        return;
      }

      const roles: string[] = [];
      if (user.roles) {
        for (const rol of user.roles) {
          roles.push(rol.nombre);
          client.join(`room:${rol.nombre}`);
        }
      }

      this.clientes.set(client.id, { socket: client, user, roles });
      console.log(
        `Client connected: ${user.userName} [rooms: ${roles.join(', ')}]`,
      );
    } catch {
      console.log('Connection rejected: invalid token');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const clientData = this.clientes.get(client.id);
    if (clientData) {
      console.log(`Client disconnected: ${clientData.user.userName}`);
      for (const roleName of clientData.roles) {
        client.leave(`room:${roleName}`);
      }
      this.clientes.delete(client.id);
    }
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() message: string): void {
    this.server.emit('message', message);
  }

  @SubscribeMessage('saludo')
  saludo(): void {
    this.server.emit('saludo', 'Hello World!');
  }

  @SubscribeMessage('registro')
  registro(@ConnectedSocket() client: Socket, @MessageBody() data: any): void {
    console.log('Registro:', data);
  }

  emitMenuChange(event: MenuEventPayload): void {
    this.server.emit('menu:change', event);
  }

  getConnectedClients(): number {
    return this.clientes.size;
  }

  getClientsByRole(roleName: string): string[] {
    const clients: string[] = [];
    this.clientes.forEach((data, clientId) => {
      if (data.roles.includes(roleName)) {
        clients.push(clientId);
      }
    });
    return clients;
  }
}
