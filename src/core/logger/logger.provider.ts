import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../app.keys';
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerProvider extends ConsoleLogger {
  levels: string[] = ['error', 'warn', 'log', 'verbose', 'debug'];
  constructor(private configService: ConfigService) {
    super();
    this.levels = this.configService.get(AppConfig.LOGGERLEVELS) ?? this.levels;
  }

  log(message: string, context?: string) {
    if (this.levels.includes('log')) {
      super.log(message, context);
    }
  }
  error(message: string, trace?: string, context?: string) {
    if (this.levels.includes('error')) {
      super.error(message, trace, context);
    }
  }
  warn(message: string, context?: string) {
    if (this.levels.includes('warn')) {
      super.warn(message, context);
    }
  }
  debug(message: string, context?: string) {
    if (this.levels.includes('debug')) {
      super.debug(message, context);
    }
  }
  verbose(message: string, context?: string) {
    if (this.levels.includes('verbose')) {
      super.verbose(message, context);
    }
  }
}
