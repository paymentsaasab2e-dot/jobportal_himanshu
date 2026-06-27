import { getApiBaseUrl } from '@/lib/api-base';

export type EmployerDemoFormPayload = {
  email: string;
  fullName: string;
  countryCode: string;
  dialCode: string;
  phoneNumber: string;
  companySize: string;
  organizationName: string;
  organizationType: 'agency' | 'standalone';
  outcome?: string;
  requestKind?: 'demo' | 'trial' | 'purchase';
  packageSlug?: string;
  billingCycle?: 'monthly' | 'annual';
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
  return postDemoRequest<{
    requestId: string;
    email: string;
    requestKind?: 'demo' | 'trial' | 'purchase';
    readyForPayment?: boolean;
    packageSlug?: string;
    billingCycle?: 'monthly' | 'annual';
    loginUrl?: string;
    loginId?: string;
    trialEndsAt?: string;
    tenantDbName?: string;
    credentialEmailSent?: boolean;
    devPassword?: string;
  }>('/verify-otp', {
    requestId,
    email,
    otp,
  });
}

export async function completeEmployerPurchase(body: {
  requestId: string;
  email: string;
  paymentReference: string;
}) {
  return postDemoRequest<{
    requestId: string;
    email: string;
    loginUrl?: string;
    loginId?: string;
    tenantDbName?: string;
    credentialEmailSent?: boolean;
    credentialEmailError?: string;
    devPassword?: string;
    subscriptionPlan?: { name?: string };
  }>('/complete-purchase', body);
}
