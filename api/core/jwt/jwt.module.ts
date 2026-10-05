import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtCoreService } from './jwt.service';

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [JwtCoreService],
  exports: [JwtCoreService],
})
export class JwtCoreModule {}
