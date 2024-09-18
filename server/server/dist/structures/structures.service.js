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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructuresService = void 0;
const database_service_1 = require("../database/database.service");
const common_1 = require("@nestjs/common");
let StructuresService = class StructuresService {
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    create(createStructureDto) {
        return this.databaseService.structure.create({ data: createStructureDto });
    }
    findAll() {
        return this.databaseService.structure.findMany({
            where: {
                soft_delete: false,
            },
        });
    }
    findOne(code) {
        return this.databaseService.structure.findUnique({
            where: {
                code,
            },
        });
    }
    update(code, updateStructureDto) {
        return this.databaseService.structure.update({
            where: {
                code,
            },
            data: updateStructureDto,
        });
    }
    remove(code) {
        return this.databaseService.structure.update({
            where: {
                code,
            },
            data: {
                soft_delete: true,
            },
        });
    }
};
exports.StructuresService = StructuresService;
exports.StructuresService = StructuresService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], StructuresService);
//# sourceMappingURL=structures.service.js.map