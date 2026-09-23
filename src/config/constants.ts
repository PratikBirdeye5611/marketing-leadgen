export const ErrorCodes = {
  EMAIL_ID_NOT_SUPPLIED: 'EMAIL_ID_NOT_SUPPLIED',
  EMAIL_ID_TOO_LONG: 'EMAIL_ID_TOO_LONG',
  EMAIL_ID_TOO_SHORT: 'EMAIL_ID_TOO_SHORT',
  INVALID_EMAIL_ID: 'INVALID_EMAIL_ID',
  LAST_NAME_NOT_SUPPLIED: 'LAST_NAME_NOT_SUPPLIED',
  PHONE_NO_NOT_SUPPLIED: 'PHONE_NO_NOT_SUPPLIED',
  INVALID_PHONE_NO: 'INVALID_PHONE_NO',
  BUSINESS_NAME_TOO_SHORT: 'BUSINESS_NAME_TOO_SHORT',
  BUSINESS_NAME_TOO_LONG: 'BUSINESS_NAME_TOO_LONG',
  INVALID_ZIP_CODE: 'INVALID_ZIP_CODE',
  COMMENTS_TOO_LONG: 'COMMENTS_TOO_LONG',
  OUT_OF_REGION: 'OUT_OF_REGION',
  LEAD_LIMIT_EXCEEDED: 'LEAD_LIMIT_EXCEEDED',
  INVALID_SCAN_BUSINESS_REQUEST: 'INVALID_SCAN_BUSINESS_REQUEST',
  API_CALL_NOT_SUCCESS: 'API_CALL_NOT_SUCCESS',
  NO_DATA_FOUND_WITH_GIVEN_REQUEST_ID: 'NO_DATA_FOUND_WITH_GIVEN_REQUEST_ID',
  LEAD_SCORE_CALCULATION_FAILURE: 'LEAD_SCORE_CALCULATION_FAILURE',
  INVAILD_RESPONSE_IN_GEO_IP_SERVICE: 'INVAILD_RESPONSE_IN_GEO_IP_SERVICE',
  BUSINESS_SIGNUP_FAILED: 'BUSINESS_SIGNUP_FAILED',
  PRESENCE_API_FAILED: 'PRESENCE_API_FAILED',
  GOT_NULL_RESPONSE_FROM_PRESENCE_API: 'GOT_NULL_RESPONSE_FROM_PRESENCE_API',
  LOCAL_RANKING_SCAN_LIMIT_EXCEEDED: 'LOCAL_RANKING_SCAN_LIMIT_EXCEEDED',
  SCAN_TOOL_DATA_PARSING_FAILED: 'SCAN_TOOL_DATA_PARSING_FAILED',
  REQUESTID_BLANK_FOR_REPUTATION_SUMMARY_NOTIFICATION: 'REQUESTID_BLANK_FOR_REPUTATION_SUMMARY_NOTIFICATION',
  INVALID_WEBSITE_URL: 'INVALID_WEBSITE_URL',
  INVALID_BUSINESS_UPDATE_REQEUST: 'INVALID_BUSINESS_UPDATE_REQEUST',
  LEAD_NOT_FOUND_FOR_LEAD_OWNER: 'LEAD_NOT_FOUND_FOR_LEAD_OWNER',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export const LeadGenConstants = {
  BUSINESS_NAME_MIN_ALLOWED_LENGTH: 2,
  BUSINESS_NAME_MAX_ALLOWED_LENGTH: 250,
  BUSINESS_ZIP_MAX_ALLOWED_LENGTH: 10,
  BUSINESS_COMMENTS_MAX_ALLOWED_LENGTH: 1500,
  EMAIL_ID_MAX_LENGTH: 80,
  EMAIL_ID_MIN_LENGTH: 6,

  DEFAULT_LEAD_CREATED: 0,
  SUCCESSFULLY_LEAD_CREATED: 1,
  SKIP_LEAD_CREATED: 3,
  FORCEFULLY_LEAD_CREATED: 5,
  SUPPORT_SKIP_LEAD_CREATED: 6,
  LEAD_VALIDATION_FAILURE: 41,
  LEAD_EXCEPTION: 42,

  CALENDAR_NOTIFICATION_DATA_MODEL_NAME:"CALENDAR_NOTIFICATION",
  CALENDAR_NOTIFICATION_SETUP_EMAIL_TYPE: "calendar_notification_setup",

  BIRDEYE_PHONE_NUMBER: '1-888-980-4244',
  GOOGLE_SOURCE_ID: 2,
  DEMO_REQUEST_FLOW_TYPE: 'DEMO_REQUEST',
  SCAN_FLOW_IDENTIFIER: 'scan',
  REVIEW_MASTERCLASS_LEAD_URL: 'review-masterclass',
  ADVERTISING_MEDIA_AGENCY_BE_CATEGORY: 'Advertising / Media / Agency',
  OTHER: 'Other',
  CONTACT: 'Contact',
  EMAIL: 'Email',
  ID: 'Id',
  EU : 'EU',
  SFDC_DEFAULT_OWNER_ID: '005360000021APuAAM',
  PAID: 'paid',
  DEMO: 'demo',
  TRACKLYTICS_LEAD_URL: 'api/events/update-lead-id',
  FALLBACK_CALENDAR_DEFAULT_VALUE: 'none',
  CALENDAR_LEAD_REQUEST_TYPE: 'CALENDAR_LEAD',
  UK_ADVERTISING_MEDIA_LOCATION_ERROR: 'UK advertising media location error',
  CHANNEL: 'channel',
  LINKEDIN_WEBHOOK_ENDPOINT: 'linkedin',
  BUSINESS: 'Business',
  RESELLER: 'Reseller',
  PRODUCT: 'Product',
  PAID_ENV_VALUE: 2,
  PYTHON_PATH: '/usr/bin/python3',
  PYTHON_OPTIONS: '-W ignore',
  FAILED_CALENDAR_MESSAGE1: ' attempted to book time for a meeting on ',
  FAILED_CALENDAR_MESSAGE2: ', but did not succeed because there was no availability.',
  CALENDAR_INVITE_EVENT_START_DATE_TIME_HEADING: 'Event Start Date Time: ',
  CALENDAR_INVITE_EVENT_END_DATE_TIME_HEADING: 'Event End Date Time: ',
  DEFAULT_SFDC_TIMEZONE_PST: 'America/Los_Angeles',
  DEFAULT_SCAN_LIMIT: 3,
  LAT_LNG_MULTIPLIER: 1000000,
  DOWNGRADE_REASON_SPAM: 'Spam',
  DUPLICATES_DETECTED: 'DUPLICATES_DETECTED',
  MALFORMED_ID: 'MALFORMED_ID',
  OWNER_ID: 'OwnerId',
  DEFAULT_EVENT_SUMMARY : "Appointment confirmed with ${CALENDAR_BOOKING_TEMPLATE.getOrganizerName()!\"Team Birdeye\"} / ${(CALENDAR_BOOKING_TEMPLATE.getAttendeeName()!\"\")?capitalize} on ${CALENDAR_BOOKING_TEMPLATE.getMeetingTime()!}",
  DEFAULT_EVENT_DESCRIPTION : "Hello ${(CALENDAR_BOOKING_TEMPLATE.getAttendeeName()!\"\")?capitalize},\n" +
            "\n" +
            "Thank you for scheduling your ${CALENDAR_BOOKING_TEMPLATE.getMeetingDescription()}. ${(CALENDAR_BOOKING_TEMPLATE.getOrganizerName()!\"Team Birdeye\")?capitalize} will shortly get in touch with you at ${CALENDAR_BOOKING_TEMPLATE.getAttendeePhone()!} on ${CALENDAR_BOOKING_TEMPLATE.getMeetingTime()!}.\n" +
            "<#if CALENDAR_BOOKING_TEMPLATE.getAttendeeComments()??>Message from ${(CALENDAR_BOOKING_TEMPLATE.getAttendeeName()!\"attendee\")?capitalize}: ${CALENDAR_BOOKING_TEMPLATE.getAttendeeComments()}</#if>\n" +
            "\n\n" +
            "Best regards,\n" +
            "${CALENDAR_BOOKING_TEMPLATE.getOrganizerName()!\"Team Birdeye\"}\n" +
            "${CALENDAR_BOOKING_TEMPLATE.getOrganizerEmail()!}",
  SCRIPT_EXTERNAL_PATH : "/app/leadgen/python"
} as const;

export const ParametersConstants = {
  ZOOM_INFO_ENABLED: 'zoom_info_enabled',
  ZOOM_INFO_EXCLUDED_EMAIL_DOMAINS: 'zoom_info_excluded_email_domains',
  MARKETO_ENABLED: 'marketo_enabled',
  LEAD_SUPORTED_COUNTRY_CODES: 'lead_supported_country_codes',
  BIRDEYE_EMAIL_DOMAINS: 'birdeye_email_domains',
  UBERALL_SUPPORTED_COUNTRY_CODES: 'uberall_supported_country_codes',
  EU_SUPPORTED_COUNTRY_CODES: 'eu_supported_country_codes',
  MAILGUN_VALID_RESULTS: 'mailgun_valid_results',
  MAILGUN_UNKNOWN_RESULTS: 'mailgun_unknown_results',
  MAILGUN_INVALID_REASONS: 'mailgun_invalid_reasons',
  HUNTER_VALID_STATUS: 'hunter_valid_status',
  AM_OPPORTUNITY_SYNC_ENABLED: 'am_opportunity_sync_enabled',
} as const;

export const KafkaTopicsConstants = {
  CREATE_BUSINESS_KAFKA_TOPIC: 'create-business',
  UPSELL_CONVERT_LEAD_WITH_ACCOUNT: 'upsell-convert-lead-with-account',
  CALENDAR_LEAD_TEXTING_TOPIC: 'calendar-lead-texting',
  SCAN_TOOL_REPORT_URL_UPDATE_ON_DASHBOARD: 'scan-tool-report-url-update-on-dashboard',
  SCAN_TOOL_NEXUS_EMAIL: 'scan-tool-nexus-email',
  SCAN_TOOL_NEXUS_EMAIL_EU: 'scan-tool-nexus-email-eu',
} as const;

export const SFDCQueryParamConstants = {
  RETURN_FIELD_WITH_LEAD_CONTACT_ACCOUNT_INFO:'OwnerId,Status,ConvertedContactId,ConvertedContact.Account.Type,ConvertedContact.Account.Account_Status__c',
  RETURN_FIELD_BY_OWNER_ID_AND_STATUS_AND_CONVERTED_CONTACT: 'Id,Status,OwnerId,ConvertedContactId',
  SOQL_QUERY_TO_FIND_CUSTOMER_ACCOUNT_INFO_BY_CONTACT_ID: "SELECT Id,Name,Account.Type,Account.Account_Status__c FROM Contact WHERE Id = '{0}' limit 1",
  ENTITY_ID: 'entityId',
  CLASS_TYPE: 'classType',
  QUERY: 'query',
  RETURN_FIELD_VALUE_BY_OWNER_ID_AND_STATUS_AND_DEVICE_NAME: 'OwnerId,Status,Device_name__c',
  SOQL_QUERY_TO_FIND_OPPORTUNITY:
    "select Id,Name, opportunity.stageName,Opportunity.Lead_name__r.id,Opportunity.Lead_name__r.Status, Opportunity.account.id  from Opportunity  where Opportunity.Lead_name__r.Email='{0}' limit 1",

} as const;

export const APIEndpoints = {
  SFDC_CREATE_LEAD_ENDPOINT: '/operations/sfdc/create/lead/',
  SFDC_UPDATE_LEAD_ENDPOINT: '/operations/sfdc/update/sfdcResource/Lead',
  SFDC_UPDATE_RESOURCE_ENDPOINT: '/operations/sfdc/update/sfdcResource/',
  SFDC_SEARCH_ENTITY_ENDPOINT: '/operations/sfdc/search/entity/',
  SFDC_GET_LEAD_ENDPOINT: '/operations/sfdc/lead/',
  SFDC_LEAD_ID_CONSTANT_IN_CREATE_API_REQUEST : "leadId",
  SFDC_ACCOUNT_DETAILS_BY_CUSTOM_QUERY: '/operations/sfdc/query',
  SFDC_ADD_NOTE_ENDPOINT: '/operations/sfdc/add/note/',
  SFDC_CREATE_RESOURCE_ENDPOINT: '/operations/sfdc/create/',
  SFDC_GET_DETAILS_BY_QUERY: '/operations/sfdc/get/details/',
  SFDC_RESET_INDUSTRY: '/operations/sfdc/reset/industry/',
  API_CALENDAR_EVENTS_ADD: '/calender/events/add',
  API_CALENDAR_EVENTS_GET: '/calender/events/',
  API_CALENDAR_EVENTS_PATCH: '/calender/events/',
  API_FETCH_AVAILABLE_SALES_REP_EMAILS: '/calender/events/checkIfSlotIsFree',
  MAILGUN_EMAIL_VALIDATION_ENDPOINT: '/v4/address/validate',
  SEND_INSTANT_EMAIL_URL: '/email/sendInstantEmail',
  RESELLER_SCAN: '/operations/reseller/scan',
  BUSINESS_ISPRESENT: '/business/isPresent',
  REPUTATION_GAP_SYNC_TRIGGER: '/growth/reputation-gap/trigger',
  URL_SHORTEN_API: '/v1/url/shorten',
  BUSINESS_UPDATE: '/v1/public/business/update',
  CREATE_BUSINESS_AGGREGATION: "/bam/public/create/business-aggregation",
  FIND_BUSINESS : "/bam/business/find",
} as const;

export const SFDCNoteTitles = {
  UPDATE_LT_FIELDS_TITLE: 'LT Fields Update',
  LIVE_CHAT_TITLE: 'Live Chat',
} as const;

export const MarketoConstants = {
  MARKETO_FAILED_LEAD_LIST_ID: 'failed-lead-list',
} as const;

export const BazaarifyConstants = {
  EMAIL_ID_MAX_LENGTH: 80,
  EMAIL_ID_MIN_LENGTH: 6,
  PAID: 'paid',
  FREE: 'free',
  UK_REGION: 'UK',
  US_REGION: 'US',
  GOOGLE_SOURCE_ID: 2,
  LAT_LNG_MULTIPLIER: 1000000,
  DEMO: 'demo'
} as const;

export const EmailServiceConstants = {
  FREE: 'free',
  PAID: 'paid',
};

export const SfdcConstants = {
  Event : 'Event',
  ACCOUNT_STATUS_ACTIVE: 'Active',
  ACCOUNT_STATUS_FREEMIUM: 'Freemium',
  ACCOUNT_TYPE_CUSTOMER: 'Customer',
  CONTACT : 'Contact',
  LEAD : 'Lead',
  ACCOUNT : 'Account',
  OPPORTUNITY : 'Opportunity',
};