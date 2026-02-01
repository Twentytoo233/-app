
import { Language } from '../types';

const translations = {
  en: {
    title: 'VoyageMaster',
    dashboard: 'My Journey',
    planner: 'Trip Planner',
    guide: 'Explore Guide',
    business: 'Business Hub',
    collab: 'Collaboration',
    toolkit: 'Smart Toolkit',
    hello: 'Safe Travels, Alex!',
    viewItinerary: 'View Full Itinerary',
    complianceReport: 'Corp Compliance Report',
    liveSearch: 'Live Search Data',
    groundingCitations: 'Grounding Citations',
    langToggle: '中文',
    searchPlaceholder: 'Where to?',
    generatePlan: 'Generate Plan',
  },
  cn: {
    title: '远航大师',
    dashboard: '我的旅程',
    planner: '行程规划',
    guide: '探索指南',
    business: '商务中心',
    collab: '团队协作',
    toolkit: '智能工具箱',
    hello: '旅途平安，Alex！',
    viewItinerary: '查看完整行程',
    complianceReport: '企业合规报告',
    liveSearch: '实时搜索数据',
    groundingCitations: '数据来源引用',
    langToggle: 'English',
    searchPlaceholder: '要去哪儿？',
    generatePlan: '生成行程单',
  }
};

export const useTranslation = (lang: Language) => {
  return (key: keyof typeof translations['en']) => translations[lang][key] || key;
};
