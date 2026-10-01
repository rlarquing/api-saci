/**
 * Generador de CSV (RFC 4180 adaptado a Excel es-ES):
 * - Separador ';' (Excel en configuración regional española lo parte bien)
 * - BOM UTF-8 para que Excel respete acentos y ñ
 * - Escapado de comillas, separadores y saltos de línea
 */
export function toCsvBuffer(
  headers: string[],
  keys: string[],
  rows: Array<Record<string, any>>,
): Buffer {
  const escapar = (valor: any): string => {
    const s = valor === null || valor === undefined ? '' : String(valor);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lineas: string[] = [headers.map(escapar).join(';')];
  for (const fila of rows) {
    lineas.push(keys.map((k) => escapar(fila[k])).join(';'));
  }

  return Buffer.from('\uFEFF' + lineas.join('\r\n'), 'utf8');
}

/** Fecha ISO → formato legible para reportes (dd/mm/aaaa hh:mm). */
export function fechaLegible(valor: any): string {
  if (!valor) return '';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return String(valor);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
