import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ILeadController } from './lead.controller.interface';
import { ContactRequestSchema } from '../validators/contact-request.schema';
import { ILeadGenService } from '../../services/interfaces/lead-gen.service.interface';
import { IContactRequest } from '../../types/contact-request.types';
import { IZohoLeadMessage } from '../../types/zoho-lead.types';
import { extractUserIpAddress } from '../../utils/ip-address.util';

export class LeadController implements ILeadController {
  constructor(private readonly leadGenService: ILeadGenService) {}

  submitDemoRequest = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parseResult = ContactRequestSchema.safeParse(req.body);

      if (!parseResult.success) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          details: formatZodErrors(parseResult.error),
        });
        return;
      }

      const contactRequest: IContactRequest = { ...parseResult.data };

      const userIpAddress = extractUserIpAddress(req);

      const delayInClosestApiCall = req.query.delayInClosestApiCall
        ? parseInt(req.query.delayInClosestApiCall as string, 10)
        : undefined;

      const result: IZohoLeadMessage = await this.leadGenService.submitDemoRequest(
        contactRequest,
        userIpAddress,
        delayInClosestApiCall,
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

function formatZodErrors(error: ZodError): { field: string; message: string }[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}
