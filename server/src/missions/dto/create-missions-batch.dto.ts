import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsInt,
} from 'class-validator';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { CreateMissionDto } from './create-mission.dto';

/** Upper bound on one batch, so a single request stays a reasonable transaction. */
export const MAX_BATCH_USERS = 100;

/**
 * One ordre de mission for each listed user, all sharing the same destination,
 * dates, motif, transport and direction.
 */
export class CreateMissionsBatchDto extends OmitType(CreateMissionDto, [
  'userMatricule',
] as const) {
  @ApiProperty({
    description: 'Matricules des agents pour lesquels créer un ordre',
    example: [12345, 12346],
    type: [Number],
  })
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BATCH_USERS)
  @ArrayUnique()
  @IsInt({ each: true })
  userMatricules: number[];
}
