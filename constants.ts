
import { DonationConfig } from './types';

export const COLORS = {
  primary: '#24CA68',
  secondary: '#EEFFE6',
  lightGray: '#F9F9F9',
  dark: '#1A1A1A',
};

const INITIAL_CAMPAIGN: DonationConfig = {
  id: 'default-1',
  campaignId: '000000',
  mainImage: 'https://i.imgur.com/RbZQZ66.png',
  logoUrl: 'https://i.imgur.com/RbZQZ66.png',
  sealIcon: 'https://imgur.com/39baGGf.png',
  category: 'Doação',
  title: 'Carregando campanha...',
  subtitle: 'Por favor, aguarde um momento.',
  description: 'Carregando informações da campanha...',
  targetAmount: 1,
  currentAmount: 0,
  heartsCount: 0,
  supportersCount: 0,
  creatorName: 'Organizador',
  creatorSince: '',
  beneficiaryName: 'Beneficiário',
  topicTitle: 'Sobre a campanha',
  presetAmounts: [30, 50, 100],
  minAmount: 5,
  upsells: [],
  isActive: true,
  gateway: 'sigilopay',
  sigiloPayConfig: { publicKey: '', secretKey: '' },
  metaPixelId: '',
  metaAccessToken: '',
  supporters: []
};

export const getStoredCampaigns = (): DonationConfig[] => {
  const stored = localStorage.getItem('vakinha_campaigns');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.map((c: any) => ({
        ...c,
        minAmount: 5, // Força o mínimo de 5 reais
        gateway: 'sigilopay',
        sigiloPayConfig: c.sigiloPayConfig || { publicKey: '', secretKey: '' },
        logoUrl: c.logoUrl || 'https://i.imgur.com/RbZQZ66.png',
        sealIcon: c.sealIcon || 'https://imgur.com/39baGGf.png',
        beneficiaryName: c.beneficiaryName || 'Malak',
        topicTitle: c.topicTitle || 'Ajude o Malak a lutar pela vida 🐾 💛',
        metaPixelId: c.metaPixelId || '',
        metaAccessToken: c.metaAccessToken || '',
        creatorName: c.creatorName || 'Admin',
        creatorSince: c.creatorSince || 'novembro/2024',
        upsells: c.upsells && c.upsells.length > 0 ? c.upsells : [
          { id: 'transporte', label: 'Auxílio transporte', value: 10.00, icon: '🚗' },
          { id: 'medicacao', label: 'Ajuda com medicações', value: 25.00, icon: '💊' },
          { id: 'cesta', label: 'Doar cesta básica', value: 85.00, icon: '🧺' },
        ]
      }));
    } catch (e) {
      return [INITIAL_CAMPAIGN];
    }
  }
  return [INITIAL_CAMPAIGN];
};

export const saveCampaigns = (campaigns: DonationConfig[]) => {
  localStorage.setItem('vakinha_campaigns', JSON.stringify(campaigns));
};

export const getActiveCampaign = (): DonationConfig => {
  const all = getStoredCampaigns();
  return all.find(c => c.isActive) || all[0] || INITIAL_CAMPAIGN;
};

export const getCampaignByCid = (cid: string): DonationConfig | undefined => {
  const all = getStoredCampaigns();
  return all.find(c => c.campaignId === cid || c.id === cid);
};
