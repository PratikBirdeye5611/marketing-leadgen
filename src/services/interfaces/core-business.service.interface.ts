import { ISignupInputMessage, ISignupOutputMessage } from '../../types/signup.types';
import { IBusinessUpdateDto } from '../../types/business-update.types';

export interface ICoreBusinessService {
  businessSignupWithCore(signupInputMessage: ISignupInputMessage): Promise<ISignupOutputMessage | null>;
  isBusinessPresentV2(
    signupInputMessage: ISignupInputMessage,
    envFlag: string,
    region: string | null,
    placeId: string | null,
  ): Promise<ISignupOutputMessage | null>;
  updateBusinessDetails(businessId: number, businessUpdateDto: IBusinessUpdateDto): Promise<void>;
}