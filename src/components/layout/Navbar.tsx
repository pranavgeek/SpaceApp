import React from 'react';
import { Menu } from 'lucide-react';
import { SideMenu } from './SideMenu';
import { NotificationBell } from '../notifications/NotificationBell';
import { useAuth } from '../../hooks/useAuth';

export function Navbar() {
  const { isAuthenticated, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 nav-blur border-b border-white/10 z-50">
      <div className="responsive-container">
        <div className="flex items-center justify-between h-[calc(env(safe-area-inset-top)+4rem)] pt-[env(safe-area-inset-top)]">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="ios-button p-2 rounded-full hover:bg-white/5"
          >
            <Menu className="h-6 w-6 text-white/80" />
          </button>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-2">
                <span className="font-light text-xl tracking-widest text-white">
                  THE SPACE
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <NotificationBell />
            {isAuthenticated && user && (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10"
              />
            )}
          </div>
        </div>
      </div>
      </nav>
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}