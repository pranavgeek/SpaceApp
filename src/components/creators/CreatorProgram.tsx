import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight, Rocket, Trophy, DollarSign } from 'lucide-react';

const benefits = [
  {
    icon: Rocket,
    title: 'Launch Support',
    description: 'Get featured in our marketplace and reach thousands of potential customers'
  },
  {
    icon: Trophy,
    title: 'Creator Badge',
    description: 'Verified creator status with premium profile features'
  },
  {
    icon: DollarSign,
    title: 'Commission',
    description: 'Earn up to 85% commission on your product sales'
  }
];

export function CreatorProgram() {
  return (
    <section className="py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="modern-card p-6"
      >
        <div className="flex items-center space-x-2 mb-6">
          <Sparkles className="w-5 h-5 text-white" />
          <h2 className="text-lg font-light tracking-wider text-white">Creator Program</h2>
        </div>
        
        <div className="space-y-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex items-start space-x-4"
            >
              <benefit.icon className="w-5 h-5 text-white/60 mt-1" />
              <div className="flex-1">
                <h3 className="text-white font-light mb-1">{benefit.title}</h3>
                <p className="text-sm text-white/60 font-light">{benefit.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          className="w-full mt-8 px-6 py-3 text-sm font-light tracking-wider text-black bg-white rounded-full hover:bg-white/90 transition-colors flex items-center justify-center space-x-2"
        >
          <span>Apply Now</span>
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </section>
  );
}