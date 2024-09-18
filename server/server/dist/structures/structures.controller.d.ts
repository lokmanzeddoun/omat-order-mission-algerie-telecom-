import { StructuresService } from './structures.service';
import { CreateStructureDto } from './dto/create-structure.dto';
import { UpdateStructureDto } from './dto/update-structure.dto';
export declare class StructuresController {
    private readonly structuresService;
    constructor(structuresService: StructuresService);
    create(createStructureDto: CreateStructureDto): any;
    findAll(): any;
    findOne(id: string): any;
    update(id: string, updateStructureDto: UpdateStructureDto): any;
    remove(id: string): any;
}
