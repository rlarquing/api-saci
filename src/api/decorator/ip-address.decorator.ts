import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const IpAddress = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();

    // Orden de prioridad para obtener IP real (considerando proxies)
    const ip =
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() || // Primer IP de la cadena de proxies
      request.headers['x-real-ip'] || // Nginx/Apache
      request.connection?.remoteAddress || // Conexión directa
      request.socket?.remoteAddress || // Socket
      request.ip || // Express (si está configurado trust proxy)
      'unknown';

    // Normalizar IPv6 localhost (::1) a IPv4 (127.0.0.1)
    return ip === '::1' ? '127.0.0.1' : ip;
  },
);
