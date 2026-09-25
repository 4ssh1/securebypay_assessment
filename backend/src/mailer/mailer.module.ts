import { Module } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { MAIL_TRANSPORT } from './mail.transport';
import { MailerService } from './mailer.service';
import { ConsoleMailTransport } from './transports/console.transport';
import { ResendMailTransport } from './transports/resend.transport';

@Module({
  providers: [
    MailerService,
    {
      provide: MAIL_TRANSPORT,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) =>
        config.mailTransport === 'resend' ? new ResendMailTransport(config) : new ConsoleMailTransport(),
    },
  ],
  exports: [MailerService],
})
export class MailerModule {}