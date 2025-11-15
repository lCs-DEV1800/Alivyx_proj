
import React, { useState, useRef, useEffect } from 'react';
import { authService, appointmentService, doctorService, notificationService } from './services/api';

// ==================== TIPOS ====================
enum View {
  Login = 'login',
  Register = 'register',
  Dashboard = 'dashboard',
  DoctorDashboard = 'doctorDashboard',
  DoctorAvailability = 'doctorAvailability',
  ScheduleAppointment = 'scheduleAppointment',
  ScheduleExam = 'scheduleExam',
  Verify = 'verify',
  Queue = 'queue',
  AppointmentHistory = 'appointmentHistory',
  Profile = 'profile'
}

interface User {
  id: string;
  cpf: string;
  name: string;
  email: string;
  phone: string;
}

interface Appointment {
  id: string;
  patientName: string;
  cpf: string;
  district: string;
  specialty: string;
  date: string;
  time: string;
  city: string;
  ubs: string;
  queuePosition: number;
}

interface AppNotification {
  id: string;
  message: string;
  timestamp: number;
  read: boolean;
}

// ==================== CONSTANTES ====================
const DISTRICTS: Record<string, string[]> = {
  Natal: ['Alecrim', 'Candelária', 'Capim Macio', 'Cidade Alta', 'Lagoa Nova', 'Petrópolis', 'Ponta Negra', 'Tirol']
};

const UBS_LOCATIONS: Record<string, Array<{name: string, lat: number, lng: number}>> = {
  'Alecrim': [{name: 'UBS Alecrim', lat: -5.7945, lng: -35.2188}],
  'Candelária': [{name: 'UBS Candelária', lat: -5.7845, lng: -35.2088}],
  'Capim Macio': [{name: 'UBS Capim Macio', lat: -5.8545, lng: -35.1788}],
  'Cidade Alta': [{name: 'UBS Cidade Alta', lat: -5.7745, lng: -35.1988}],
  'Lagoa Nova': [{name: 'UBS Lagoa Nova', lat: -5.8345, lng: -35.2088}],
  'Petrópolis': [{name: 'UBS Petrópolis', lat: -5.7845, lng: -35.1888}],
  'Ponta Negra': [{name: 'UBS Ponta Negra', lat: -5.8845, lng: -35.1688}],
  'Tirol': [{name: 'UBS Tirol', lat: -5.7945, lng: -35.1988}]
};

const SPECIALTIES = ['Cardiologia', 'Clínica Geral', 'Dermatologia', 'Ginecologia', 'Pediatria', 'Ortopedia'];
const EXAM_TYPES = ['Hemograma', 'Raio-X', 'Ultrassonografia', 'Tomografia', 'Ressonância Magnética', 'Eletrocardiograma'];
const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

/// ==================== UTILITÁRIOS ====================
const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  return numbers
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .slice(0, 14);
};

const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  return numbers
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);
};

const validateCPF = (cpf: string): boolean => {
  const numbers = cpf.replace(/\D/g, '');
  return numbers.length === 11;
};

const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const timeSince = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " anos";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " meses";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " dias";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " horas";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutos";
  return "agora";
};

// ==================== COMPONENTES COMUNS ====================
const Logo = () => (
  <div className="flex items-center justify-center">
    <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-3xl shadow-2xl">
      <div className="flex items-center justify-center mb-4">
        <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center rounded-2xl shadow-lg transform hover:scale-105 transition-transform">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
      </div>
      <h1 className="text-3xl font-black text-gray-800 text-center">CheckAgora</h1>
      <p className="text-teal-600 font-bold text-center mt-1">Alivyx</p>
    </div>
  </div>
);

const HeaderLogo = () => (
  <div className="flex items-center space-x-3">
    <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center rounded-xl shadow-md">
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
      </svg>
    </div>
    <div className="flex items-baseline">
      <h1 className="text-2xl font-black text-gray-800">CheckAgora</h1>
      <p className="text-lg text-teal-600 font-bold ml-1">Alivyx</p>
    </div>
  </div>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, error, ...props }, ref) => (
  <div className="w-full">
    <input
      ref={ref}
      placeholder={label}
      {...props}
      className={`w-full px-5 py-4 bg-white border-2 ${error ? 'border-red-400' : 'border-gray-200'} rounded-2xl shadow-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition text-gray-800 placeholder-gray-400`}
    />
    {error && <p className="text-red-500 text-sm mt-1 ml-2">{error}</p>}
  </div>
));

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  children: React.ReactNode;
};

const Select = ({ children, className, ...props }: SelectProps) => (
  <select {...props} className={`w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition appearance-none text-gray-800 ${className || ''}`.trim()}>
    {children}
  </select>
);

// ==================== NOTIFICATION CENTER ====================
const NotificationBell = ({ count, onClick }: { count: number, onClick: () => void }) => (
  <button onClick={onClick} className="relative text-gray-700 p-2.5 rounded-xl hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
    {count > 0 && (
      <span className="absolute -top-1 -right-1 flex h-5 w-5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center font-bold">{count}</span>
      </span>
    )}
  </button>
);

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

const NotificationCenter = ({ notifications, onMarkAsRead, onMarkAllAsRead }: NotificationCenterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const node = useRef<HTMLDivElement>(null);

  const handleClickOutside = (e: MouseEvent) => {
    if (node.current?.contains(e.target as Node)) return;
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={node}>
      <NotificationBell count={unreadCount} onClick={() => setIsOpen(!isOpen)} />
      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl z-50 border border-gray-100 overflow-hidden">
          <div className="p-4 flex justify-between items-center border-b border-gray-100 bg-gradient-to-r from-teal-50 to-teal-100">
            <h3 className="font-bold text-gray-800 text-lg">Notificações</h3>
            {unreadCount > 0 && (
              <button onClick={onMarkAllAsRead} className="text-sm text-teal-600 hover:text-teal-700 font-semibold">
                Marcar todas como lidas
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(n => (
                <li 
                  key={n.id} 
                  className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!n.read ? 'bg-teal-50' : ''}`} 
                  onClick={() => !n.read && onMarkAsRead(n.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.read ? 'bg-teal-500' : 'bg-gray-300'}`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{n.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{timeSince(n.timestamp)}</p>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="p-8 text-center text-sm text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Nenhuma notificação.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// ==================== LAYOUTS ====================
const AuthLayout = ({ children, title }: { children?: React.ReactNode; title: string }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50">
    <div className="w-full max-w-md mx-auto">
      <Logo />
      <div className="mt-8 bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <h2 className="text-3xl font-black text-center text-gray-800 mb-6">{title}</h2>
        {children}
      </div>
    </div>
  </div>
);

interface AppLayoutProps {
  children?: React.ReactNode;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onLogout: () => void;
  onNavigateToProfile: () => void;
}

const AppLayout = ({ children, notifications, onMarkAsRead, onMarkAllAsRead, onLogout, onNavigateToProfile }: AppLayoutProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuNode = useRef<HTMLDivElement>(null);

  const handleClickOutside = (e: MouseEvent) => {
    if (menuNode.current?.contains(e.target as Node)) return;
    setIsMenuOpen(false);
  };

  useEffect(() => {
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50">
      <header className="bg-white/90 backdrop-blur-md shadow-md sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-5xl mx-auto p-4 flex justify-between items-center">
          <HeaderLogo />
          <div className="flex items-center space-x-2">
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={onMarkAsRead}
              onMarkAllAsRead={onMarkAllAsRead}
            />
            <div className="relative" ref={menuNode}>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="p-2.5 rounded-xl hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                </svg>
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl z-50 border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => {
                      onNavigateToProfile();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-teal-50 transition-colors font-medium"
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Perfil</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      onLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-5 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium border-t border-gray-100"
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Sair</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

// ==================== TELAS ====================
const LoginScreen = ({ onLoginAttempt, setView }: { onLoginAttempt: (identifier: string, password: string) => Promise<void>; setView: (view: View) => void }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Se parece com CPF (tem números), formata como CPF
    if (/^[0-9.\-]*$/.test(value)) {
      setIdentifier(formatCPF(value));
    } else {
      setIdentifier(value);
    }
    setError('');
  };

  const handleLoginClick = async () => {
    if (!identifier || !password) {
      setError('Por favor, preencha CPF/Email e senha.');
      return;
    }
    setIsLoading(true);
    try {
      await onLoginAttempt(identifier, password);
    } catch (error) {
      setError('Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Bem-vindo">
      <div className="space-y-4">
        <Input label="CPF ou Email" value={identifier} onChange={handleIdentifierChange} disabled={isLoading} error={error} placeholder="Digite seu CPF ou email" />
        <Input label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
      </div>
      <button 
        onClick={handleLoginClick} 
        disabled={isLoading} 
        className="w-full mt-6 bg-gradient-to-r from-teal-500 to-teal-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:from-teal-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center space-x-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Entrando...</span>
          </span>
        ) : 'Entrar'}
      </button>
      <p className="text-center mt-6 text-gray-600">
        Não possui cadastro?{' '}
        <button onClick={() => setView(View.Register)} className="font-bold text-teal-600 hover:text-teal-700 transition-colors" disabled={isLoading}>
          Cadastrar
        </button>
      </p>
    </AuthLayout>
  );
};

const RegisterScreen = ({ onRegisterAttempt, setView }: { onRegisterAttempt: (user: Omit<User, 'id'>, password: string, userType?: string, registrationCode?: string) => Promise<void>; setView: (view: View) => void }) => {
  const [userType, setUserType] = useState<'patient' | 'doctor'>('patient');
  const [cpf, setCpf] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registrationCode, setRegistrationCode] = useState('');
  const [crm, setCrm] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleRegisterClick = async () => {
    const newErrors: {[key: string]: string} = {};
    if (!validateCPF(cpf)) newErrors.cpf = 'CPF inválido.';
    if (!name) newErrors.name = 'Nome é obrigatório.';
    if (!validateEmail(email)) newErrors.email = 'Email inválido.';
    if (phone.replace(/\D/g, '').length < 10) newErrors.phone = 'Telefone inválido.';
    if (password.length < 6) newErrors.password = 'Senha deve ter no mínimo 6 caracteres.';
    if (password !== confirmPassword) newErrors.confirmPassword = 'As senhas não coincidem.';
    if (userType === 'doctor' && registrationCode !== 'ALIVIX') {
      newErrors.registrationCode = 'Código de registro inválido.';
    }
    if (userType === 'doctor' && !crm) {
      newErrors.crm = 'CRM é obrigatório para médicos.';
    }

    setErrors(newErrors);

      if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        const userData = userType === 'doctor' ? { cpf: crm, name, email, phone } : { cpf, name, email, phone };
        await onRegisterAttempt(userData, password, userType, registrationCode);
      } catch (error) {
        setErrors({general: 'Erro ao cadastrar. Tente novamente.'});
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <AuthLayout title="Cadastro">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Usuário</label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setUserType('patient')}
              disabled={isLoading}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                userType === 'patient'
                  ? 'bg-teal-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Paciente
            </button>
            <button
              type="button"
              onClick={() => setUserType('doctor')}
              disabled={isLoading}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                userType === 'doctor'
                  ? 'bg-teal-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Médico
            </button>
          </div>
        </div>
        {userType === 'patient' ? (
          <Input label="CPF" value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} maxLength={14} inputMode="numeric" disabled={isLoading} error={errors.cpf} />
        ) : (
          <Input
            label="CRM"
            value={crm}
            onChange={(e) => setCrm(e.target.value)}
            disabled={isLoading}
            error={errors.crm}
            placeholder="Digite seu CRM ou número de registro"
          />
        )}
        <Input label="Nome completo" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} error={errors.name} />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} error={errors.email} />
        <Input label="Telefone" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} maxLength={15} inputMode="tel" disabled={isLoading} error={errors.phone} />
        {userType === 'doctor' && (
          <Input
            label="Código de Registro (ALIVIX)"
            value={registrationCode}
            onChange={(e) => setRegistrationCode(e.target.value.toUpperCase())}
            disabled={isLoading}
            error={errors.registrationCode}
            placeholder="Digite o código ALIVIX"
          />
        )}
        <Input label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} error={errors.password} />
        <Input label="Confirmar senha" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} error={errors.confirmPassword} />
      </div>
      <button 
        onClick={handleRegisterClick} 
        disabled={isLoading} 
        className="w-full mt-6 bg-gradient-to-r from-teal-500 to-teal-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:from-teal-600 hover:to-teal-700 transition-all disabled:opacity-50"
      >
        {isLoading ? 'Cadastrando...' : 'Cadastrar'}
      </button>
      <p className="text-center mt-6 text-gray-600">
        Já possui cadastro?{' '}
        <button onClick={() => setView(View.Login)} className="font-bold text-teal-600 hover:text-teal-700 transition-colors" disabled={isLoading}>
          Entrar
        </button>
      </p>
    </AuthLayout>
  );
};

const DashboardScreen = ({ setView, notifications, onMarkAsRead, onMarkAllAsRead, onLogout, onNavigateToProfile }: { setView: (view: View) => void } & Omit<AppLayoutProps, 'children'>) => {
  return (
    <AppLayout notifications={notifications} onMarkAsRead={onMarkAsRead} onMarkAllAsRead={onMarkAllAsRead} onLogout={onLogout} onNavigateToProfile={onNavigateToProfile}>
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-3 leading-tight">
            Seu tempo vale,<br/>a gente cuida
          </h1>
          <p className="text-gray-600 text-lg">Agende exames de forma simples e rápida</p>
        </div>
        
        <div className="mt-10 space-y-4 max-w-2xl mx-auto">
          <button 
            onClick={() => setView(View.ScheduleExam)} 
            className="w-full group bg-white hover:bg-gradient-to-br hover:from-blue-500 hover:to-blue-600 text-gray-800 hover:text-white p-6 rounded-2xl font-semibold shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 border-2 border-gray-100"
          >
            <div className="flex items-center justify-center space-x-3">
              <svg className="w-8 h-8 text-blue-500 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17,2H7C5.9,2,5,2.9,5,4v16c0,1.1,0.9,2,2,2h10c1.1,0,2-0.9,2-2V4C19,2.9,18.1,2,17,2z M17,18H7V4h2v5h6V4h2V18z"></path>
              </svg>
              <span className="text-xl">Agendar Exame</span>
            </div>
          </button>
          
          <button 
            onClick={() => setView(View.Verify)} 
            className="w-full bg-white hover:bg-gray-50 text-gray-800 border-2 border-teal-500 p-6 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-center space-x-3">
              <svg className="w-7 h-7 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
              </svg>
              <span className="text-xl">Verificar Agendamento</span>
            </div>
          </button>
          
          <button 
            onClick={() => setView(View.AppointmentHistory)} 
            className="w-full bg-white hover:bg-gray-50 text-gray-800 border-2 border-teal-500 p-6 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-center space-x-3">
              <svg className="w-7 h-7 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.25 2.52.75-1.23-3.5-2.07V8H12z"/>
              </svg>
              <span className="text-xl">Histórico de Agendamentos</span>
            </div>
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

const ScheduleExamScreen = ({ setView, user, onSchedule, notifications, onMarkAsRead, onMarkAllAsRead, onLogout, onNavigateToProfile }: any) => {
  const [district, setDistrict] = useState('');
  const [ubs, setUbs] = useState('');
  const [examType, setExamType] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedUbsLocation, setSelectedUbsLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const availableTimes = React.useMemo(() => {
    if (!selectedDate) return [];
    const now = new Date();
    const currentDateStr = now.toISOString().split('T')[0];
    if (selectedDate === currentDateStr) {
      const currentHour = now.getHours();
      return TIME_SLOTS.filter(time => parseInt(time.split(':')[0]) > currentHour);
    }
    return TIME_SLOTS;
  }, [selectedDate]);

  const ubsOptions = React.useMemo(() => district ? UBS_LOCATIONS[district] || [] : [], [district]);

  useEffect(() => {
    setUbs('');
    setSelectedUbsLocation(null);
  }, [district]);

  const handleUbsChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ubsName = e.target.value;
    setUbs(ubsName);
    const ubsData = ubsOptions.find(u => u.name === ubsName);
    setSelectedUbsLocation(ubsData ? { lat: ubsData.lat, lng: ubsData.lng } : null);
    
    // Buscar médicos da UBS
    if (ubsName) {
      try {
        const ubsListResponse = await appointmentService.getUBSByDistrict(district);
        const selectedUbs = ubsListResponse.find((u: any) => u.name === ubsName);
        if (selectedUbs) {
          const doctorsList = await appointmentService.getDoctorsByUbs(selectedUbs.id);
          setDoctors(doctorsList);
          if (doctorsList.length > 0) {
            setSelectedDoctor(doctorsList[0].id.toString());
          }
        }
      } catch (error) {
        console.error('Erro ao buscar médicos:', error);
      }
    }
  };

  const handleConfirm = async () => {
    if (!district || !examType || !selectedDate || !selectedTime || !ubs || !selectedDoctor) {
      alert('Por favor, preencha todos os campos.');
      return;
    }
    setIsLoading(true);
    try {
      await onSchedule({ district, specialty: examType, date: selectedDate, time: selectedTime, city: 'Natal', ubs });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout notifications={notifications} onMarkAsRead={onMarkAsRead} onMarkAllAsRead={onMarkAllAsRead} onLogout={onLogout} onNavigateToProfile={onNavigateToProfile}>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <h1 className="text-3xl font-black text-gray-800 mb-6 text-center">Agendar Exame</h1>
          
          <div className="space-y-4">
            <Select defaultValue={user.cpf} disabled>
              <option value={user.cpf}>{user.cpf}</option>
            </Select>

            <Select defaultValue="Rio Grande do Norte" disabled>
              <option value="Rio Grande do Norte">Rio Grande do Norte</option>
            </Select>

            <Select defaultValue="Natal" disabled>
              <option value="Natal">Natal</option>
            </Select>

            <Select value={district} onChange={e => setDistrict(e.target.value)}>
              <option value="" disabled>Selecione o bairro</option>
              {DISTRICTS['Natal']?.map(d => <option key={d} value={d}>{d}</option>)}
            </Select>

            <Select value={ubs} onChange={handleUbsChange} disabled={!district}>
              <option value="" disabled>Selecione a UBS</option>
              {ubsOptions.length > 0 ? (
                ubsOptions.map(u => <option key={u.name} value={u.name}>{u.name}</option>)
              ) : (
                <option disabled>Nenhuma UBS encontrada</option>
              )}
            </Select>

            {doctors.length > 0 && (
              <Select value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)}>
                <option value="" disabled>Selecione o médico</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} - {doc.specialty}
                  </option>
                ))}
              </Select>
            )}

            <Select value={examType} onChange={e => setExamType(e.target.value)}>
              <option value="" disabled>Selecione o tipo de exame</option>
              {EXAM_TYPES.map(exam => <option key={exam} value={exam}>{exam}</option>)}
            </Select>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => {
                    setSelectedDate(e.target.value);
                    setSelectedTime('');
                  }}
                  min={today}
                  className="w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition text-gray-800"
                />
              </div>
              <Select value={selectedTime} onChange={e => setSelectedTime(e.target.value)} disabled={!selectedDate}>
                <option value="" disabled>Horário</option>
                {availableTimes.length > 0 ? (
                  availableTimes.map(time => <option key={time} value={time}>{time}</option>)
                ) : (
                  <option disabled>Sem horários</option>
                )}
              </Select>
            </div>
          </div>

          <div className="flex space-x-4 mt-8">
            <button 
              onClick={() => setView(View.Dashboard)} 
              disabled={isLoading} 
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-2xl font-bold shadow-md transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirm} 
              disabled={isLoading} 
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {isLoading ? 'Confirmando...' : 'Confirmar'}
            </button>
          </div>
        </div>

        {selectedUbsLocation && (
          <div className="mt-6 bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Localização da UBS</h3>
            <div className="w-full h-80 rounded-2xl overflow-hidden shadow-lg">
              <iframe
                src={`https://maps.google.com/maps?q=${selectedUbsLocation.lat},${selectedUbsLocation.lng}&z=15&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                title="Mapa da UBS"
              ></iframe>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

const QueueScreen = ({ setView, position, notifications, onMarkAsRead, onMarkAllAsRead, onLogout, onNavigateToProfile }: any) => {
  return (
    <AppLayout notifications={notifications} onMarkAsRead={onMarkAsRead} onMarkAllAsRead={onMarkAllAsRead} onLogout={onLogout} onNavigateToProfile={onNavigateToProfile}>
      <div className="text-center flex flex-col items-center justify-center py-10">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-lg border border-gray-100">
          <div className="mb-6">
            <svg className="w-20 h-20 mx-auto text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-gray-800 mb-4">Agendamento em Fila</h1>
          <p className="text-xl text-gray-600 mb-6">Sua posição na fila é</p>
          <div className="relative">
            <div className="w-56 h-56 mx-auto rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center shadow-2xl border-8 border-white">
              <span className="text-8xl font-black text-teal-600" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>{position}</span>
            </div>
            <div className="absolute inset-0 w-56 h-56 mx-auto rounded-full bg-teal-400 opacity-20 animate-ping"></div>
          </div>
          <p className="mt-8 text-gray-600 leading-relaxed">
            Seu agendamento foi recebido e está na fila para confirmação. Você pode voltar à tela inicial e verificar sua posição a qualquer momento.
          </p>
        </div>
        <button 
          onClick={() => setView(View.Dashboard)} 
          className="w-full max-w-md mt-8 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all"
        >
          Voltar à Tela Inicial
        </button>
      </div>
    </AppLayout>
  );
};

const VerifyScreen = ({ setView, scheduledAppointments, onCancelAppointment, notifications, onMarkAsRead, onMarkAllAsRead, onLogout, onNavigateToProfile }: any) => {
  const [searchDate, setSearchDate] = useState('');
  const [foundAppointments, setFoundAppointments] = useState<Appointment[]>([]);

  const handleSearch = () => {
    if (!searchDate) {
      alert('Por favor, selecione uma data.');
      return;
    }
    const appointmentsOnDate = scheduledAppointments.filter((app: Appointment) => app.date === searchDate);
    if (appointmentsOnDate.length > 0) {
      const sortedAppointments = appointmentsOnDate.sort((a: Appointment, b: Appointment) => a.time.localeCompare(b.time));
      setFoundAppointments(sortedAppointments);
    } else {
      setFoundAppointments([]);
      alert('Nenhum agendamento encontrado para a data informada.');
    }
  };

  const handleCancel = (appointmentToCancel: Appointment) => {
    onCancelAppointment(appointmentToCancel);
    setFoundAppointments(prev => prev.filter(app => app.id !== appointmentToCancel.id));
  };

  return (
    <AppLayout notifications={notifications} onMarkAsRead={onMarkAsRead} onMarkAllAsRead={onMarkAllAsRead} onLogout={onLogout} onNavigateToProfile={onNavigateToProfile}>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 mb-6">
          <h1 className="text-3xl font-black text-gray-800 mb-6 text-center">Verificar Agendamento</h1>
          <div className="flex items-center space-x-3">
            <input
              type="date"
              value={searchDate}
              onChange={e => setSearchDate(e.target.value)}
              className="flex-1 px-5 py-4 bg-white border-2 border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition text-gray-800"
            />
            <button 
              onClick={handleSearch} 
              className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              Buscar
            </button>
          </div>
        </div>

        {foundAppointments.length > 0 ? (
          <div className="space-y-4">
            {foundAppointments.map((app) => (
              <div key={app.id} className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-2xl font-bold text-gray-800">{app.patientName}</h3>
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center border-2 border-teal-200">
                          <span className="text-2xl font-black text-teal-600">{app.queuePosition}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-500 mt-1">NÂº Fila</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <p><span className="font-semibold text-gray-600">CPF:</span> <span className="text-gray-800">{app.cpf}</span></p>
                    <p><span className="font-semibold text-gray-600">Procedimento:</span> <span className="text-gray-800">{app.specialty}</span></p>
                    <p><span className="font-semibold text-gray-600">Data:</span> <span className="text-gray-800">{new Date(app.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span></p>
                    <p><span className="font-semibold text-gray-600">Horário:</span> <span className="text-gray-800">{app.time}</span></p>
                    <p><span className="font-semibold text-gray-600">Bairro:</span> <span className="text-gray-800">{app.district}</span></p>
                    <p><span className="font-semibold text-gray-600">UBS:</span> <span className="text-gray-800">{app.ubs}</span></p>
                  </div>
                  <button 
                    onClick={() => handleCancel(app)} 
                    className="w-full mt-4 bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-2xl font-bold transition-all border-2 border-red-200"
                  >
                    Cancelar Agendamento
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : searchDate ? (
          <div className="bg-white rounded-3xl shadow-xl p-12 border border-gray-100 text-center">
            <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 text-lg">Nenhum agendamento encontrado para esta data.</p>
          </div>
        ) : null}

        <button 
          onClick={() => setView(View.Dashboard)} 
          className="w-full mt-6 bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-2xl font-bold shadow-md transition-all"
        >
          Voltar à Tela Inicial
        </button>
      </div>
    </AppLayout>
  );
};

const AppointmentHistoryScreen = ({ setView, appointments, onCancelAppointment, notifications, onMarkAsRead, onMarkAllAsRead, onLogout, onNavigateToProfile }: any) => {
  const now = new Date();
  const upcomingAppointments = appointments
    .filter((app: Appointment) => new Date(`${app.date}T${app.time}:00`) >= now)
    .sort((a: Appointment, b: Appointment) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
  const pastAppointments = appointments
    .filter((app: Appointment) => new Date(`${app.date}T${app.time}:00`) < now)
    .sort((a: Appointment, b: Appointment) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());

  const AppointmentCard = ({ appointment, onCancel, isUpcoming }: any) => {
    const isExam = EXAM_TYPES.includes(appointment.specialty);
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800">{appointment.specialty}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isExam ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
              {isExam ? 'ðŸ”¬ Exame' : 'ðŸ©º Consulta'}
            </span>
          </div>
          <div className="flex flex-col items-center ml-4">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-200">
              <span className="text-xl font-black text-gray-600">{appointment.queuePosition}</span>
            </div>
            <span className="text-xs font-bold text-gray-500 mt-1">NÂº Fila</span>
          </div>
        </div>
        <div className="space-y-2 text-sm text-gray-600">
          <p><span className="font-semibold">Paciente:</span> {appointment.patientName}</p>
          <p><span className="font-semibold">CPF:</span> {appointment.cpf}</p>
          <p><span className="font-semibold">Local:</span> {appointment.ubs}, {appointment.district}</p>
          <p className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
            </svg>
            <span>{new Date(appointment.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} às {appointment.time}</span>
          </p>
        </div>
        {isUpcoming && onCancel && (
          <button 
            onClick={() => onCancel(appointment)} 
            className="w-full mt-4 bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl font-semibold transition-all border border-red-200"
          >
            Cancelar Agendamento
          </button>
        )}
      </div>
    );
  };

  return (
    <AppLayout notifications={notifications} onMarkAsRead={onMarkAsRead} onMarkAllAsRead={onMarkAllAsRead} onLogout={onLogout} onNavigateToProfile={onNavigateToProfile}>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 mb-6">
          <h1 className="text-3xl font-black text-gray-800 text-center">Histórico de Agendamentos</h1>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <span className="w-2 h-8 bg-teal-500 rounded-full"></span>
            <span>Próximos Agendamentos</span>
          </h2>
          {upcomingAppointments.length > 0 ? (
            <div className="grid gap-4">
              {upcomingAppointments.map((app: Appointment) => (
                <AppointmentCard key={app.id} appointment={app} onCancel={onCancelAppointment} isUpcoming={true} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
              <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500">Você não possui agendamentos futuros.</p>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <span className="w-2 h-8 bg-gray-400 rounded-full"></span>
            <span>Agendamentos Anteriores</span>
          </h2>
          {pastAppointments.length > 0 ? (
            <div className="grid gap-4">
              {pastAppointments.map((app: Appointment) => (
                <AppointmentCard key={app.id} appointment={app} isUpcoming={false} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
              <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500">Você não possui agendamentos anteriores.</p>
            </div>
          )}
        </section>

        <button 
          onClick={() => setView(View.Dashboard)} 
          className="w-full mt-8 bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-2xl font-bold shadow-md transition-all"
        >
          Voltar à Tela Inicial
        </button>
      </div>
    </AppLayout>
  );
};

const ProfileScreen = ({ user, onUpdateUser, setView, notifications, onMarkAsRead, onMarkAllAsRead, onLogout, onNavigateToProfile }: any) => {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveChanges = async () => {
    setError('');
    setSuccess('');
    if (password && password.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    const updatedUser = { ...user, name, phone };
    setIsLoading(true);
    const result = await onUpdateUser(updatedUser, password || undefined);
    setIsLoading(false);
    if (result) {
      setSuccess('Dados atualizados com sucesso!');
      setPassword('');
      setConfirmPassword('');
    } else {
      setError('Não foi possível atualizar os dados. Tente novamente.');
    }
  };

  return (
    <AppLayout notifications={notifications} onMarkAsRead={onMarkAsRead} onMarkAllAsRead={onMarkAllAsRead} onLogout={onLogout} onNavigateToProfile={onNavigateToProfile}>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-gray-800">Meu Perfil</h1>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-bold text-gray-600 ml-2 block mb-2">CPF (não pode ser alterado)</label>
              <Input label="CPF" value={user.cpf} disabled />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-600 ml-2 block mb-2">Email (não pode ser alterado)</label>
              <Input label="Email" value={user.email} disabled />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-600 ml-2 block mb-2">Nome Completo</label>
              <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-600 ml-2 block mb-2">Telefone</label>
              <Input label="Telefone" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} maxLength={15} disabled={isLoading} />
            </div>

            <div className="border-t-2 border-gray-100 pt-6 mt-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Alterar Senha</h2>
              <p className="text-sm text-gray-500 mb-4">Deixe em branco para não alterar.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-600 ml-2 block mb-2">Nova Senha</label>
                  <Input label="Nova Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-600 ml-2 block mb-2">Confirmar Nova Senha</label>
                  <Input label="Confirmar Nova Senha" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-red-700 text-center font-semibold">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 text-green-700 text-center font-semibold">
                {success}
              </div>
            )}

            <button 
              onClick={handleSaveChanges} 
              disabled={isLoading} 
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>

        <button 
          onClick={() => setView(View.Dashboard)} 
          className="w-full mt-6 bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-2xl font-bold shadow-md transition-all"
        >
          Voltar à Tela Inicial
        </button>
      </div>
    </AppLayout>
  );
};

// ==================== TELA DO MÉDICO ====================
const DoctorDashboardScreen = ({ setView, notifications, onMarkAsRead, onMarkAllAsRead, onLogout, onNavigateToProfile }: { setView: (view: View) => void } & Omit<AppLayoutProps, 'children'>) => {
  return (
    <AppLayout notifications={notifications} onMarkAsRead={onMarkAsRead} onMarkAllAsRead={onMarkAllAsRead} onLogout={onLogout} onNavigateToProfile={onNavigateToProfile}>
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-3 leading-tight">
            Painel do Médico
          </h1>
          <p className="text-gray-600 text-lg">Gerencie sua disponibilidade e agendamentos</p>
        </div>
        
        <div className="mt-10 space-y-4 max-w-2xl mx-auto">
          <button 
            onClick={() => setView(View.DoctorAvailability)} 
            className="w-full group bg-white hover:bg-gradient-to-br hover:from-teal-500 hover:to-teal-600 text-gray-800 hover:text-white p-6 rounded-2xl font-semibold shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 border-2 border-gray-100"
          >
            <div className="flex items-center justify-center space-x-3">
              <svg className="w-8 h-8 text-teal-500 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
              </svg>
              <span className="text-xl">Configurar Disponibilidade</span>
            </div>
          </button>
          
          <button 
            onClick={() => setView(View.AppointmentHistory)} 
            className="w-full bg-white hover:bg-gray-50 text-gray-800 border-2 border-teal-500 p-6 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-center space-x-3">
              <svg className="w-7 h-7 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.25 2.52.75-1.23-3.5-2.07V8H12z"/>
              </svg>
              <span className="text-xl">Ver Agendamentos</span>
            </div>
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

const DoctorAvailabilityScreen = ({ setView, user, notifications, onMarkAsRead, onMarkAllAsRead, onLogout, onNavigateToProfile }: any) => {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const handleDateToggle = (date: string) => {
    setSelectedDates(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date)
        : [...prev, date]
    );
  };

  const handleSaveAvailability = async () => {
    setIsLoading(true);
    try {
      // Aqui você faria a chamada à API para salvar as datas
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulação
      alert('Disponibilidade salva com sucesso!');
    } catch (error) {
      alert('Erro ao salvar disponibilidade');
    } finally {
      setIsLoading(false);
    }
  };

  // Gerar próximos 30 dias
  const generateNextDays = (count: number) => {
    const dates = [];
    const current = new Date();
    for (let i = 0; i < count; i++) {
      const date = new Date(current);
      date.setDate(current.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const nextDays = generateNextDays(30);

  return (
    <AppLayout notifications={notifications} onMarkAsRead={onMarkAsRead} onMarkAllAsRead={onMarkAllAsRead} onLogout={onLogout} onNavigateToProfile={onNavigateToProfile}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 mb-6">
          <h1 className="text-3xl font-black text-gray-800 text-center mb-2">Configurar Disponibilidade</h1>
          <p className="text-center text-gray-600">Selecione as datas em que você estará disponível para atendimento</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {nextDays.map(date => {
              const dateObj = new Date(date + 'T00:00:00');
              const isSelected = selectedDates.includes(date);
              const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' });
              const dayNumber = dateObj.getDate();
              const monthName = dateObj.toLocaleDateString('pt-BR', { month: 'short' });
              
              return (
                <button
                  key={date}
                  onClick={() => handleDateToggle(date)}
                  className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                    isSelected 
                      ? 'bg-teal-500 border-teal-600 text-white shadow-lg' 
                      : 'bg-white border-gray-200 text-gray-700 hover:border-teal-300'
                  }`}
                >
                  <div className="text-xs font-semibold uppercase">{dayName}</div>
                  <div className="text-2xl font-black">{dayNumber}</div>
                  <div className="text-xs">{monthName}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={handleSaveAvailability}
              disabled={isLoading || selectedDates.length === 0}
              className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Salvando...' : `Salvar ${selectedDates.length} data(s) selecionada(s)`}
            </button>
            <button
              onClick={() => setView(View.DoctorDashboard)}
              className="px-8 bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-2xl font-bold shadow-md transition-all"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

// ==================== APP PRINCIPAL ====================
export default function App() {
  const [view, setView] = useState<View>(View.Login);
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'patient' | 'doctor'>('patient');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: '1', message: 'Bem-vindo ao CheckAgora! Agende seu primeiro exame.', timestamp: Date.now() - 300000, read: false }
  ]);
  const [queuePosition, setQueuePosition] = useState<number>(0);
  const queueCounter = useRef(0);

  // Mock backend queue counter
  useEffect(() => {
    const savedCounter = localStorage.getItem('queueCounter');
    queueCounter.current = savedCounter ? parseInt(savedCounter, 10) : 0;
  }, []);

  const getNextQueuePosition = () => {
    queueCounter.current += 1;
    localStorage.setItem('queueCounter', queueCounter.current.toString());
    return queueCounter.current;
  };

  const handleLogin = async (identifier: string, password: string) => {
    try {
      // Tentar login como paciente primeiro
      let response;
      try {
        response = await authService.loginPatient(identifier, password);
        setUser(response.user);
        setUserType('patient');
        setView(View.Dashboard);
      } catch (patientError: any) {
        // Se falhar, tentar como médico
        response = await authService.loginDoctor(identifier, password);
        setUser(response.doctor);
        setUserType('doctor');
        setView(View.DoctorDashboard);
      }
      addNotification('Login realizado com sucesso!');
      
      // Carregar dados do backend
      loadNotifications();
      loadAppointments();
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erro ao fazer login');
    }
  };

  const handleRegister = async (userData: Omit<User, 'id'>, password: string, userType: string = 'patient', registrationCode?: string) => {
    try {
      if (userType === 'doctor') {
        const response = await authService.registerDoctor({
          crm: userData.cpf, // cpf contém o CRM quando é médico
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          specialty: 'Clínica Geral',
          password: password,
          registrationCode: registrationCode || '',
          ubsId: 1 // UBS padrão
        });
        setUser(response.doctor);
        setUserType('doctor');
        setView(View.DoctorDashboard);
        addNotification('Cadastro de médico realizado com sucesso!');
      } else {
        const response = await authService.registerPatient({
          cpf: userData.cpf,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          password: password
        });
        setUser(response.user);
        setUserType('patient');
        setView(View.Dashboard);
        addNotification('Cadastro realizado com sucesso!');
      }
      
      // Carregar dados do backend
      loadNotifications();
      loadAppointments();
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erro ao fazer cadastro');
    }
  };

  const handleSchedule = async (details: Omit<Appointment, 'patientName' | 'cpf' | 'queuePosition' | 'id'>) => {
    if (!user) return;
    try {
      console.log('Dados enviados para API:', {
        district: details.district,
        specialty: details.specialty,
        appointment_date: details.date,
        appointment_time: details.time,
        ubs_name: details.ubs
      });
      
      const response = await appointmentService.create({
        district: details.district,
        specialty: details.specialty,
        appointment_date: details.date,
        appointment_time: details.time,
        ubs_name: details.ubs
      });
      
      // Recarregar agendamentos
      await loadAppointments();
      
      setQueuePosition(response.appointment.queue_position);
      addNotification(`Agendamento para ${details.specialty} na fila! Posição: ${response.appointment.queue_position}`);
      setView(View.Queue);
    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao criar agendamento';
      addNotification(`Erro: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  };

  const handleCancelAppointment = async (appointmentToCancel: Appointment) => {
    if (window.confirm('Deseja realmente cancelar este agendamento?')) {
      try {
        await appointmentService.cancel(Number(appointmentToCancel.id));
        
        // Recarregar agendamentos
        await loadAppointments();
        
        addNotification('Agendamento cancelado com sucesso.');
      } catch (error: any) {
        addNotification('Erro ao cancelar agendamento.');
      }
    }
  };

  const handleUpdateUser = async (updatedUser: User, password?: string): Promise<boolean> => {
    try {
      const updateData: any = {
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone
      };
      
      if (password) {
        updateData.password = password;
      }
      
      const response = await authService.updatePatientProfile(updateData);
      setUser(response.user);
      
      // Recarregar agendamentos para atualizar nome
      await loadAppointments();
      
      addNotification('Perfil atualizado com sucesso!');
      return true;
    } catch (error: any) {
      addNotification('Erro ao atualizar perfil.');
      return false;
    }
  };

  const loadNotifications = async () => {
    try {
      const notifs = await notificationService.getPatientNotifications();
      setNotifications(notifs.map((n: any) => ({
        id: n.id.toString(),
        message: n.message,
        timestamp: new Date(n.created_at).getTime(),
        read: n.is_read
      })));
    } catch (error) {
      console.error('Erro ao carregar notificações');
    }
  };

  const loadAppointments = async () => {
    try {
      const appts = await appointmentService.getAll();
      setAppointments(appts.map((a: any) => ({
        id: a.id.toString(),
        patientName: a.patient_name || '',
        cpf: a.cpf || '',
        district: a.district,
        specialty: a.specialty,
        date: a.appointment_date,
        time: a.appointment_time,
        city: 'Natal',
        ubs: a.ubs_name,
        queuePosition: a.queue_position
      })));
    } catch (error) {
      console.error('Erro ao carregar agendamentos');
    }
  };

    const addNotification = (message: string) => {
    const newNotification: AppNotification = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      timestamp: Date.now(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleLogout = () => {
    setUser(null);
    setAppointments([]);
    setView(View.Login);
  };

  const handleNavigateToProfile = () => {
    setView(View.Profile);
  };

  const commonProps = {
    notifications,
    onMarkAsRead: handleMarkAsRead,
    onMarkAllAsRead: handleMarkAllAsRead,
    onLogout: handleLogout,
    onNavigateToProfile: handleNavigateToProfile
  };

  const renderView = () => {
    switch (view) {
      case View.Login:
        return <LoginScreen onLoginAttempt={handleLogin} setView={setView} />;
      case View.Register:
        return <RegisterScreen onRegisterAttempt={handleRegister} setView={setView} />;
      
      // Authenticated views
      case View.Dashboard:
        return <DashboardScreen setView={setView} {...commonProps} />;
      
      case View.DoctorDashboard:
        return <DoctorDashboardScreen setView={setView} {...commonProps} />;
      
      case View.DoctorAvailability:
        if (user) return <DoctorAvailabilityScreen setView={setView} user={user} {...commonProps} />;
        break;
      
      case View.ScheduleExam:
        if (user) return <ScheduleExamScreen setView={setView} user={user} onSchedule={handleSchedule} {...commonProps} />;
        break;

      case View.Queue:
        return <QueueScreen setView={setView} position={queuePosition} {...commonProps} />;
      
      case View.Verify:
        return <VerifyScreen setView={setView} scheduledAppointments={appointments} onCancelAppointment={handleCancelAppointment} {...commonProps} />;
      
      case View.AppointmentHistory:
        return <AppointmentHistoryScreen setView={setView} appointments={appointments} onCancelAppointment={handleCancelAppointment} {...commonProps} />;
      
      case View.Profile:
        if (user) return <ProfileScreen user={user} onUpdateUser={handleUpdateUser} setView={setView} {...commonProps} />;
        break;
    }
    // Default to login if user is not set for authenticated views
    return <LoginScreen onLoginAttempt={handleLogin} setView={setView} />;
  }

  return renderView();
}
