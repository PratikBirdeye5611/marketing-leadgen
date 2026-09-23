import { Knex } from 'knex';
import { getScanReportUrl, cacheScanReportUrl } from '../../cache/scan-tool.cache';
import { createAPICall, constructHttpHeader, constructHttpHeaderWithServiceName } from '../../utils/http.util';
import { isNotBlank } from '../../utils/string.util';
import { addDays, getTodayDate } from '../../utils/date-time.util';
import { env } from '../../config/env';
import { BazaarifyConstants, LeadGenConstants, ParametersConstants } from '../../config/constants';
import { ErrorCodes } from '../../config/constants';
import { ScanType } from '../../types/enums';
import { InputValidationException } from '../../exceptions/input-validation.exception';
import { LeadGenException } from '../../exceptions/leadgen.exception';
import { LimitExceededException } from '../../exceptions/limit-exceeded.exception';
import { IContactRequest } from '../../types/contact-request.types';
import {
  IListingScanRequest,
  IScanCheck,
  IScanCheckResponse,
  IListingScanResponse,
  IReputation,
  IData,
  IScanToolResponse,
  IDomainMessage,
} from '../../types/scan-tool.types';
import { ISignupInputMessage, ISignupOutputMessage } from '../../types/signup.types';
import { IBusinessLiteDto, IBusinessOptions } from '../../types/business-lite.types';
import { IBusinessUpdateDto, ILocationBusinessDto, IUpdateBusinessRequest } from '../../types/business-update.types';
import { IDuplicateBusinessRequest } from '../../types/duplicate-business.types';
import { ScanRequestV3Repository, IScanRequestV3 } from '../../repositories/growth/scan-request-v3.repo';
import { ScanIndustryHistoryRepository } from '../../repositories/growth/scan-industry-history.repo';
import { ScanLimitRepository } from '../../repositories/growth/scan-limit.repo';
import { ParametersRepository } from '../../repositories/growth/parameters.repo';
import { IBusinessProfileService } from '../interfaces/business-profile.service.interface';
import { IBusinessSignupService } from '../interfaces/business-signup.service.interface';
import { ICoreBusinessService } from '../interfaces/core-business.service.interface';
import { IFreemiumService } from '../interfaces/freemium.service.interface';
import { IValidatorUtilityService } from '../interfaces/validation/validator-utility.service.interface';
import { IScanToolService } from '../interfaces/scan-tool.service.interface';

export class ScanToolService implements IScanToolService {
  constructor(
    private readonly db: Knex,
    private readonly scanRequestV3Repository: ScanRequestV3Repository,
    private readonly scanIndustryHistoryRepository: ScanIndustryHistoryRepository,
    private readonly scanLimitRepository: ScanLimitRepository,
    private readonly parametersRepository: ParametersRepository,
    private readonly businessProfileService: IBusinessProfileService,
    private readonly businessSignupService: IBusinessSignupService,
    private readonly coreBusinessService: ICoreBusinessService,
    private readonly freemiumService: IFreemiumService,
    private readonly validatorUtilityService: IValidatorUtilityService,
  ) {}

  async scanRequestFromLead(requestMessage: IContactRequest): Promise<string | null> {
    let onlineListingsUrl = '';
    try {
      const listingScanRequest = this.prepareListingScanRequest(requestMessage);

      const scanReportUrlFromCache = await getScanReportUrl(
        listingScanRequest.businessName!,
        listingScanRequest.phone!,
        listingScanRequest.zip!,
        listingScanRequest.placeId,
        listingScanRequest.userEmail!,
      );
      if (isNotBlank(scanReportUrlFromCache)) {
        return scanReportUrlFromCache;
      }

      if (!this.isValidLeadScanRequest(listingScanRequest)) {
        return null;
      }

      const businessTypes = [LeadGenConstants.BUSINESS, LeadGenConstants.RESELLER, LeadGenConstants.PRODUCT];
      const duplicateBusinessRequest: IDuplicateBusinessRequest = {
        name: listingScanRequest.businessName,
        phone: listingScanRequest.phone,
        zip: listingScanRequest.zip,
        placeId: listingScanRequest.placeId,
        env: LeadGenConstants.PAID_ENV_VALUE,
        businessTypes,
      };
      const duplicateBusiness = await this.businessProfileService.findDuplicateBusinessOnFree(duplicateBusinessRequest);
      if (
        duplicateBusiness &&
        (BazaarifyConstants.PAID.toLowerCase() === duplicateBusiness.activationStatus?.toLowerCase() ||
          BazaarifyConstants.DEMO.toLowerCase() === duplicateBusiness.activationStatus?.toLowerCase())
      ) {
        await cacheScanReportUrl(
          listingScanRequest.businessName!,
          listingScanRequest.phone!,
          listingScanRequest.zip!,
          listingScanRequest.placeId,
          listingScanRequest.userEmail!,
          onlineListingsUrl,
        );
        return null;
      }

      let scanRequestList: IScanRequestV3[] = [];
      let scanRequestV3: IScanRequestV3 | undefined;

      if (isNotBlank(listingScanRequest.placeId)) {
        scanRequestList = await this.scanRequestV3Repository.findByPlaceIdAndUserEmail(
          listingScanRequest.placeId!,
          listingScanRequest.userEmail!,
        );
        if (scanRequestList.length > 0) {
          scanRequestV3 = scanRequestList[scanRequestList.length - 1];
          if (scanRequestV3 && isNotBlank(scanRequestV3.online_listings_url)) {
            onlineListingsUrl = scanRequestV3.online_listings_url!;
            await cacheScanReportUrl(
              listingScanRequest.businessName!,
              listingScanRequest.phone!,
              listingScanRequest.zip!,
              listingScanRequest.placeId,
              listingScanRequest.userEmail!,
              onlineListingsUrl,
            );
            return onlineListingsUrl;
          }
        }
      }

      scanRequestList = await this.scanRequestV3Repository.findByBusinessNameAndPhoneAndZipAndUserEmail(
        listingScanRequest.businessName!,
        listingScanRequest.phone!,
        listingScanRequest.zip!,
        listingScanRequest.userEmail!,
      );
      if (scanRequestList.length > 0) {
        scanRequestV3 = scanRequestList[scanRequestList.length - 1];
        if (scanRequestV3 && isNotBlank(scanRequestV3.online_listings_url)) {
          onlineListingsUrl = scanRequestV3.online_listings_url!;
          await cacheScanReportUrl(
            listingScanRequest.businessName!,
            listingScanRequest.phone!,
            listingScanRequest.zip!,
            listingScanRequest.placeId,
            listingScanRequest.userEmail!,
            onlineListingsUrl,
          );
          return onlineListingsUrl;
        }
      }

      const scanRequestId = await this.generateUniqueScanRequestId();
      onlineListingsUrl = `${env.bazaarify.freeServerBaseUrl}online-listings/?rid=${scanRequestId}`;

      listingScanRequest.scanRequestId = scanRequestId;
      await cacheScanReportUrl(
        listingScanRequest.businessName!,
        listingScanRequest.phone!,
        listingScanRequest.zip!,
        listingScanRequest.placeId,
        listingScanRequest.userEmail!,
        onlineListingsUrl,
      );

      await this.callAsyncScanRequest(listingScanRequest);
    } catch (exception) {
      console.error('Exception while scan request for lead for request:', requestMessage, exception);
    }
    return onlineListingsUrl;
  }

  private prepareListingScanRequest(requestMessage: IContactRequest): IListingScanRequest {
    const listingScanRequest: IListingScanRequest = {};

    if (isNotBlank(requestMessage.businessName)) listingScanRequest.businessName = requestMessage.businessName;
    if (isNotBlank(requestMessage.businessPhone)) listingScanRequest.phone = requestMessage.businessPhone;
    if (isNotBlank(requestMessage.emailId)) listingScanRequest.userEmail = requestMessage.emailId;
    if (isNotBlank(requestMessage.zip)) listingScanRequest.zip = requestMessage.zip;
    if (isNotBlank(requestMessage.street)) listingScanRequest.address = requestMessage.street;
    if (isNotBlank(requestMessage.industry)) listingScanRequest.googleIndustry = requestMessage.industry;
    if (isNotBlank(requestMessage.placeId)) listingScanRequest.placeId = requestMessage.placeId;
    if (requestMessage.latitude != null) listingScanRequest.latitude = requestMessage.latitude;
    if (requestMessage.longitude != null) listingScanRequest.longitude = requestMessage.longitude;

    listingScanRequest.scanType = ScanType.LEAD_SCAN;

    if (isNotBlank(requestMessage.city)) listingScanRequest.city = requestMessage.city;
    if (isNotBlank(requestMessage.countryCode)) listingScanRequest.countryCode = requestMessage.countryCode;
    if (isNotBlank(requestMessage.state)) listingScanRequest.state = requestMessage.state;

    listingScanRequest.type = LeadGenConstants.BUSINESS;

    if (isNotBlank(requestMessage.firstName)) listingScanRequest.userFirstName = requestMessage.firstName;
    if (isNotBlank(requestMessage.lastName)) listingScanRequest.userLastName = requestMessage.lastName;
    if (isNotBlank(requestMessage.phone)) listingScanRequest.userPhone = requestMessage.phone;
    if (isNotBlank(requestMessage.website)) listingScanRequest.websiteUrl = requestMessage.website;
    if (isNotBlank(requestMessage.country)) listingScanRequest.countryName = requestMessage.country;

    return listingScanRequest;
  }

  private isValidLeadScanRequest(listingScanRequest: IListingScanRequest): boolean {
    if (
      listingScanRequest &&
      listingScanRequest.businessName != null &&
      listingScanRequest.phone != null &&
      listingScanRequest.zip != null &&
      listingScanRequest.userEmail != null
    ) {
      if (listingScanRequest.placeId != null) return true;
      if (listingScanRequest.city != null && listingScanRequest.state != null && listingScanRequest.address != null) return true;
      return false;
    }
    return false;
  }

  private async callAsyncScanRequest(listingScanRequest: IListingScanRequest): Promise<void> {
    try {
      await this.scanRequest(listingScanRequest);
      await this.updateIndustry(listingScanRequest.scanRequestId!, listingScanRequest.googleIndustry!);
    } catch (exception) {
      console.warn('Exception while calling async scan request for lead scan request:', listingScanRequest, exception);
    }
  }

  async scanRequest(listingScanRequest: IListingScanRequest): Promise<void> {
    if (listingScanRequest.countryCode?.toLowerCase() === 'gb') {
      listingScanRequest.countryCode = 'UK';
    }

    let scanCheckResponse: IScanCheckResponse;
    let isBusinessAlreadyExists = true;

    await this.validateEmail(listingScanRequest.userEmail!, listingScanRequest.scanType!);

    const scanCheck: IScanCheck = {
      businessName: listingScanRequest.businessName,
      phone: listingScanRequest.phone,
      zip: listingScanRequest.zip,
      countryCode: listingScanRequest.countryCode,
      placeId: listingScanRequest.placeId,
    };
    scanCheckResponse = await this.scanPreConditionCheck(scanCheck);

    if (scanCheckResponse.businessNumber == null) {
      isBusinessAlreadyExists = false;
      const signupInputMessage = this.prepareSignupInputMessage(listingScanRequest);
      const businessTypes = [LeadGenConstants.BUSINESS, LeadGenConstants.RESELLER, LeadGenConstants.PRODUCT];
      const duplicateBusinessRequest: IDuplicateBusinessRequest = {
        name: signupInputMessage.businessName,
        phone: signupInputMessage.phone,
        zip: signupInputMessage.zip,
        placeId: signupInputMessage.placeId,
        env: 2,
        businessTypes,
      };
      const duplicateBusiness = await this.businessProfileService.findDuplicateBusinessOnFree(duplicateBusinessRequest);

      if (duplicateBusiness) {
        scanCheckResponse.businessId = duplicateBusiness.businessId;
        scanCheckResponse.businessNumber = duplicateBusiness.businessNumber;
        scanCheckResponse.env = '2';

        const businessLiteDto = await this.businessSignupService.getBusinessFromCore(
          String(duplicateBusiness.businessNumber),
          'free',
          null,
        );
        if (businessLiteDto) scanCheckResponse.locationId = businessLiteDto.locationId;

        if (isNotBlank(listingScanRequest.placeId)) {
          try {
            const businessUpdateDto = this.prepareBusinessUpdateRequest(listingScanRequest);
            await this.coreBusinessService.updateBusinessDetails(duplicateBusiness.businessId!, businessUpdateDto);
          } catch (exception) {
            console.log('Exception while updating business with input for request:', listingScanRequest, exception);
          }
        }
      } else {
        const businessSignupOutput = await this.coreBusinessService.businessSignupWithCore(signupInputMessage);
        if (businessSignupOutput) {
          scanCheckResponse.businessId = businessSignupOutput.businessId;
          scanCheckResponse.businessNumber = businessSignupOutput.businessNumber;
          scanCheckResponse.env = '2';

          const businessLiteDto = await this.businessSignupService.getBusinessFromCore(
            String(businessSignupOutput.businessNumber),
            'free',
            null,
          );
          if (businessLiteDto) scanCheckResponse.locationId = businessLiteDto.locationId;
        } else {
          throw new InputValidationException(ErrorCodes.BUSINESS_SIGNUP_FAILED);
        }
      }
    }

    if (
      listingScanRequest.scanType === ScanType.LEN_PAGE_SCAN ||
      listingScanRequest.scanType === ScanType.BD_PARTNER_SCAN ||
      listingScanRequest.scanType === ScanType.SUCCESS_PORTAL_SCAN
    ) {
      scanCheckResponse.showCta = false;
      scanCheckResponse.createLead = false;
    }

    if (
      BazaarifyConstants.UK_REGION.toLowerCase() !== scanCheckResponse.region?.toLowerCase() &&
      (listingScanRequest.scanType === ScanType.PARTNER_SCAN || isBusinessAlreadyExists) &&
      isNotBlank(listingScanRequest.city) &&
      isNotBlank(listingScanRequest.state)
    ) {
      const locationBusinessDto = await this.getBusinessLocation(scanCheckResponse.locationId!, scanCheckResponse.env!);
      if (locationBusinessDto) {
        const updateBusinessRequest = this.prepareUpdateLocationObject(listingScanRequest, locationBusinessDto);
        updateBusinessRequest.location = locationBusinessDto;
        await this.freemiumService.updateBusiness(updateBusinessRequest, String(scanCheckResponse.businessId), scanCheckResponse.env!);
      }
    }

    const scanRequestId = isNotBlank(listingScanRequest.scanRequestId)
      ? listingScanRequest.scanRequestId!
      : await this.generateUniqueScanRequestId();

    const onlineListingsUrl = await this.generateOnlineListingsPageUrl(
      scanRequestId,
      scanCheckResponse.businessId!,
      scanCheckResponse.env!,
      scanCheckResponse.region!,
    );

    await this.prepareScanRequestObjectAndSave(scanRequestId, listingScanRequest, scanCheckResponse, onlineListingsUrl);
  }

  private async validateEmail(email: string, scanType: string): Promise<void> {
    const byPassEmailsForValidation = ['marketing@strokesupportassoc.org'];
    if (byPassEmailsForValidation.includes(email)) return;

    if (scanType !== 'SUCCESS_PORTAL_SCAN') {
      const isValid = await this.validatorUtilityService.validateEmail(email);
      if (!isValid) throw new InputValidationException(ErrorCodes.INVALID_EMAIL_ID, [email]);
      const isBirdeye = await this.validatorUtilityService.isBirdeyeDomain(email);
      if (isBirdeye) {
        throw new InputValidationException(ErrorCodes.INVALID_EMAIL_ID, [email], 'Birdeye domain is not allowed to scan');
      }
    }
  }

  async scanPreConditionCheck(request: IScanCheck): Promise<IScanCheckResponse> {
    const scanCheckResponse: IScanCheckResponse = { createLead: true, showCta: true, region: BazaarifyConstants.US_REGION };

    const signupInputMessage: ISignupInputMessage = {
      businessName: request.businessName,
      phone: request.phone,
      zip: request.zip,
    };
    if (isNotBlank(request.countryCode)) signupInputMessage.countryCode = request.countryCode;

    let signupOutputMessage: ISignupOutputMessage | null = null;

    const regionCodesRow = await this.parametersRepository.findByName(ParametersConstants.EU_SUPPORTED_COUNTRY_CODES);

    if (regionCodesRow?.value && isNotBlank(request.countryCode)) {
      const supportedCountryCodes = new Set(regionCodesRow.value.split(',').map((c) => c.trim().toUpperCase()));
      const requestCountryCode = request.countryCode!.trim().toUpperCase();

      if (supportedCountryCodes.has(requestCountryCode)) {
        signupOutputMessage = await this.coreBusinessService.isBusinessPresentV2(
          signupInputMessage,
          BazaarifyConstants.PAID,
          BazaarifyConstants.UK_REGION,
          request.placeId ?? null,
        );
        if (signupOutputMessage?.businessNumber != null) scanCheckResponse.region = BazaarifyConstants.UK_REGION;
      }
    }

    if (signupOutputMessage == null || signupOutputMessage.businessNumber == null) {
      signupOutputMessage = await this.coreBusinessService.isBusinessPresentV2(
        signupInputMessage,
        BazaarifyConstants.PAID,
        BazaarifyConstants.US_REGION,
        request.placeId ?? null,
      );
      if (signupOutputMessage?.businessNumber != null) scanCheckResponse.region = BazaarifyConstants.US_REGION;
    }

    if (signupOutputMessage?.businessNumber != null) {
      let businessLiteDto: IBusinessLiteDto | null;
      if (BazaarifyConstants.UK_REGION.toLowerCase() === scanCheckResponse.region?.toLowerCase()) {
        businessLiteDto = await this.businessSignupService.getBusinessFromCoreForEU(String(signupOutputMessage.businessNumber));
      } else {
        businessLiteDto = await this.businessSignupService.getBusinessFromCore(String(signupOutputMessage.businessNumber), 'paid', null);
      }

      if (businessLiteDto) {
        if (businessLiteDto.activationStatus?.toLowerCase() === 'paid' || businessLiteDto.activationStatus?.toLowerCase() === 'demo') {
          scanCheckResponse.businessId = businessLiteDto.businessId;
          scanCheckResponse.businessNumber = businessLiteDto.businessNumber;
          scanCheckResponse.accountType = businessLiteDto.accountType;
          scanCheckResponse.activationStatus = businessLiteDto.activationStatus;
          scanCheckResponse.locationId = businessLiteDto.locationId;
          scanCheckResponse.env = '1';
        }

        if (
          (businessLiteDto.accountType?.toLowerCase() === 'whitelabel' || businessLiteDto.accountType?.toLowerCase() === 'cobranded') &&
          (businessLiteDto.activationStatus?.toLowerCase() === 'paid' || businessLiteDto.activationStatus?.toLowerCase() === 'demo')
        ) {
          scanCheckResponse.createLead = false;
          scanCheckResponse.showCta = false;
        } else if (businessLiteDto.accountType?.toLowerCase() === 'direct' && businessLiteDto.activationStatus?.toLowerCase() === 'paid') {
          const presenceOpted = await this.getBusinessPresenceOpted(signupOutputMessage.businessNumber!, scanCheckResponse.region!);
          if (presenceOpted != null) {
            scanCheckResponse.presenceOpted = presenceOpted;
            if (presenceOpted === 1 || presenceOpted === 2) {
              scanCheckResponse.createLead = false;
              scanCheckResponse.showCta = false;
            }
          }
        }
      }
    }

    return scanCheckResponse;
  }

  private prepareSignupInputMessage(listingScanRequest: IListingScanRequest): ISignupInputMessage {
    const signupInputMessage: ISignupInputMessage = {};

    if (isNotBlank(listingScanRequest.businessName)) signupInputMessage.businessName = listingScanRequest.businessName;
    if (isNotBlank(listingScanRequest.phone)) signupInputMessage.phone = listingScanRequest.phone;
    if (isNotBlank(listingScanRequest.zip)) signupInputMessage.zip = listingScanRequest.zip;
    if (isNotBlank(listingScanRequest.type)) signupInputMessage.type = listingScanRequest.type;
    if (isNotBlank(listingScanRequest.city)) signupInputMessage.city = listingScanRequest.city;
    if (isNotBlank(listingScanRequest.address)) signupInputMessage.address = listingScanRequest.address;
    if (isNotBlank(listingScanRequest.state)) signupInputMessage.state = listingScanRequest.state;
    if (isNotBlank(listingScanRequest.userEmail)) signupInputMessage.userEmailId = listingScanRequest.userEmail;
    if (isNotBlank(listingScanRequest.userFirstName)) signupInputMessage.userFirstName = listingScanRequest.userFirstName;
    if (isNotBlank(listingScanRequest.userLastName)) signupInputMessage.userLastName = listingScanRequest.userLastName;
    if (isNotBlank(listingScanRequest.userPhone)) signupInputMessage.userPhone = listingScanRequest.userPhone;
    if (isNotBlank(listingScanRequest.countryCode)) signupInputMessage.countryCode = listingScanRequest.countryCode;
    if (isNotBlank(listingScanRequest.googleIndustry)) signupInputMessage.industry = listingScanRequest.googleIndustry;
    if (isNotBlank(listingScanRequest.websiteUrl)) signupInputMessage.websiteUrl = listingScanRequest.websiteUrl;

    if (listingScanRequest.latitude != null) {
      signupInputMessage.latitude = Math.trunc(listingScanRequest.latitude * BazaarifyConstants.LAT_LNG_MULTIPLIER);
    }
    if (listingScanRequest.longitude != null) {
      signupInputMessage.longitude = Math.trunc(listingScanRequest.longitude * BazaarifyConstants.LAT_LNG_MULTIPLIER);
    }

    if (isNotBlank(listingScanRequest.placeId)) signupInputMessage.placeId = listingScanRequest.placeId;

    return signupInputMessage;
  }

  private prepareBusinessUpdateRequest(listingScanRequest: IListingScanRequest): IBusinessUpdateDto {
    return {
      name: listingScanRequest.businessName,
      phone: listingScanRequest.phone,
      websiteUrl: listingScanRequest.websiteUrl,
      location: this.getLocationMessage(listingScanRequest),
    };
  }

  private getLocationMessage(listingScanRequest: IListingScanRequest) {
    return {
      address1: listingScanRequest.address,
      city: listingScanRequest.city,
      state: listingScanRequest.state,
      zip: listingScanRequest.zip,
      countryCode: listingScanRequest.countryCode,
      countryName: listingScanRequest.countryName,
      lat: listingScanRequest.latitude != null ? String(listingScanRequest.latitude) : undefined,
      lng: listingScanRequest.longitude != null ? String(listingScanRequest.longitude) : undefined,
    };
  }

  private prepareUpdateLocationObject(
    listingScanRequest: IListingScanRequest,
    locationBusinessDto: ILocationBusinessDto,
  ): IUpdateBusinessRequest {
    if (!isNotBlank(locationBusinessDto.city)) locationBusinessDto.city = listingScanRequest.city;
    if (!isNotBlank(locationBusinessDto.state)) locationBusinessDto.state = listingScanRequest.state;
    return { location: locationBusinessDto };
  }

  private async getBusinessLocation(locationId: number, envFlag: string): Promise<ILocationBusinessDto | null> {
    const coreEndpoint = envFlag.toLowerCase() === '1' ? env.coreBusiness.paidEndpoint : env.coreBusiness.freeEndpoint;
    const url = `${coreEndpoint}v1/location/${locationId}`;
    try {
      return (await createAPICall<ILocationBusinessDto>(url, 'GET', constructHttpHeaderWithServiceName())) ?? null;
    } catch (exception) {
      console.error('Exception while calling business location API for uri:', url, exception);
      return null;
    }
  }

  private async getBusinessDomain(businessId: number, envFlag: string, region: string): Promise<IDomainMessage | null> {
    const coreEndpoint =
      region.toLowerCase() === BazaarifyConstants.US_REGION.toLowerCase() ? env.coreBusiness.paidEndpoint : env.coreBusiness.paidEndpointEu;
    const url = `${coreEndpoint}/v1/domain/${businessId}`;
    try {
      return await createAPICall<IDomainMessage>(url, 'GET', constructHttpHeaderWithServiceName());
    } catch (ex) {
      console.error('Exception while calling /domain Api for businessId:', businessId, url, ex);
      return null;
    }
  }

  async generateOnlineListingsPageUrl(scanRequestId: string, businessId: number, envFlag: string, region: string): Promise<string> {
    let onlineListingsUrl = '';
    if (isNotBlank(envFlag) && envFlag === '1') {
      const domainMessage = await this.getBusinessDomain(businessId, envFlag, region);
      onlineListingsUrl += domainMessage!.secureEnabled === 1 ? 'https://' : 'http://';
      onlineListingsUrl += domainMessage!.domain;
      onlineListingsUrl += '/';
    } else {
      onlineListingsUrl += env.bazaarify.freeServerBaseUrl;
    }
    onlineListingsUrl += `online-listings/?rid=${scanRequestId}`;
    return onlineListingsUrl;
  }

  async prepareScanRequestObjectAndSave(
    scanRequestId: string,
    listingScanRequest: IListingScanRequest,
    scanCheckResponse: IScanCheckResponse,
    onlineListingsUrl: string,
  ): Promise<void> {
    const scanRequestV3: IScanRequestV3 = {
      scan_request_id: scanRequestId,
      b_id: scanCheckResponse.businessId,
      business_id: scanCheckResponse.businessNumber,
      business_name: listingScanRequest.businessName,
      phone: listingScanRequest.phone,
      user_email: listingScanRequest.userEmail,
      zip: listingScanRequest.zip,
      address: listingScanRequest.address,
      google_industry: listingScanRequest.googleIndustry,
      place_id: listingScanRequest.placeId,
      latitude: listingScanRequest.latitude,
      longitude: listingScanRequest.longitude,
      scan_type: listingScanRequest.scanType,
      env: scanCheckResponse.env,
      show_cta: scanCheckResponse.showCta,
      create_lead: scanCheckResponse.createLead,
      city: listingScanRequest.city,
      state: listingScanRequest.state,
      country_code: listingScanRequest.countryCode,
      online_listings_url: onlineListingsUrl,
      country_name: listingScanRequest.countryName,
      user_first_name: listingScanRequest.userFirstName,
      user_last_name: listingScanRequest.userLastName,
      region: scanCheckResponse.region,
    };

    if (listingScanRequest.partnerId != null) scanRequestV3.partner_id = listingScanRequest.partnerId;
    if (scanCheckResponse.accountType != null) scanRequestV3.account_type = scanCheckResponse.accountType;
    if (scanCheckResponse.presenceOpted != null) scanRequestV3.presence_opted = scanCheckResponse.presenceOpted;
    if (scanCheckResponse.activationStatus != null) scanRequestV3.activation_status = scanCheckResponse.activationStatus;

    await this.scanRequestV3Repository.save(scanRequestV3);
  }

  async updateIndustry(scanRequestId: string, industry: string): Promise<void> {
    const scanRequestData = await this.scanRequestV3Repository.findByScanRequestId(scanRequestId);
    if (!scanRequestData) throw new InputValidationException(ErrorCodes.NO_DATA_FOUND_WITH_GIVEN_REQUEST_ID);
    const scanRequest = scanRequestData;

    let limit : number = LeadGenConstants.DEFAULT_SCAN_LIMIT;
    if (scanRequest.scan_type?.toLowerCase() === ScanType.PARTNER_SCAN.toLowerCase()) {
      if (scanRequest.partner_id != null) {
        const scanLimit = await this.scanLimitRepository.findByResellerId(scanRequest.partner_id);
        if (scanLimit?.scan_limit_value != null) limit = scanLimit.scan_limit_value;
      }
    }

    const isWithinLimit = await this.validateLocalRankingLimit(
      limit,
      scanRequestId,
      scanRequest.business_id!,
      scanRequest.env!,
      industry,
    );

    if (!isWithinLimit) {
      throw new LimitExceededException(ErrorCodes.LOCAL_RANKING_SCAN_LIMIT_EXCEEDED);
    } else {
      scanRequest.industry_keyword = industry;
    }

    await this.scanRequestV3Repository.save(scanRequest);

    if (!isNotBlank(scanRequest.listing_status)) {
      void this.callAsyncPresenceStatusAPI(scanRequestId);
    }
    void this.callAsyncReputationAPI(scanRequestId);
  }

  private async callAsyncPresenceStatusAPI(scanRequestId: string): Promise<void> {
    await this.scanStatus(scanRequestId, true);
  }

  private async validateLocalRankingLimit(
    limit: number,
    scanRequestId: string,
    businessId: number,
    envFlag: string,
    industry: string,
  ): Promise<boolean> {
    const date = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const uniqueIndustriesForBusiness = await this.scanIndustryHistoryRepository.findByDateAddedBusinessIdAndEnv(date, businessId, envFlag);

    if (uniqueIndustriesForBusiness.length >= limit) {
      const isUniqueIndustry = uniqueIndustriesForBusiness.some((u) => u.toLowerCase() === industry.toLowerCase());
      if (!isUniqueIndustry) return false;
    }

    await this.scanIndustryHistoryRepository.save({
      scan_request_id: scanRequestId,
      google_industry: industry,
      business_id: businessId,
      env: envFlag,
    });

    return true;
  }

  async scanStatus(scanRequestId: string, refresh: boolean): Promise<IScanToolResponse> {
    const scanRequest = await this.scanRequestV3Repository.findByScanRequestId(scanRequestId);
    const scanToolResponse: IScanToolResponse = {};

    if (!scanRequest) throw new InputValidationException(ErrorCodes.NO_DATA_FOUND_WITH_GIVEN_REQUEST_ID);

    if (!refresh) {
      const thirtyDaysAgoDate = addDays(getTodayDate(false), -30);
      if (!scanRequest.last_refresh_date || scanRequest.last_refresh_date < thirtyDaysAgoDate) {
        refresh = true;
      }
    }

    if (refresh) scanRequest.last_refresh_date = new Date();

    try {
      const listingStatus = await this.getListingStatus(
        scanRequest.business_id!,
        scanRequest.env!,
        scanRequestId,
        refresh,
        scanRequest.scan_type!,
        scanRequest.region!,
      );
      if (listingStatus) {
        scanRequest.listing_status = listingStatus;
      } else {
        scanRequest.listing_status = 'EXCEPTION';
        throw new LeadGenException(ErrorCodes.GOT_NULL_RESPONSE_FROM_PRESENCE_API);
      }
      scanToolResponse.status = listingStatus;
    } catch (exception) {
      if (exception instanceof LeadGenException) {
        scanToolResponse.status = 'FAILED';
        scanToolResponse.error = 'Presence Perform Scan API Failed';
      } else {
        throw exception;
      }
    }

    await this.scanRequestV3Repository.save(scanRequest);
    return scanToolResponse;
  }

  private async getListingStatus(
    businessNumber: number,
    envFlag: string,
    scanRequestId: string,
    refresh: boolean,
    scanType: string,
    region: string,
  ): Promise<string | null> {
    const presence = region.toLowerCase() === BazaarifyConstants.US_REGION.toLowerCase() ? env.presence.endpoint : env.presence.endpointEu;
    const params = new URLSearchParams({ env: envFlag, refresh: String(refresh), scanType });
    const url = `${presence}/listing/scan-tool/performScan/${businessNumber}?${params.toString()}`;
    try {
      const listingScanResponse = await createAPICall<IListingScanResponse>(url, 'POST', constructHttpHeader());
      if (listingScanResponse) return listingScanResponse.status ?? null;
    } catch (ex) {
      console.error('Exception while calling performScan api for scanRequestId:', scanRequestId, url, ex);
      throw new LeadGenException(ErrorCodes.PRESENCE_API_FAILED);
    }
    return null;
  }

  private async callAsyncReputationAPI(scanRequestId: string): Promise<void> {
    await this.getReputation(scanRequestId, true, false);
  }

  async getReputation(scanRequestId: string, appendRequestType: boolean, sendMail: boolean): Promise<IScanToolResponse> {
    const scanRequest = await this.scanRequestV3Repository.findByScanRequestId(scanRequestId);
    const scanToolResponse: IScanToolResponse = {};

    if (!scanRequest) throw new InputValidationException(ErrorCodes.NO_DATA_FOUND_WITH_GIVEN_REQUEST_ID);

    const data: IData = {};
    const reputation = await this.getReputationData(scanRequest, appendRequestType, sendMail);
    if (reputation) {
      data.reputation = reputation;
      scanRequest.reputation_status = 'COMPLETE';
    } else {
      scanToolResponse.error = 'Got null response from reputation api';
    }

    await this.scanRequestV3Repository.save(scanRequest);
    scanToolResponse.data = data;
    return scanToolResponse;
  }

  async getReputationData(scanRequest: IScanRequestV3, appendRequestType: boolean, sendEmail: boolean): Promise<IReputation | null> {
    const scanRequestId = appendRequestType ? `${scanRequest.scan_request_id}-EMAIL` : scanRequest.scan_request_id;

    if (!isNotBlank(scanRequest.place_id)) return null;

    try {
      let bamEndpoint: string;
      if (BazaarifyConstants.UK_REGION.toLowerCase() === scanRequest.region?.toLowerCase()) {
        bamEndpoint = env.bam.paidEndpointEu;
      } else {
        bamEndpoint = scanRequest.env?.toLowerCase() === '1' ? env.bam.paidEndpoint : env.bam.freeEndpoint;
      }
      const url = `${bamEndpoint}/bam/get/reputation/${scanRequest.b_id}/${scanRequest.place_id}/${scanRequestId}`;
      return (await createAPICall<IReputation>(url, 'GET', constructHttpHeaderWithServiceName())) ?? null;
    } catch (ex) {
      console.error('Exception while calling reputation API for request:', scanRequest, ex);
      return null;
    }
  }

  private async getBusinessPresenceOpted(businessNumber: number, region: string): Promise<number | null> {
    const coreEndpoint =
      region.toLowerCase() === BazaarifyConstants.US_REGION.toLowerCase() ? env.coreBusiness.paidEndpoint : env.coreBusiness.paidEndpointEu;
    const params = new URLSearchParams({ businessNumber: String(businessNumber), traversehierarchy: 'true' });
    const url = `${coreEndpoint}v1/business/businessoptionsByNumber?${params.toString()}`;
    try {
      const response = await createAPICall<IBusinessOptions>(url, 'GET', constructHttpHeaderWithServiceName());
      if (response) return response.presenceOpted ?? null;
    } catch (exception) {
      console.error('Exception while calling businessoptionsByNumber API for uri:', url, exception);
    }
    return null;
  }

  private async generateUniqueScanRequestId(): Promise<string> {
    const scanRequestId = this.generateRandomAlphanumeric(15);
    const scanRequestData = await this.scanRequestV3Repository.findByScanRequestId(scanRequestId);
    if (scanRequestData) return this.generateUniqueScanRequestId();
    return scanRequestId;
  }

  private generateRandomAlphanumeric(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) result += characters.charAt(Math.floor(Math.random() * characters.length));
    return result;
  }
}