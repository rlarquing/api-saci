export const removeItemFromArr = (
  arr: any[],
  item: any,
  field: string,
): any[] => {
  return arr.filter((e) => e[field] !== item[field]);
};
export const removeFromArr = (arr: any[], item: any): any[] => {
  return arr.filter((e) => e !== item);
};
export const encuentra = (array: any[], elem: any, field: any): boolean => {
  return array.some((item: any) => item[field] === elem[field]);
};
export const buscarValor = (objetos: any[], valor: string): any[] => {
  return objetos.filter((objeto: any) => {
    return Object.values(objeto).some(
      (campo) => String(campo).indexOf(valor) !== -1,
    );
  });
};
export const paginarArreglo = (
  arreglo: any[],
  limit: number,
  offset: number,
): any[] => {
  return arreglo.slice(offset, offset + limit);
};
const hasPrimitiveType = (x: any): boolean => {
  return (
    typeof x == 'boolean' ||
    typeof x == 'number' ||
    typeof x == 'string' ||
    typeof x == 'symbol' ||
    x instanceof Boolean ||
    x instanceof Number ||
    x instanceof String
  );
};
export const isEquals = (a: any, b: any): boolean => {
  if (hasPrimitiveType(a) && hasPrimitiveType(b)) {
    return a === b; // coerción en primitivos
  } else if (a instanceof Array && b instanceof Array) {
    if (a.length == 0) {
      return b.length == 0;
    } else if (b.length == 0) {
      return a.length == 0;
    } else if (a.length !== b.length) {
      return false;
    } else {
      for (let i = 0; i < a.length; i++) {
        if (!isEquals(a[i], b[i])) {
          return false;
        }
      }
    }
  } else {
    return deepEqual(a, b);
  }
  return true;
};

const deepEqual = (object1: any, object2: any): boolean => {
  const keys1: string[] = Object.keys(object1);
  const keys2: string[] = Object.keys(object2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    const val1: any = object1[key];
    const val2: any = object2[key];
    const areObjects: boolean = isObject(val1) && isObject(val2);
    if (
      (areObjects && !deepEqual(val1, val2)) ||
      (!areObjects && val1 !== val2)
    ) {
      return false;
    }
  }

  return true;
};

function isObject(object: any) {
  return object != null && typeof object === 'object';
}

export const eliminarDuplicado = (array: any): any[] => {
  const newArray: any = [];
  let esta = false;
  for (let i = 0; i <= array.length - 1; i++) {
    for (let j = i + 1; j < array.length; j++) {
      if (isEquals(array[i], array[j])) {
        esta = true;
      }
    }
    if (!esta) {
      newArray.push(array[i]);
    }
    esta = false;
  }
  return newArray;
};
export const findElemento = (lista: any[], elemento: any): any => {
  for (const item of lista) {
    if (deepEqual(item, elemento)) {
      return item;
    }
  }
  return -1;
};
export const aInicialMayuscula = (str: string): string => {
  let result: string = str;
  if (result.length > 0) {
    result = result.substring(0, 1).toLocaleUpperCase();
  }
  if (str.length > 1) {
    result += str.substring(1);
  }
  return result;
};
export const aInicialMinuscula = (str: string): string => {
  let result: string = str;
  if (result.length > 0) {
    result = result.substring(0, 1).toLocaleLowerCase();
  }
  if (str.length > 1) {
    result += str.substring(1);
  }
  return result;
};
export const esMayuscula = (char: string) => {
  return char === char.toLocaleUpperCase();
};
export const formatearNombre = (str: string, separador: string) => {
  if (str.length === 0) {
    return '';
  }
  if (str.indexOf('_') !== -1) {
    separador = '_';
  }
  let resultado = str[0].toLocaleLowerCase();
  for (let i = 1; i < str.length; i++) {
    if (esMayuscula(str[i])) {
      resultado += separador;
    }
    resultado += str[i].toLocaleLowerCase();
  }
  return resultado;
};
export const quitarSeparador = (str: string, separador: string): string => {
  if (str.length === 0) {
    return '';
  }
  if (str.indexOf('_') !== -1) {
    separador = '_';
  }
  const resultado: any = str
    .split(separador)
    .map((item) => aInicialMayuscula(item));
  return resultado.join('');
};
export const eliminarSufijo = (str: string, s: string) => {
  if (right(str, s.length) === s) {
    return left(str, str.length - s.length);
  } else {
    return str;
  }
};
export const left = (str: string, l: number) => {
  return str.substring(0, l);
};
export const right = (str: string, l: number) => {
  return str.substring(str.length - l);
};
export const parseFormula = (expression: string, solver?: any) => {
  let _f: string;
  function isOperation(l: string) {
    const tmp: string = String(l).trim();
    return (
      tmp.indexOf('+') !== -1 ||
      tmp.indexOf('-') !== -1 ||
      tmp.indexOf('*') !== -1 ||
      tmp.indexOf('/') !== -1 ||
      tmp.indexOf('(') !== -1 ||
      tmp.indexOf(')') !== -1
    );
  }
  function isNumber(str: any) {
    try {
      const tmp = Number(String(str).trim());
      // pero además...
      return !((str !== 0 && str !== '0' && tmp === 0) || isNaN(tmp));
    } catch {
      return false;
    }
  }
  function _evaluate(l: number, r: number) {
    // ok
    if (r >= _f.length) {
      r = _f.length - 1;
    }
    // La validación de la división por cero se resuelve dentro de la clase BigInteger
    let wo: number, op: number, k: number;
    let t1 = 0;
    let t2 = 0;
    k = 0; // parenthesis level
    wo = 0; // were operator is ?
    op = 8; //
    // Substituir un segmento de la cadena por la cadena original...
    function substituir(s: string, start: number, end: number, subStr: string) {
      const prefijo: string = start === 0 ? '' : s.substring(0, start);
      const sufijo: string = end === s.length - 1 ? '' : s.substring(end + 1);
      return prefijo + subStr + sufijo;
    }
    // Sintactical analizer (where the operator in position ends, else position of next char).
    function sintaxCheck(cadena: string, posicion: number) {
      let endComment;
      if (
        !cadena ||
        cadena.length === 0 ||
        posicion < 0 ||
        posicion >= cadena.length
      ) {
        return -1;
      }
      // pares
      const pares: any[] = [
        { start: '(', end: ')' },
        { start: '{', end: '}' },
        { start: '[', end: ']' },
      ];
      if (cadena.substring(posicion, posicion + 2) === '//') {
        // Line comment, until CR or EOF
        endComment = cadena.indexOf('\n', posicion + 2);
        if (endComment === -1) {
          return cadena.length - 1;
        }
        return endComment + 1; // hasta cr
      } else if (cadena.substring(posicion, posicion + 2) === '/*') {
        // Block comment, always until */, or error
        endComment = cadena.indexOf('*/', posicion + 2);
        return endComment; // sino, completo.
      }
      // De otro modo
      switch (cadena[posicion]) {
        case "'": // simples
          return cadena.indexOf("'", posicion + 1);
        case '`': // francesas
          return (posicion = cadena.indexOf('`', posicion + 1));
        case '"': // dobles
          return cadena.indexOf('"', posicion + 1);
        default: {
          let q;
          for (let i = 0; i < pares.length; i++) {
            if (
              cadena.substr(posicion, pares[i].start.length) === pares[i].start
            ) {
              q = posicion + pares[i].start.length; // reubica el puntero
              while (q !== -1 && q < cadena.length) {
                if (cadena.substr(q, pares[i].end.length) === pares[i].end) {
                  return q + pares[i].end.length - 1;
                } else {
                  q = sintaxCheck(cadena, q);
                  if (q !== -1 && q < cadena.length) {
                    q++;
                  } else {
                    return -1;
                  }
                }
              }
              return -1;
            }
          }
          // None of them
        }
      }
      // Sino retorna posición y ya...
      return posicion;
    }
    let wep: any;
    let delta: number;
    if (_f.charAt(l) === '(' && _f.charAt(r) === ')') {
      wep = sintaxCheck(_f, l);
      if (wep && wep - 1 <= r) {
        if (wep - 1 === r) {
          return _evaluate(l + 1, r - 1);
        } else {
          delta = _f.length;
          _f = substituir(_f, l, wep - 1, _evaluate(l + 1, wep - 2));
          delta = delta - _f.length;
          r = r - delta;
        }
      }
    }
    for (let i = l; i < r; i = i + 1) {
      // validación de paréntesis
      if (k < 0)
        throw new Error(
          `La expresión tiene ${_f}, tiene paréntesis mal formados en la posición ${i}.`,
        );
      switch (_f.charAt(i)) {
        case '(': {
          k = k + 1;
          break;
        }
        case ')': {
          k = k - 1;
          break;
        }
        case '+': {
          if (k == 0) {
            wo = i;
            op = 1;
          }
          break;
        }
        case '-': {
          if (k == 0) {
            wo = i;
            op = 2;
          }
          break;
        }
        case '*': {
          if (k == 0 && op > 2) {
            wo = i;
            op = 3;
          }
          break;
        }
        case '/': {
          if (k == 0 && op > 2) {
            wo = i;
            op = 4;
          }
          break;
        }
      }
    }
    if (op < 5) {
      t1 = _evaluate(l, wo - 1);
      t2 = _evaluate(wo + 1, r);
    }
    switch (op) {
      case 1:
        return String(Number(t1) + Number(t2));
      case 2:
        return String(Number(t1) - Number(t2));
      case 3:
        return String(Number(t1) * Number(t2));
      case 4:
        return String(Number(t1) / Number(t2));
    }
    const tmp = String(_f)
      .substring(l, r + 1)
      .trim();
    if (!isOperation(tmp) && !isNumber(tmp)) {
      if (solver) {
        return solver(tmp);
      } else {
        throw new Error('Necesita resolver una referencia a: ' + tmp.trim());
      }
    }
    return tmp;
  }
  _f = String(expression);
  return _evaluate(0, _f.length - 1);
};
export const intlRound = (numero: number, decimales = 2, usarComa = false) => {
  //Esta respuesta
  const opciones = {
    maximumFractionDigits: decimales,
    useGrouping: false,
  };
  return Number(
    new Intl.NumberFormat(usarComa ? 'es' : 'en', opciones).format(numero),
  );
};
// Función para extraer el arreglo con los indicadores y periodos...
export const analizarFormulas = (exp: string): any[] => {
  const resultado: any = [];
  let indicador = '';
  let inPeriodo = false;
  let columna = '';
  let sustituir = '';
  for (let i = 0; i < exp.length; i++) {
    sustituir = sustituir + exp[i];
    if (exp.charCodeAt(i) > 32) {
      if (
        'abcdefghijklmnñopqrstuvwxyzABCDEFGHIJKLMNÑOPQRSTUVWXYZA_$áéíóúüÁÉÍÓÚÜ0123456789'.indexOf(
          exp[i],
        ) !== -1
      ) {
        if (inPeriodo) {
          columna = columna + exp[i];
        } else {
          indicador = indicador + exp[i];
        }
      } else if (exp[i] === '{') {
        inPeriodo = true;
      } else if (exp[i] === '}') {
        if (columna === '') {
          indicador = '';
        }
        resultado.push({
          indicador: indicador,
          columna: columna,
          sustituir: sustituir.trim(),
        });
        inPeriodo = false;
        indicador = '';
        columna = '';
        sustituir = '';
      } else if ('+-*/()'.indexOf(exp[i]) !== -1) {
        sustituir = sustituir.substring(0, sustituir.indexOf(exp[i]));
        if (indicador !== '' || columna !== '') {
          if (columna === '') {
            indicador = '';
          }

          resultado.push({
            indicador: indicador,
            columna: columna,
            sustituir: sustituir.trim(),
          });
          indicador = '';
          columna = '';
          inPeriodo = false;
          sustituir = '';
        }
      }
    }
  }
  if (indicador !== '' || columna !== '') {
    if (columna === '') {
      indicador = '';
    }
    sustituir = sustituir.trim();
    resultado.push({ indicador: indicador, columna: columna, sustituir });
  }
  return resultado;
};
export const min = (array: any): number => {
  return Math.min(...array);
};

export const max = (array: any): number => {
  return Math.max(...array);
};

export const color = (valor: number): string => {
  let color = '#ff0013';
  if (valor >= 0.9) {
    color = '#00ff1a';
  } else if (valor >= 0.6 && valor < 0.9) {
    color = '#fff900';
  }
  return color;
};

export const compareDates = (d1: string, d2: string): boolean => {
  let parts: string[] = d1.split('/');
  const dn1 = Number(parts[1] + parts[0]);
  parts = d2.split('/');
  const dn2 = Number(parts[1] + parts[0]);
  return dn1 <= dn2;
};

export const ordenarElementosPorFecha = (array: any): any => {
  const length = array.length;
  for (let i = 0; i < length; i++) {
    for (let j = 0; j < length - i - 1; j++) {
      if (compareDates(array[j].fecha, array[j + 1].fecha)) {
        const tmp = array[j];
        array[j] = array[j + 1];
        array[j + 1] = tmp;
      }
    }
  }
  return array;
};

export const promedio = (array: number[]): number => {
  let suma = 0;
  for (const number of array) {
    suma = suma + number;
  }
  return suma / array.length;
};

export const zPositiva = (x: number, xMin, xMax): number => {
  let z: number;
  if (x === xMin) {
    z = 0;
  } else if (x === xMax) {
    z = 1;
  } else {
    z = (x - xMin) / (xMax - xMin);
  }
  return z;
};

export const zNegativa = (x: number, xMin, xMax): number => {
  let z: number;
  if (x === xMax) {
    z = 0;
  } else if (x === xMin) {
    z = 1;
  } else {
    z = (xMax - x) / (xMax - xMin);
  }
  return z;
};

export const generarNuevoColor = () => {
  const simbolos = '0123456789ABCDEF';
  let color = '#';

  for (let i = 0; i < 6; i++) {
    color = color + simbolos[Math.floor(Math.random() * 16)];
  }
  return color;
};
export const groupBy = (list: any, keyGetter: any) => {
  const map: any = new Map();
  list.forEach((item) => {
    const key: any = keyGetter(item);
    const collection = map.get(key);
    if (!collection) {
      map.set(key, [item]);
    } else {
      collection.push(item);
    }
  });
  return map;
};
