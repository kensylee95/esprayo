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
import { Inject, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';

import { EventService } from '@modules/event/event.service';
import {
  LeaderboardEntry,
  LeaderboardService,
} from '@modules/leaderboard/leaderboard.service';
import { WalletService } from '@modules/wallet/wallet.service';
import { EventStatus } from '@modules/event/entities/event.entity';
import { SocketEvents } from '@app/socket-events';
import { RealtimeGatewayService } from '@modules/RealtimeGateway/RealtimeGateway.service';
import { CurrentUser } from '@modules/auth/src';
import { REDIS_CLIENT } from '@modules/redis/redis.module';
import { GiftService } from '@modules/gift/gift.service';

const socketRoom = (eventId: string): string => `gift-room:${eventId}`;

type RoomRole = 'guest' | 'display' | 'host';

interface JoinRoomDto {
  eventId: string;
  role?: RoomRole;
}

interface LeaveRoomDto {
  eventId: string;
}

interface SocketData {
  eventId?: string | null;
  role?: RoomRole | null;
  userId?: string | null;
}

interface ServerToClientEvents {
  [SocketEvents.roomError]: (payload: { message: string }) => void;

  [SocketEvents.guestCountUpdate]: (payload: { guestCount: number }) => void;

  [SocketEvents.leaderboardSnapshot]: (payload: {
    leaderboard: LeaderboardEntry[];
    totalTokens: number;
    totalGifts: number;
    walletBalance: number | null;
    guestCount: number;
    role: RoomRole;
  }) => void;
}

type GiftRoomSocket = Socket<
  Record<string, never>,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket'],
  namespace: '/gift-room',
})
export class EventGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventGateway.name);

  constructor(
    private readonly eventService: EventService,
    private readonly leaderboardService: LeaderboardService,
    private readonly realtimeGatewayService: RealtimeGatewayService,
    private readonly walletService: WalletService,
    private readonly giftService: GiftService,

    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  private guestCountKey(eventId: string): string {
    return `event:${eventId}:guest_count`;
  }

  private guestActiveKey(userId: string): string {
    return `guest:active:${userId}`;
  }

  afterInit(server: Server): void {
    this.logger.log('Gift room websocket initialized');

    this.realtimeGatewayService.setServer(server);
  }

  handleConnection(client: GiftRoomSocket): void {
    this.logger.log(`[WS /gift-room] connected: ${client.id}`);
  }

  async handleDisconnect(client: GiftRoomSocket): Promise<void> {
    this.logger.log(`[WS /gift-room] disconnected: ${client.id}`);

    const { eventId, role, userId } = client.data;

    if (!eventId || role !== 'guest' || !userId) {
      return;
    }

    try {
      const socketId = await this.redis.get(this.guestActiveKey(userId));

      if (socketId !== client.id) {
        return;
      }

      await this.redis.del(this.guestActiveKey(userId));

      const guestCount = await this.redis.decr(this.guestCountKey(eventId));

      this.realtimeGatewayService.emitTo(
        socketRoom(eventId),
        SocketEvents.guestCountUpdate,
        {
          guestCount: Math.max(0, guestCount),
        },
      );
    } catch (error) {
      this.logger.error(
        'guest_count.decr failed',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  @SubscribeMessage(SocketEvents.roomJoin)
  async handleJoin(
    @CurrentUser('id')
    userId: string,

    @MessageBody()
    dto: JoinRoomDto,

    @ConnectedSocket()
    client: GiftRoomSocket,
  ) {
    try {
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

        client.emit(SocketEvents.roomError, {
          message: error,
        });

        return {
          ok: false,
          error,
        };
      }

      client.data.eventId = eventId;

      client.data.role = role;

      client.data.userId = userId;

      await client.join(socketRoom(eventId));

      let guestCount = 0;

      if (role === 'guest') {
        const isNew = await this.redis.set(
          this.guestActiveKey(userId),
          client.id,
          'EX',
          86400,
          'NX',
        );

        if (isNew) {
          guestCount = await this.redis.incr(this.guestCountKey(eventId));

          if (guestCount === 1) {
            void this.redis.expire(this.guestCountKey(eventId), 86400);
          }
        } else {
          await this.redis.set(
            this.guestActiveKey(userId),
            client.id,
            'EX',
            86400,
          );

          guestCount = Number(
            (await this.redis.get(this.guestCountKey(eventId))) ?? '0',
          );
        }
      } else {
        guestCount = Number(
          (await this.redis.get(this.guestCountKey(eventId))) ?? '0',
        );
      }

      const [leaderboard, totalTokens, totalGifts, walletBalance] =
        await Promise.all([
          this.leaderboardService.getTop(eventId, 20),

          this.leaderboardService.getTotalTokens(eventId),

          this.giftService.getEventGiftCount(eventId),

          role === 'guest'
            ? this.walletService.getBalance(userId).catch(() => null)
            : Promise.resolve(null),
        ]);

      client.to(socketRoom(eventId)).emit(SocketEvents.guestCountUpdate, {
        guestCount,
      });

      client.emit(SocketEvents.leaderboardSnapshot, {
        leaderboard,
        totalTokens,
        totalGifts,
        walletBalance,
        guestCount,
        role,
      });

      return {
        ok: true,
        leaderboard,
        totalTokens,
        totalGifts,
        walletBalance,
        guestCount,
      };
    } catch (error) {
      this.logger.error(
        'handleJoin failed',
        error instanceof Error ? error.stack : String(error),
      );

      client.emit(SocketEvents.roomError, {
        message: 'Internal error joining room',
      });

      return {
        ok: false,
        error: 'Internal error',
      };
    }
  }

  @SubscribeMessage(SocketEvents.roomLeave)
  async handleLeave(
    @MessageBody()
    dto: LeaveRoomDto,

    @ConnectedSocket()
    client: GiftRoomSocket,
  ): Promise<void> {
    const { eventId } = dto;

    const { role, userId } = client.data;

    await client.leave(socketRoom(eventId));

    if (role === 'guest' && userId) {
      try {
        const socketId = await this.redis.get(this.guestActiveKey(userId));

        if (socketId === client.id) {
          await this.redis.del(this.guestActiveKey(userId));

          const guestCount = await this.redis.decr(this.guestCountKey(eventId));

          this.realtimeGatewayService.emitTo(
            socketRoom(eventId),
            SocketEvents.guestCountUpdate,
            {
              guestCount: Math.max(0, guestCount),
            },
          );
        }
      } catch (error) {
        this.logger.error(
          'guest_count.decr failed',
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    client.data.eventId = null;

    client.data.role = null;

    client.data.userId = null;
  }
}
