import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-20 h-20 bg-brand-cyan/10 rounded-3xl flex items-center justify-center border border-brand-cyan/30 shadow-[0_0_30px_rgba(0,212,255,0.2)]"
        >
          <ShieldCheck className="w-10 h-10 text-brand-cyan" />
        </motion.div>
        <p className="text-brand-cyan/60 text-xs font-bold uppercase tracking-[0.3em] animate-pulse">
          Carregando Sistema...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow">
        <AnimatePresence mode="wait">
          {user ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Dashboard />
            </motion.div>
          ) : (
            <motion.div
              key="auth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Auth />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <footer className="py-12 bg-brand-black border-t border-white/5 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="container mx-auto px-4"
        >
          <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-white/40 hover:text-brand-cyan transition-colors cursor-default uppercase italic">
            Página desenvolvida por <span className="text-brand-cyan">Kauan Silva</span>
          </h2>
        </motion.div>
      </footer>
    </div>
  );
}
