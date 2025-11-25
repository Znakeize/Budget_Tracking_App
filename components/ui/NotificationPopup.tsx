import React from 'react';
import { X, AlertCircle, Bell } from 'lucide-react';
import { Card } from './Card';
import { NotificationItem } from '../../utils/calculations';

interface NotificationPopupProps {
  notifications: NotificationItem[];
  onClose: () => void;
  onNotificationClick: (item: NotificationItem) => void;
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({ notifications, onClose, onNotificationClick }) => {
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
                      <AlertCircle size={14} className="text-indigo-500" /> 
                      Notifications
                      {notifications.length > 0 && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{notifications.length}</span>}
                  </h3>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                      <X size={14} />
                  </button>
              </div>
              
              {/* Content */}
              <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                  {notifications.length > 0 ? (
                      notifications.map((notif) => (
                          <div key={notif.id} className="relative group flex flex-col gap-1 p-2 rounded-lg bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/5 transition-all">
                              <div className="flex items-start gap-2">
                                  <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                      notif.type === 'danger' ? 'bg-red-500' : 
                                      notif.type === 'warning' ? 'bg-orange-500' : 
                                      notif.type === 'success' ? 'bg-emerald-500' : 
                                      'bg-blue-500'
                                  }`}></div>
                                  <div className="flex-1 min-w-0">
                                      <p className={`text-xs font-medium leading-snug ${
                                          notif.type === 'danger' ? 'text-red-600 dark:text-red-400' : 
                                          notif.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' :
                                          'text-slate-700 dark:text-slate-200'
                                      }`}>
                                          {notif.message}
                                      </p>
                                      <p className="text-[10px] text-slate-400 mt-0.5">{notif.date}</p>
                                  </div>
                              </div>
                              <button 
                                  onClick={() => {
                                      onNotificationClick(notif);
                                      onClose();
                                  }} 
                                  className="mt-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 self-end hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                  VIEW DETAILS
                              </button>
                          </div>
                      ))
                  ) : (
                       <div className="py-8 text-center">
                          <Bell size={20} className="mx-auto text-slate-300 dark:text-slate-600 mb-2 opacity-50" />
                          <p className="text-[10px] text-slate-400">All caught up!</p>
                      </div>
                  )}
              </div>
          </Card>
      </div>
    </>
  );
};