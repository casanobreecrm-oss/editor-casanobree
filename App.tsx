import React, { useState, useEffect } from 'react';
import { ImageEditor } from './components/ImageEditor';
import { CasanobreeLogo, UserIcon, LogoutIcon, ShieldIcon } from './components/Icons';
import { LoginPage } from './components/LoginPage';
import { AdminModal } from './components/AdminModal';
import { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Verifica se já existe um usuário salvo no localStorage ao carregar
  useEffect(() => {
    const savedUser = localStorage.getItem('casanobree_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('casanobree_user');
      }
    }
  }, []);

  const handleLogin = (loggedUser: User) => {
    setUser(loggedUser);
    localStorage.setItem('casanobree_user', JSON.stringify(loggedUser));
  };

  const handleLogout = () => {
    setUser(null);
    setShowAdminPanel(false);
    localStorage.removeItem('casanobree_user');
  };

  // Se não estiver logado, mostra a tela de login
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#050505] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-[#050505] to-black text-slate-100 selection:bg-amber-500/30 selection:text-amber-200">
      
      {showAdminPanel && <AdminModal onClose={() => setShowAdminPanel(false)} />}

      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo Customizada Casanobree */}
            <div className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
              <CasanobreeLogo className="w-10 h-10" />
            </div>
            <div className="flex flex-col hidden sm:flex">
              <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600">
                CASANOBREE
              </h1>
              <span className="text-[10px] font-semibold tracking-[0.3em] text-amber-500/80 uppercase">
                Editor Inteligente
              </span>
            </div>
          </div>

          {/* Área do Usuário */}
          <div className="flex items-center gap-4">
             
             {/* Botão Admin (Apenas para admin) */}
             {user.username === 'admin' && (
               <button
                 onClick={() => setShowAdminPanel(true)}
                 className="flex items-center gap-2 text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 px-3 py-1.5 rounded-full transition-all mr-2"
               >
                 <ShieldIcon className="w-4 h-4" />
                 <span className="hidden md:inline">Gestão de Equipe</span>
               </button>
             )}

             <div className="flex items-center gap-2 bg-neutral-900/50 border border-white/5 rounded-full pl-2 pr-4 py-1.5">
                <div className="bg-neutral-800 p-1.5 rounded-full text-amber-500">
                   <UserIcon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-neutral-400 leading-none">Corretor</span>
                  <span className="text-sm font-medium text-white leading-none">{user.name}</span>
                </div>
             </div>
             
             <button 
                onClick={handleLogout}
                className="text-neutral-500 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-full"
                title="Sair do sistema"
             >
               <LogoutIcon className="w-5 h-5" />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white tracking-tight">
            Excelência Visual em <span className="text-amber-400">Cada Detalhe</span>
          </h2>
          <p className="text-neutral-400 text-lg font-light leading-relaxed">
            Bem-vindo(a), <strong className="text-white">{user.name}</strong>. Utilize nossa IA para preparar suas fotos antes de publicar no site ou portais.
          </p>
        </div>

        <ImageEditor user={user} />
      </main>
      
      <footer className="py-8 text-center text-neutral-600 text-sm border-t border-white/5 mt-12">
        <p>© {new Date().getFullYear()} Casanobree Imóveis. Uso exclusivo interno.</p>
      </footer>
    </div>
  );
};

export default App;