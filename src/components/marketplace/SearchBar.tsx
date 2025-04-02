import React from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

export function SearchBar() {
  return (
    <div className="px-4 py-4">
      <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full modern-card flex items-center px-4 py-3 space-x-3 ios-button 
                  hover:ring-2 hover:ring-white/10 transition-all duration-300"
      >
        <Search className="w-5 h-5 text-white/60" />
        <div className="flex-1 text-left">
          <span className="block text-sm text-white/80 font-light">Search THE SPACE</span>
          <span className="block text-xs text-white/40 font-light">Apps, Hardware, Innovation...</span>
        </div>
      </motion.button>
    </div>
  );
}