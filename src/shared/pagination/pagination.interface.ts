/**
 * Interfaces para el sistema de paginación personalizado para MongoDB
 * Este módulo reemplaza nestjs-typeorm-paginate que no funciona correctamente con MongoDB
 */

/**
 * Opciones de paginación
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  route?: string;
}

/**
 * Metadatos de paginación
 */
export interface PaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Enlaces de navegación de paginación
 */
export interface PaginationLinks {
  first: string;
  previous: string;
  next: string;
  last: string;
}

/**
 * Respuesta paginada completa
 */
export interface PaginationResponse<T> {
  items: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

/**
 * Clase Pagination compatible con la interfaz anterior de nestjs-typeorm-paginate
 * para facilitar la migración sin cambios en los controladores
 */
export class Pagination<T> implements PaginationResponse<T> {
  public items: T[];
  public meta: PaginationMeta;
  public links: PaginationLinks;

  constructor(items: T[], meta: PaginationMeta, links: PaginationLinks) {
    this.items = items;
    this.meta = meta;
    this.links = links;
  }

  /**
   * Obtiene los elementos (alias para compatibilidad)
   */
  get data(): T[] {
    return this.items;
  }
}

/**
 * Parámetros de consulta para paginación
 */
export interface PaginationQueryParams {
  page?: number | string;
  limit?: number | string;
  sinPaginacion?: boolean | string;
}

/**
 * Normaliza los parámetros de paginación
 */
export function normalizePaginationParams(
  page?: number | string,
  limit?: number | string,
): { page: number; limit: number } {
  const normalizedPage = Math.max(1, Number(page) || 1);
  const normalizedLimit = Math.min(Math.max(1, Number(limit) || 10), 100);
  return { page: normalizedPage, limit: normalizedLimit };
}
