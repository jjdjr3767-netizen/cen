import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, where, onSnapshot, getDocFromServer, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Negotiation } from '../types';
import { startOfDay, startOfWeek, isAfter } from 'date-fns';
import { 
  LogOut, 
  User, 
  TrendingUp, 
  Calendar, 
  BarChart3, 
  Wallet,
  Menu,
  X,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import NegotiationForm from './NegotiationForm';
import History from './History';

export default function Dashboard() {
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error: any) {
        if (error.message?.includes('the client is offline')) {
          setConnectionError(true);
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'negotiations'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Negotiation[];
      setNegotiations(data);
    }, (error) => {
      console.error('Firestore Error:', error);
    });

    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const week = startOfWeek(now);

    return negotiations.reduce((acc, n) => {
      if (n.status !== 'realized') return acc;
      
      const nDate = n.timestamp?.toDate() || new Date();
      
      acc.total += n.userProfit;
      if (isAfter(nDate, today)) acc.today += n.userProfit;
      if (isAfter(nDate, week)) acc.week += n.userProfit;
      
      return acc;
    }, { today: 0, week: 0, total: 0 });
  }, [negotiations]);

  const handleLogout = () => auth.signOut();

  return (
    <div className="min-h-screen bg-brand-black text-white selection:bg-brand-cyan/30">
      {connectionError && (
        <div className="bg-red-500 text-white p-2 text-center text-xs flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Erro de conexão com o banco de dados. Verifique sua internet ou configuração.
        </div>
      )}
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-brand-black/80 backdrop-blur-xl border-b border-white/5 px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-cyan/10 rounded-xl flex items-center justify-center border border-brand-cyan/30">
              <TrendingUp className="w-6 h-6 text-brand-cyan" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none">Centro Comercial</h1>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold mt-1">Dashboard Financeiro</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/5">
              <div className="w-8 h-8 bg-brand-cyan/20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-brand-cyan" />
              </div>
              <span className="text-sm font-medium">{auth.currentUser?.displayName || 'Usuário'}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-white/40 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-white/60"
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 z-40 bg-brand-black pt-24 px-6"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="w-12 h-12 bg-brand-cyan/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-brand-cyan" />
                </div>
                <div>
                  <p className="font-bold">{auth.currentUser?.displayName}</p>
                  <p className="text-xs text-white/40">{auth.currentUser?.email}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full btn-secondary flex items-center justify-center gap-2 text-red-400"
              >
                <LogOut className="w-5 h-5" />
                Sair da Conta
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Bem-vindo, {auth.currentUser?.displayName?.split(' ')[0]}</h2>
          <p className="text-white/40 mt-1">Aqui está o resumo das suas atividades no Centro Comercial.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard 
            title="Lucro Hoje" 
            value={stats.today} 
            icon={<Calendar className="w-5 h-5" />}
            color="cyan"
          />
          <StatCard 
            title="Lucro Semanal" 
            value={stats.week} 
            icon={<BarChart3 className="w-5 h-5" />}
            color="cyan"
          />
          <StatCard 
            title="Lucro Total" 
            value={stats.total} 
            icon={<Wallet className="w-5 h-5" />}
            color="cyan"
            isTotal
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <NegotiationForm />
          </div>
          <div className="lg:col-span-7">
            <History />
          </div>
        </div>

        <footer className="mt-20 pt-12 border-t border-white/5 text-center pb-8">
          <h2 className="text-xl md:text-2xl font-black tracking-tighter text-white/20 italic uppercase">
            Página desenvolvida por <span className="text-brand-cyan/50">Kauan Silva</span>
          </h2>
        </footer>
      </main>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactElement;
  color: string;
  isTotal?: boolean;
}

function StatCard({ title, value, icon, isTotal }: StatCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="glass-card relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
        {React.cloneElement(icon, { className: "w-16 h-16" })}
      </div>
      
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-brand-cyan/10 rounded-lg border border-brand-cyan/20">
          {React.cloneElement(icon, { className: "w-5 h-5 text-brand-cyan" })}
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-white/40">{title}</p>
      </div>
      
      <div className="relative">
        <h3 className="text-3xl font-bold font-mono glow-text tracking-tight">
          R$ {value.toLocaleString()}
        </h3>
        {isTotal && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
            <TrendingUp className="w-3 h-3" />
            Crescimento Constante
          </div>
        )}
      </div>
    </motion.div>
  );
}
