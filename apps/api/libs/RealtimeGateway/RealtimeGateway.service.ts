import { Injectable } from '@nestjs/common';
import { WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@Injectable()
export class RealtimeGatewayService {
  @WebSocketServer()
  server: Server;

  emitTo(room: string, event: string, payload: any) {
    this.server.to(room).emit(event, payload);
  }
}
