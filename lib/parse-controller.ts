import { aInicialMinuscula, eliminarSufijo, findElemento } from './util';
import { normalize } from 'path';
import { CreateEndPointDto } from '../src/shared/dto';
import { EndPointService } from '../src/core/service';
import { Project } from 'ts-morph';

import * as fs from 'fs';
import * as path from 'path';

// Crea una nueva instancia de Project
const project = new Project();
project.addSourceFilesAtPaths('**/*.ts');

const pathBase = normalize(`${process.cwd()}/src/api/controller`);
let dirFiles: string[] = [];
function getFilesWithFullPath(dirPath: string): string[] {
  return fs
    .readdirSync(dirPath)
    .filter((file) => {
      return fs.statSync(path.join(dirPath, file)).isFile();
    })
    .map((file) => path.join(dirPath, file));
}
dirFiles = getFilesWithFullPath(pathBase);

function findElementoPorDentro(dirs: string[], className: string): any {
  for (const dir of dirs) {
    const sourceFile = project.getSourceFileOrThrow(dir);
    const classes = sourceFile.getClasses();
    let className1 = '';
    for (const cls of classes) {
      className1 = cls.getName();
    }
    if (className === className1) {
      return dir;
    }
  }
  return -1;
}

function servicioHeredado(
  dirs: string[],
  baseClass: string,
  className: string,
): string[] {
  let resultado: string[] = [];
  const metodos: any[] = [];

  const dir = findElementoPorDentro(dirs, baseClass);
  if (dir !== -1) {
    let rutaController = '$generic';
    const sourceFile = project.getSourceFileOrThrow(dir);
    const classes = sourceFile.getClasses();
    let baseClass1;
    let className1;
    for (const cls of classes) {
      const methods = cls.getMethods();
      baseClass1 = cls.getBaseClass();
      className1 = cls.getName();
      const decorator = cls
        .getDecorators()
        .find((item) => item.getName() === 'Controller');
      if (decorator) {
        const decoratorArgument = decorator.getArguments()[0];
        rutaController = decoratorArgument.getText().replace(/'/g, '');
      }
      for (const method of methods) {
        const decorators = method.getDecorators();
        for (const decorator of decorators) {
          const decoratorName = decorator.getName();
          if (
            ['Get', 'Post', 'Patch', 'Delete', 'Put'].includes(decoratorName)
          ) {
            const decoratorArguments = decorator.getArguments();
            for (const argument of decoratorArguments) {
              const argumento = argument.getText().replace(/'/g, '');
              switch (decoratorName) {
                case 'Get':
                  metodos.push({
                    servicio: method.getName(),
                    ruta: `/${rutaController}${argumento}`,
                    className,
                    metodo: decoratorName,
                  });
                  break;
                case 'Post':
                  metodos.push({
                    servicio: method.getName(),
                    ruta: `/${rutaController}${argumento}`,
                    className,
                    metodo: decoratorName,
                  });
                  break;
                case 'Patch':
                  metodos.push({
                    servicio: method.getName(),
                    ruta: `/${rutaController}${argumento}`,
                    className,
                    metodo: decoratorName,
                  });
                  break;
                case 'Delete':
                  metodos.push({
                    servicio: method.getName(),
                    ruta: `/${rutaController}${argumento}`,
                    className,
                    metodo: decoratorName,
                  });
                  break;
                case 'Put':
                  metodos.push({
                    servicio: method.getName(),
                    ruta: `/${rutaController}${argumento}`,
                    className,
                    metodo: decoratorName,
                  });

                  break;
              }
            }
          }
        }
      }
    }
    if (baseClass1) {
      resultado = resultado.concat(metodos);
      return resultado.concat(
        servicioHeredado(dirs, baseClass1.getName(), className1),
      );
    } else {
      resultado = resultado.concat(metodos);
      return resultado;
    }
  }
  return resultado;
}

async function buscarServicios(): Promise<Map<string, CreateEndPointDto>> {
  const resultado: Map<string, CreateEndPointDto> = new Map<
    string,
    CreateEndPointDto
  >();
  let nombre: string;
  let controller: string;
  const controladores: string[] = [];
  for (const file of dirFiles) {
    if (file.indexOf('.controller.ts') !== -1) {
      controladores.push(file);
    }
  }
  for (const controlador of controladores) {
    const sourceFile = project.getSourceFileOrThrow(controlador);
    const classes = sourceFile.getClasses();
    let metodos: any[] = [];
    let rutaController = '';
    let className = '';
    for (const cls of classes) {
      const methods = cls.getMethods();
      const baseClass = cls.getBaseClass();
      className = cls.getName();
      if (baseClass) {
        metodos = servicioHeredado(
          controladores,
          baseClass.getName(),
          className,
        );
      }
      const decorator = cls
        .getDecorators()
        .find((item) => item.getName() === 'Controller');
      if (decorator) {
        const decoratorArgument = decorator.getArguments()[0];
        rutaController = decoratorArgument.getText().replace(/'/g, '');
      }
      for (const method of methods) {
        const decorators = method.getDecorators();
        for (const decorator of decorators) {
          const decoratorName = decorator.getName();
          if (
            ['Get', 'Post', 'Patch', 'Delete', 'Put'].includes(decoratorName)
          ) {
            const decoratorArguments = decorator.getArguments();
            for (const argument of decoratorArguments) {
              const argumento = argument.getText().replace(/'/g, '');
              switch (decoratorName) {
                case 'Get':
                  metodos.push({
                    servicio: method.getName(),
                    ruta: `/${rutaController}${argumento}`,
                    className,
                    metodo: decoratorName,
                  });
                  break;
                case 'Post':
                  metodos.push({
                    servicio: method.getName(),
                    ruta: `/${rutaController}${argumento}`,
                    className,
                    metodo: decoratorName,
                  });
                  break;
                case 'Patch':
                  metodos.push({
                    servicio: method.getName(),
                    ruta: `/${rutaController}${argumento}`,
                    className,
                    metodo: decoratorName,
                  });
                  break;
                case 'Delete':
                  metodos.push({
                    servicio: method.getName(),
                    ruta: `/${rutaController}${argumento}`,
                    className,
                    metodo: decoratorName,
                  });
                  break;
                case 'Put':
                  metodos.push({
                    servicio: method.getName(),
                    ruta: `/${rutaController}${argumento}`,
                    className,
                    metodo: decoratorName,
                  });

                  break;
              }
            }
          }
        }
      }
    }
    if (
      className !== 'GenericController' &&
      className !== 'GenericImportacionController' &&
      className !== 'GeometricController'
    ) {
      for (const metodo of metodos) {
        let ruta = '';
        if (metodo.ruta.split('/')[1] === '$generic') {
          ruta = metodo.ruta.replace('$generic', rutaController);
        } else {
          ruta = metodo.ruta;
        }
        const analisisRuta: string[] = ruta.split('/');
        const rutaArreglada: string[] = [];
        for (let item of analisisRuta) {
          if (item.includes(':')) {
            item = item.replace(':', '{') + '}';
            rutaArreglada.push(item);
          } else {
            rutaArreglada.push(item);
          }
        }
        ruta = rutaArreglada.join('/');
        controller = eliminarSufijo(className, 'Controller');
        if (controller === 'GenericNomenclador') {
          controller = 'Nomenclador';
        }
        nombre = `Acceso a ${controller} -> ${metodo.servicio}`;

        resultado.set(nombre, {
          controller: aInicialMinuscula(controller),
          ruta,
          nombre,
          servicio: metodo.servicio,
          metodo: metodo.metodo,
        });
      }
    }
  }
  return resultado;
}

export async function parseController(endPointService: EndPointService) {
  const serviciosRegistrados: string[] = await endPointService.findAll();
  const serviciosEncontrados: Map<string, CreateEndPointDto> =
    await buscarServicios();
  if (serviciosRegistrados.length === 0) {
    for (const serviciosEncontrado of serviciosEncontrados.values()) {
      await endPointService.create(serviciosEncontrado);
    }
  } else {
    for (const encontrado of serviciosEncontrados.values()) {
      if (findElemento(serviciosRegistrados, encontrado.nombre) === -1) {
        // el elemento está en la lista y no está en la bd
        await endPointService.create(encontrado);
      }
    }
    for (const registrado of serviciosRegistrados) {
      if (!serviciosEncontrados.has(registrado)) {
        // el elemento está en la bd y no está en la lista
        await endPointService.remove(registrado);
      }
    }
    for (const encontrado of serviciosEncontrados.values()) {
      if (findElemento(serviciosRegistrados, encontrado.nombre) !== -1) {
        await endPointService.update(encontrado);
      }
    }
  }
}
