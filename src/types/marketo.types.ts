export interface IMarketoGetUserResult {
  id: number;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface IMarketoUserDetailsResponse {
  success: boolean;
  result?: IMarketoGetUserResult[];
}

export interface IMarketoAddUserResult {
  id: number;
  status: string;
}

export interface IMarketoCreateOrUpdateUserResponse {
  success: boolean;
  result?: IMarketoAddUserResult[];
}

export interface IMarketoAddToListResult {
  id: number;
  status: string;
}

export interface IMarketoAddToListResponse {
  success: boolean;
  result?: IMarketoAddToListResult[];
}

export interface IMarketoNewsletterSubscription {
  id?: number;
  marketoId?: number;
  email?: string;
  createStatus?: string;
  listStatus?: string;
}
