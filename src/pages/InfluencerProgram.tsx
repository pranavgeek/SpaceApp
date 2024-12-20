import React from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp, DollarSign, Users, Award, ChevronRight } from 'lucide-react';
import { influencerTiers } from '../data/influencerProgram';

export function InfluencerProgram() {
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
              <Star className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl text-white font-light text-center mb-2">
              THE SPACE Influencer Program
            </h1>
            <p className="text-white/60 text-sm font-light text-center">
              Partner with us to earn while promoting innovation
            </p>
          </motion.div>

          <div className="space-y-6">
            {influencerTiers.map((tier, index) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="modern-card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg text-white font-light">{tier.tier.charAt(0).toUpperCase() + tier.tier.slice(1)} Tier</h2>
                  <div className="px-3 py-1 bg-white/10 rounded-full">
                    <span className="text-xs text-white font-light">
                      Up to ${tier.earnings.baseRate * 30}/mo base
                    </span>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-white/60" />
                    <span className="text-sm text-white/80 font-light">
                      {tier.requirements.minFollowers.toLocaleString()}+ followers
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-5 h-5 text-white/60" />
                    <span className="text-sm text-white/80 font-light">
                      {tier.requirements.minEngagementRate}%+ engagement rate
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-white/60" />
                    <span className="text-sm text-white/80 font-light">
                      {tier.benefits.commissionRate}% commission on sales
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Award className="w-5 h-5 text-white/60" />
                    <span className="text-sm text-white/80 font-light">
                      Up to ${tier.earnings.bonusThresholds.slice(-1)[0].bonus} in bonuses
                    </span>
                  </div>
                </div>

                <button className="w-full py-3 bg-white text-black rounded-full text-sm font-light tracking-wide flex items-center justify-center space-x-2">
                  <span>Apply Now</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 p-6 modern-card"
          >
            <h3 className="text-white font-light mb-4">Why Join?</h3>
            <ul className="space-y-3">
              <li className="text-sm text-white/60 font-light">• Early access to innovative products</li>
              <li className="text-sm text-white/60 font-light">• Exclusive promotional content</li>
              <li className="text-sm text-white/60 font-light">• Performance-based bonuses</li>
              <li className="text-sm text-white/60 font-light">• Custom affiliate links and tracking</li>
              <li className="text-sm text-white/60 font-light">• Monthly product allowance</li>
            </ul>
          </motion.div>
        </section>
      </div>
    </div>
  );
}