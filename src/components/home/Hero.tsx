import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, ArrowRight } from 'lucide-react';

export function Hero() {
  return (
    <div className="relative overflow-hidden min-h-[60vh] flex items-center">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black/80" />
        <img
          src="https://images.unsplash.com/photo-1516116216624-53e697fedbea?ixlib=rb-1.2.1&auto=format&fit=crop&w=2378&q=80"
          alt="Space Background"
          className="w-full h-full object-cover opacity-30"
        />
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10">
          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="text-4xl sm:text-5xl font-light tracking-widest text-balance">
                  <span className="block text-white/80 text-2xl mb-2">Welcome to</span>
                  <span className="block text-white tracking-[0.2em]">
                    THE SPACE
                  </span>
                </h1>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mt-6 text-base text-white/60 max-w-xl mx-auto font-light leading-relaxed text-balance tracking-wide"
              >
                INNOVATION MARKETPLACE
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-8 flex flex-col gap-3 max-w-xs mx-auto"
              >
                <div className="rounded-md shadow">
                  <a
                    href="#"
                    className="group w-full flex items-center justify-center px-6 py-3 text-sm font-light tracking-widest rounded-full text-black bg-white hover:bg-white/90 transition-all duration-300"
                  >
                    Get Started
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}