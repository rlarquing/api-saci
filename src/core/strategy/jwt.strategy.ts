import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../../persistence/repository';
import { AppConfig } from '../../app.keys';
import { IJwtPayload } from '../../shared/interface';
import { UserEntity } from '../../persistence/entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private userRepository: UserRepository,
  ) {
    super({
      ignoreExpiration: false,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get(AppConfig.SECRET),
    });
  }

  async validate(payload: IJwtPayload): Promise<UserEntity> {
    const { userName } = payload;
    const user = await this.userRepository.findByName(userName);
    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
