import { IEmailRequest } from "../../types/calendar.types";

export interface IEmailService {
  sendInstantEmailRequestToEmailMicroservice(
    emailType: string,
    emailRequest: IEmailRequest,
    businessType: string,
  ): Promise<boolean>;
}
