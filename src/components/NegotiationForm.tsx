import React, { useState, useMemo } from 'react';
import { VEHICLE_LIST } from '../constants';
import { Vehicle } from '../types';
import { Search, Plus, Trash2, CheckCircle2, XCircle, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { clsx } from 'clsx';

export default function NegotiationForm() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicles, setSelectedVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const filteredVehicles = useMemo(() => {
    if (!searchTerm) return [];
    return VEHICLE_LIST.filter(v => 
      v.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);
  }, [searchTerm]);

  const totalTax = useMemo(() => 
    selectedVehicles.reduce((sum, v) => sum + v.tax, 0),
  [selectedVehicles]);

  const userProfit = totalTax / 2;

  const addVehicle = (vehicle: Vehicle) => {
    setSelectedVehicles([...selectedVehicles, vehicle]);
    setSearchTerm('');
  };

  const removeVehicle = (index: number) => {
    setSelectedVehicles(selectedVehicles.filter((_, i) => i !== index));
  };

  const handleNegotiation = async (status: 'realized' | 'canceled') => {
    if (selectedVehicles.length === 0) return;
    setLoading(true);

    try {
      await addDoc(collection(db, 'negotiations'), {
        userId: auth.currentUser?.uid,
        vehicles: selectedVehicles,
        totalTax,
        userProfit: status === 'realized' ? userProfit : 0,
        timestamp: serverTimestamp(),
        status
      });

      if (status === 'realized') {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
      
      setSelectedVehicles([]);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar negociação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-brand-cyan/10 rounded-lg">
            <Calculator className="w-5 h-5 text-brand-cyan" />
          </div>
          <h2 className="text-xl font-bold">Nova Negociação</h2>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-white/30" />
          </div>
          <input
            type="text"
            placeholder="Buscar veículo..."
            className="input-field w-full pl-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <AnimatePresence>
            {filteredVehicles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-brand-dark-blue border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl"
              >
                {filteredVehicles.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => addVehicle(v)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                  >
                    <div>
                      <p className="font-semibold">{v.name}</p>
                      <div className="flex gap-3 mt-1">
                        <p className="text-[10px] uppercase tracking-wider text-white/40">FIPE: R$ {v.value.toLocaleString()}</p>
                        <p className="text-[10px] uppercase tracking-wider text-brand-cyan/60">Taxa: R$ {v.tax.toLocaleString()}</p>
                      </div>
                    </div>
                    <Plus className="w-5 h-5 text-brand-cyan" />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-3 mb-8">
          <AnimatePresence mode="popLayout">
            {selectedVehicles.map((v, i) => (
              <motion.div
                key={`${v.name}-${i}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5"
              >
                <div>
                  <p className="font-medium">{v.name}</p>
                  <div className="flex gap-4 mt-1">
                    <p className="text-xs text-white/40 font-mono">FIPE: R$ {v.value.toLocaleString()}</p>
                    <p className="text-xs text-brand-cyan font-mono">Taxa: R$ {v.tax.toLocaleString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeVehicle(i)}
                  className="p-2 text-white/30 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {selectedVehicles.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-white/5 rounded-xl">
              <p className="text-white/30 text-sm">Nenhum veículo adicionado</p>
            </div>
          )}
        </div>

        <div className="bg-brand-cyan/5 rounded-2xl p-6 border border-brand-cyan/20 mb-8">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-cyan/60 mb-1">Total Taxas</p>
              <p className="text-2xl font-bold font-mono glow-text">R$ {totalTax.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-cyan/60 mb-1">Seu Lucro (50%)</p>
              <p className="text-2xl font-bold font-mono glow-text">R$ {userProfit.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleNegotiation('canceled')}
            disabled={loading || selectedVehicles.length === 0}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            Cancelada
          </button>
          <button
            onClick={() => handleNegotiation('realized')}
            disabled={loading || selectedVehicles.length === 0}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Realizada
              </>
            )}
          </button>
        </div>

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-center text-sm"
            >
              Negociação registrada com sucesso!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
