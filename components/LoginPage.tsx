import React, { useState } from 'react';
import { CasanobreeLogo, UserIcon, LockIcon, ArrowRightIcon, LoadingSpinner } from './Icons';
import { authenticate } from '../data/users';
import { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simula um pequeno delay para sensação de processamento
    setTimeout(() => {
      const user = authenticate(username, password);
      
      if (user) {
        onLogin(user);
      } else {
        setError('Usuário ou senha incorretos.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-[#050505] to-black px-4">
      <div className="w-full max-w-md">
        
        {/* Header da Tela de Login */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
             <div className="text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] p-4 rounded-full bg-amber-500/5 border border-amber-500/20">
              <CasanobreeLogo className="w-16 h-16" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            CASANOBREE <span className="text-amber-500 text-sm align-top tracking-[0.2em]">INTRA</span>
          </h1>
          <p className="text-neutral-500">Área exclusiva para corretores</p>
        </div>

        {/* Box de Login */}
        <div className="bg-neutral-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="bg-red-900/20 border border-red-500/30 text-red-200 text-sm p-3 rounded-lg text-center animate-fadeIn">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-amber-400 transition-colors">
                  <UserIcon className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Usuário"
                  className="w-full bg-black/50 border border-neutral-700 text-white rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder-neutral-600"
                  required
                />
              </div>

              <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-amber-400 transition-colors">
                  <LockIcon className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  className="w-full bg-black/50 border border-neutral-700 text-white rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder-neutral-600"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(245,158,11,0.39)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.23)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <LoadingSpinner className="w-5 h-5" />
              ) : (
                <>
                  Entrar no Sistema <ArrowRightIcon className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-neutral-600 text-xs mt-8">
          © Casanobree Imóveis. Acesso restrito e monitorado.
        </p>
      </div>
    </div>
  );
};