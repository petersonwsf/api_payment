import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PixController } from './modules/pix/controller/PixController';

@Module({
  imports: [],
  controllers: [AppController, PixController],
  providers: [AppService],
})
export class AppModule {}
