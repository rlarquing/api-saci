/**
 * Helper de paginación para MongoDB con TypeORM
 * Implementa paginación nativa usando los métodos de MongoRepository
 *
 * NOTA: MongoRepository.countDocuments() es más confiable que aggregate() para contar
 */

import { MongoRepository, FindManyOptions, ObjectLiteral } from 'typeorm';
import {
  Pagination,
  PaginationOptions,
  PaginationMeta,
  PaginationLinks,
} from './pagination.interface';

/**
 * Función principal de paginación para MongoDB
 * @param repository - Repositorio de TypeORM para MongoDB
 * @param options - Opciones de paginación
 * @param findOptions - Opciones de búsqueda de TypeORM
 * @returns Promise<Pagination<T>> - Resultado paginado
 */
export async function paginateMongo<T extends ObjectLiteral>(
  repository: MongoRepository<T>,
  options: PaginationOptions,
  findOptions?: FindManyOptions<T>,
): Promise<Pagination<T>> {
  const { page, limit, route } = options;

  // Validar parámetros
  const normalizedPage = Math.max(1, page);
  const normalizedLimit = Math.min(Math.max(1, limit), 100);
  const skip = (normalizedPage - 1) * normalizedLimit;

  // Construir el filtro de búsqueda para MongoDB
  const filterQuery = (findOptions?.where as any) || {};

  // Usar countDocuments() de MongoRepository - es más confiable que aggregate()
  // Este método usa el driver nativo de MongoDB internamente
  let totalCount: number;

  try {
    // MongoRepository.countDocuments() acepta el filtro directamente
    totalCount = await repository.countDocuments(filterQuery);
  } catch (error) {
    // Fallback: usar count() si countDocuments falla
    console.warn(
      'Fallback a repository.count() debido a error con countDocuments:',
      error,
    );
    totalCount = await repository.count({
      where: filterQuery,
    } as any);
  }

  // Calcular metadatos
  const totalPages = Math.ceil(totalCount / normalizedLimit);

  // Obtener los elementos de la página actual
  const items = await repository.find({
    ...findOptions,
    where: filterQuery,
    skip: skip,
    take: normalizedLimit,
  });

  // Construir metadatos
  const meta: PaginationMeta = {
    totalItems: totalCount,
    itemCount: items.length,
    itemsPerPage: normalizedLimit,
    totalPages: totalPages,
    currentPage: normalizedPage,
  };

  // Construir enlaces de navegación
  const links: PaginationLinks = buildLinks(
    route,
    normalizedPage,
    normalizedLimit,
    totalPages,
  );

  return new Pagination<T>(items, meta, links);
}

/**
 * Construye los enlaces de navegación para la paginación
 */
function buildLinks(
  route: string = '',
  currentPage: number,
  limit: number,
  totalPages: number,
): PaginationLinks {
  const first = route ? `${route}?limit=${limit}` : '';
  const previous =
    currentPage > 1 ? `${route}?page=${currentPage - 1}&limit=${limit}` : '';
  const next =
    currentPage < totalPages
      ? `${route}?page=${currentPage + 1}&limit=${limit}`
      : '';
  const last =
    totalPages > 0 ? `${route}?page=${totalPages}&limit=${limit}` : '';

  return {
    first,
    previous,
    next,
    last,
  };
}

/**
 * Función de paginación alternativa usando agregación de MongoDB
 * Útil para consultas más complejas con joins o proyecciones
 */
export async function paginateMongoAggregate<T extends ObjectLiteral>(
  repository: MongoRepository<T>,
  options: PaginationOptions,
  pipeline: any[] = [],
): Promise<Pagination<T>> {
  const { page, limit, route } = options;

  const normalizedPage = Math.max(1, page);
  const normalizedLimit = Math.min(Math.max(1, limit), 100);
  const skip = (normalizedPage - 1) * normalizedLimit;

  // Pipeline para contar total
  const countPipeline = [...pipeline, { $count: 'total' }];
  const countResult = await repository.aggregate(countPipeline).toArray();
  const totalCount = countResult.length > 0 ? countResult[0].total : 0;

  // Pipeline para obtener elementos paginados
  const dataPipeline = [
    ...pipeline,
    { $skip: skip },
    { $limit: normalizedLimit },
  ];
  const items = (await repository.aggregate(dataPipeline).toArray()) as T[];

  const totalPages = Math.ceil(totalCount / normalizedLimit);

  const meta: PaginationMeta = {
    totalItems: totalCount,
    itemCount: items.length,
    itemsPerPage: normalizedLimit,
    totalPages: totalPages,
    currentPage: normalizedPage,
  };

  const links: PaginationLinks = buildLinks(
    route,
    normalizedPage,
    normalizedLimit,
    totalPages,
  );

  return new Pagination<T>(items, meta, links);
}
