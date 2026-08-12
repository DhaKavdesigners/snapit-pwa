import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export const OrderSuccessView: React.FC = () => {
  const navigate = useNavigate();
  
  // Generate a random mock order ID
  const orderId = `OD${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;

  // In a real app we might play a sound or trigger haptic feedback here
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-md mx-auto relative flex flex-col items-center justify-center min-h-screen bg-brand p-6 text-white text-center shadow-2xl overflow-hidden">
      
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          delay: 0.1
        }}
        className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
      >
        <CheckCircle2 className="w-20 h-20 text-brand" />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h1 className="text-3xl font-black mb-2">Order Placed!</h1>
        <p className="text-white/80 text-lg mb-8">
          The merchant has received your order and is preparing it now.
        </p>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 w-full max-w-sm mb-12">
          <p className="text-white/60 text-sm uppercase tracking-wider font-bold mb-1">Order ID</p>
          <p className="font-mono text-xl font-bold tracking-widest">{orderId}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full mt-auto mb-8"
      >
        <Button 
          variant="outline"
          className="w-full h-14 text-lg font-bold bg-white text-brand border-white hover:bg-gray-50 flex items-center justify-center gap-2"
          onClick={() => navigate('/')}
        >
          <Home className="w-5 h-5" />
          Back to Home
        </Button>
      </motion.div>
      
    </div>
  );
};
