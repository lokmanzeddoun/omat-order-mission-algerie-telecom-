import { Category } from '@prisma/client';
import { Role } from '@prisma/client';
export declare class createUserDto {
    matricule: number;
    nom: string;
    prenom: string;
    role: Role;
    grade: string;
    category: Category;
    serviceId: string;
}
