import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { FileLogService } from '../logging/file-log.service';
@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  use(request: Request, res: Response, next: NextFunction): void {
    const startedAt = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      const ip = request.ip || request.socket.remoteAddress || 'unknown-ip';
      const line = [
        new Date().toISOString(),
        ip,
        request.method,
        request.originalUrl,
        res.statusCode,
        `${durationMs}ms`,
      ].join(' ');
      FileLogService.writeAccess(line);
    });
    next();
  }
}
