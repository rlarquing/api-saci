import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { UserEntity } from '../persistence/entity';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendRequestResetPassword(user: UserEntity) {
    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Recuperación de la contraseña de su cuenta de usuario.',
      template: 'request-password', // `.hbs` extension is appended automatically
      context: {
        // ✏️ filling curly brackets with content
        name: user.email,
        code: user.resetPasswordCode,
      },
    });
  }

  /** Envío genérico HTML (digerido de stock del digest — backlog P2). */
  async sendHtml(to: string[], subject: string, html: string): Promise<void> {
    await this.mailerService.sendMail({
      to: to.join(', '),
      subject,
      html,
    });
  }
}
