import { getApiBaseUrl } from '@/lib/api-base';

export type EmployerDemoFormPayload = {
  email: string;
  fullName: string;
  countryCode: string;
  dialCode: string;
  phoneNumber: string;
  companySize: string;
  organizationName: string;
  outcome?: string;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

async function postDemoRequest<T>(path: string, body: Record<string, unknown>): Promise<ApiResponse<T>> {
  const response = await fetch(`${getApiBaseUrl()}/employers/demo-request${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

export async function sendEmployerDemoOtp(payload: EmployerDemoFormPayload) {
  return postDemoRequest<{ requestId: string; email: string; otp?: string }>('/send-otp', payload);
}

export async function resendEmployerDemoOtp(requestId: string, email: string) {
  return postDemoRequest<{ requestId: string; email: string; otp?: string }>('/resend-otp', {
    requestId,
    email,
  });
}

export async function verifyEmployerDemoOtp(requestId: string, email: string, otp: string) {
  return postDemoRequest<{ requestId: string; email: string }>('/verify-otp', {
    requestId,
    email,
    otp,
  });
}
