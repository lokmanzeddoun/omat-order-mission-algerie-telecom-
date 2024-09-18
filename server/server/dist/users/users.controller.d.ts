import { UsersService } from './users.service';
import { Prisma } from '@prisma/client';
import { createUserDto } from './dtos/create-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: createUserDto): Promise<any>;
    findAll(): any;
    findOne(id: string): any;
    update(id: string, updateUserDto: Prisma.UserCreateInput): any;
    remove(id: string): any;
}
