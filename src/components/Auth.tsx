import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { motion } from 'motion/react';
import { LogIn, UserPlus, ShieldCheck } from 'lucide-react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper to create a virtual email from username
  // Using a very simple domain to ensure it's accepted
  const getVirtualEmail = (user: string) => {
    const sanitized = user.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${sanitized}@rp.com`;
  };

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (username.length < 3) {
      setError('O usuário deve ter pelo menos 3 caracteres.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    const email = getVirtualEmail(username);
    const sanitizedUsername = username.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    if (sanitizedUsername.length < 3) {
      setError('O usuário deve conter pelo menos 3 letras ou números.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update profile with username
        await updateProfile(user, { displayName: username });

        // Create user document in Firestore
        const userPath = `users/${user.uid}`;
        try {
          await setDoc(doc(db, 'users', user.uid), {
            username,
            createdAt: serverTimestamp(),
            role: 'user'
          });
        } catch (fsErr) {
          handleFirestoreError(fsErr, OperationType.WRITE, userPath);
        }
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Usuário ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este nome de usuário já está em uso.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha é muito fraca. Use pelo menos 6 caracteres.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Nome de usuário inválido.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('O login com usuário/senha não está habilitado no console do Firebase. Por favor, use o botão "Entrar com Google" abaixo ou habilite "E-mail/Senha" no console.');
      } else {
        // Check if it's our custom Firestore error
        try {
          const fsError = JSON.parse(err.message);
          if (fsError.error) {
            setError(`Erro no banco de dados: ${fsError.error}`);
            return;
          }
        } catch (e) {
          // Not a JSON error
        }
        setError(`Ocorreu um erro (${err.code || 'unknown'}): ${err.message || 'Tente novamente.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user document exists, if not create it
      const userPath = `users/${user.uid}`;
      try {
        await setDoc(doc(db, 'users', user.uid), {
          username: user.displayName || user.email?.split('@')[0] || 'User',
          createdAt: serverTimestamp(),
          role: 'user'
        }, { merge: true });
      } catch (fsErr) {
        handleFirestoreError(fsErr, OperationType.WRITE, userPath);
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      setError('Erro ao entrar com Google. Verifique se os popups estão permitidos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(circle_at_top_right,_var(--tw-colors-brand-dark-blue)_0%,_transparent_50%)]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-brand-cyan/10 rounded-2xl flex items-center justify-center mb-4 border border-brand-cyan/30">
            <ShieldCheck className="w-8 h-8 text-brand-cyan" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Centro Comercial</h1>
          <p className="text-white/50 text-sm mt-2">Gestão Financeira RP</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/40 ml-1">Usuário</label>
            <input
              type="text"
              placeholder="Digite seu usuário"
              className="input-field w-full"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/40 ml-1">Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              className="input-field w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-400/10 p-3 rounded-lg border border-red-400/20">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                {isLogin ? 'Entrar' : 'Registrar'}
              </>
            )}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="px-4 bg-[#0a0a0c] text-white/30">Ou continue com</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white py-3 px-4 rounded-xl hover:bg-white/10 transition-all disabled:opacity-50 font-medium"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Entrar com Google
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-sm text-brand-cyan hover:underline underline-offset-4"
          >
            {isLogin ? 'Não tem uma conta? Criar agora' : 'Já tem uma conta? Entrar'}
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 text-center">
          <h2 className="text-lg font-bold tracking-tighter text-white/30 italic">
            Página desenvolvida por <span className="text-brand-cyan/60">Kauan Silva</span>
          </h2>
        </div>
      </motion.div>
    </div>
  );
}
