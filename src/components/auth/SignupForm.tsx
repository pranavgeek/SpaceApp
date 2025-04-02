import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import type { OnboardingState } from '../../types/onboarding';

interface SignupFormProps {
  role: OnboardingState['role'];
  onComplete: () => void;
}

export function SignupForm({ role, onComplete }: SignupFormProps) {
  const { signup } = useAuth();
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    bio: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signup({
        ...formData,
        role
      });
      onComplete();
    } catch (error) {
      console.error('Signup failed:', error);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
      onSubmit={handleSubmit}
    >
      <div>
        <label className="block text-sm text-white/60 mb-2">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full p-3 modern-card text-white bg-transparent rounded-xl outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-white/60 mb-2">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="w-full p-3 modern-card text-white bg-transparent rounded-xl outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-white/60 mb-2">Password</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          className="w-full p-3 modern-card text-white bg-transparent rounded-xl outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-white/60 mb-2">Bio</label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          className="w-full p-3 modern-card text-white bg-transparent rounded-xl outline-none resize-none"
          rows={3}
        />
      </div>

      <button
        type="submit"
        className="w-full py-3 bg-white text-black rounded-full text-sm font-light tracking-wide"
      >
        Create Account
      </button>
    </motion.form>
  );
}