"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const database_service_1 = require("server/src/database/database.service");
const bcrypt = require("bcrypt");
let UsersService = class UsersService {
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async create(createUserDto) {
        let userSince;
        const user = await this.databaseService.user.findUnique({
            where: {
                matricule: createUserDto.matricule,
            },
        });
        if (!user) {
            userSince = new Date();
        }
        if (createUserDto.role && !client_1.Role[createUserDto.role])
            throw new common_1.BadRequestException('Invalid role');
        if (createUserDto.category && !client_1.Category[createUserDto.category])
            throw new common_1.BadRequestException('Invalid category');
        const password = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(password, 10);
        try {
            return this.databaseService.user.create({
                data: {
                    ...createUserDto,
                    password: hashedPassword,
                    userSince: userSince ?? undefined,
                },
            });
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.BadRequestException('User already exists');
            }
            throw new common_1.InternalServerErrorException('Server error');
        }
    }
    findAll() {
        return this.databaseService.user.findMany();
    }
    findOne(matricule) {
        return this.databaseService.user.findUnique({
            where: {
                matricule,
            },
        });
    }
    update(matricule, updateUserDto) {
        return this.databaseService.user.update({
            where: {
                matricule,
            },
            data: updateUserDto,
        });
    }
    remove(matricule) {
        return this.databaseService.user.update({
            where: {
                matricule,
            },
            data: {
                soft_delete: true,
            },
        });
    }
};
exports.UsersService = UsersService;
__decorate([
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, typeof (_b = typeof client_1.Prisma !== "undefined" && client_1.Prisma.UserCreateInput) === "function" ? _b : Object]),
    __metadata("design:returntype", void 0)
], UsersService.prototype, "update", null);
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof database_service_1.DatabaseService !== "undefined" && database_service_1.DatabaseService) === "function" ? _a : Object])
], UsersService);
//# sourceMappingURL=users.service.js.map