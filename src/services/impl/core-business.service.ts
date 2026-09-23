import { createAPICall, constructHttpHeaderWithServiceName } from '../../utils/http.util';
import { env } from '../../config/env';
import { ISignupInputMessage, ISignupOutputMessage } from '../../types/signup.types';
import { IBusinessUpdateDto } from '../../types/business-update.types';
import { InputValidationException } from '../../exceptions/input-validation.exception';
import { ErrorCodes } from '../../config/constants';
import { ICoreBusinessService } from '../interfaces/core-business.service.interface';

function resolveCoreEndpoint(envFlag: string, region?: string | null): string {
  if (region && region.toUpperCase() === 'UK') {
    return envFlag === '1' ? env.coreBusiness.paidEndpointEu : env.coreBusiness.freeEndpoint;
  }
  return envFlag === '1' ? env.coreBusiness.paidEndpoint : env.coreBusiness.freeEndpoint;
}

function getCoreAPIUrl(): string {
  const params = new URLSearchParams({
    demo_request: '1',
    leadgen: 'true',
    initial_login_check: 'false',
    is_require_aggregation: 'true',
  });
  return `${env.coreBusiness.freeEndpoint}/v1/signup/create?${params.toString()}`;
}

export class CoreBusinessService implements ICoreBusinessService {
  async businessSignupWithCore(signupInputMessage: ISignupInputMessage): Promise<ISignupOutputMessage | null> {
    const url = getCoreAPIUrl();
    try {
      return await createAPICall<ISignupOutputMessage>(
        url,
        'POST',
        constructHttpHeaderWithServiceName(),
        signupInputMessage,
      );
    } catch (e: any) {
      const status = e?.response?.status;
      if (status && status >= 500) {
        console.error('Business Signup Failed due to ISE(500) or TooManyRequest(429)', signupInputMessage, e);
        return null;
      }
      if (status === 429) {
        console.error('Business Signup Failed due to TooManyRequest(429)', signupInputMessage, e);
        return null;
      }
      if (status && status >= 400 && status < 500) {
        const body = e?.response?.data;
        if (body?.code === 1356) {
          throw new InputValidationException(ErrorCodes.INVALID_PHONE_NO, [signupInputMessage.phone]);
        }
        throw new InputValidationException(ErrorCodes.BUSINESS_SIGNUP_FAILED, [body?.message]);
      }
      console.error('Business Signup Failed', signupInputMessage, e);
      throw e;
    }
  }

  async isBusinessPresentV2(
    signupInputMessage: ISignupInputMessage,
    envFlag: string,
    region: string | null,
    placeId: string | null,
  ): Promise<ISignupOutputMessage | null> {
    const coreEndpoint = resolveCoreEndpoint(envFlag, region);
    const params = new URLSearchParams({ is_associated: '0' });
    if (placeId) params.set('profileId', placeId);
    const url = `${coreEndpoint}/v1/business/v2/ispresent?${params.toString()}`;
    try {
      return await createAPICall<ISignupOutputMessage>(
        url,
        'POST',
        constructHttpHeaderWithServiceName(),
        signupInputMessage,
      );
    } catch (e) {
      console.error('Exception while calling v2 ispresent API for request', signupInputMessage, url, e);
      return null;
    }
  }

  async updateBusinessDetails(businessId: number, businessUpdateDto: IBusinessUpdateDto): Promise<void> {
    const url = `${env.coreBusiness.freeEndpoint}/v1/public/business/update`;
    try {
      const headers = {
        ...constructHttpHeaderWithServiceName(),
        'business-id': String(businessId),
        'business-type': 'Free',
      };
      const response = await createAPICall(url, 'PUT', headers, businessUpdateDto);
      if (response) {
        console.log('Successfully updated business details for businessId:', businessId, response);
      }
    } catch (e: any) {
      const status = e?.response?.status;
      if (status && status >= 400 && status < 500) {
        const body = e?.response?.data;
        if (body?.code === 2306) {
          throw new InputValidationException(ErrorCodes.INVALID_WEBSITE_URL, []);
        }
        if (body?.code === 1055) {
          throw new InputValidationException(ErrorCodes.INVALID_PHONE_NO, [businessUpdateDto.phone]);
        }
        throw new InputValidationException(ErrorCodes.INVALID_BUSINESS_UPDATE_REQEUST, [body?.message]);
      }
      console.error('Exception while updating business details', url, e);
      throw e;
    }
  }
}