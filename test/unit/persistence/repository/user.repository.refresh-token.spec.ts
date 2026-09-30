import * as dayjs from 'dayjs';
import { UserRepository } from '../../../../src/persistence/repository/user.repository';

/**
 * `AuthService.getRefreshToken` persiste `refreshTokenExp` como STRING
 * 'YYYY/MM/DD'. MongoDB aplica type bracketing: los operadores de comparación
 * solo cruzan valores del mismo tipo BSON, así que filtrar con un Date nunca
 * casaba y todo refresh terminaba en 'token expired'.
 */
describe('UserRepository.validateRefreshToken', () => {
  const buildRepository = () => {
    const filtros: any[] = [];
    const repository = new UserRepository(
      {
        findOne: async (options: any) => {
          filtros.push(options.where);
          return null;
        },
      } as any,
      {} as any,
      {} as any,
    );
    return { repository, filtros };
  };

  it('filtra la expiración con el mismo tipo con el que se persiste (string)', async () => {
    const { repository, filtros } = buildRepository();

    await repository.validateRefreshToken('usuario', 'token-de-refresco');

    const expiracion = filtros[0].refreshTokenExp.$gte;
    expect(typeof expiracion).toBe('string');
    expect(expiracion).toMatch(/^\d{4}\/\d{2}\/\d{2}$/);
    expect(expiracion).toBe(dayjs().format('YYYY/MM/DD'));
  });

  it('un refreshToken emitido hoy sigue vigente con la comparación lexicográfica', () => {
    // Es lo que escribe AuthService.getRefreshToken.
    const emitido = dayjs().add(1, 'day').format('YYYY/MM/DD');
    const hoy = dayjs().format('YYYY/MM/DD');
    const caducado = dayjs().subtract(1, 'day').format('YYYY/MM/DD');

    expect(emitido >= hoy).toBe(true);
    expect(caducado >= hoy).toBe(false);
  });
});
