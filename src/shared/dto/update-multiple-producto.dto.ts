import { PartialType } from '@nestjs/swagger';
import { CreateProductoDto } from './create-producto.dto';

/**
 * Edición múltiple de productos: {ids: string[], data: UpdateProductoDto}
 * (contrato del endpoint /multiple del GenericController).
 */
export class UpdateMultipleProductoDto {
  ids!: string[];
  data!: Partial<CreateProductoDto>;
}
