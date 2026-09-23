import { IZoomInfoService } from '../interfaces/zoom-info.service.interface';
import { IEnrichResultDto } from '../../types/zoominfo.types';
import { createAPICall, constructHttpHeader } from '../../utils/http.util';
import { env } from '../../config/env';

export class ZoomInfoService implements IZoomInfoService {
  async processContactRequest(
    contactRequestId: number,
    emailId: string,
    businessName?: string,
    zip?: string,
  ): Promise<IEnrichResultDto | null> {
    try {
      const url = `${env.bizApp.url}/api/zoominfo/enrich`;
      const payload = { contactRequestId, emailId, businessName, zip };
      return await createAPICall<IEnrichResultDto>(url, 'POST', constructHttpHeader(), payload);
    } catch {
      return null;
    }
  }
}
