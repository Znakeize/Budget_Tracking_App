
import React from 'react';
import { ChevronLeft, MessageCircle, ExternalLink, Users, Send } from 'lucide-react';
import { Card } from '../components/ui/Card';

interface CommunityLinksViewProps {
  onBack: () => void;
}

const SocialHub = () => {
  return (
    <div className="social-hub-wrapper flex justify-center py-8">
      <div className="tooltip-container">
        <div className="text">
          <svg viewBox="0 0 16 16" className="bi bi-send-fill" height={22} width={22} xmlns="http://www.w3.org/2000/svg" fill="currentColor">
            <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471z" />
          </svg>
        </div>
        {/* Twitter */}
        <a href="#" className="tooltip1" aria-label="Twitter">
          <svg viewBox="0 0 16 16" className="bi bi-twitter" height={20} width={20} xmlns="http://www.w3.org/2000/svg" fill="currentColor">
            <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334q.002-.211-.006-.422A6.7 6.7 0 0 0 16 3.542a6.7 6.7 0 0 1-1.889.518 3.3 3.3 0 0 0 1.447-1.817 6.5 6.5 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.32 9.32 0 0 1-6.767-3.429 3.29 3.29 0 0 0 1.018 4.382A3.3 3.3 0 0 1 .64 6.575v.045a3.29 3.29 0 0 0 2.632 3.218 3.2 3.2 0 0 1-.865.115 3 3 0 0 1-.614-.057 3.28 3.28 0 0 0 3.067 2.277A6.6 6.6 0 0 1 .78 13.58a6 6 0 0 1-.78-.045A9.34 9.34 0 0 0 5.026 15" />
          </svg>
        </a>
        {/* Facebook */}
        <a href="#" className="tooltip2" aria-label="Facebook">
          <svg viewBox="0 0 16 16" className="bi bi-facebook" height={20} width={20} xmlns="http://www.w3.org/2000/svg" fill="currentColor">
            <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951" />
          </svg>
        </a>
        {/* WhatsApp */}
        <a href="#" className="tooltip3" aria-label="WhatsApp">
          <svg viewBox="0 0 16 16" className="bi bi-whatsapp" height={20} width={20} xmlns="http://www.w3.org/2000/svg" fill="currentColor">
            <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
          </svg>
        </a>
        {/* Discord */}
        <a href="#" className="tooltip4" aria-label="Discord">
          <svg viewBox="0 0 16 16" className="bi bi-discord" height={20} width={20} xmlns="http://www.w3.org/2000/svg" fill="currentColor">
            <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612" />
          </svg>
        </a>
        {/* Instagram */}
        <a href="#" className="tooltip5" aria-label="Instagram">
          <svg viewBox="0 0 16 16" className="bi bi-instagram" height={20} width={20} xmlns="http://www.w3.org/2000/svg" fill="currentColor">
            <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.281.11-.705.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.486-.276a2.478 2.478 0 0 1-.919-.598 2.48 2.48 0 0 1-.599-.92c-.11-.281-.24-.705-.276-1.485-.038-.843-.047-1.096-.047-3.232 0-2.136.009-2.388.047-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z"/>
          </svg>
        </a>
        {/* Telegram */}
        <a href="#" className="tooltip6" aria-label="Telegram">
          <svg viewBox="0 0 16 16" height={20} width={20} xmlns="http://www.w3.org/2000/svg" fill="currentColor">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.287 5.906c-.778.324-2.334.994-4.666 2.01-.378.15-.577.298-.595.442-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294.26.006.549-.1.868-.32 2.179-1.471 3.304-2.214 3.374-2.23.05-.012.12-.026.166.016.047.041.042.12.037.141-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8.154 8.154 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629.093.06.183.125.27.187.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.426 1.426 0 0 0-.013-.315.337.337 0 0 0-.114-.217.526.526 0 0 0-.31-.093c-.3.005-.763.213-2.936 1.192"/>
          </svg>
        </a>
        {/* Github */}
        <a href="#" className="tooltip7" aria-label="Github">
          <svg viewBox="0 0 16 16" className="bi bi-github" height={20} width={20} xmlns="http://www.w3.org/2000/svg" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
          </svg>
        </a>
        {/* Reddit */}
        <a href="#" className="tooltip8" aria-label="Reddit">
          <svg viewBox="0 0 16 16" className="bi bi-reddit" height={20} width={20} xmlns="http://www.w3.org/2000/svg" fill="currentColor">
            <path d="M6.167 8a.83.83 0 0 0-.83.83c0 .459.372.84.83.831a.831.831 0 0 0 0-1.661m1.843 3.647c.315 0 1.403-.038 1.976-.611a.23.23 0 0 0 0-.306.213.213 0 0 0-.306 0c-.353.363-1.126.487-1.67.487-.545 0-1.308-.124-1.671-.487a.213.213 0 0 0-.306 0 .213.213 0 0 0 0 .306c.564.563 1.652.61 1.977.61zm.992-2.807c0 .458.373.83.831.83s.83-.381.83-.83a.831.831 0 0 0-1.66 0z" />
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.828-1.165c-.315 0-.602.124-.812.325-.801-.573-1.9-.945-3.121-.993l.534-2.501 1.738.372a.83.83 0 1 0 .83-.869.83.83 0 0 0-.744.468l-1.938-.41a.2.2 0 0 0-.153.028.2.2 0 0 0-.086.134l-.592 2.788c-1.24.038-2.358.41-3.17.992-.21-.2-.496-.324-.81-.324a1.163 1.163 0 0 0-.478 2.224q-.03.17-.029.353c0 1.795 2.091 3.256 4.669 3.256s4.668-1.451 4.668-3.256c0-.114-.01-.238-.029-.353.401-.181.688-.592.688-1.069 0-.65-.525-1.165-1.165-1.165" />
          </svg>
        </a>
        <span className="tooltip9"></span>
      </div>
      
      <style>{`
        .tooltip-container {
          background: rgb(3, 169, 244);
          background: linear-gradient(138deg, rgb(0, 0, 0) 15%, rgb(0, 31, 46) 65%);
          position: relative;
          cursor: pointer;
          font-size: 17px;
          padding: 0.7em 0.7em;
          border-radius: 50px;
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);
          z-index: 20;
        }
        .tooltip-container:hover {
          background: #fff;
          transition: all 0.9s;
        }
        .tooltip-container .text {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          transition: all 0.2s;
        }
        .tooltip-container:hover .text {
          color: rgb(0, 0, 0);
          transition: all 0.9s;
        }

        /* Twitter */
        .tooltip1 {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0;
          visibility: hidden;
          background: #000000;
          color: #001722;
          padding: 10px;
          border-radius: 50px;
          transition: opacity 0.3s, visibility 0.3s, top 0.3s, background 0.3s;
          z-index: 1;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .tooltip-container:hover .tooltip1 {
          top: 150%;
          opacity: 1;
          visibility: visible;
          background: #fff;
          border-radius: 50px;
          transform: translate(-50%, -5px);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tooltip-container:hover .tooltip1:hover {
          background: #03a9f4;
          color: #fff;
        }

        /* Facebook */
        .tooltip2 {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0;
          visibility: hidden;
          background: #fff;
          color: #001722;
          padding: 10px;
          border-radius: 50px;
          transition: opacity 0.3s, visibility 0.3s, top 0.3s, background 0.3s;
          z-index: 1;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .tooltip-container:hover .tooltip2 {
          top: -120%;
          opacity: 1;
          visibility: visible;
          background: #fff;
          transform: translate(-50%, -5px);
          border-radius: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tooltip-container:hover .tooltip2:hover {
          background: #001722;
          color: #fff;
        }

        /* WhatsApp */
        .tooltip3 {
          position: absolute;
          top: 100%;
          left: 60%;
          transform: translateX(80%);
          opacity: 0;
          visibility: hidden;
          background: #fff;
          color: #001722;
          padding: 10px;
          border-radius: 50px;
          transition: opacity 0.3s, visibility 0.3s, top 0.3s, background 0.3s;
          z-index: 1;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .tooltip-container:hover .tooltip3 {
          top: 10%;
          opacity: 1;
          visibility: visible;
          background: #fff;
          transform: translate(85%, -5px);
          border-radius: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tooltip-container:hover .tooltip3:hover {
          background: #1db954;
          color: #000000;
        }

        /* Discord */
        .tooltip4 {
          position: absolute;
          top: 100%;
          left: -190%;
          transform: translateX(70%);
          opacity: 0;
          visibility: hidden;
          background: #fff;
          color: #001722;
          padding: 10px;
          border-radius: 50px;
          transition: opacity 0.3s, visibility 0.3s, top 0.3s, background 0.3s;
          z-index: 1;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .tooltip-container:hover .tooltip4 {
          top: 10%;
          opacity: 1;
          visibility: visible;
          background: #fff;
          transform: translate(70%, -5px);
          border-radius: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tooltip-container:hover .tooltip4:hover {
          background: #8c9eff;
          color: #fff;
        }

        /* Instagram */
        .tooltip5 {
          position: absolute;
          top: 100%;
          left: -145%;
          transform: translateX(70%);
          opacity: 0;
          visibility: hidden;
          background: #fff;
          color: #001722;
          padding: 10px;
          border-radius: 50px;
          transition: opacity 0.3s, visibility 0.3s, top 0.3s, background 0.3s;
          z-index: 1;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .tooltip-container:hover .tooltip5 {
          top: -78%;
          opacity: 1;
          visibility: visible;
          background: #fff;
          transform: translate(70%, -5px);
          border-radius: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tooltip-container:hover .tooltip5:hover {
          background: #e029a3ff;
          color: #fff;
        }

        /* Telegram */
        .tooltip6 {
          position: absolute;
          top: 100%;
          left: 35%;
          transform: translateX(70%);
          opacity: 0;
          visibility: hidden;
          background: #fff;
          color: #001722;
          padding: 10px;
          border-radius: 50px;
          transition: opacity 0.3s, visibility 0.3s, top 0.3s, background 0.3s;
          z-index: 1;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .tooltip-container:hover .tooltip6 {
          top: -79%;
          opacity: 1;
          visibility: visible;
          background: #fff;
          transform: translate(70%, -5px);
          border-radius: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tooltip-container:hover .tooltip6:hover {
          background: #0088cc;
          color: #fff;
        }

        /* Github */
        .tooltip7 {
          position: absolute;
          top: 100%;
          left: 39%;
          transform: translateX(70%);
          opacity: 0;
          visibility: hidden;
          background: #fff;
          color: #001722;
          padding: 10px;
          border-radius: 50px;
          transition: opacity 0.3s, visibility 0.3s, top 0.3s, background 0.3s;
          z-index: 1;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .tooltip-container:hover .tooltip7 {
          top: 104%;
          opacity: 1;
          visibility: visible;
          background: #fff;
          transform: translate(70%, -5px);
          border-radius: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tooltip-container:hover .tooltip7:hover {
          background: #000;
          color: #fff;
        }

        /* Reddit */
        .tooltip8 {
          position: absolute;
          top: 100%;
          left: -150%;
          transform: translateX(70%);
          opacity: 0;
          visibility: hidden;
          background: #fff;
          color: #001722;
          padding: 10px;
          border-radius: 50px;
          transition: opacity 0.3s, visibility 0.3s, top 0.3s, background 0.3s;
          z-index: 1;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .tooltip-container:hover .tooltip8 {
          top: 101%;
          opacity: 1;
          visibility: visible;
          background: #fff;
          transform: translate(70%, -5px);
          border-radius: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tooltip-container:hover .tooltip8:hover {
          background: #ff4500;
          color: #fff;
        }

        .tooltip9 {
          position: absolute;
          top: 0;
          left: -115%;
          opacity: 0;
          visibility: hidden;
          width: 150px;
          height: 150px;
          z-index: -1;
        }
        .tooltip-container:hover .tooltip9 {
          top: -110%;
          opacity: 1;
          visibility: visible;
          border-radius: 50%;
          z-index: -1;
        }
      `}</style>
    </div>
  );
};

export const CommunityLinksView: React.FC<CommunityLinksViewProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col h-full relative">
       {/* Header */}
       <div className="flex-none pt-6 px-4 pb-4 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Social</h2>
                        <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">Community</h1>
                    </div>
                </div>
            </div>
       </div>

       <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-6 pb-28">
           
           <div className="text-center py-4 animate-in fade-in slide-in-from-bottom-2">
               <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Join the Conversation</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                   Connect with other budgeters, share tips, and get latest updates on our social channels.
               </p>
           </div>

           {/* Social Hub Widget */}
           <div className="py-6">
               <div className="mb-0"></div>
               <SocialHub />
               <div className="mt-10 text-center">
                   <p className="text-xs text-slate-400 animate-pulse">Tap the icon to reveal all our social platforms</p>
               </div>
           </div>

           <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 delay-100">
               <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Official Channels</h4>
               
               <a href="#" className="flex items-center p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group">
                   <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mr-4 group-hover:scale-110 transition-transform">
                       <MessageCircle size={20} />
                   </div>
                   <div className="flex-1">
                       <h5 className="font-bold text-slate-900 dark:text-white">Community Forum</h5>
                       <p className="text-xs text-slate-500 dark:text-slate-400">Ask questions & share guides</p>
                   </div>
                   <ExternalLink size={16} className="text-slate-400" />
               </a>

               <a href="#" className="flex items-center p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group">
                   <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mr-4 group-hover:scale-110 transition-transform">
                       <Users size={20} />
                   </div>
                   <div className="flex-1">
                       <h5 className="font-bold text-slate-900 dark:text-white">Discord Server</h5>
                       <p className="text-xs text-slate-500 dark:text-slate-400">Live chat with the team</p>
                   </div>
                   <ExternalLink size={16} className="text-slate-400" />
               </a>
           </div>

           <Card className="p-6 bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none text-center">
               <h3 className="text-lg font-bold mb-2">Invite Friends</h3>
               <p className="text-xs text-indigo-100 mb-4 opacity-90">Share BudgetFlow with your friends and family to help them manage their finances better.</p>
               <button className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors active:scale-95 flex items-center justify-center gap-2">
                   <Send size={16} /> Share App Link
               </button>
           </Card>

       </div>
    </div>
  );
};
