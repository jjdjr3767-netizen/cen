import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Negotiation } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History as HistoryIcon, Calendar, Car, TrendingUp, XCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function History() {
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'negotiations'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Negotiation[];
      setNegotiations(data);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching history:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="glass-card flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="glass-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-brand-cyan/10 rounded-lg">
          <HistoryIcon className="w-5 h-5 text-brand-cyan" />
        </div>
        <h2 className="text-xl font-bold">Extrato de Negociações</h2>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {negotiations.length > 0 ? (
            negotiations.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 text-xs text-white/40 font-semibold uppercase tracking-wider">
                    <Calendar className="w-3 h-3" />
                    {n.timestamp?.toDate() ? format(n.timestamp.toDate(), "dd 'de' MMM, HH:mm", { locale: ptBR }) : 'Processando...'}
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                    n.status === 'realized' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {n.status === 'realized' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {n.status === 'realized' ? 'Realizada' : 'Cancelada'}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {n.vehicles.map((v, idx) => (
                    <div key={idx} className="flex flex-col gap-0.5 px-3 py-1.5 bg-brand-dark-blue/50 rounded-lg border border-white/5">
                      <div className="flex items-center gap-1.5 text-xs text-white/70">
                        <Car className="w-3 h-3 text-brand-cyan" />
                        {v.name}
                      </div>
                      <div className="flex gap-2 ml-4.5">
                        <p className="text-[9px] uppercase tracking-wider text-white/30">FIPE: R$ {v.value.toLocaleString()}</p>
                        <p className="text-[9px] uppercase tracking-wider text-brand-cyan/40">Taxa: R$ {v.tax.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-end border-t border-white/5 pt-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1">Total Taxas</p>
                    <p className="text-sm font-mono text-white/60">R$ {n.totalTax.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-cyan/60 mb-1">Seu Lucro</p>
                    <p className="text-lg font-bold font-mono glow-text">R$ {n.userProfit.toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
              <TrendingUp className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/30 text-sm">Nenhuma negociação encontrada</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
