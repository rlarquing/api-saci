import { Injectable } from '@nestjs/common';
import {
  UserRepository,
  RolRepository,
  FuncionRepository,
  EndPointRepository,
} from '../../persistence/repository';

@Injectable()
export class SyncRelationService {
  constructor(
    private userRepository: UserRepository,
    private rolRepository: RolRepository,
    private funcionRepository: FuncionRepository,
    private endPointRepository: EndPointRepository,
  ) {}

  // ==================== USER ↔ ROL ====================

  /**
   * Asigna un rol a un usuario y sincroniza bidireccionalmente
   */
  async agregarRolAUsuario(usuarioId: string, rolId: string): Promise<void> {
    // Obtener usuario y rol
    const usuario = await this.userRepository.findById(usuarioId);
    const rol = await this.rolRepository.findById(rolId);

    if (!usuario || !rol) {
      throw new Error('Usuario o rol no encontrado');
    }

    // Agregar rol al usuario (si no existe)
    if (!usuario.roleIds) {
      usuario.roleIds = [];
    }
    if (!usuario.roleIds.includes(rolId)) {
      usuario.roleIds.push(rolId);
      await this.userRepository.update(usuario);
    }

    // Agregar usuario al rol (si no existe)
    if (!rol.userIds) {
      rol.userIds = [];
    }
    if (!rol.userIds.includes(usuarioId)) {
      rol.userIds.push(usuarioId);
      await this.rolRepository.update(rol);
    }
  }

  /**
   * Quita un rol de un usuario y sincroniza bidireccionalmente
   */
  async quitarRolDeUsuario(usuarioId: string, rolId: string): Promise<void> {
    const usuario = await this.userRepository.findById(usuarioId);
    const rol = await this.rolRepository.findById(rolId);

    if (!usuario || !rol) {
      throw new Error('Usuario o rol no encontrado');
    }

    // Quitar rol del usuario
    if (usuario.roleIds) {
      usuario.roleIds = usuario.roleIds.filter((id) => id !== rolId);
      await this.userRepository.update(usuario);
    }

    // Quitar usuario del rol
    if (rol.userIds) {
      rol.userIds = rol.userIds.filter((id) => id !== usuarioId);
      await this.rolRepository.update(rol);
    }
  }

  /**
   * Reemplaza todos los roles de un usuario y sincroniza
   */
  async setRolesDeUsuario(usuarioId: string, rolIds: string[]): Promise<void> {
    const usuario = await this.userRepository.findById(usuarioId);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Obtener todos los roles actuales del usuario
    const rolesActuales = await this.rolRepository.findByIds(rolIds);

    // Quitar usuario de todos los roles anteriores
    if (usuario.roleIds) {
      for (const rolIdAnterior of usuario.roleIds) {
        try {
          const rolAnterior = await this.rolRepository.findById(rolIdAnterior);
          if (rolAnterior?.userIds) {
            rolAnterior.userIds = rolAnterior.userIds.filter(
              (id) => id !== usuarioId,
            );
            await this.rolRepository.update(rolAnterior);
          }
        } catch {
          // Si el rol no existe, continuar
        }
      }
    }

    // Actualizar roles del usuario
    usuario.roleIds = rolIds;
    await this.userRepository.update(usuario);

    // Agregar usuario a los nuevos roles
    for (const rol of rolesActuales) {
      if (!rol.userIds) {
        rol.userIds = [];
      }
      if (!rol.userIds.includes(usuarioId)) {
        rol.userIds.push(usuarioId);
        await this.rolRepository.update(rol);
      }
    }
  }

  // ==================== USER ↔ FUNCION ====================

  /**
   * Asigna una función a un usuario y sincroniza bidireccionalmente
   */
  async agregarFuncionAUsuario(
    usuarioId: string,
    funcionId: string,
  ): Promise<void> {
    const usuario = await this.userRepository.findById(usuarioId);
    const funcion = await this.funcionRepository.findById(funcionId);

    if (!usuario || !funcion) {
      throw new Error('Usuario o función no encontrada');
    }

    // Agregar función al usuario
    if (!usuario.funcionIds) {
      usuario.funcionIds = [];
    }
    if (!usuario.funcionIds.includes(funcionId)) {
      usuario.funcionIds.push(funcionId);
      await this.userRepository.update(usuario);
    }

    // Agregar usuario a la función
    if (!funcion.userIds) {
      funcion.userIds = [];
    }
    if (!funcion.userIds.includes(usuarioId)) {
      funcion.userIds.push(usuarioId);
      await this.funcionRepository.update(funcion);
    }
  }

  /**
   * Quita una función de un usuario y sincroniza bidireccionalmente
   */
  async quitarFuncionDeUsuario(
    usuarioId: string,
    funcionId: string,
  ): Promise<void> {
    const usuario = await this.userRepository.findById(usuarioId);
    const funcion = await this.funcionRepository.findById(funcionId);

    if (!usuario || !funcion) {
      throw new Error('Usuario o función no encontrada');
    }

    // Quitar función del usuario
    if (usuario.funcionIds) {
      usuario.funcionIds = usuario.funcionIds.filter((id) => id !== funcionId);
      await this.userRepository.update(usuario);
    }

    // Quitar usuario de la función
    if (funcion.userIds) {
      funcion.userIds = funcion.userIds.filter((id) => id !== usuarioId);
      await this.funcionRepository.update(funcion);
    }
  }

  /**
   * Reemplaza todas las funciones de un usuario y sincroniza bidireccionalmente
   */
  async setFuncionesDeUsuario(
    usuarioId: string,
    funcionIds: string[],
  ): Promise<void> {
    const usuario = await this.userRepository.findById(usuarioId);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Obtener todas las funciones actuales del usuario
    const funcionesActuales =
      await this.funcionRepository.findByIds(funcionIds);

    // Quitar usuario de todas las funciones anteriores
    if (usuario.funcionIds) {
      for (const funcionIdAnterior of usuario.funcionIds) {
        try {
          const funcionAnterior =
            await this.funcionRepository.findById(funcionIdAnterior);
          if (funcionAnterior?.userIds) {
            funcionAnterior.userIds = funcionAnterior.userIds.filter(
              (id) => id !== usuarioId,
            );
            await this.funcionRepository.update(funcionAnterior);
          }
        } catch {
          // Si la función no existe, continuar
        }
      }
    }

    // Actualizar funciones del usuario
    usuario.funcionIds = funcionIds;
    await this.userRepository.update(usuario);

    // Agregar usuario a las nuevas funciones
    for (const funcion of funcionesActuales) {
      if (!funcion.userIds) {
        funcion.userIds = [];
      }
      if (!funcion.userIds.includes(usuarioId)) {
        funcion.userIds.push(usuarioId);
        await this.funcionRepository.update(funcion);
      }
    }
  }

  // ==================== ROL ↔ FUNCION ====================

  /**
   * Asigna una función a un rol y sincroniza bidireccionalmente
   */
  async agregarFuncionARol(rolId: string, funcionId: string): Promise<void> {
    const rol = await this.rolRepository.findById(rolId);
    const funcion = await this.funcionRepository.findById(funcionId);

    if (!rol || !funcion) {
      throw new Error('Rol o función no encontrada');
    }

    // Agregar función al rol
    if (!rol.funcionIds) {
      rol.funcionIds = [];
    }
    if (!rol.funcionIds.includes(funcionId)) {
      rol.funcionIds.push(funcionId);
      await this.rolRepository.update(rol);
    }

    // Agregar rol a la función
    if (!funcion.roleIds) {
      funcion.roleIds = [];
    }
    if (!funcion.roleIds.includes(rolId)) {
      funcion.roleIds.push(rolId);
      await this.funcionRepository.update(funcion);
    }
  }

  /**
   * Quita una función de un rol y sincroniza bidireccionalmente
   */
  async quitarFuncionDeRol(rolId: string, funcionId: string): Promise<void> {
    const rol = await this.rolRepository.findById(rolId);
    const funcion = await this.funcionRepository.findById(funcionId);

    if (!rol || !funcion) {
      throw new Error('Rol o función no encontrada');
    }

    // Quitar función del rol
    if (rol.funcionIds) {
      rol.funcionIds = rol.funcionIds.filter((id) => id !== funcionId);
      await this.rolRepository.update(rol);
    }

    // Quitar rol de la función
    if (funcion.roleIds) {
      funcion.roleIds = funcion.roleIds.filter((id) => id !== rolId);
      await this.funcionRepository.update(funcion);
    }
  }

  /**
   * Reemplaza todas las funciones de un rol y sincroniza
   */
  async setFuncionesDeRol(rolId: string, funcionIds: string[]): Promise<void> {
    const rol = await this.rolRepository.findById(rolId);
    if (!rol) {
      throw new Error('Rol no encontrado');
    }

    // Obtener todas las funciones actuales del rol
    const funcionesActuales =
      await this.funcionRepository.findByIds(funcionIds);

    // Quitar rol de todas las funciones anteriores
    if (rol.funcionIds) {
      for (const funcionIdAnterior of rol.funcionIds) {
        try {
          const funcionAnterior =
            await this.funcionRepository.findById(funcionIdAnterior);
          if (funcionAnterior?.roleIds) {
            funcionAnterior.roleIds = funcionAnterior.roleIds.filter(
              (id) => id !== rolId,
            );
            await this.funcionRepository.update(funcionAnterior);
          }
        } catch {
          // Si la función no existe, continuar
        }
      }
    }

    // Actualizar funciones del rol
    rol.funcionIds = funcionIds;
    await this.rolRepository.update(rol);

    // Agregar rol a las nuevas funciones
    for (const funcion of funcionesActuales) {
      if (!funcion.roleIds) {
        funcion.roleIds = [];
      }
      if (!funcion.roleIds.includes(rolId)) {
        funcion.roleIds.push(rolId);
        await this.funcionRepository.update(funcion);
      }
    }
  }

  // ==================== FUNCION ↔ ENDPOINT ====================

  /**
   * Asigna un endpoint a una función y sincroniza bidireccionalmente
   */
  async agregarEndpointAFuncion(
    funcionId: string,
    endPointId: string,
  ): Promise<void> {
    const funcion = await this.funcionRepository.findById(funcionId);
    const endPoint = await this.endPointRepository.findById(endPointId);

    if (!funcion || !endPoint) {
      throw new Error('Función o endpoint no encontrada');
    }

    // Agregar endpoint a la función
    if (!funcion.endPointIds) {
      funcion.endPointIds = [];
    }
    if (!funcion.endPointIds.includes(endPointId)) {
      funcion.endPointIds.push(endPointId);
      await this.funcionRepository.update(funcion);
    }

    // Agregar función al endpoint
    if (!endPoint.funcionIds) {
      endPoint.funcionIds = [];
    }
    if (!endPoint.funcionIds.includes(funcionId)) {
      endPoint.funcionIds.push(funcionId);
      await this.endPointRepository.update(endPoint);
    }
  }

  /**
   * Quita un endpoint de una función y sincroniza bidireccionalmente
   */
  async quitarEndpointDeFuncion(
    funcionId: string,
    endPointId: string,
  ): Promise<void> {
    const funcion = await this.funcionRepository.findById(funcionId);
    const endPoint = await this.endPointRepository.findById(endPointId);

    if (!funcion || !endPoint) {
      throw new Error('Función o endpoint no encontrada');
    }

    // Quitar endpoint de la función
    if (funcion.endPointIds) {
      funcion.endPointIds = funcion.endPointIds.filter(
        (id) => id !== endPointId,
      );
      await this.funcionRepository.update(funcion);
    }

    // Quitar función del endpoint
    if (endPoint.funcionIds) {
      endPoint.funcionIds = endPoint.funcionIds.filter(
        (id) => id !== funcionId,
      );
      await this.endPointRepository.update(endPoint);
    }
  }

  // ==================== MENU ↔ FUNCION ====================

  /**
   * Asigna una función a un menú y sincroniza bidireccionalmente
   */
  async agregarFuncionAMenu(menuId: string, funcionId: string): Promise<void> {
    // Solo necesitamos sincronizar si la entidad Menu tiene un campo para funciones
    // Por ahora, la relación es solo unidireccional (funcion.menuId -> menu._id)
    // No hay campo en Menu para funciones, así que solo actualizamos la función
    const funcion = await this.funcionRepository.findById(funcionId);
    if (!funcion) {
      throw new Error('Función no encontrada');
    }

    funcion.menuId = menuId;
    await this.funcionRepository.update(funcion);
  }

  /**
   * Quita una función de un menú
   */
  async quitarFuncionDeMenu(funcionId: string): Promise<void> {
    const funcion = await this.funcionRepository.findById(funcionId);
    if (!funcion) {
      throw new Error('Función no encontrada');
    }

    funcion.menuId = undefined;
    await this.funcionRepository.update(funcion);
  }
}
