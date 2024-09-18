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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const client_2 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
class createUserDto {
}
exports.createUserDto = createUserDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, swagger_1.ApiProperty)({
        description: 'User Matricule',
        default: 1234,
        type: 'number',
        example: 1234,
    }),
    __metadata("design:type", Number)
], createUserDto.prototype, "matricule", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({
        description: 'User familyName',
        default: 'ghomari',
        type: 'string',
        example: 'ghomari',
    }),
    __metadata("design:type", String)
], createUserDto.prototype, "nom", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({
        description: 'User name',
        default: 'mohammed',
        type: 'string',
        example: 'mohammed',
    }),
    __metadata("design:type", String)
], createUserDto.prototype, "prenom", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User Role (super_admin,admin, user)',
        default: 'user',
        type: 'string',
        example: 'USER',
    }),
    (0, class_validator_1.IsEnum)(client_2.Role, {
        message: `Invalid value for 'type` +
            `Acceptable values are: ${Object.values(client_2.Role)}`,
    }),
    __metadata("design:type", typeof (_a = typeof client_2.Role !== "undefined" && client_2.Role) === "function" ? _a : Object)
], createUserDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, swagger_1.ApiProperty)({
        description: 'User Fonction(Grade)',
        type: 'string',
        example: 'service',
    }),
    __metadata("design:type", String)
], createUserDto.prototype, "grade", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.Category, {
        message: `Invalid value for 'type` +
            `Acceptable values are: ${Object.values(client_1.Category)}`,
    }),
    (0, swagger_1.ApiProperty)({
        description: 'User Category (cadre,cadre_superieure, execution_maitrise)',
        type: 'string',
        example: 'CADRE',
    }),
    __metadata("design:type", typeof (_b = typeof client_1.Category !== "undefined" && client_1.Category) === "function" ? _b : Object)
], createUserDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Structure code',
        type: 'string',
        example: '1A',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], createUserDto.prototype, "serviceId", void 0);
//# sourceMappingURL=create-user.dto.js.map