import { IEnrichResultDto } from '../../types/zoominfo.types';

export interface IZoomInfoService {
  processContactRequest(
    contactRequestId: number,
    emailId: string,
    businessName?: string,
    zip?: string,
  ): Promise<IEnrichResultDto | null>;
}
