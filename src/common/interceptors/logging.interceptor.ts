import { CallHandler, ExecutionContext, NestInterceptor, Logger, Injectable } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    this.logger.log(`Incoming request: ${method} ${url}`);

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        const responseTime = Date.now() - now;

        this.logger.log(
          `Request handled: [${method} ${url} - status: ${statusCode} - delay: ${responseTime}ms]`,
        );
      }),

      catchError((error) => {
        const delay = Date.now() - now;
        const statusCode = error.status || 500;

        this.logger.error(
          `Request error: [${method} ${url} - status: ${statusCode} - delay: ${delay}ms] - ${error.message}`,
        );

        return throwError(() => error);
      }),
    );
  }
}
