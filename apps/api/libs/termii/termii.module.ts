import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import termiiConfig from './termii.config';
import { TermiiService } from './termii.service';

@Module({
  imports: [ConfigModule.forFeature(termiiConfig)],
  providers: [TermiiService],
  exports: [TermiiService],
})
export class TermiiModule {}
