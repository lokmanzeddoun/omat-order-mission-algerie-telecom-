"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMissionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_mission_dto_1 = require("./create-mission.dto");
class UpdateMissionDto extends (0, swagger_1.PartialType)(create_mission_dto_1.CreateMissionDto) {
}
exports.UpdateMissionDto = UpdateMissionDto;
//# sourceMappingURL=update-mission.dto.js.map