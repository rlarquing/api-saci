export interface QrEventPayload {
  qrCodigo: string;
  /** La etiqueta es reutilizable: 'asignado' NO la agota. */
  estado: 'disponible' | 'asignado' | 'anulado';
  almacenId?: string;
  timestamp: string;
}
