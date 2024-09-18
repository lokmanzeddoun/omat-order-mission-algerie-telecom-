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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const client_2 = require("@prisma/client");
class User {
}
exports.User = User;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User Matricule',
        nullable: false,
        required: true,
        type: 'int',
        example: '21356498752',
    }),
    __metadata("design:type", Number)
], User.prototype, "matricule", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'nom',
        nullable: false,
        required: true,
        type: 'string',
        example: 'Mohamed',
    }),
    __metadata("design:type", String)
], User.prototype, "nom", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'prenom',
        nullable: false,
        required: true,
        type: 'string',
        example: 'ghomari',
    }),
    __metadata("design:type", String)
], User.prototype, "prenom", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Password: Min 6 characters, 1 uppercase, 1 lowercase and 1 number',
        nullable: false,
        required: true,
        type: 'string',
        example: 'Password123',
    }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User Role (admin, user)',
        nullable: false,
        required: true,
        type: 'string',
        example: 'user',
    }),
    __metadata("design:type", typeof (_a = typeof client_1.Role !== "undefined" && client_1.Role) === "function" ? _a : Object)
], User.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'the first time he enter the platfom',
        nullable: true,
        required: false,
        type: 'string',
        example: '2022-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], User.prototype, "userSince", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'grade(Fonction)',
        nullable: false,
        required: true,
        type: 'string',
        example: 'service',
    }),
    __metadata("design:type", String)
], User.prototype, "grade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User Category',
        nullable: false,
        required: true,
        type: 'string',
        example: 'cadre',
    }),
    __metadata("design:type", typeof (_b = typeof client_2.Category !== "undefined" && client_2.Category) === "function" ? _b : Object)
], User.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Status',
        nullable: true,
        required: false,
        type: 'enum("inactive","active")',
        default: 'inactive',
        example: 'inactive',
    }),
    __metadata("design:type", typeof (_c = typeof client_1.Status !== "undefined" && client_1.Status) === "function" ? _c : Object)
], User.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'soft_delete',
        nullable: true,
        required: false,
        type: 'boolean',
        default: 'false',
        example: 'false',
    }),
    __metadata("design:type", Boolean)
], User.prototype, "soft_delete", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Created At',
        nullable: true,
        required: false,
        type: 'string',
        example: '2022-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Updated At',
        nullable: true,
        required: false,
        type: 'string',
        example: '2022-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
//# sourceMappingURL=user.entity.js.map