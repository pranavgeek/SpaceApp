import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, PlusCircle, MessageCircle, User, Star, DollarSign } from 'lucide-react';

type Page = 'explore' | 'create' | 'profile' | 'messages' | 'influencer' | 'pricing';

interface NavItem {
  icon: React.ElementType;
  label: string;
  page: Page;
  active?: boolean;
  onClick?: () => void;
}

interface BottomNavProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

export function BottomNav({ currentPage, onPageChange }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (page: Page) => {
    onPageChange(page);
    navigate(`/${page}`);
  };

  const NAV_ITEMS: NavItem[] = [
    { icon: Search, label: 'Explore', page: 'explore' },
    { icon: PlusCircle, label: 'Create', page: 'create' },
    { icon: Star, label: 'Influencer', page: 'influencer' },
    { icon: MessageCircle, label: 'Messages', page: 'messages' },
    { icon: User, label: 'Profile', page: 'profile' }
  ];

  function NavItem({ icon: Icon, label, page, active, onClick }: NavItem) {
    return (
      <button 
        onClick={onClick}
        className="flex-1 flex flex-col items-center ios-button"
        aria-current={location.pathname === `/${page}` ? 'page' : undefined}
      >
        <div className="w-6 h-6 mb-1">
          <Icon className={`w-full h-full ${active ? 'text-white' : 'text-white/40'}`} />
        </div>
        <span className={`text-xs font-light tracking-wider ${active ? 'text-white' : 'text-white/40'}`}>
          {label}
        </span>
      </button>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 nav-blur border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
      <div className="responsive-container">
        <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            page={item.page}
            className="flex-1 flex flex-col items-center ios-button"
            onClick={() => handleNavigation(item.page)}
          />
        ))}
        </div>
      </div>
    </nav>
  );
}