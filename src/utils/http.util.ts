import axios, { AxiosRequestConfig, Method } from 'axios';

export async function createAPICall<T>(
  url: string,
  method: Method,
  headers: Record<string, string>,
  body?: unknown,
): Promise<T> {
  const config: AxiosRequestConfig = {
    url,
    method,
    headers,
    ...(body !== null && body !== undefined ? { data: body } : {}),
  };
  try {
    const response = await axios.request<T>(config);
    return response.data;
  } catch (error: any) {
    console.error('API Call Failed:', url);
    console.error('Status:', error?.response?.status);
    console.error('Response:', JSON.stringify(error?.response?.data, null, 2));
    throw error;
  }
}

export function constructHttpHeader(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

export function constructHttpHeaderWithServiceName(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Service-Name': 'leadgen-service',
  };
}
