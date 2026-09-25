import type { Request } from 'express';

export interface PolicyHandler {
  handle(request: Request): boolean | Promise<boolean>;
}
