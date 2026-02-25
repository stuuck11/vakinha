
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

export interface SigiloPayConfig {
  publicKey: string;
  secretKey: string;
}

export type PaymentGateway = 'sigilopay';

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
  sigiloPayConfig: SigiloPayConfig;
  metaPixelId?: string;
  metaAccessToken?: string;
}

export enum Page {
  Home = 'home',
  Contribution = 'contribution',
  Admin = 'admin'
}
