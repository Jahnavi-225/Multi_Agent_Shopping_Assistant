import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import LoginPage from '../pages/LoginPage';

export default function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen } = useAuth();

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="relative w-full max-w-md"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Close Modal"
            >
              <X className="w-4 h-4" />
            </motion.button>
            <LoginPage onSuccess={() => setIsAuthModalOpen(false)} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
