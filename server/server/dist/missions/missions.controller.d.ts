import { MissionsService } from './missions.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
export declare class MissionsController {
    private readonly missionsService;
    constructor(missionsService: MissionsService);
    create(createMissionDto: CreateMissionDto): string;
    findAll(): string;
    findOne(id: string): string;
    update(id: string, updateMissionDto: UpdateMissionDto): string;
    remove(id: string): string;
}
