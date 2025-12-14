import React from 'react';
import { Notification } from '../types';

interface NotificationToastProps {
  notifications: Notification[];
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notifications }) => {
  return (
    <div className="fixed top-24 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {notifications.map((notif) => (
        <div 
          key={notif.id}
          className={`
            min-w-[280px] p-4 rounded shadow-[0_0_20px_rgba(0,0,0,0.5)] border-l-4 backdrop-blur-md bg-slate-900/90 text-white animate-in slide-in-from-right fade-in duration-300
            ${notif.type === 'success' ? 'border-green-500' : 
              notif.type === 'warning' ? 'border-orange-500' : 
              notif.type === 'error' ? 'border-red-500' : 'border-brand-blue'}
          `}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                notif.type === 'success' ? 'text-green-400' : 
                notif.type === 'warning' ? 'text-orange-400' : 
                notif.type === 'error' ? 'text-red-400' : 'text-brand-blue'
              }`}>
                {notif.type === 'success' ? 'MISSION SUCCESS' : 
                 notif.type === 'warning' ? 'ALERT' : 'SYSTEM INFO'}
              </div>
              <div className="text-sm font-mono">{notif.message}</div>
            </div>
            {notif.xp && (
              <div className="ml-4 flex flex-col items-center">
                <span className="text-xs text-slate-400 uppercase">XP</span>
                <span className="text-lg font-bold text-yellow-400">+{notif.xp}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;