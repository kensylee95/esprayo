import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { EventService } from '@modules/event/event.service';
import { LeaderboardService } from '@modules/leaderboard/leaderboard.service';
import { EventStatus } from '@modules/event/entities/event.entity';
import { SocketEvents } from '@app/socket-events';
import { RealtimeGatewayService } from '@modules/RealtimeGateway/RealtimeGateway.service';

const socketRoom = (eventId: string) => `gift-room:${eventId}`;

@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket'],
  namespace: '/gift-room',
})
export class EventGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  private readonly server: Server;

  constructor(
    private readonly eventService: EventService,
    private readonly leaderboardService: LeaderboardService,
    private readonly realtimeGatewayService: RealtimeGatewayService,
  ) {}

  // Called by NestJS after the WebSocket server is fully initialized.
  // This is the only place where `this.server` is guaranteed to be set,
  // so we hand it to RealtimeGatewayService here so the worker can use it.
  afterInit(server: Server) {
    console.log('After init was fired!');
    this.realtimeGatewayService.setServer(server);
  }

  handleConnection(client: Socket) {
    console.log(`[WS /gift-room] connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[WS /gift-room] disconnected: ${client.id}`);
  }

  @SubscribeMessage(SocketEvents.roomJoin)
  async handleJoin(
    @MessageBody()
    dto: { eventId: string; role?: 'guest' | 'display' | 'host' },
    @ConnectedSocket() client: Socket,
  ) {
    const { eventId, role = 'guest' } = dto;

    const status = await this.eventService.validateAndReseedEvent(
      eventId,
      client,
    );

    if (status !== EventStatus.ACTIVE) {
      const error =
        status === EventStatus.DRAFT
          ? 'This gift room has not opened yet.'
          : 'This gift room has ended.';

      client.emit(SocketEvents.roomError, { message: error });
      return { ok: false, error };
    }

    const [leaderboard, totalTokens] = await Promise.all([
      this.leaderboardService.getTop(eventId, 20),
      this.leaderboardService.getTotalTokens(eventId),
    ]);

    await client.join(socketRoom(eventId));

    client.emit(SocketEvents.leaderboardSnapshot, {
      leaderboard,
      totalTokens,
      role,
    });

    return { ok: true, leaderboard, totalTokens };
  }

  @SubscribeMessage(SocketEvents.roomLeave)
  async handleLeave(
    @MessageBody() data: { eventId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await client.leave(socketRoom(data.eventId));
  }
}
