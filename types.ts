
export interface Supporter {
  id: string;
  name: string;
  amount: number;
  comment: string;
  time: string;
  avatarColor: string;
}

export interface UpsellOption {
  id: string;
  label: string;
  value: number;
  icon: string;
}

export interface StripeConfig {
  publicKey: string;
  isTestMode: boolean;
}

export interface MercadoPagoConfig {
  publicKey: string;
}

export interface AsaasConfig {
  apiKey: string;
}

export interface PixUpConfig {
  apiKey: string;
}

export type PaymentGateway = 'stripe' | 'mercadopago' | 'asaas' | 'pixup' | 'stone' | 'braip' | 'pagbank';

export interface StoneConfig {
  apiKey: string;
}

export interface BraipConfig {
  token: string;
  checkoutCode: string;
}

export interface PagBankConfig {
  token: string;
}

export interface DonationConfig {
  id: string;
  campaignId: string;
  mainImage: string;
  logoUrl?: string;
  sealIcon?: string;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  heartsCount: number;
  supportersCount: number;
  creatorName: string;
  creatorSince: string;
  beneficiaryName: string;
  topicTitle: string;
  presetAmounts: number[];
  minAmount: number;
  upsells: UpsellOption[];
  isActive: boolean;
  supporters: Supporter[];
  gateway: PaymentGateway;
  stripeConfig: StripeConfig;
  mercadopagoConfig: MercadoPagoConfig;
  asaasConfig: AsaasConfig;
  pixupConfig: PixUpConfig;
  stoneConfig: StoneConfig;
  braipConfig: BraipConfig;
  pagbankConfig: PagBankConfig;
  metaPixelId?: string;
  metaAccessToken?: string;
}

export enum Page {
  Home = 'home',
  Contribution = 'contribution',
  Admin = 'admin'
}
