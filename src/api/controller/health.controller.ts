import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MongoDriver } from 'typeorm/driver/mongodb/MongoDriver';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly configService: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Health check: verifica variables de entorno y conexión a MongoDB',
  })
  @ApiResponse({ status: 200, description: 'Health check' })
  @ApiResponse({
    status: 503,
    description: 'Servicio no disponible (BD caída)',
  })
  async check(): Promise<{
    success: boolean;
    database: string;
    uptime: number;
  }> {
    const envOk = this.configService.get('PORT') !== undefined;
    let dbOk = false;
    let dbStatus = 'disconnected';

    try {
      // MongoDB no soporta SQL: "SELECT 1" siempre fallaba y reportaba la BD
      // como caída aunque estuviera conectada. En TypeORM 1.x el cliente de
      // MongoDB vive en el queryRunner del driver; el ping de Mongo es el
      // chequeo correcto para TYPE=mongodb.
      const mongoClient: any = (this.dataSource.driver as MongoDriver)
        .queryRunner?.databaseConnection;
      if (!mongoClient) throw new Error('Cliente MongoDB no disponible');
      await mongoClient.db().admin().ping();
      dbOk = true;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'error';
    }

    return {
      success: envOk && dbOk,
      database: dbStatus,
      uptime: process.uptime(),
    };
  }
}
