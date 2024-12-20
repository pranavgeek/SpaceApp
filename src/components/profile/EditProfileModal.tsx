import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { User } from '../../types/user';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, updateProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: {
      city: user?.location?.city || '',
      country: user?.location?.country || ''
    },
    socialLinks: {
      twitter: user?.socialLinks?.twitter || '',
      linkedin: user?.socialLinks?.linkedin || '',
      website: user?.socialLinks?.website || ''
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // In a real app, you would make an API call here
      await new Promise(resolve => setTimeout(resolve, 1000));
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-4 bottom-0 mb-[env(safe-area-inset-bottom)] rounded-2xl modern-card z-50 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-light text-white">Edit Profile</h2>
                <button onClick={onClose} className="ios-button">
                  <X className="w-6 h-6 text-white/60" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex justify-center">
                  <div className="relative">
                    <img
                      src={user?.avatar}
                      alt={user?.name}
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-white/10"
                    />
                    <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg ios-button">
                      <Camera className="w-4 h-4 text-black" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 modern-card text-white bg-transparent rounded-xl outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full p-3 modern-card text-white bg-transparent rounded-xl outline-none resize-none"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">City</label>
                    <input
                      type="text"
                      value={formData.location.city}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        location: { ...prev.location, city: e.target.value }
                      }))}
                      className="w-full p-3 modern-card text-white bg-transparent rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Country</label>
                    <input
                      type="text"
                      value={formData.location.country}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        location: { ...prev.location, country: e.target.value }
                      }))}
                      className="w-full p-3 modern-card text-white bg-transparent rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-light tracking-wider text-white/40">
                    Social Links
                  </h3>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Twitter</label>
                    <input
                      type="text"
                      value={formData.socialLinks.twitter}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                      }))}
                      className="w-full p-3 modern-card text-white bg-transparent rounded-xl outline-none"
                      placeholder="@username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">LinkedIn</label>
                    <input
                      type="text"
                      value={formData.socialLinks.linkedin}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                      }))}
                      className="w-full p-3 modern-card text-white bg-transparent rounded-xl outline-none"
                      placeholder="username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Website</label>
                    <input
                      type="url"
                      value={formData.socialLinks.website}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, website: e.target.value }
                      }))}
                      className="w-full p-3 modern-card text-white bg-transparent rounded-xl outline-none"
                      placeholder="https://"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-white text-black rounded-full text-sm font-light 
                           flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}