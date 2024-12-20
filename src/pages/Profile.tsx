import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Grid, Heart, Share2, Verified, Globe, Clock, Languages, Store, Star, Users, TrendingUp, CreditCard, Receipt, Package, Twitter, Instagram, Linkedin } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AuthModal } from '../components/auth/AuthModal';
import { EditProfileModal } from '../components/profile/EditProfileModal';
import { ShareModal } from '../components/profile/ShareModal';
import { useMembership } from '../hooks/useMembership';
import { PaymentMethodForm } from '../components/payments/PaymentMethodForm';
import { PaymentSummary } from '../components/payments/PaymentSummary';
import { OrderList } from '../components/orders/OrderList';
import { OrderTracker } from '../components/orders/OrderTracker';
import { RoleSelection } from '../components/onboarding/RoleSelection';
import { SignupForm } from '../components/auth/SignupForm';
import type { OnboardingState } from '../types/onboarding';

interface ProfileState {
  isOnboarding: boolean;
  onboarding?: OnboardingState;
}

function getRoleIcon(role: string) {
  switch (role) {
    case 'seller':
      return Store;
    case 'creator':
      return Star;
    default:
      return Users;
  }
}

function getRoleStats(role: string) {
  switch (role) {
    case 'seller':
      return {
        products: 12,
        followers: 8420,
        sales: 156
      };
    case 'creator':
      return {
        campaigns: 24,
        followers: 52000,
        earnings: 125000
      };
    default:
      return {
        purchases: 8,
        following: 384,
        reviews: 12
      };
  }
}

export function Profile() {
  const { user, isAuthenticated } = useAuth();
  const { currentPlan } = useMembership();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'grid' | 'payments' | 'orders' | 'likes'>('grid');
  const stats = user ? getRoleStats(user.role) : null;
  const RoleIcon = user ? getRoleIcon(user.role) : Users;

  const [state, setState] = React.useState<ProfileState>({
    isOnboarding: !isAuthenticated,
    onboarding: {
      currentStep: 'role'
    }
  });

  const handleRoleSelect = (role: OnboardingState['role']) => {
    setState(prev => ({
      ...prev,
      onboarding: { ...prev.onboarding!, currentStep: 'details', role }
    }));
  };
  const handleSignupComplete = () => {
    setState(prev => ({ ...prev, isOnboarding: false }));
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="pt-[calc(env(safe-area-inset-top)+4rem)]">
        <section className="px-4 py-6">
          <div className="flex justify-end mb-6">
            <button className="ios-button">
              <Settings className="w-6 h-6 text-white/80" />
            </button>
          </div>

          {!isAuthenticated && (
            <div className="text-center">
              <h2 className="text-xl text-white font-light mb-4">Welcome to THE SPACE</h2>
              <p className="text-white/60 text-sm font-light mb-6">
                Sign in to access your profile and explore the platform
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-3 bg-white text-black rounded-full text-sm font-light"
              >
                Sign In / Sign Up
              </button>
            </div>
          )}
        
          {isAuthenticated && state.isOnboarding ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4"
            >
              <h1 className="text-2xl text-white font-light text-center mb-2">
                Join THE SPACE
              </h1>
              <p className="text-white/60 text-sm font-light text-center mb-8">
                Select your role to get started
              </p>
              {state.onboarding?.currentStep === 'role' ? (
                <RoleSelection onSelect={handleRoleSelect} />
              ) : (
                <SignupForm 
                  role={state.onboarding?.role!} 
                  onComplete={handleSignupComplete}
                />
              )}
            </motion.div>
          ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8">
            <div className="relative inline-block">
              <img
                src={user?.avatar}
                alt={user?.name}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-white/10"
              />
              {user?.role === 'seller' && (
                <div className="absolute bottom-0 right-0 bg-black p-1 rounded-full">
                  <Verified className="w-5 h-5 text-white" />
                </div>
              )}
              {user?.role === 'seller' && (
                <div className="absolute -top-1 -right-1 bg-black p-1 rounded-full">
                  <Store className="w-4 h-4 text-white" />
                </div>
              )}
              {user?.role === 'influencer' && (
                <div className="absolute -top-1 -right-1 bg-black p-1 rounded-full">
                  <Star className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            
            <h1 className="text-xl text-white font-light mt-4 mb-1">
              {user?.name}
            </h1>
            <p className="text-white/60 text-sm font-light mb-4">
              {user?.bio}
            </p>
            
            <div className="flex flex-col space-y-2 mb-4">
              <div className="flex items-center justify-center space-x-2 text-white/60">
                <Globe className="w-4 h-4" />
                <span className="text-sm font-light">
                  {user?.location && `${user.location.city}, ${user.location.country}`}
                </span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-white/60">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-light">
                  {user?.location && new Date().toLocaleTimeString('en-US', { timeZone: user.location.timezone })}
                </span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-white/60">
                <Languages className="w-4 h-4" />
                <span className="text-sm font-light">{user?.languages.join(' · ')}</span>
              </div>
            </div>

            <div className="flex justify-center space-x-8">
              {stats && Object.entries(stats).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="text-white font-light">
                    {typeof value === 'number' && value >= 1000 
                      ? `${(value / 1000).toFixed(1)}k` 
                      : value}
                  </div>
                  <div className="text-xs text-white/60 font-light capitalize">{key}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-center space-x-4 mt-6">
              <button 
                onClick={() => setShowEditModal(true)}
                className="px-6 py-2 text-sm font-light text-black bg-white rounded-full hover:bg-white/90 transition-colors ios-button"
              >
                Edit Profile
              </button>
              <button 
                onClick={() => setShowShareModal(true)}
                className="p-2 text-white/80 rounded-full modern-card ios-button"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex justify-center space-x-4 mt-4">
              {user?.socialLinks && Object.entries(user.socialLinks).map(([platform, handle]) => {
                const url = platform === 'tiktok' 
                  ? `https://tiktok.com/@${handle.replace('@', '')}` 
                  : `https://${platform}.com/${platform === 'linkedin' ? 'in/' : ''}${handle.replace('@', '')}`;
                
                return (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 flex items-center justify-center modern-card rounded-xl text-white/40 hover:text-white/60 hover:scale-110 transition-all ios-button"
                  >
                    {platform === 'twitter' && <Twitter className="w-5 h-5" />}
                    {platform === 'instagram' && <Instagram className="w-5 h-5" />}
                    {platform === 'linkedin' && <Linkedin className="w-5 h-5" />}
                    {platform === 'tiktok' && (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0011.14-4.02v-7a8.16 8.16 0 004.65 1.49v-3.88a4.85 4.85 0 01-1.2 0z"/>
                      </svg>
                    )}
                  </a>
                );
              })}
            </div>
          </motion.div>
          )}
          <div className="flex items-center justify-around mb-6">
            <button 
              onClick={() => setActiveTab('grid')}
              className={`flex-1 py-3 text-white ${
                activeTab === 'grid' ? 'border-b-2 border-white' : 'text-white/40'
              }`}
            >
              <Grid className="w-6 h-6 mx-auto" />
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 py-3 text-white ${
                activeTab === 'payments' ? 'border-b-2 border-white' : 'text-white/40'
              }`}
            >
              <Receipt className="w-6 h-6 mx-auto" />
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-3 text-white ${
                activeTab === 'orders' ? 'border-b-2 border-white' : 'text-white/40'
              }`}
            >
              <Package className="w-6 h-6 mx-auto" />
            </button>
            <button 
              onClick={() => setActiveTab('likes')}
              className={`flex-1 py-3 text-white ${
                activeTab === 'likes' ? 'border-b-2 border-white' : 'text-white/40'
              }`}
            >
              <Heart className="w-6 h-6 mx-auto" />
            </button>
          </div>

          {activeTab === 'grid' && (
            <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: item * 0.1 }}
                className="aspect-square modern-card rounded-2xl overflow-hidden"
              >
                <img
                  src={`https://images.unsplash.com/photo-${1518770660439 + item}-4636190af475?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80`}
                  alt={`Product ${item}`}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ))}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              <PaymentMethodForm />
              <PaymentSummary
                amount={99.99}
                currency="USD"
                onPaymentComplete={() => {
                  // Handle payment completion
                }}
              />
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <OrderList />
            </div>
          )}

          {activeTab === 'likes' && (
            <div className="text-center text-white/60 py-8">
              <Heart className="w-8 h-8 mx-auto mb-4 text-white/40" />
              <p className="text-sm font-light">No liked items yet</p>
            </div>
          )}
        </section>
        
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        <EditProfileModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} />
        <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} />
      </div>
    </div>
  );
}