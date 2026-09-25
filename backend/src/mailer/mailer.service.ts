import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ErrorCode } from '../common/constants/error-codes';
import { AppException } from '../common/exceptions/app.exception';
import { MAIL_TRANSPORT, MailMessage,type  MailTransport } from './mail.transport';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(@Inject(MAIL_TRANSPORT) private readonly transport: MailTransport) {}

  async send(message: MailMessage): Promise<void> {
    try {
      await this.transport.send(message);
    } catch (error) {
      this.logger.error(`Mail delivery failed: ${error instanceof Error ? error.message : String(error)}`);
      throw new AppException(
        HttpStatus.SERVICE_UNAVAILABLE,
        ErrorCode.MAIL_DELIVERY_FAILED,
        'Unable to send email right now. Please try again shortly.',
      );
    }
  }
}
