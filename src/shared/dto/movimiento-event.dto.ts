export interface MovimientoEventPayload {
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'TRASLADO';
  almacenId?: string;
  movimientoId?: string;
  productoCodigo?: string;
  cantidad?: number;
  timestamp: string;
}
