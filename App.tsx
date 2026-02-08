
import React, { useState, useEffect } from 'react';
import { Page, DonationConfig } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ContributionPage } from './pages/ContributionPage';
import { AdminPage } from './pages/AdminPage';
import { StickyDonateButton } from './components/StickyDonateButton';
import { getActiveCampaign, getCampaignByCid } from './constants';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [config, setConfig] = useState<DonationConfig>(getActiveCampaign());

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      
      // Rotas Públicas: #c/ID (Home) ou #p/ID (Pagamento)
      // Usamos split('?')[0] para ignorar parâmetros de rastreio que o Instagram/Facebook anexam ao hash
      if (hash.startsWith('#c/')) {
        const cid = hash.substring(3).split('?')[0];
        const camp = getCampaignByCid(cid);
        if (camp) {
          setConfig(camp);
          setCurrentPage(Page.Admin); // Visualização Pública da Campanha
        } else {
          window.location.hash = '';
        }
      } 
      else if (hash.startsWith('#p/')) {
        const cid = hash.substring(3).split('?')[0];
        const camp = getCampaignByCid(cid);
        if (camp) {
          setConfig(camp);
          setCurrentPage(Page.Contribution);
        } else {
          window.location.hash = '';
        }
      }
      else if (hash === '#admin' || hash === '#login') {
        // Rota explícita para o Painel Administrativo
        setCurrentPage(Page.Home);
      }
      else if (hash === '#campaign') {
        // Legado / Compatibilidade
        setCurrentPage(Page.Admin);
      } else {
        // Padrão: Se não houver hash ou for desconhecido, mostra a campanha ativa (Visualização Pública)
        // Isso resolve o problema de redirecionar para o login ao clicar em links com UTMs no Instagram
        setConfig(getActiveCampaign());
        setCurrentPage(Page.Admin);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const refreshConfig = () => {
    // No Dashboard, se houver mudança, recarrega
    if (currentPage === Page.Home) {
      setConfig(getActiveCampaign());
    }
  };

  const navigateToDonate = () => {
    window.location.hash = `#p/${config.campaignId}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToHome = () => {
    // Redireciona para o painel admin (Acessar Conta)
    window.location.hash = '#admin';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewCampaign = (selectedConfig: DonationConfig) => {
    setConfig(selectedConfig);
    window.location.hash = `#c/${selectedConfig.campaignId}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFD]">
      {currentPage !== Page.Home && <Header onDonateClick={navigateToDonate} />}
      
      <main className="flex-grow">
        {currentPage === Page.Home && (
          <AdminPage 
            onUpdate={refreshConfig} 
            onBack={() => { window.location.hash = ''; }} 
            onViewCampaign={handleViewCampaign} 
          />
        )}
        {currentPage === Page.Admin && (
          <HomePage onDonateClick={navigateToDonate} config={config} />
        )}
        {currentPage === Page.Contribution && (
          <ContributionPage onBack={() => {
            window.location.hash = `#c/${config.campaignId}`;
          }} config={config} />
        )}
      </main>

      {currentPage === Page.Admin && (
        <StickyDonateButton onClick={navigateToDonate} />
      )}

      {currentPage !== Page.Home && (
        <Footer onAdminClick={navigateToHome} />
      )}
    </div>
  );
};

export default App;
