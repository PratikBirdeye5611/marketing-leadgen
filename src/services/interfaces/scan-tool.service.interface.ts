import { IContactRequest } from '../../types/contact-request.types';
import { IListingScanRequest, IScanCheck, IScanCheckResponse, IScanToolResponse, IReputation } from '../../types/scan-tool.types';
import { IScanRequestV3 } from '../../repositories/growth/scan-request-v3.repo';

export interface IScanToolService {
  scanRequestFromLead(requestMessage: IContactRequest): Promise<string | null>;
  scanRequest(listingScanRequest: IListingScanRequest): Promise<void>;
  scanPreConditionCheck(request: IScanCheck): Promise<IScanCheckResponse>;
  generateOnlineListingsPageUrl(scanRequestId: string, businessId: number, envFlag: string, region: string): Promise<string>;
  prepareScanRequestObjectAndSave(
    scanRequestId: string,
    listingScanRequest: IListingScanRequest,
    scanCheckResponse: IScanCheckResponse,
    onlineListingsUrl: string,
  ): Promise<void>;
  updateIndustry(scanRequestId: string, industry: string): Promise<void>;
  scanStatus(scanRequestId: string, refresh: boolean): Promise<IScanToolResponse>;
  getReputation(scanRequestId: string, appendRequestType: boolean, sendMail: boolean): Promise<IScanToolResponse>;
  getReputationData(scanRequest: IScanRequestV3, appendRequestType: boolean, sendEmail: boolean): Promise<IReputation | null>;
}