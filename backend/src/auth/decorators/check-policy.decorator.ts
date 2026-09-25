import { SetMetadata, Type } from '@nestjs/common';
import { PolicyHandler} from "../interfaces/policy.interface"

export const POLICY_KEY = 'auth:policies';
export const CheckPolicy = (...handlers: Type<PolicyHandler>[]) => SetMetadata(POLICY_KEY, handlers);
