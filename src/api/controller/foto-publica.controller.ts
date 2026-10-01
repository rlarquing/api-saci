import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ProductoService } from '../../core/service';

/**
 * Servidor público de fotos de producto (sin autenticación).
 *
 * Existe como controller aparte y SIN guards porque las fotos se consumen
 * desde <img> (web) y <Image> (React Native), que no pueden enviar el header
 * Authorization. Las fotos no contienen datos personales; el rate-limit
 * global (ThrottlerGuard) sigue aplicando.
 */
@ApiTags('Fotos de producto')
@Controller('producto-foto')
export class FotoPublicaController {
  constructor(private readonly productoService: ProductoService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Foto del producto (JPEG/PNG/WebP, cacheable 24 h)' })
  @ApiResponse({ status: 200, description: 'Binario de la imagen' })
  @ApiResponse({ status: 404, description: 'Producto sin foto o inexistente' })
  async obtener(@Param('id') id: string, @Res() res: Response): Promise<void> {
    try {
      const foto = await this.productoService.obtenerFoto(id);
      if (!foto) {
        res.status(HttpStatus.NOT_FOUND).json({
          statusCode: 404,
          message: 'El producto no tiene foto',
        });
        return;
      }
      res.setHeader('Content-Type', foto.contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.status(HttpStatus.OK).send(foto.buffer);
    } catch {
      res.status(HttpStatus.NOT_FOUND).json({
        statusCode: 404,
        message: 'Producto no encontrado',
      });
    }
  }
}
