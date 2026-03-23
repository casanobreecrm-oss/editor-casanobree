import React, { useState, useEffect } from 'react';
import { getUsers, addUser, removeUser } from '../data/users';
import { User } from '../types';
import { XCircleIcon, UsersIcon, LockIcon, TrashIcon, CheckCircleIcon } from './Icons';

interface AdminModalProps {
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  
  // Form States
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Carrega lista ao abrir
  useEffect(() => {
    refreshList();
  }, []);

  const refreshList = () => {
    setUsers(getUsers());
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!newName || !newUsername || !newPassword) {
      setError('Preencha todos os campos.');
      return;
    }

    try {
      addUser({
        name: newName,
        username: newUsername,
        password: newPassword
      });
      
      refreshList();
      setNewName('');
      setNewUsername('');
      setNewPassword('');
      setSuccessMsg('Corretor adicionado com sucesso!');
      
      setTimeout(() => setSuccessMsg(''), 3000);

    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar usuário.');
    }
  };

  const handleDeleteUser = (username: string) => {
    if (window.confirm(`Tem certeza que deseja remover o acesso de ${username}?`)) {
      try {
        removeUser(username);
        refreshList(); // Atualiza a lista imediatamente
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 border border-amber-500/20 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-neutral-800 p-4 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="bg-amber-500/10 p-2 rounded-lg text-amber-500">
               <UsersIcon className="w-6 h-6" />
             </div>
             <div>
               <h2 className="text-xl font-bold text-white">Gestão de Equipe</h2>
               <p className="text-xs text-neutral-400">Adicione ou remova corretores</p>
             </div>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
          
          {/* Formulário de Cadastro */}
          <div className="bg-neutral-800/50 p-5 rounded-xl border border-white/5">
            <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              + Cadastrar Novo Corretor
            </h3>
            
            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div>
                 <label className="block text-xs text-neutral-400 mb-1">Nome Completo</label>
                 <input 
                   type="text" 
                   value={newName}
                   onChange={e => setNewName(e.target.value)}
                   className="w-full bg-black/50 border border-neutral-700 rounded-lg p-2 text-sm text-white focus:border-amber-500 outline-none"
                   placeholder="Ex: João Silva"
                 />
               </div>
               <div>
                 <label className="block text-xs text-neutral-400 mb-1">Usuário (Login)</label>
                 <input 
                   type="text" 
                   value={newUsername}
                   onChange={e => setNewUsername(e.target.value)}
                   className="w-full bg-black/50 border border-neutral-700 rounded-lg p-2 text-sm text-white focus:border-amber-500 outline-none"
                   placeholder="Ex: joao"
                 />
               </div>
               <div>
                 <label className="block text-xs text-neutral-400 mb-1">Senha</label>
                 <input 
                   type="text" 
                   value={newPassword}
                   onChange={e => setNewPassword(e.target.value)}
                   className="w-full bg-black/50 border border-neutral-700 rounded-lg p-2 text-sm text-white focus:border-amber-500 outline-none"
                   placeholder="Ex: 123"
                 />
               </div>
               <div className="md:col-span-3 flex justify-end gap-3 items-center mt-2">
                  {error && <span className="text-red-400 text-xs">{error}</span>}
                  {successMsg && <span className="text-green-400 text-xs flex items-center gap-1"><CheckCircleIcon className="w-3 h-3" /> {successMsg}</span>}
                  <button 
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-500 text-black font-bold py-2 px-6 rounded-lg text-sm transition-colors"
                  >
                    Salvar Cadastro
                  </button>
               </div>
            </form>
          </div>

          {/* Lista de Usuários */}
          <div>
            <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-wider mb-3">Corretores Ativos ({users.length})</h3>
            <div className="bg-black/50 border border-neutral-700 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-neutral-800 text-neutral-400 border-b border-neutral-700">
                    <th className="p-3 font-medium">Nome</th>
                    <th className="p-3 font-medium">Login</th>
                    <th className="p-3 font-medium">Senha</th>
                    <th className="p-3 font-medium text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {users.map((u) => (
                    <tr key={u.username} className="hover:bg-neutral-800/30 transition-colors group">
                      <td className="p-3 text-white flex items-center gap-2">
                        {u.username === 'admin' && <LockIcon className="w-3 h-3 text-amber-500" />}
                        {u.name}
                      </td>
                      <td className="p-3 text-neutral-300 font-mono">{u.username}</td>
                      <td className="p-3 text-neutral-500 font-mono">{u.password}</td>
                      <td className="p-3 text-right">
                        {u.username !== 'admin' && (
                          <button 
                            type="button"
                            onClick={() => handleDeleteUser(u.username)}
                            className="text-red-500/70 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-lg cursor-pointer"
                            title="Remover Acesso"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <div className="bg-neutral-800 p-4 border-t border-white/5 text-right">
          <button 
            onClick={onClose}
            className="bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Fechar Painel
          </button>
        </div>
      </div>
    </div>
  );
};