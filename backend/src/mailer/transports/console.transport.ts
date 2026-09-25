import { Injectable, Logger } from '@nestjs/common';
import { MailMessage, MailTransport } from '../mail.transport';

@Injectable()
export class ConsoleMailTransport implements MailTransport {
  private readonly logger = new Logger('ConsoleMail');

  async send(message: MailMessage): Promise<void> {
    this.logger.warn(`To: ${message.to} | Template: ${message.templateId} | Vars: ${JSON.stringify(message.variables)}`);
  }
}