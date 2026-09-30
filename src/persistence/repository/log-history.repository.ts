import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, MongoRepository } from 'typeorm';
import { LogHistoryEntity, UserEntity } from '../entity';
import { UserRepository } from './user.repository';
import {
  PaginationOptions,
  paginateMongo,
  Pagination,
} from '../../shared/pagination';

@Injectable()
export class LogHistoryRepository {
  constructor(
    @InjectRepository(LogHistoryEntity)
    private logHistoryRepository: MongoRepository<LogHistoryEntity>,
    private userRepository: UserRepository,
  ) {}

  async findAll(
    options: PaginationOptions,
  ): Promise<Pagination<LogHistoryEntity>> {
    return await paginateMongo<LogHistoryEntity>(
      this.logHistoryRepository,
      options,
    );
  }

  async findById(id: string): Promise<LogHistoryEntity> {
    if (!id) {
      throw new BadRequestException('id must be sent');
    }
    const options = { id } as any;
    const traza: LogHistoryEntity =
      await this.logHistoryRepository.findOneBy(options);
    if (!traza) {
      throw new NotFoundException('this trazas does not found');
    }
    return traza;
  }

  async create(trazaEntity: LogHistoryEntity): Promise<void> {
    await this.logHistoryRepository.save(trazaEntity);
  }

  async delete(id: string): Promise<DeleteResult> {
    const options = { id } as any;
    const trazaExist = await this.logHistoryRepository.findOneBy(options);
    if (!trazaExist) {
      throw new NotFoundException('trazas does not exist');
    }
    return await this.logHistoryRepository.delete(id as any);
  }

  async findByFiltrados(user: UserEntity, filtro: any): Promise<any> {
    const wheres: any = {};

    if (filtro.date) {
      const datep = new Date(filtro.date);
      const start = new Date(datep.setHours(0, 0, 0, 0));
      const end = new Date(datep.setHours(23, 59, 59, 999));
      const date = { $gte: start.toISOString(), $lte: end.toISOString() };
      Object.assign(wheres, { date: date });
    }
    if (filtro.model) {
      Object.assign(wheres, { model: filtro.model });
    }
    if (filtro.data) {
      Object.assign(wheres, { data: filtro.data });
    }
    if (filtro.record) {
      Object.assign(wheres, { record: filtro.record });
    }
    if (filtro.action) {
      Object.assign(wheres, { action: filtro.action });
    }

    const take = filtro.take || 10;
    const page = filtro.page || 1;
    const [result, total] = await this.logHistoryRepository.findAndCount({
      where: wheres,
      take: page * take,
      skip: (page - 1) * take,
    });
    return {
      data: result,
      count: total,
    };
  }
}
