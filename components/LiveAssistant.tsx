
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Mic, MicOff, Volume2, X, MessageSquare, Loader2, Sparkles } from 'lucide-react';
import { Language } from '../types';

interface LiveAssistantProps {
  lang: Language;
}

const LiveAssistant: React.FC<LiveAssistantProps> = ({ lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const startSession = async () => {
    setStatus('connecting');
    
    // 从后端 API 获取 API Key
    let apiKey = '';
    try {
      const response = await fetch('/api/gemini/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang })
      });
      if (!response.ok) {
        throw new Error('Failed to get API configuration');
      }
      const data = await response.json();
      apiKey = data.apiKey;
      if (!apiKey) {
        throw new Error('API Key not available');
      }
    } catch (err) {
      console.error('Failed to initialize Live Assistant:', err);
      setStatus('idle');
      return;
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const outputCtx = audioContextRef.current;
    const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

    const systemInstruction = lang === 'cn' 
      ? '你是一位远航大师（VoyageMaster AI）的智能出行管家。请使用中文为用户提供行程规划、当地贴士和物流建议。回复应简洁且富有帮助。'
      : 'You are a helpful travel concierge for VoyageMaster AI. Help users with itinerary planning, local tips, and travel logistics via voice in real-time. Respond in English. Keep responses concise and helpful.';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setStatus('listening');
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (isMuted) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message) => {
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              setStatus('speaking');
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setStatus('listening');
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.outputTranscription) {
              setTranscription(prev => (prev + ' ' + message.serverContent?.outputTranscription?.text).trim());
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Live Assistant Error:', e);
            stopSession();
          },
          onclose: () => {
            setIsActive(false);
            setStatus('idle');
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Failed to start Live Assistant:', err);
      setStatus('idle');
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setIsActive(false);
    setStatus('idle');
    setTranscription('');
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-80 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <span className="font-bold text-sm">{lang === 'cn' ? 'AI 语音助理' : 'AI Travel Concierge'}</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>
          
          <div className="p-6 flex flex-col items-center text-center space-y-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${
              isActive ? 'bg-indigo-50 text-indigo-600 scale-110' : 'bg-slate-50 text-slate-300'
            }`}>
              {status === 'connecting' ? (
                <Loader2 className="animate-spin" size={32} />
              ) : isActive ? (
                <div className="relative">
                  <div className={`absolute inset-0 rounded-full bg-indigo-200 animate-ping opacity-25 ${status !== 'listening' && 'hidden'}`}></div>
                  <Volume2 size={32} className={status === 'speaking' ? 'animate-bounce' : ''} />
                </div>
              ) : (
                <Mic size={32} />
              )}
            </div>
            
            <div className="space-y-1">
              <p className="font-bold text-slate-800">
                {status === 'idle' && (lang === 'cn' ? '准备就绪' : 'Ready to assist')}
                {status === 'connecting' && (lang === 'cn' ? '正在连接...' : 'Establishing link...')}
                {status === 'listening' && (lang === 'cn' ? '正在倾听...' : 'Listening to you...')}
                {status === 'speaking' && (lang === 'cn' ? '助理正在发言' : 'Concierge speaking')}
              </p>
              <p className="text-xs text-slate-400">
                {isActive ? (lang === 'cn' ? '请讲出您的需求' : 'Talk naturally about your travel needs') : (lang === 'cn' ? '点击开始进行语音咨询' : 'Press start to begin voice consultation')}
              </p>
            </div>

            {transcription && (
              <div className="w-full bg-slate-50 rounded-xl p-3 text-left max-h-24 overflow-y-auto shadow-inner">
                <p className="text-[10px] text-slate-400 font-black uppercase mb-1 tracking-widest">{lang === 'cn' ? '文字转录' : 'Transcript'}</p>
                <p className="text-xs text-slate-600 italic leading-relaxed">"{transcription}"</p>
              </div>
            )}

            <div className="flex gap-2 w-full pt-2">
              {!isActive ? (
                <button 
                  onClick={startSession}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  <Mic size={18} /> {lang === 'cn' ? '开始通话' : 'Start Call'}
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-3 rounded-xl font-bold transition-all border ${
                      isMuted ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                    }`}
                  >
                    {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                  <button 
                    onClick={stopSession}
                    className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100"
                  >
                    {lang === 'cn' ? '结束通话' : 'End Session'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-slate-800 text-white' : 'bg-indigo-600 text-white'
        }`}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};

export default LiveAssistant;
