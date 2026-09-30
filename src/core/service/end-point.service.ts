import { Injectable } from '@nestjs/common';
import { DeleteResult } from 'typeorm';
import { EndPointRepository } from '../../persistence/repository';
import { CreateEndPointDto, SelectDto } from '../../shared/dto';
import { EndPointEntity } from '../../persistence/entity';

@Injectable()
export class EndPointService {
  constructor(private endPointRepository: EndPointRepository) {}
  async create(createEndPointDto: CreateEndPointDto): Promise<void> {
    const endPointEntity: EndPointEntity = new EndPointEntity(
      createEndPointDto,
    );
    await this.endPointRepository.create(endPointEntity);
  }
  async findAll(): Promise<string[]> {
    const resultado: string[] = [];
    const endPoints: EndPointEntity[] = await this.endPointRepository.findAll();
    for (const endPoint of endPoints) {
      resultado.push(endPoint.nombre);
    }
    return resultado;
  }

  async update(endPointEntity: any): Promise<void> {
    return await this.endPointRepository.update(endPointEntity);
  }

  async remove(servicio: string): Promise<DeleteResult> {
    return await this.endPointRepository.remove(servicio);
  }
  async createSelect(): Promise<SelectDto[]> {
    const items: any[] = await this.endPointRepository.findAll();
    const selectDto: SelectDto[] = [];
    for (const item of items) {
      selectDto.push(new SelectDto(item.id, item.toString()));
    }
    return selectDto;
  }
}
