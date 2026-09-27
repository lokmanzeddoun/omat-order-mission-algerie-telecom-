import { Global, Module } from '@nestjs/common';
import { AccessPolicy } from './access-policy';

/**
 * The access-control policy is a cross-cutting singleton (ADR 0001), so it is
 * provided once and exported globally rather than re-declared in every module.
 */
@Global()
@Module({
  providers: [AccessPolicy],
  exports: [AccessPolicy],
})
export class PolicyModule {}
