import React from 'react';
import { motion } from 'framer-motion';
import { Upload, ArrowRight, Lock, Code, Cpu, Bot, Star, X, Loader2 } from 'lucide-react';
import { useMembership } from '../hooks/useMembership';
import { useAuth } from '../hooks/useAuth';
import { AuthModal } from '../components/auth/AuthModal';
import { useNavigate } from 'react-router-dom';

interface ProductFormData {
  title: string;
  description: string;
  price: string;
  category: string;
}

interface Template {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  requiresPro?: boolean;
}

const templates: Template[] = [
  {
    id: '1',
    title: 'Software Application',
    description: 'List your software product or application',
    icon: Code,
    requiresPro: true,
  },
  {
    id: '2',
    title: 'Hardware Product',
    description: 'List your hardware or IoT device',
    icon: Cpu,
    requiresPro: true,
  },
  {
    id: '3',
    title: 'AI Solution',
    description: 'List your AI or machine learning solution',
    icon: Bot,
    requiresPro: false,
  },
  {
    id: '4',
    title: 'Influencer Campaign',
    description: 'Create a new influencer campaign',
    icon: Star,
    requiresPro: true,
  }
];

export function Create() {
  const { currentPlan } = useMembership();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<ProductFormData>({
    title: '',
    description: '',
    price: '',
    category: ''
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string>('');
  const isPro = currentPlan?.tier === 'pro' || currentPlan?.tier === 'enterprise';

  const handleTemplateSelect = (templateId: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setSelectedTemplate(templateId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validate form data
      if (!formData.title || !formData.description || !formData.price) {
        throw new Error('Please fill in all required fields');
      }

      // In a real app, you would make an API call here
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to the product page or marketplace
      navigate('/explore');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="pt-[calc(env(safe-area-inset-top)+4rem)]">
        <section className="px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="modern-card p-6 mb-8"
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl modern-card mx-auto mb-6">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl text-white font-light text-center mb-2">
              Create New Listing
            </h1>
            <p className="text-white/60 text-sm font-light text-center">
              Share your innovation with the world
            </p>
          </motion.div>

          <div className="space-y-4">
            {templates.map((template, index) => (
              <motion.button
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleTemplateSelect(template.id)}
                className={`w-full modern-card p-4 ios-button relative ${
                  template.requiresPro && !isPro ? 'opacity-50' : ''
                }`}
                disabled={template.requiresPro && !isPro}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl modern-card flex items-center justify-center">
                    <template.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-white font-light mb-1">{template.title}</h3>
                    <p className="text-sm text-white/60 font-light">
                      {template.description}
                    </p>
                  </div>
                  {template.requiresPro && !isPro ? (
                    <Lock className="w-5 h-5 text-white/40" />
                  ) : (
                    <ArrowRight className="w-5 h-5 text-white/40" />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
          
          {!isPro && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 p-4 modern-card"
            >
              <p className="text-white/60 text-sm font-light text-center mb-4">
                Upgrade to Pro to unlock all templates and features
              </p>
              <button
                onClick={() => window.location.href = '/pricing'}
                className="w-full py-3 bg-white text-black rounded-full text-sm font-light"
              >
                Upgrade to Pro
              </button>
            </motion.div>
          )}
        </section>
        
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />

        {selectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full max-w-lg mx-4 modern-card p-6"
            >
              <button
                onClick={() => setSelectedTemplate(null)}
                className="absolute top-4 right-4 text-white/60 hover:text-white ios-button"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="text-center mb-6">
                <h2 className="text-xl text-white font-light mb-2">
                  Create New {templates.find(t => t.id === selectedTemplate)?.title}
                </h2>
                <p className="text-white/60 text-sm font-light">
                  Fill in the details to get started
                </p>
              </div>
              
              <form className="space-y-4">
                {error && (
                  <p className="text-red-500 text-sm text-center">{error}</p>
                )}

                <div>
                  <label className="block text-sm text-white/60 mb-2">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full p-3 modern-card text-white bg-transparent rounded-xl outline-none"
                    placeholder="Enter a title for your product"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-white/60 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full p-3 modern-card text-white bg-transparent rounded-xl outline-none resize-none"
                    rows={4}
                    placeholder="Describe your product..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-white/60 mb-2">Price (USD)</label>
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full p-3 modern-card text-white bg-transparent rounded-xl outline-none"
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-white text-black rounded-full text-sm font-light 
                           flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Product</span>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      </div>
    </div>
  );
}