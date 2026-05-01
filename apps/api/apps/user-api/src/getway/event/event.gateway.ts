import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

import { EventService } from '@modules/event/event.service';
import { LeaderboardService } from '@modules/leaderboard/leaderboard.service';
import { EventStatus } from '@modules/event/entities/event.entity';
import { RealtimeGatewayService } from '@modules/RealtimeGateway/RealtimeGateway.service';
import { SocketEvents } from '@app/socket-events';
import { EventRedisKeys } from '@app/redis-keys';
import { LeaderboardEntry } from './event.interface';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/gift-room',
})
export class EventGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly eventService: EventService,
    private readonly leaderboardService: LeaderboardService,
    private readonly realTimeService: RealtimeGatewayService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`[WS] connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[WS] disconnected: ${client.id}`);
  }

  @SubscribeMessage(SocketEvents.roomJoin)
  async handleJoin(
    @MessageBody() dto: { eventId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { eventId } = dto;

    const status = await this.eventService.validateAndReseedEvent(
      eventId,
      client,
    );

    if (status !== EventStatus.ACTIVE) {
      return {
        ok: false,
        error:
          status === EventStatus.DRAFT
            ? 'This gift room has not opened yet.'
            : 'This gift room has ended.',
      };
    }

    const [leaderboard, totalTokens] = await Promise.all([
      this.leaderboardService.getTop(eventId, 20),
      this.leaderboardService.getTotalTokens(eventId),
    ]);

    await client.join(EventRedisKeys.event(eventId));

    return { ok: true, leaderboard, totalTokens };
  }

  @SubscribeMessage(SocketEvents.roomLeave)
  async handleLeave(
    @MessageBody() data: { eventId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await client.leave(EventRedisKeys.event(data.eventId));
  }

  broadcastUpdate(
    eventId: string,
    payload: {
      leaderboard: LeaderboardEntry[];
      eventTokenBalance: number;
      eventNairaBalance: number;
      latestGift: {
        displayName: string;
        giftName: string;
        giftEmoji: string;
        tokens: number;
      };
    },
  ) {
    this.realTimeService.emitTo(
      EventRedisKeys.event(eventId),
      SocketEvents.leaderboardUpdate,
      payload,
    );
  }
}
