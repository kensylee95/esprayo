import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket'],
})
export class RealtimeGatewayService {
  @WebSocketServer()
  server: Server;

  emitToEvent(eventId: string, event: string, data: any) {
    this.server?.to(`event:${eventId}`).emit(event, data);
  }
}