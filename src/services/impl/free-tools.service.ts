import { IFreeToolsService } from '../interfaces/free-tools.service.interface';
import { IContactRequest } from '../../types/contact-request.types';
import { IScanToolService } from '../interfaces/scan-tool.service.interface';
import { isNotBlank } from '../../utils/string.util';

export class FreeToolsService implements IFreeToolsService {
  constructor(private readonly scanToolService: IScanToolService) {}

  async generateScanReportUrlForLead(contactRequest: IContactRequest): Promise<string> {
    if (
      !isNotBlank(contactRequest.businessName) ||
      !isNotBlank(contactRequest.phone) ||
      !isNotBlank(contactRequest.zip)
    ) {
      return '';
    }
    try {
      return await this.scanToolService.scanRequestFromLead(contactRequest) ?? '';
    } catch {
      return '';
    }
  }
}
