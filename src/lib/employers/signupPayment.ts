import type { PricingPlan } from '@/components/ui/pricing';

const MERCHANT_UPI = 'ghodehimanshu453-4@okicici';
const MERCHANT_NAME = 'Hryantra SAASA';
const USD_TO_INR_RATE = 83;

export type SignupPaymentOrder = {
  orderId: string;
  amountInr: string;
  amountPaise: number;
  currency: 'INR';
  merchantUpi: string;
  merchantName: string;
  packageName: string;
  description: string;
  upiPayLink: string;
};

function packageChargeUsd(plan: PricingPlan, isMonthly: boolean) {
  if (isMonthly) return Number(plan.price) || 0;
  const monthly = Number(plan.yearlyPrice) || Number(plan.price) || 0;
  return monthly * 12;
}

export function buildSignupPaymentOrder(plan: PricingPlan, isMonthly: boolean): SignupPaymentOrder {
  const usdAmount = packageChargeUsd(plan, isMonthly);
  const amountInr = (usdAmount * USD_TO_INR_RATE).toFixed(2);
  const orderId = `order_signup_${Date.now()}`;
  const params = new URLSearchParams({
    pa: MERCHANT_UPI,
    pn: MERCHANT_NAME,
    am: amountInr,
    cu: 'INR',
    tn: `${plan.name} package`,
    tr: orderId,
  });

  return {
    orderId,
    amountInr,
    amountPaise: Math.max(100, Math.round(Number(amountInr) * 100)),
    currency: 'INR',
    merchantUpi: MERCHANT_UPI,
    merchantName: MERCHANT_NAME,
    packageName: plan.name,
    description: `${plan.name} package (${isMonthly ? 'monthly' : 'annual'})`,
    upiPayLink: `upi://pay?${params.toString()}`,
  };
}

export function qrImageUrl(upiPayLink: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(upiPayLink)}`;
}

export function formatInr(amountInr: string | number | undefined) {
  const num = Number(amountInr);
  if (!Number.isFinite(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
}
