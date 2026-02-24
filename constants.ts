
import { DonationConfig } from './types';

export const COLORS = {
  primary: '#24CA68',
  secondary: '#EEFFE6',
  lightGray: '#F9F9F9',
  dark: '#1A1A1A',
};

const INITIAL_CAMPAIGN: DonationConfig = {
  id: 'default-1',
  campaignId: '5193165',
  mainImage: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1000',
  logoUrl: 'https://imgur.com/iXfnbqR.png',
  sealIcon: 'https://imgur.com/39baGGf.png',
  category: 'Saúde / Tratamentos',
  title: 'Salve o Malak',
  subtitle: 'O Malak precisa de uma cirurgia urgente.',
  description: 'O Mallak — nosso lindo furacão em forma de Golden Retriever — está enfrentando a batalha mais difícil de sua vida. Ele foi diagnosticado com uma grave doença neurológica, um tumor cerebral, e agora precisa urgentemente de tratamento especializado, com possibilidade de cirurgia e/ou radioterapia. Os custos são extremamente altos e aumentam a cada dia. Estamos fazendo tudo o que está ao nosso alcance, mas infelizmente não conseguimos seguir sozinhos...',
  targetAmount: 25784.90,
  currentAmount: 17422.74,
  heartsCount: 471,
  supportersCount: 368,
  creatorName: 'Admin',
  creatorSince: 'novembro/2024',
  beneficiaryName: 'Malak',
  topicTitle: 'Ajude o Malak a lutar pela vida 🐾 💛',
  presetAmounts: [30, 50, 75, 100, 200, 500, 750, 1000],
  minAmount: 5,
  upsells: [
    { id: 'transporte', label: 'Auxílio transporte', value: 10.00, icon: '🚗' },
    { id: 'medicacao', label: 'Ajuda com medicações', value: 25.00, icon: '💊' },
    { id: 'cesta', label: 'Doar cesta básica', value: 85.00, icon: '🧺' },
  ],
  isActive: true,
  gateway: 'appmax',
  stripeConfig: { publicKey: '', isTestMode: true },
  mercadopagoConfig: { publicKey: '' },
  asaasConfig: { apiKey: '' },
  pixupConfig: { apiKey: '' },
  stoneConfig: { apiKey: '' },
  braipConfig: { token: '', checkoutCode: '' },
  pagbankConfig: { token: '' },
  simpayConfig: { token: '' },
  appmaxConfig: { token: '' },
  metaPixelId: '',
  metaAccessToken: '',
  supporters: [
    { id: '1', name: 'Maria S.', amount: 100, comment: 'Força Malak! 💚', time: 'há 2 horas', avatarColor: '#E6FFFA' },
    { id: '2', name: 'João P.', amount: 50, comment: 'Estamos com você!', time: 'há 5 horas', avatarColor: '#F0FFF4' },
    { id: '3', name: 'Ana C.', amount: 200, comment: 'Melhoras pro pequeno 🐕❤️', time: 'há 1 dia', avatarColor: '#EBF8FF' },
    { id: '4', name: 'Carlos M.', amount: 30, comment: '', time: 'há 1 dia', avatarColor: '#F0FFF4' }
  ]
};

export const getStoredCampaigns = (): DonationConfig[] => {
  const stored = localStorage.getItem('vakinha_campaigns');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.map((c: any) => ({
        ...c,
        gateway: c.gateway || 'appmax',
        mercadopagoConfig: c.mercadopagoConfig || { publicKey: '' },
        asaasConfig: c.asaasConfig || { apiKey: '' },
        pixupConfig: c.pixupConfig || { apiKey: '' },
        stoneConfig: c.stoneConfig || { apiKey: '' },
        braipConfig: c.braipConfig || { token: '', checkoutCode: '' },
        pagbankConfig: c.pagbankConfig || { token: '' },
        simpayConfig: c.simpayConfig || { token: '' },
        appmaxConfig: c.appmaxConfig || { token: '' },
        logoUrl: c.logoUrl || 'https://imgur.com/iXfnbqR.png',
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
