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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructuresController = void 0;
const common_1 = require("@nestjs/common");
const structures_service_1 = require("./structures.service");
const create_structure_dto_1 = require("./dto/create-structure.dto");
const update_structure_dto_1 = require("./dto/update-structure.dto");
const swagger_1 = require("@nestjs/swagger");
const structure_entity_1 = require("./entities/structure.entity");
let StructuresController = class StructuresController {
    constructor(structuresService) {
        this.structuresService = structuresService;
    }
    create(createStructureDto) {
        return this.structuresService.create(createStructureDto);
    }
    findAll() {
        return this.structuresService.findAll();
    }
    findOne(id) {
        return this.structuresService.findOne(id);
    }
    update(id, updateStructureDto) {
        return this.structuresService.update(id, updateStructureDto);
    }
    remove(id) {
        return this.structuresService.remove(id);
    }
};
exports.StructuresController = StructuresController;
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: 'CREATE STRUCTURE',
        description: 'Private endpoint to Create a new Structure. It is allowed only by "admin" users, and allows the creation of strucutres with "admin" Role.',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Created', type: structure_entity_1.Structure }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_structure_dto_1.CreateStructureDto]),
    __metadata("design:returntype", void 0)
], StructuresController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StructuresController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StructuresController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_structure_dto_1.UpdateStructureDto]),
    __metadata("design:returntype", void 0)
], StructuresController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StructuresController.prototype, "remove", null);
exports.StructuresController = StructuresController = __decorate([
    (0, swagger_1.ApiTags)('Structures'),
    (0, common_1.Controller)('structures'),
    __metadata("design:paramtypes", [structures_service_1.StructuresService])
], StructuresController);
//# sourceMappingURL=structures.controller.js.map