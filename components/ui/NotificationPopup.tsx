
import React from 'react';
import { X, AlertCircle, Bell, Calendar, TrendingDown, PiggyBank, Crown, CalendarHeart } from 'lucide-react';
import { Card } from './Card';
import { NotificationItem } from '../../utils/calculations';

interface NotificationPopupProps {
  notifications: NotificationItem[];
  onClose: () => void;
  onNotificationClick: (item: NotificationItem) => void;
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({ notifications, onClose, onNotificationClick }) => {
  const getIcon = (category: NotificationItem['category']) => {
      switch(category) {
          case 'Bill': return <Calendar size={14} />;
          case 'Debt': return <TrendingDown size={14} />;
          case 'Savings': return <PiggyBank size={14} />;
          case 'System': return <Crown size={14} />;
          case 'Event': return <CalendarHeart size={14} />;
          default: return <AlertCircle size={14} />;
      }
  };

  return (
    <>
      <div 
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]" 
          onClick={onClose}
      ></div>
      <div className="absolute top-[4.5rem] right-4 z-50 w-72 animate-in zoom-in-95 slide-in-from-top-2 duration-200">
          <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-2xl p-0 overflow-hidden ring-1 ring-black/5">
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <Bell size={14} className="text-indigo-500" /> 
                      Notifications
                      {notifications.length > 0 && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{notifications.length}</span>}
                  </h3>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                      <X size={14} />
                  </button>
              </div>
              
              {/* Content */}
              <div className="max-h-72 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
                  {notifications.length > 0 ? (
                      notifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            className={`relative group flex flex-col gap-1 p-2.5 rounded-xl transition-all cursor-pointer border ${
                                notif.category === 'System' 
                                    ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-50 dark:hover:bg-indigo-900/20' 
                                    : notif.category === 'Event'
                                        ? 'bg-fuchsia-50/50 dark:bg-fuchsia-900/10 border-fuchsia-100 dark:border-fuchsia-500/20 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20'
                                        : 'bg-white dark:bg-black/20 border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/10'
                            }`}
                            onClick={() => {
                                onNotificationClick(notif);
                            }} 
                          >
                              <div className="flex items-start gap-2.5">
                                  <div className={`mt-0.5 p-1.5 rounded-full shrink-0 shadow-sm flex items-center justify-center ${
                                      notif.type === 'danger' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 
                                      notif.type === 'warning' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 
                                      notif.type === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                                      'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                  }`}>
                                      {getIcon(notif.category)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <p className={`text-xs font-medium leading-snug ${
                                          notif.category === 'System' ? 'text-indigo-900 dark:text-indigo-200' : 
                                          notif.category === 'Event' ? 'text-fuchsia-900 dark:text-fuchsia-200' :
                                          notif.type === 'danger' ? 'text-slate-900 dark:text-white font-bold' : 
                                          'text-slate-700 dark:text-slate-200'
                                      }`}>
                                          {notif.message}
                                      </p>
                                      <div className="flex items-center justify-between mt-1">
                                          <p className="text-[9px] text-slate-400">{notif.date}</p>
                                          <span className="text-[9px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                              {notif.category === 'System' ? 'DISMISS' : 'VIEW'}
                                          </span>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      ))
                  ) : (
                       <div className="py-10 text-center flex flex-col items-center">
                          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                              <Bell size={20} className="text-slate-300 dark:text-slate-600" />
                          </div>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">All caught up!</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">No new notifications</p>
                      </div>
                  )}
              </div>
          </Card>
      </div>
    </>
  );
};
