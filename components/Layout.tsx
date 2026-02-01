
import React from 'react';
import { Plane, Map, Briefcase, LayoutDashboard, Menu, X, Bell, Wrench, Users, Languages } from 'lucide-react';
import { Language } from '../types';
import { useTranslation } from '../services/i18n';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lang: Language;
  setLang: (lang: Language) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, lang, setLang }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const t = useTranslation(lang);

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'plan', label: t('planner'), icon: Plane },
    { id: 'guide', label: t('guide'), icon: Map },
    { id: 'business', label: t('business'), icon: Briefcase },
    { id: 'collab', label: t('collab'), icon: Users },
    { id: 'toolkit', label: t('toolkit'), icon: Wrench },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-20`}>
        <div className="p-6 flex items-center justify-between">
          <div className={`flex items-center gap-3 overflow-hidden ${!isSidebarOpen && 'justify-center w-full'}`}>
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <Plane size={24} />
            </div>
            {isSidebarOpen && <span className="font-bold text-xl tracking-tight text-slate-800">{t('title')}</span>}
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <item.icon size={22} />
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-700 rounded-xl"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} className="mx-auto" />}
            {isSidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-semibold text-slate-800">{menuItems.find(i => i.id === activeTab)?.label}</h1>
          <div className="flex items-center gap-4">
            {/* Language Toggle */}
            <button 
              onClick={() => setLang(lang === 'en' ? 'cn' : 'en')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <Languages size={14} />
              {t('langToggle')}
            </button>

            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <img src="https://picsum.photos/seed/traveler/40/40" className="w-9 h-9 rounded-full ring-2 ring-indigo-100" alt="User avatar" />
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-700 leading-none">Alex Nomad</p>
                <p className="text-xs text-slate-400 mt-1">Premium Member</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
