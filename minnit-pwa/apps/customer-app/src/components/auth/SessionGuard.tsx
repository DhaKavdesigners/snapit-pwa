import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, LogIn, Lock, Smartphone } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

export const SessionGuard: React.FC = () => {
  const { 
    isLoggedIn, 
    userProfile, 
    sessionId, 
    sessionTimestamp, 
    sessionRevokedMessage, 
    revokeCurrentSession, 
    clearSessionRevokedMessage 
  } = useAuthStore();
  
  const navigate = useNavigate();
  const phone = userProfile?.phone?.replace(/\D/g, '').slice(-10) || '';

  // 1. Realtime Broadcast Listener & Supabase Postgres Changes
  useEffect(() => {
    if (!isLoggedIn || !phone) return;

    // A. Broadcast Channel (Immediate <50ms notification across online devices)
    const broadcastChannel = supabase
      .channel(`user-session-${phone}`)
      .on('broadcast', { event: 'session_revoked' }, (message) => {
        const payload = message.payload;
        if (payload?.newSessionId && payload.newSessionId !== sessionId) {
          console.warn('🔒 Remote login detected via broadcast! Revoking local session.');
          revokeCurrentSession('Your Minnit account was logged in on another device.');
        }
      })
      .subscribe();

    // B. Postgres Database Changes (In case profile was updated on another device)
    const dbChangesChannel = supabase
      .channel(`user-profile-sync-${phone}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${phone}`,
        },
        (payload) => {
          const newUpdatedAt = payload.new?.updated_at;
          if (newUpdatedAt && sessionTimestamp) {
            const serverMs = new Date(newUpdatedAt).getTime();
            const localMs = new Date(sessionTimestamp).getTime();
            // If server timestamp is noticeably newer (> 1500ms), another login occurred
            if (serverMs - localMs > 1500) {
              console.warn('🔒 Remote login detected via Postgres changes! Revoking local session.');
              revokeCurrentSession('Your Minnit account was logged in on another device.');
            }
          }
        }
      )
      .subscribe();

    // C. Periodic & Visibility Heartbeat Check
    const checkServerSession = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('updated_at')
          .eq('id', phone)
          .single();

        if (data?.updated_at && sessionTimestamp) {
          const serverMs = new Date(data.updated_at).getTime();
          const localMs = new Date(sessionTimestamp).getTime();
          if (serverMs - localMs > 1500) {
            console.warn('🔒 Remote login detected via heartbeat! Revoking local session.');
            revokeCurrentSession('Your Minnit account was logged in on another device.');
          }
        }
      } catch (err) {
        console.debug('Session check error:', err);
      }
    };

    const interval = setInterval(checkServerSession, 20000);

    const handleFocus = () => {
      checkServerSession();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      supabase.removeChannel(broadcastChannel);
      supabase.removeChannel(dbChangesChannel);
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [isLoggedIn, phone, sessionId, sessionTimestamp, revokeCurrentSession]);

  const handleDismissModal = () => {
    clearSessionRevokedMessage();
    navigate('/profile');
  };

  return (
    <AnimatePresence>
      {sessionRevokedMessage && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 text-center relative overflow-hidden"
          >
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-red-500 to-rose-600" />

            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4 relative shadow-inner">
              <Smartphone className="w-8 h-8 text-amber-700" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
                <Lock className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Title */}
            <h3 className="font-black text-lg text-gray-900 mb-1.5 tracking-tight">
              Logged Out on This Device
            </h3>

            {/* Subtext */}
            <p className="text-xs text-gray-600 font-medium leading-relaxed mb-4">
              {sessionRevokedMessage}
            </p>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 text-[11px] text-gray-500 mb-5 leading-normal text-left flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                To protect your privacy and personal delivery details, Minnit accounts can only stay active on one device at a time.
              </span>
            </div>

            {/* Action button */}
            <button
              onClick={handleDismissModal}
              className="w-full bg-gradient-to-r from-emerald-600 to-brand text-white font-black text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/30 uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In Again</span>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
