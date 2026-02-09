
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
  // Page.Admin renderiza a HomePage (público) e Page.Home renderiza o AdminPage (painel)
  const [currentPage, setCurrentPage] = useState<Page>(Page.Admin); 
  const [config, setConfig] = useState<DonationConfig>(getActiveCampaign());

  useEffect(() => {
    const handleRoute = () => {
      // Usando PATHNAME para links limpos compatíveis com Instagram
      const path = window.location.pathname;
      
      if (path.startsWith('/c/')) {
        const cid = path.substring(3).split('?')[0];
        const camp = getCampaignByCid(cid);
        if (camp) {
          setConfig(camp);
          setCurrentPage(Page.Admin); 
        } else {
          // Se não achar a campanha, volta pra raiz
          pushRoute('/', true);
        }
      } 
      else if (path.startsWith('/p/')) {
        const cid = path.substring(3).split('?')[0];
        const camp = getCampaignByCid(cid);
        if (camp) {
          setConfig(camp);
          setCurrentPage(Page.Contribution);
        } else {
          pushRoute('/', true);
        }
      }
      else if (path === '/login' || path === '/admin-panel') {
        setCurrentPage(Page.Home);
      } else {
        // Rota padrão ou raiz
        const active = getActiveCampaign();
        setConfig(active);
        setCurrentPage(Page.Admin);
      }
    };

    handleRoute();
    window.addEventListener('popstate', handleRoute);
    return () => window.removeEventListener('popstate', handleRoute);
  }, []);

  const refreshConfig = () => {
    setConfig(getActiveCampaign());
  };

  /**
   * pushRoute: Muda a rota da aplicação.
   * @param path O caminho a ser navegado
   * @param replace Se deve substituir o histórico em vez de adicionar
   */
  const pushRoute = (path: string, replace = false) => {
    try {
      if (replace) {
        window.history.replaceState({}, '', path);
      } else {
        window.history.pushState({}, '', path);
      }
    } catch (e) {
      console.warn("Aviso: A atualização da URL foi bloqueada pelo sandbox, mas a navegação interna continuará funcionando.", e);
    }
    
    // Dispara o evento manualmente para o useEffect reagir à mudança de estado
    window.dispatchEvent(new Event('popstate'));
    
    // Teleporte imediato para o topo (sem animação suave)
    window.scrollTo(0, 0);
  };

  const navigateToDonate = () => {
    pushRoute(`/p/${config.campaignId}`);
  };

  const navigateToAdmin = () => {
    pushRoute('/login');
  };

  const handleViewCampaign = (selectedConfig: DonationConfig) => {
    setConfig(selectedConfig);
    pushRoute(`/c/${selectedConfig.campaignId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFD]">
      {currentPage !== Page.Home && (
        <Header onDonateClick={navigateToDonate} />
      )}
      
      <main className="flex-grow">
        {/* Painel Administrativo */}
        {currentPage === Page.Home && (
          <AdminPage 
            onUpdate={refreshConfig} 
            onBack={() => pushRoute('/')} 
            onViewCampaign={handleViewCampaign} 
          />
        )}

        {/* Site Público da Campanha */}
        {currentPage === Page.Admin && (
          <HomePage onDonateClick={navigateToDonate} config={config} />
        )}

        {/* Página de Checkout/PIX */}
        {currentPage === Page.Contribution && (
          <ContributionPage 
            onBack={() => pushRoute(`/c/${config.campaignId}`)} 
            config={config} 
          />
        )}
      </main>

      {/* Botão flutuante apenas no site público */}
      {currentPage === Page.Admin && (
        <StickyDonateButton onClick={navigateToDonate} />
      )}

      {/* Footer em todas as páginas exceto Admin */}
      {currentPage !== Page.Home && (
        <Footer onAdminClick={navigateToAdmin} />
      )}
    </div>
  );
};

export default App;
