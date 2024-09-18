import { DatabaseService } from '../database/database.service';
import { CreateStructureDto } from './dto/create-structure.dto';
import { UpdateStructureDto } from './dto/update-structure.dto';
export declare class StructuresService {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    create(createStructureDto: CreateStructureDto): any;
    findAll(): any;
    findOne(code: string): any;
    update(code: string, updateStructureDto: UpdateStructureDto): any;
    remove(code: string): any;
}
