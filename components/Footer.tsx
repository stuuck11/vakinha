
import React from 'react';

interface FooterProps {
  onAdminClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onAdminClick }) => {
  return (
    <footer className="bg-[#1A1A1A] text-white pt-12 pb-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h4 className="font-bold text-lg mb-6 text-gray-300">Institucional</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white">Quem somos</a></li>
              <li><a href="#" className="hover:text-white">Campanhas</a></li>
              <li><a href="#" className="hover:text-white">Criar campanha</a></li>
              <li><button onClick={onAdminClick} className="hover:text-white text-left">Acessar conta</button></li>
              <li><a href="#" className="hover:text-white">Política de privacidade</a></li>
              <li><a href="#" className="hover:text-white">Termos de uso</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6 text-gray-300">Suporte</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white">Dúvidas frequentes</a></li>
              <li><a href="#" className="hover:text-white">Taxas e prazos</a></li>
              <li><a href="#" className="hover:text-white">Segurança e transparência</a></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6 text-gray-300">Contato</h4>
            <a href="#" className="inline-block bg-gray-800 px-6 py-3 rounded-lg text-sm font-bold border border-gray-700 hover:bg-gray-700 transition-colors">
              Falar com o suporte
            </a>
            
            <div className="mt-8">
              <h4 className="font-bold text-sm mb-4 text-gray-500 uppercase tracking-widest">Siga-nos</h4>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#24CA68] transition-colors cursor-pointer text-xl">f</div>
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#24CA68] transition-colors cursor-pointer text-xl">i</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-800 text-center text-xs text-gray-500">
          <p>© 2024 União Solidária. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
