'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const GlobalLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100000] bg-white flex flex-col items-center justify-center">
      <div className="relative">
        {/* Outer pulse */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -inset-8 bg-sky-100 rounded-full blur-xl"
        />
        
        {/* Inner rotating rings */}
        <div className="relative flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-slate-100 border-t-sky-500 rounded-full"
          />
          
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute w-10 h-10 border-4 border-slate-100 border-b-sky-400 rounded-full"
          />
        </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">
          Securing Session
        </p>
        <div className="flex gap-1 justify-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="w-1.5 h-1.5 bg-sky-500 rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};
