import { CallHandler, ExecutionContext, Injectable, NestInterceptor, StreamableFile } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Paginated } from '../dto/paginated';

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(_: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((body: unknown) => {
        if (body instanceof StreamableFile) return body;
        if (body instanceof Paginated) return { success: true, data: body.items, meta: body.meta };
        return { success: true, data: body ?? null };
      }),
    );
  }
}
