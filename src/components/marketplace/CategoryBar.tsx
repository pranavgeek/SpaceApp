import React from 'react';
import { motion } from 'framer-motion';
import { Code, Cpu, Lightbulb, Rocket, Bot, Cloud, Star } from 'lucide-react';

const categories = [
  { icon: Code, label: 'Software' },
  { icon: Cpu, label: 'Hardware' },
  { icon: Bot, label: 'AI Tools' },
  { icon: Cloud, label: 'Cloud' },
  { icon: Star, label: 'Featured' },
  { icon: Rocket, label: 'Startups' },
];

export function CategoryBar() {
  return (
    <div className="overflow-x-auto ios-scroll">
      <div className="responsive-container">
        <div className="flex space-x-4 py-4 md:justify-center">
        {categories.map((category, index) => (
          <motion.button
            key={category.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex-shrink-0 flex flex-col items-center space-y-2 ios-button md:w-24"
          >
            <div className="w-12 h-12 rounded-full modern-card flex items-center justify-center">
              <category.icon className="w-5 h-5 text-white/80" />
            </div>
            <span className="text-xs text-white/60 font-light text-center">
              {category.label}
            </span>
          </motion.button>
        ))}
        </div>
      </div>
    </div>
  );
}