import { Role, Status } from '@prisma/client';
import { Category } from '@prisma/client';
export declare class User {
    matricule: number;
    nom: string;
    prenom: string;
    password: string;
    role: Role;
    userSince?: Date;
    grade: string;
    category: Category;
    status?: Status;
    soft_delete?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
