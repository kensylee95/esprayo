import { Module } from '@nestjs/common';
import { RealtimeGatewayService } from './RealtimeGateway.service';

@Module({
  providers: [RealtimeGatewayService],
  exports: [RealtimeGatewayService],
})
export class RealtimeModule {}
