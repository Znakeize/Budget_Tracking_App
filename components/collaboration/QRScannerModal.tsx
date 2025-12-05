import React, { useEffect } from 'react';
import { ScanLine } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onScanSuccess();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onScanSuccess]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4">
            <div className="w-64 h-64 border-4 border-emerald-500 rounded-3xl relative flex items-center justify-center mb-8">
                <div className="w-full h-1 bg-emerald-500 absolute top-0 animate-[scan_2s_ease-in-out_infinite]"></div>
                <ScanLine size={48} className="text-emerald-500/50" />
            </div>
            <p className="text-white font-bold text-lg mb-8">Scanning...</p>
            <button onClick={onClose} className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold">Cancel</button>
            <style>{`@keyframes scan { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }`}</style>
        </div>
    );
};