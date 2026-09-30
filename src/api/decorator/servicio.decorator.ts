import { SetMetadata } from '@nestjs/common';
export const Servicio = (controller: any, servicio: string) => {
  return SetMetadata('servicio', controller + '.' + servicio);
};
