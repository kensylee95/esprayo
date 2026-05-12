import { Global, Module } from '@nestjs/common';
import { RealtimeGatewayService } from './RealtimeGateway.service';
@Global()
@Module({
  providers: [RealtimeGatewayService],
  exports: [RealtimeGatewayService],
})
export class RealtimeModule {}
