import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { demoAccounts } from '../../data/demoAccounts';

export function LoginForm() {
  const { login } = useAuth();
  const [loading, setLoading] = React.useState<string>('');
  const [selectedRole, setSelectedRole] = React.useState<string>('');
  const [error, setError] = React.useState<string>('');

  const handleDemoLogin = async (email: string) => {
    try {
      setLoading(email);
      setError('');
      setSelectedRole(demoAccounts.find(account => account.email === email)?.role || '');
      await login(email, 'demo-password');
      setLoading('');
    } catch (error) {
      console.error('Login failed:', error);
      setError('Login failed. Please try again.');
      setLoading('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl text-white font-light mb-2">Demo Accounts</h2>
        <p className="text-sm text-white/60 font-light">
          Click an account to explore THE SPACE
        </p>
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </div>

      <div className="space-y-4">
        {demoAccounts.map((account) => (
          <motion.button
            key={account.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => handleDemoLogin(account.email)}
            className={`w-full modern-card p-4 ios-button ${selectedRole === account.role ? 'ring-2 ring-white' : ''} ${loading === account.email ? 'opacity-50' : ''}`}
            disabled={!!loading}
          >
            <div className="flex items-center space-x-4">
              <img
                src={account.avatar}
                alt={account.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1 text-left">
                <div className="flex items-center space-x-2">
                  <h3 className="text-white font-light">{account.name}</h3>
                  <span className="text-xs text-white/40 uppercase">
                    {account.role}
                  </span>
                  {loading === account.email && (
                    <Loader2 className="w-4 h-4 text-white animate-spin ml-2" />
                  )}
                </div>
                <p className="text-sm text-white/60 font-light mt-1">
                  {account.bio}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <p className="text-xs text-white/40 text-center">
        Click any account to login and explore that role's features
      </p>
    </div>
  );
}