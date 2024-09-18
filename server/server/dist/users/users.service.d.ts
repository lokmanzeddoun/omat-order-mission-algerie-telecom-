import { Prisma } from '@prisma/client';
import { DatabaseService } from 'server/src/database/database.service';
import { createUserDto } from './dtos/create-user.dto';
export declare class UsersService {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    create(createUserDto: createUserDto): Promise<any>;
    findAll(): any;
    findOne(matricule: number): any;
    update(matricule: number, updateUserDto: Prisma.UserCreateInput): any;
    remove(matricule: number): any;
}
