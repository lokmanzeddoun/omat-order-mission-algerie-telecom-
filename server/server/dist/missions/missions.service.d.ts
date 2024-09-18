import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
export declare class MissionsService {
    create(createMissionDto: CreateMissionDto): string;
    findAll(): string;
    findOne(id: number): string;
    update(id: number, updateMissionDto: UpdateMissionDto): string;
    remove(id: number): string;
}
