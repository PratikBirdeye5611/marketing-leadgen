import { IEmailService } from '../interfaces/email.service.interface';
import { createAPICall, constructHttpHeader } from '../../utils/http.util';
import { APIEndpoints, EmailServiceConstants } from '../../config/constants';
import { env } from '../../config/env';
import { IEmailRequest } from '../../types/calendar.types';

export class EmailService implements IEmailService {
  async sendInstantEmailRequestToEmailMicroservice(
    emailType: string,
    emailRequest: IEmailRequest,
    businessType: string = EmailServiceConstants.FREE,
  ): Promise<boolean> {
    const url = `${env.email.serviceUrl}${APIEndpoints.SEND_INSTANT_EMAIL_URL}?email_type=${emailType}&business_type=${businessType}`;
    try {
      const response = await createAPICall<string>(url, 'POST', constructHttpHeader(), emailRequest);
      console.log(
        `Sent Request to Email Microservice for emailType: ${emailType}, emailIds: ${emailRequest.emailIds.join(',')}, request: ${JSON.stringify(emailRequest)}, response: ${response}`,
      );
      return true;
    } catch (e) {
      console.error(`Exception while sending mail to email microservice for email request ${JSON.stringify(emailRequest)}`, e);
      return false;
    }
  }
}
