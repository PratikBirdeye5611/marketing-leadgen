import { ISFDCLeadRequestBuilder } from '../interfaces/sfdc-lead-request.builder.interface';
import { IContactRequest } from '../../types/contact-request.types';
import { ILead, IContact, IAccount, IContactForAccount } from '../../types/sfdc-lead.types';
import { ISFDCLeadOperationHelper } from '../interfaces/sfdc-lead-operation.helper.interface';
import { ILeadGenHelper } from '../interfaces/lead-gen.helper.interface';
import { SFDCLeadStatus, ExistingLeadStatus, LeadStage, getLeadSourceOrDefault } from '../../types/enums';
import { LeadGenConstants, SfdcConstants, SFDCQueryParamConstants } from '../../config/constants';
import { getTrimmedBaseURL, isNotBlank, isBlank, decodeValue } from '../../utils/string.util';
import {zonedTimeFormatToDisplay,
  parseSfdcLeadDate,
  daysDifference,
DateFormats,formatSFDCDate } from '../../utils/date-time.util';
import { env } from '../../config/env';
import {getValidLeadStage } from '../../types/enums';

const AMP = '&amp;';
export class SFDCLeadRequestBuilder implements ISFDCLeadRequestBuilder {
  private static readonly DEFAULT_SFDC_TIMEZONE_PST = 'America/Los_Angeles';
  constructor(
    private readonly sfdcHelper: ISFDCLeadOperationHelper,
    private readonly leadGenHelper: ILeadGenHelper,
  ) {}

 buildLeadRequest(contactRequest: IContactRequest, existingLead: ILead | null): ILead {
    const lead: ILead = {};
    const existingLeadStatus = existingLead?.Status ?? null;

    if (existingLead) {
      lead.Id = existingLead.Id;
      lead.Description = this.leadGenHelper.getNormalizedString(
        existingLead.Description ?? '',
      );

      if (
        existingLeadStatus === SFDCLeadStatus.NEW ||
        existingLeadStatus === SFDCLeadStatus.WORKING
      ) {
        if (
          existingLead.OwnerId &&
          existingLead.OwnerId !== LeadGenConstants.SFDC_DEFAULT_OWNER_ID
        ) {
          contactRequest.leadOwner = undefined;
          contactRequest.leadAutoAssignment = undefined;
        }
      }
    }

    if (isNotBlank(contactRequest.firstName)) {
      lead.FirstName = contactRequest.firstName!.replace(/&/g, '&amp;');
    }

    if (isNotBlank(contactRequest.lastName)) {
      lead.LastName = contactRequest.lastName!.replace(/&/g, '&amp;');
    }

    if (isNotBlank(contactRequest.title)) {
      lead.Title = contactRequest.title;
    }

    lead.Email = contactRequest.emailId;
    lead.Phone = contactRequest.phone;
    lead.MobilePhone = contactRequest.mobilePhone;
    lead.Company = contactRequest.businessName;

    if (isNotBlank(contactRequest.businessPhone)) {
      lead.Business_Phone__c = contactRequest.businessPhone!.replace(/&/g, '&amp;');
    }

    if (isNotBlank(contactRequest.street)) {
      lead.Street = contactRequest.street;
    }

    if (isNotBlank(contactRequest.city)) {
      lead.City = contactRequest.city;
    }

    if (isNotBlank(contactRequest.state)) {
      lead.State = contactRequest.state;
    }

    if (isNotBlank(contactRequest.country)) {
      lead.Country = contactRequest.country;
    }

    if (
      contactRequest.countryCode?.toUpperCase() === 'US' &&
      isNotBlank(contactRequest.zip) &&
      /^\d{4}$/.test(contactRequest.zip!)
    ) {
      lead.PostalCode = `0${contactRequest.zip}`;
      lead.Zip_Code__c = `0${contactRequest.zip}`;
    } else {
      lead.PostalCode = contactRequest.zip;
      lead.Zip_Code__c = contactRequest.zip;
    }

    if (isNotBlank(contactRequest.website)) {
      lead.Website = contactRequest.website!.replace(/&/g, '&amp;');
    }

    if (isNotBlank(contactRequest.businessLocations)) {
      let trimmed = contactRequest.businessLocations!;

      if (trimmed.includes('-')) {
        trimmed = trimmed.substring(0, trimmed.indexOf('-'));
      } else if (trimmed.includes('+')) {
        trimmed = trimmed.substring(0, trimmed.indexOf('+'));
      }

      lead.Business_Location__c = trimmed;
    }

    if (isNotBlank(contactRequest.monthlyCustomers)) {
      lead.Number_of_New_Customers_Month__c =
        contactRequest.monthlyCustomers;
    }

    if (isNotBlank(contactRequest.businessEmployees)) {
      lead.Business_Employees__c =
        contactRequest.businessEmployees!.replace(/&/g, '&amp;');
    }

    if (contactRequest.numberOfEmployees != null) {
      lead.NumberOfEmployees = contactRequest.numberOfEmployees;
    }

    if (contactRequest.annualRevenue != null) {
      lead.AnnualRevenue = contactRequest.annualRevenue;
    }

    if (isNotBlank(contactRequest.locationsUnderManagement)) {
      lead.Locations_under_management__c =
        contactRequest.locationsUnderManagement;
    }

    if (contactRequest.productToSell?.length) {
      lead.Product_to_Sell__c =
        contactRequest.productToSell.join(';');
    }

    if (isNotBlank(contactRequest.customerMonthlyExpenditure)) {
      lead.Monthly_Expenditure__c =
        contactRequest.customerMonthlyExpenditure;
    }

    if (contactRequest.productOfInterest?.length) {
      lead.Product_of_Interest__c =
        contactRequest.productOfInterest.join(';');
    }

    if (isNotBlank(contactRequest.industry)) {
      lead.Industry = contactRequest.industry;
      lead.Industry__c = contactRequest.industry;
    }

    if (isNotBlank(contactRequest.subIndustry1)) {
      lead.Sub_Industry1__r = {
        sub_industry_name__c: contactRequest.subIndustry1,
      };
    } else if (isNotBlank(contactRequest.industry)) {
      // Same fallback behavior as Java builder
      lead.Sub_Industry1__r = {
        sub_industry_name__c: contactRequest.industry,
      };
    }

    lead.Google_Review_Count__c = contactRequest.googleReviewCount;

    lead.Google_Rating__c =
      contactRequest.googleRating != null
        ? String(contactRequest.googleRating)
        : undefined;

    if (isNotBlank(contactRequest.profileUrl)) {
      lead.Google_URL__c =
        contactRequest.profileUrl!.replace(/&/g, '&amp;');
    }

    if (isNotBlank(contactRequest.scanReportUrl)) {
      lead.Scan_Business_URL__c = contactRequest.scanReportUrl;
    }

    if (isNotBlank(contactRequest.comments)) {
      lead.Description = [lead.Description, contactRequest.comments]
        .filter(Boolean)
        .join('\n');
    }

    if (contactRequest.leadScore != null) {
      lead.Lead_Score__c = contactRequest.leadScore;
    }

    if (isNotBlank(contactRequest.scoreColorCode)) {
      lead.Lead_Color_Data__c = contactRequest.scoreColorCode;
    }

    if (isNotBlank(contactRequest.scoreConfidence)) {
      lead.Score_Confidence__c = contactRequest.scoreConfidence;
    }

    if (isNotBlank(contactRequest.buyingIntent)) {
      lead.Buying_Intent__c = contactRequest.buyingIntent;
    }

    if (contactRequest.croExperiments?.length) {
      lead.CRO_Experiments__c =
        contactRequest.croExperiments.join(';');
    }

    if (isNotBlank(contactRequest.original_Lead__c)) {
      lead.Original_Lead__c = contactRequest.original_Lead__c;
    }

    if (contactRequest.upsellRequest) {
      lead.Customer__c = true;
    }

    lead.CTA__c = contactRequest.beCta;
    lead.Device_name__c = contactRequest.deviceName;
    lead.Google_Click_ID__c = contactRequest.adClickId;
    lead.Referral_Code__c = contactRequest.referralCode;

    if (isNotBlank(contactRequest.crmName)) {
      lead.CRM_Detail__r = {
        name: contactRequest.crmName,
      };
    }

    if (
      isBlank(existingLeadStatus) ||
      existingLeadStatus === SFDCLeadStatus.DOWNGRADE ||
      existingLeadStatus === SFDCLeadStatus.CONVERTED ||
      (
        existingLeadStatus === SFDCLeadStatus.OPEN &&
        existingLead?.OwnerId === LeadGenConstants.SFDC_DEFAULT_OWNER_ID
      )
    ) {
      this.mqlOrReMqlFlow(
        contactRequest,
        lead,
        existingLeadStatus,
      );
    }

    if (isBlank(existingLeadStatus)) {
      this.setFTParamsInLead(contactRequest, lead);
    }

    this.setLTParamsInLead(contactRequest, lead);

    if (
      !this.isConvertedStatus(existingLeadStatus) &&
      isNotBlank(contactRequest.leadOwner)
    ) {
      lead.OwnerId = contactRequest.leadOwner;
    }

    if (contactRequest.leadAutoAssignment != null) {
      lead.Auto_Assignment__c =
        contactRequest.leadAutoAssignment;
    }

    return lead;
  }

  async requestToUpdateSFDCLead(
    contactRequest: IContactRequest,
    existingLead: ILead,
  ): Promise<ILead> {
    const newLead = this.buildLeadRequest(contactRequest, existingLead);
    await this.resetLeadCounters(contactRequest, existingLead, newLead);

    console.log(
      '[SFDC] Request to update SFDC Lead. contactRequestId: %s, newLead: %o',
      contactRequest.id,
      newLead,
    );

    await this.sfdcHelper.callToUpdateSFDCLead(newLead, existingLead.Status ?? null);
    return newLead;
  }

  async resetLeadCounters(
    contactRequest: IContactRequest,
    existingLead: ILead,
    lead: ILead,
  ): Promise<void> {
    const markLeadNew = this.getLeadEligibilityToResetLeadCounters(existingLead);

    if (markLeadNew) {
      if (contactRequest.leadStage?.toLowerCase() !== LeadStage.SUSPECT.toLowerCase()) {
        lead.Open_Date__c = zonedTimeFormatToDisplay(
          Date.now(),
          SFDCLeadRequestBuilder.DEFAULT_SFDC_TIMEZONE_PST,
          DateFormats.DATE_FORMAT_YYYYMMDD,
        );
      }
      if (SFDCLeadStatus.CONVERTED != existingLead.Status) {
        lead.Call_Counter__c = 0;
      }
    }
  }

  getLeadEligibilityToResetLeadCounters(existingLead: ILead): boolean {
    if (!existingLead.MQL_DateTime__c) {
      return true;
    }

    const leadMQLDate = parseSfdcLeadDate(existingLead.MQL_DateTime__c);
    const diffMs = Date.now() - leadMQLDate.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return (
      days > 1 &&
      (SFDCLeadStatus.DOWNGRADE == (existingLead.Status) ||
        SFDCLeadStatus.CONVERTED == (existingLead.Status) ||
        (existingLead.Status?.toLowerCase() === SFDCLeadStatus.OPEN.toLowerCase() &&
          existingLead.OwnerId === env.sfdc.defaultOwnerId))
    );
  }

  async buildSFDCContact(message: IContactRequest, contactId: string, existingContact: IContact): Promise<IContact> {
    const contact: IContact = {};
    const existingContactStatus = existingContact?.Contact_Status__c ?? null;

    if ((existingContactStatus ?? '').toLowerCase() !== SFDCLeadStatus.WORKING.toLowerCase()) {
      if (isNotBlank(message.title)) contact.Title = message.title;
      if (isNotBlank(message.firstName)) contact.FirstName = message.firstName!.replace(/&/g, AMP);
      if (isNotBlank(message.lastName)) contact.LastName = message.lastName!.replace(/&/g, AMP);
      contact.Phone = message.phone;
      contact.MobilePhone = message.mobilePhone;
    }

    if (isNotBlank(message.department)) contact.Department__c = message.department;
    if (isNotBlank(message.locationsUnderManagement)) contact.Locations_under_management__c = message.locationsUnderManagement;
    if (message.productOfInterest && message.productOfInterest.length > 0) contact.Product_of_Interest__c = message.productOfInterest.join(';');

    if (isNotBlank(message.comments)) {
      const comment = [this.leadGenHelper.getNormalizedString(existingContact?.Description ?? ''), message.comments].filter(Boolean).join('\n');
      contact.Description = comment;
    }

    if (message.leadScore != null) contact.Lead_Score__c = message.leadScore;

    const isDowngradeOrConverted = [SFDCLeadStatus.DOWNGRADE, SFDCLeadStatus.CONVERTED].some((s) => s.toLowerCase() === (existingContactStatus ?? '').toLowerCase());
    if (isDowngradeOrConverted || existingContact?.OwnerId === LeadGenConstants.SFDC_DEFAULT_OWNER_ID) {
      this.reMqlContactFlow(message, contact, existingContactStatus, existingContact);
    }

    if (message.croExperiments && message.croExperiments.length > 0) contact.CRO_Experiments__c = message.croExperiments.join(';');

    const isDefaultOwnerOrEmpty = [LeadGenConstants.SFDC_DEFAULT_OWNER_ID, null, ''].some((v) => (v ?? '').toLowerCase() === (message.leadOwner ?? '').toLowerCase());
    if (!isDefaultOwnerOrEmpty) {
      contact.OwnerId = message.leadOwner;
      if ((existingContactStatus ?? '').toLowerCase() !== SFDCLeadStatus.WORKING.toLowerCase()) {
        contact.Contact_Status__c = SFDCLeadStatus.NEW;
      }
    }

    this.setLTParamsInContact(message, contact);

    if (isNotBlank(message.buyingIntent)) contact.Buying_Intent__c = message.buyingIntent;

    contact.CTA__c = message.beCta;
    contact.Device_name__c = message.deviceName;
    contact.Google_Click_ID__c = message.adClickId;

    contact.Customer__c = this.isCustomerAccount(await this.getContactAssociatedAccountForCustomerCheck(contactId));

    return contact;
  }

  private async getContactAssociatedAccountForCustomerCheck(contactId: string): Promise<IAccount | null> {
    const query = SFDCQueryParamConstants.SOQL_QUERY_TO_FIND_CUSTOMER_ACCOUNT_INFO_BY_CONTACT_ID.replace('{0}', contactId);
    const contact = await this.sfdcHelper.getSfdcDetailsByQuery<IContactForAccount>(query);
    if (contact?.Account) return contact.Account;
    return null;
  }
  private isCustomerAccount(account: IAccount | null): boolean {
    return (
      account != null &&
      (account.Account_Status__c ?? '').toLowerCase() === SfdcConstants.ACCOUNT_STATUS_ACTIVE.toLowerCase() &&
      (account.Type ?? '').toLowerCase() === SfdcConstants.ACCOUNT_TYPE_CUSTOMER.toLowerCase()
    );
  }

  private reMqlContactFlow(message: IContactRequest, contact: IContact, existingContactStatus: string | null, existingContact: IContact): void {
    if ((existingContact?.OwnerId ?? '').toLowerCase() === LeadGenConstants.SFDC_DEFAULT_OWNER_ID.toLowerCase()) {
      contact.Contact_Status__c = SFDCLeadStatus.OPEN;
    } else if (
      (message.leadStage ?? '').toLowerCase() !== LeadStage.SUSPECT.toLowerCase() &&
      [SFDCLeadStatus.DOWNGRADE, SFDCLeadStatus.CONVERTED].some((s) => s.toLowerCase() === (existingContactStatus ?? '').toLowerCase())
    ) {
      contact.Contact_Status__c = isBlank(existingContact?.OwnerId) ? SFDCLeadStatus.OPEN : SFDCLeadStatus.NEW;
    }

    contact.Web_Submit_Date_Time__c = formatSFDCDate(message.webSubmitDateTime ?? new Date());

    contact.LeadSource = getLeadSourceOrDefault(message.leadSource);

    const stage = getValidLeadStage(message.leadStage);
    if (stage) contact.Contact_Stage__c = stage;

    if (isNotBlank(message.leadCampaign)) contact.Lead_Campaign__c = message.leadCampaign;
    if (isNotBlank(message.leadSubCampaign)) contact.Campaign_Name__c = message.leadSubCampaign;
    if (isNotBlank(message.leadCampaignKW)) contact.Lead_Campaign_KW__c = decodeValue(message.leadCampaignKW!);
    if (isNotBlank(message.leadContent)) contact.Lead_Content__c = message.leadContent;
    if (isNotBlank(message.leadMedium)) contact.Lead_Medium__c = message.leadMedium;

    if (isNotBlank(message.clickUrl)) {
      contact.Click_URL__c = getTrimmedBaseURL(message.clickUrl);
      contact.Click_URL1__c = message.clickUrl;
    }
    if (isNotBlank(message.leadUrl)) {
      contact.Lead_URL__c = getTrimmedBaseURL(message.leadUrl);
      contact.Lead_URL1__c = message.leadUrl;
    }

    if (isNotBlank(message.clickPageType)) contact.Click_Page_Type__c = message.clickPageType;
    if (isNotBlank(message.leadPageType)) contact.Lead_Page_Type__c = message.leadPageType;

    if ((message.leadStage ?? '').toLowerCase() !== LeadStage.SUSPECT.toLowerCase()) {
      contact.MQL_DateTime__c = formatSFDCDate(new Date());
      contact.Open_Date__c = zonedTimeFormatToDisplay(Date.now(), LeadGenConstants.DEFAULT_SFDC_TIMEZONE_PST, DateFormats.DATE_FORMAT_YYYYMMDD);
    }
  }

  private setLTParamsInContact(message: IContactRequest, contact: IContact): void {
    if (isNotBlank(message.clickUrl)) contact.LT_Click_URL__c = getTrimmedBaseURL(message.clickUrl);
    if (isNotBlank(message.leadUrl)) contact.LT_Lead_URL__c = getTrimmedBaseURL(message.leadUrl);
    if (isNotBlank(message.leadCampaignKW)) contact.LT_Lead_Campaign_KW__c = decodeValue(message.leadCampaignKW!);
    if (isNotBlank(message.leadCampaign)) contact.LT_Lead_Campaign__c = message.leadCampaign;
    if (isNotBlank(message.leadSubCampaign)) contact.LT_Lead_Sub_Campaign__c = message.leadSubCampaign;
    if (isNotBlank(message.leadContent)) contact.LT_Lead_Content__c = message.leadContent;
    if (isNotBlank(message.leadMedium)) contact.LT_Lead_Medium__c = message.leadMedium;
    if (isNotBlank(message.clickPageType)) contact.LT_Click_Page_Type__c = message.clickPageType;
    if (isNotBlank(message.leadPageType)) contact.LT_Lead_Page_Type__c = message.leadPageType;

    if ((message.leadStage ?? '').toLowerCase() !== LeadStage.SUSPECT.toLowerCase()) {
      contact.LT_MQL_Date_Time__c = formatSFDCDate(new Date());
    }

    const campaignIdInput = isNotBlank(message.leadSfdcCampaign) ? message.leadSfdcCampaign : message.leadSubCampaign;
    contact.Campaign_Id__c = this.leadGenHelper.validateCampaignIdInput(campaignIdInput);
  }

  setFTParamsInLead(
    contactRequest: IContactRequest,
    lead: ILead,
  ): void {
    if (isNotBlank(contactRequest.leadCampaignKW)) {
      lead.FT_Lead_Campaign_KW__c =
        decodeValue(contactRequest.leadCampaignKW!);
    }

    if (isNotBlank(contactRequest.leadCampaign)) {
      lead.FT_Lead_Campaign__c =
        contactRequest.leadCampaign;
    }

    if (isNotBlank(contactRequest.leadSubCampaign)) {
      lead.FT_Lead_Sub_Campaign__c =
        contactRequest.leadSubCampaign;
    }

    if (isNotBlank(contactRequest.leadContent)) {
      lead.FT_Lead_Content__c =
        contactRequest.leadContent;
    }

    if (isNotBlank(contactRequest.leadMedium)) {
      lead.FT_Lead_Medium__c =
        contactRequest.leadMedium;
    }
  }

  setLTParamsInLead(
    contactRequest: IContactRequest,
    lead: ILead,
  ): void {
    if (isNotBlank(contactRequest.clickUrl)) {
      lead.LT_Click_URL__c =
        getTrimmedBaseURL(contactRequest.clickUrl);
    }

    if (isNotBlank(contactRequest.leadUrl)) {
      lead.LT_Lead_URL__c =
        getTrimmedBaseURL(contactRequest.leadUrl);
    }

    if (isNotBlank(contactRequest.leadCampaignKW)) {
      lead.LT_Lead_Campaign_KW__c =
        decodeValue(contactRequest.leadCampaignKW!);
    }

    if (isNotBlank(contactRequest.leadCampaign)) {
      lead.LT_Lead_Campaign__c =
        contactRequest.leadCampaign;
    }

    if (isNotBlank(contactRequest.leadSubCampaign)) {
      lead.LT_Lead_Sub_Campaign__c =
        contactRequest.leadSubCampaign;
    }

    if (isNotBlank(contactRequest.leadContent)) {
      lead.LT_Lead_Content__c =
        contactRequest.leadContent;
    }

    if (isNotBlank(contactRequest.leadMedium)) {
      lead.LT_Lead_Medium__c =
        contactRequest.leadMedium;
    }

    if (isNotBlank(contactRequest.clickPageType)) {
      lead.LT_Click_Page_Type__c =
        contactRequest.clickPageType;
    }

    if (isNotBlank(contactRequest.leadPageType)) {
      lead.LT_Lead_Page_Type__c =
        contactRequest.leadPageType;
    }

    if (isNotBlank(contactRequest.intent)) {
      lead.LT_Intent__c =
        contactRequest.intent;
    }

    if (contactRequest.leadStage !== LeadStage.SUSPECT) {
      lead.LT_MQL_Date_Time__c =
        formatSFDCDate(new Date());
    }

    const campaignIdInput =
      contactRequest.leadSfdcCampaign ??
      contactRequest.leadSubCampaign;

    lead.Campaign_Id__c =
      this.leadGenHelper.validateCampaignIdInput(campaignIdInput);
  }

  mqlOrReMqlFlow(
    contactRequest: IContactRequest,
    lead: ILead,
    existingLeadStatus: string | null,
  ): void {
    if (existingLeadStatus === SFDCLeadStatus.DOWNGRADE) {
      lead.Status = isNotBlank(contactRequest.leadOwner)
        ? SFDCLeadStatus.NEW
        : SFDCLeadStatus.OPEN;

      contactRequest.existingLeadStatus =
        ExistingLeadStatus.REMQL;
    }

    lead.Web_Submit_Date_Time__c =
      formatSFDCDate(
        contactRequest.webSubmitDateTime ?? new Date(),
      );

    if (isBlank(contactRequest.leadOwner)) {
      if (existingLeadStatus !== SFDCLeadStatus.OPEN) {
        contactRequest.leadOwner =
          LeadGenConstants.SFDC_DEFAULT_OWNER_ID;
      }
    } else if (
      existingLeadStatus === SFDCLeadStatus.OPEN &&
      isNotBlank(contactRequest.leadOwner)
    ) {
      lead.Status = SFDCLeadStatus.NEW;

      contactRequest.existingLeadStatus =
        ExistingLeadStatus.REMQL;
    }

    if (isNotBlank(contactRequest.leadCampaign)) {
      lead.Lead_Campaign__c =
        contactRequest.leadCampaign;
    }

    if (isNotBlank(contactRequest.leadSubCampaign)) {
      lead.Lead_Sub_Campaign__c =
        contactRequest.leadSubCampaign;
    }

    if (isNotBlank(contactRequest.leadCampaignKW)) {
      lead.Lead_Campaign_KW__c =
        decodeValue(contactRequest.leadCampaignKW!);
    }

    if (isNotBlank(contactRequest.leadContent)) {
      lead.Lead_Content__c =
        contactRequest.leadContent;
    }

    if (isNotBlank(contactRequest.leadMedium)) {
      lead.Lead_Medium__c =
        contactRequest.leadMedium;
    }

    if (isNotBlank(contactRequest.clickUrl)) {
      lead.Click_URL__c =
        getTrimmedBaseURL(contactRequest.clickUrl);

      lead.Click_URL1__c =
        contactRequest.clickUrl;
    }

    if (isNotBlank(contactRequest.leadUrl)) {
      lead.Lead_URL__c =
        getTrimmedBaseURL(contactRequest.leadUrl);

      lead.Lead_URL1__c =
        contactRequest.leadUrl;
    }

    if (isNotBlank(contactRequest.clickPageType)) {
      lead.Click_Page_Type__c =
        contactRequest.clickPageType;
    }

    if (isNotBlank(contactRequest.leadPageType)) {
      lead.Lead_Page_Type__c =
        contactRequest.leadPageType;
    }

    if (isNotBlank(contactRequest.intent)) {
      lead.Intent__c =
        contactRequest.intent;
    }

    if (contactRequest.leadStage !== LeadStage.SUSPECT) {
      lead.MQL_DateTime__c =
        formatSFDCDate(new Date());

      lead.Open_Date__c =
        new Date().toISOString().split('T')[0];
    }
  }

  createNoteForLTFieldsUpdate(
    existingLead: ILead,
    newLead: ILead,
  ): string {
    const changes: string[] = [];

    if (
      existingLead.LT_Lead_Campaign__c !==
      newLead.LT_Lead_Campaign__c
    ) {
      changes.push(
        `Campaign: ${existingLead.LT_Lead_Campaign__c} → ${newLead.LT_Lead_Campaign__c}`,
      );
    }

    return changes.join('\n');
  }

  private isConvertedStatus(status: string | null | undefined): boolean {
    return status === SFDCLeadStatus.CONVERTED;
  }
}
