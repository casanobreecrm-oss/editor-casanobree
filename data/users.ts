import { User } from '../types';

// Atualizei a chave para limpar os dados antigos (Roberto e Julia) do cache do navegador
const DB_KEY = 'casanobree_users_db_v2';

// Usuários iniciais (Padrão) - Agora apenas o Admin
const DEFAULT_USERS: User[] = [
  {
    username: 'admin',
    password: '123',
    name: 'Administrador'
  }
];

// Carrega usuários do LocalStorage ou inicia com os padrões
export const getUsers = (): User[] => {
  const stored = localStorage.getItem(DB_KEY);
  if (!stored) {
    localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  return JSON.parse(stored);
};

// Salva a lista atualizada
const saveUsers = (users: User[]) => {
  localStorage.setItem(DB_KEY, JSON.stringify(users));
};

// Adiciona novo usuário
export const addUser = (newUser: User): void => {
  const users = getUsers();
  if (users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase())) {
    throw new Error('Este nome de usuário já existe.');
  }
  users.push(newUser);
  saveUsers(users);
};

// Remove usuário
export const removeUser = (username: string): void => {
  let users = getUsers();
  // Impede deletar o admin principal para evitar bloqueio total
  if (username === 'admin') {
    throw new Error('Não é possível remover o administrador principal.');
  }
  users = users.filter(u => u.username !== username);
  saveUsers(users);
};

// Função de Autenticação
export const authenticate = (username: string, pass: string): User | null => {
  const users = getUsers();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === pass);
  
  if (user) {
    // Retorna o usuário sem a senha por segurança no estado da aplicação (cópia rasa)
    const { password, ...safeUser } = user; 
    return safeUser as User;
  }
  return null;
};