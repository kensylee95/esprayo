import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class RealtimeGatewayService {
  private server: Server;

  // Called from EventGateway.afterInit() — the only point where the real
  // Socket.io server instance exists. @WebSocketServer() does not work in
  // a plain @Injectable(), so we receive it from the gateway instead.
  setServer(server: Server) {
    this.server = server;
  }

  emitTo(room: string, event: string, payload: any) {
    if (!this.server) {
      console.error(
        '[RealtimeGatewayService] server not initialized — call setServer first',
      );
      return;
    }
    console.log(
      `[Realtime] server=${!!this.server} room=${room} event=${event}`,
    );
    this.server.to(room).emit(event, payload);
  }
}
