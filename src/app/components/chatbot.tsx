"use client";

import { FormEvent, useEffect, useState, useRef } from "react";
import {
  Bot,
  LoaderCircle,
  MessageCircle,
  Send,
  X,
  Sparkles,
  Shield,
  User,
  Minimize2,
  Maximize2,
  Mic,
  Copy,
  CheckCheck,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  RefreshCw,
  Pin,
  PinOff,
  History,
  Trash2,
  Settings,
  Languages,
  Globe,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

type Message = { role: "user" | "model"; text: string; timestamp?: Date; id?: string };

// ===== LANGUES SUPPORTÉES =====
const SUPPORTED_LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "sw", label: "Kiswahili" },
  { code: "ln", label: "Lingala" },
  { code: "nand", label: "Kinande" },
];

// ===== RÉPONSES RAPIDES PAR LANGUE =====
const quickReplies = {
  fr: [
    { label: "Réservation", value: "Je veux réserver un voyage" },
    { label: "Tarifs", value: "Quels sont les tarifs ?" },
    { label: "Destinations", value: "Quelles sont les destinations ?" },
    { label: "Contact", value: "Comment vous contacter ?" },
    { label: "Horaires", value: "Quels sont les horaires ?" },
    { label: "Sécurité", value: "Quelles sont les mesures de sécurité ?" },
  ],
  en: [
    { label: "Booking", value: "I want to book a trip" },
    { label: "Prices", value: "What are the prices?" },
    { label: "Destinations", value: "What are the destinations?" },
    { label: "Contact", value: "How to contact you?" },
    { label: "Schedule", value: "What are the schedules?" },
    { label: "Security", value: "What are the security measures?" },
  ],
  sw: [
    { label: "Kuhifadhi", value: "Nataka kuhifadhi safari" },
    { label: "Bei", value: "Bei ni gani?" },
    { label: "Maeneo", value: "Maeneo gani yanapatikana?" },
    { label: "Wasiliana", value: "Jinsi ya kuwasiliana nanyi?" },
    { label: "Ratiba", value: "Ratiba ni gani?" },
    { label: "Usalama", value: "Hatua za usalama ni zipi?" },
  ],
  ln: [
    { label: "Bokambi", value: "Nalingi kokamba mobembo" },
    { label: "Mbongo", value: "Mbongo ezali boni?" },
    { label: "Bisika", value: "Bisika nini ezali?" },
    { label: "Boyokani", value: "Ndenge nini kokutana na bino?" },
    { label: "Ngonga", value: "Ngonga nini?" },
    { label: "Libateli", value: "Mibeko ya libateli?" },
  ],
  nand: [
    { label: "Okuhika", value: "Ndyenda kuhika olugendo" },
    { label: "Ebyombi", value: "Ebyombi ni byahi?" },
    { label: "Obuhika", value: "Obuhika buli hani?" },
    { label: "Okwihulha", value: "Mwihulha ngene?" },
    { label: "Ebiseera", value: "Ebiseera bya lugendo?" },
    { label: "Obulinda", value: "Enkora z'obulinda?" },
  ],
};

// ===== MESSAGES D'ACCUEIL PAR LANGUE ET MODE =====
const getWelcomeMessage = (mode: string, lang: string) => {
  const messages = {
    admin: {
      fr: "Bonjour administrateur. Je peux analyser les opérations KivuPort et vous aider à gérer la plateforme.",
      en: "Hello administrator. I can analyze KivuPort operations and help you manage the platform.",
      sw: "Habari msimamizi. Ninaweza kuchambua shughuli za KivuPort na kukusaidia kusimamia jukwaa.",
      ln: "Mbote mokonzi. Nakoki kosala analyse ya misala ya KivuPort mpe kosalisa yo na kokamba plate-forme.",
      nand: "Ndi mwami. Ndyakughulha emilimo ya KivuPort nende okukuhasa okulongholha esiteegi."
    },
    client: {
      fr: "Bonjour. Je suis votre assistant personnel. Je peux vous aider avec vos réservations, vos voyages et vos questions.",
      en: "Hello. I am your personal assistant. I can help you with your bookings, travels and questions.",
      sw: "Habari. Mimi ni msaidizi wako wa kibinafsi. Ninaweza kukusaidia na uhifadhi wako, safari na maswali yako.",
      ln: "Mbote. Ngai nazali mosalisi na yo. Nakoki kosalisa yo na bokambi, mobembo na mituna na yo.",
      nand: "Ndi. Nyowe omuhasa wao. Ndyakuhasa okuhika, olugendo nende eby'okwebuuza."
    },
    public: {
      fr: "Bonjour. Je suis l'assistant KivuPort. Je peux vous renseigner sur les voyages, les tarifs et les réservations.",
      en: "Hello. I am the KivuPort assistant. I can inform you about travels, prices and bookings.",
      sw: "Habari. Mimi ni msaidizi wa KivuPort. Ninaweza kukujulisha kuhusu safari, bei na uhifadhi.",
      ln: "Mbote. Ngai nazali mosalisi ya KivuPort. Nakoki koyebisa yo na makambo ya mobembo, mbongo na bokambi.",
      nand: "Ndi. Nyowe omuhasa wa KivuPort. Ndyakubwira olugendo, eby'ombi n'okuhika."
    }
  };
  return messages[mode as keyof typeof messages]?.[lang as keyof typeof messages.admin] || messages.public.fr;
};

export function Chatbot() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [language, setLanguage] = useState("fr");
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ [key: string]: "like" | "dislike" | null }>({});
  const [isListening, setIsListening] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const mode =
    pathname.startsWith("/admin")
      ? "admin"
      : pathname.startsWith("/dashboard") || pathname.startsWith("/reservations") || pathname.startsWith("/settings")
        ? "client"
        : "public";

  // Scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  // Focus input quand le chat est ouvert
  useEffect(() => {
    if (open && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [open, isMinimized]);

  // Initialiser les messages
  useEffect(() => {
    const welcome = getWelcomeMessage(mode, language);
    setMessages([{
      role: "model",
      text: welcome,
      timestamp: new Date(),
      id: Date.now().toString(),
    }]);
  }, [mode, language]);

  // Raccourci clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        if (!open) setIsMinimized(false);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "l") {
        e.preventDefault();
        const langs = Object.keys(quickReplies);
        const index = langs.indexOf(language);
        setLanguage(langs[(index + 1) % langs.length]);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, language]);

  // Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      
      const langMap: { [key: string]: string } = {
        fr: "fr-FR",
        en: "en-US",
        sw: "sw-KE",
        ln: "fr-FR",
        nand: "fr-FR"
      };
      recognitionRef.current.lang = langMap[language] || "fr-FR";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setInput(transcript);
        if (event.results[0].isFinal) {
          setIsListening(false);
          setTimeout(() => {
            if (transcript.trim()) {
              const fakeEvent = { preventDefault: () => {} } as FormEvent;
              send(fakeEvent);
            }
          }, 500);
        }
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [language]);

  const toggleListen = () => {
    if (!recognitionRef.current) {
      alert("La reconnaissance vocale n'est pas supportée par votre navigateur.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInput("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const getLanguageLabel = (code: string) => {
    return SUPPORTED_LANGUAGES.find(l => l.code === code)?.label || "Français";
  };

  async function send(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const newMessage: Message = {
      role: "user",
      text,
      timestamp: new Date(),
      id: Date.now().toString(),
    };

    const next = [...messages, newMessage];
    setMessages(next);
    setInput("");
    setLoading(true);
    setIsTyping(true);

    try {
      const { data } = await supabase.auth.getSession();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {})
        },
        body: JSON.stringify({
          message: text,
          history: next.slice(-21, -1),
          path: pathname,
          language,
        }),
      });

      const botMessage: Message = {
        role: "model",
        text: "",
        timestamp: new Date(),
        id: (Date.now() + 1).toString(),
      };

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Erreur de communication.");
      }

      const contentType = response.headers.get("content-type") || "";
      setMessages((current) => [...current, botMessage]);

      if (!contentType.includes("text/event-stream") || !response.body) {
        const result = await response.json() as { response?: string; error?: string };
        const finalText = result.response || "Je n'ai pas pu traiter votre demande.";
        setMessages((current) =>
          current.map((m) => (m.id === botMessage.id ? { ...m, text: finalText } : m))
        );
        setIsTyping(false);
        speak(finalText);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamedText = "";
      let started = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const eventBlock of events) {
          const dataLine = eventBlock.split("\n").find((line) => line.startsWith("data:"));
          if (!dataLine) continue;

          const data = dataLine.slice(5).trim();
          if (!data || data === "[DONE]") continue;

          let payload: { delta?: string; error?: string };
          try {
            payload = JSON.parse(data);
          } catch {
            continue;
          }

          if (payload.error) throw new Error(payload.error);

          if (typeof payload.delta === "string" && payload.delta) {
            streamedText += payload.delta;
            started = true;
            if (started) setIsTyping(false);
            setMessages((current) =>
              current.map((m) => (m.id === botMessage.id ? { ...m, text: streamedText } : m))
            );
          }
        }
      }

      const finalText = streamedText || "Je n'ai pas pu traiter votre demande.";
      setMessages((current) =>
        current.map((m) => (m.id === botMessage.id ? { ...m, text: finalText } : m))
      );
      setIsTyping(false);
      speak(finalText);

    } catch (error) {
      setIsTyping(false);
      const errorMessage: Message = {
        role: "model",
        text: error instanceof Error ? error.message : "Une erreur est survenue. Veuillez réessayer.",
        timestamp: new Date(),
        id: (Date.now() + 1).toString(),
      };
      setMessages((current) => [...current, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  const speak = (text: string) => {
    if (isMuted || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const langMap: { [key: string]: string } = {
      fr: "fr-FR",
      en: "en-US",
      sw: "sw-KE",
      ln: "fr-FR",
      nand: "fr-FR"
    };
    utterance.lang = langMap[language] || "fr-FR";
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  const clearChat = () => {
    if (messages.length > 1) {
      const welcome = getWelcomeMessage(mode, language);
      setMessages([{
        role: "model",
        text: welcome,
        timestamp: new Date(),
        id: Date.now().toString(),
      }]);
    }
  };

  const togglePin = (id: string) => {
    setPinnedMessages((prev) =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const copyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (id: string, type: "like" | "dislike") => {
    setFeedback((prev) => ({
      ...prev,
      [id]: prev[id] === type ? null : type,
    }));
  };

  // ===== ANIMATIONS =====
  const containerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.85, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 350,
        duration: 0.5
      }
    },
    exit: {
      opacity: 0,
      scale: 0.85,
      y: 30,
      transition: { duration: 0.2 }
    }
  };

  const messageVariants: Variants = {
    hidden: { opacity: 0, y: 15, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 18,
        stiffness: 350,
        duration: 0.35
      }
    }
  };

  const buttonVariants: Variants = {
    idle: { scale: 1 },
    hover: { scale: 1.08 },
    tap: { scale: 0.92 }
  };

  const pulseRing: Variants = {
    initial: { scale: 1, opacity: 0.6 },
    animate: {
      scale: 1.4,
      opacity: 0,
      transition: {
        duration: 1.8,
        repeat: Infinity,
        ease: "easeOut"
      }
    }
  };

  const floatVariants: Variants = {
    initial: { y: 0 },
    animate: {
      y: [0, -6, 0],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="fixed bottom-2 left-2 right-2 z-50 sm:bottom-6 sm:left-auto sm:right-6 sm:w-auto">
      <AnimatePresence>
        {open && (
          <motion.div
            className={`mx-auto flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl shadow-black/15 backdrop-blur-sm ${
              isMinimized
                ? "w-[min(100%,20rem)] max-w-[20rem] h-14 sm:w-80"
                : "h-[calc(100dvh-1rem)] w-[min(100%,26rem)] max-w-[26rem] sm:h-[min(680px,calc(100vh-140px))] sm:w-[440px]"
            }`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ backdropFilter: "blur(12px)" }}
          >
            {/* ===== HEADER ===== */}
            <motion.div
              className="relative flex items-center justify-between bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-4 py-3.5 text-white shrink-0 overflow-hidden cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                  className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
                  transition={{ duration: 8, repeat: Infinity }}
                />
                <motion.div
                  className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl"
                  animate={{ scale: [1, 1.3, 1], rotate: [0, -30, 0] }}
                  transition={{ duration: 6, repeat: Infinity }}
                />
              </div>

              <div className="relative flex items-center gap-3">
                <motion.div
                  className="relative"
                  whileHover={{ rotate: -10, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="p-1.5 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Bot size={18} className="text-white" />
                  </div>
                  <motion.div
                    className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  {isTyping && (
                    <motion.div
                      className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-blue-400 rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                    />
                  )}
                </motion.div>
                <div>
                  <p className="font-semibold text-sm flex items-center gap-2">
                    Assistant KivuPort
                    {pinnedMessages.length > 0 && (
                      <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">
                        {pinnedMessages.length}
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] text-blue-100">
                      {mode === "admin" ? "Administrateur" : mode === "client" ? "Client" : "Public"}
                      <span className="mx-1">·</span>
                      {getLanguageLabel(language)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative flex items-center gap-0.5">
                {!isMinimized && (
                  <motion.button
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
                    aria-label="Réduire"
                  >
                    <Minimize2 size={16} />
                  </motion.button>
                )}
                {isMinimized && (
                  <motion.button
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
                    aria-label="Agrandir"
                  >
                    <Maximize2 size={16} />
                  </motion.button>
                )}
                <motion.button
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                  aria-label="Fermer"
                >
                  <X size={16} />
                </motion.button>
              </div>
            </motion.div>

            {/* ===== BODY ===== */}
            {!isMinimized && (
              <>
                {/* Toolbar */}
                <div className="flex items-center gap-1 px-3 py-2 bg-gray-50/80 border-b border-gray-100 overflow-x-auto shrink-0">
                  <motion.button
                    className={`p-1.5 rounded-lg transition-colors ${
                      isListening ? "bg-red-100 text-red-600" : "hover:bg-gray-200 text-gray-500 hover:text-blue-600"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleListen}
                    title={isListening ? "Arrêter l'écoute" : "Dictée vocale"}
                  >
                    <Mic size={16} className={isListening ? "animate-pulse" : ""} />
                  </motion.button>

                  <motion.button
                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-500 hover:text-blue-600"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsMuted(!isMuted)}
                    title={isMuted ? "Activer le son" : "Couper le son"}
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </motion.button>

                  <div className="w-px h-6 bg-gray-200 mx-0.5" />

                  {/* Language Selector */}
                  <div className="relative">
                    <motion.button
                      className="flex items-center gap-1 px-2 py-1 hover:bg-gray-200 rounded-lg transition-colors text-gray-500 hover:text-blue-600 text-sm"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                    >
                      <Globe size={14} />
                      <span className="text-xs font-medium">{getLanguageLabel(language)}</span>
                      <ChevronDown size={12} />
                    </motion.button>
                    
                    <AnimatePresence>
                      {langDropdownOpen && (
                        <motion.div
                          className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[120px]"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                        >
                          {SUPPORTED_LANGUAGES.map((lang) => (
                            <button
                              key={lang.code}
                              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 transition-colors ${
                                language === lang.code ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                              }`}
                              onClick={() => {
                                setLanguage(lang.code);
                                setLangDropdownOpen(false);
                              }}
                            >
                              {lang.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="w-px h-6 bg-gray-200 mx-0.5" />

                  <motion.button
                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-500 hover:text-blue-600"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={clearChat}
                    title="Nouvelle conversation"
                  >
                    <RefreshCw size={14} />
                  </motion.button>

                  <motion.button
                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-500 hover:text-blue-600"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {}}
                    title="Historique"
                  >
                    <History size={14} />
                  </motion.button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50/80 to-white">
                  {/* Pinned messages */}
                  {pinnedMessages.length > 0 && (
                    <div className="mb-3 p-2 bg-amber-50 rounded-xl border border-amber-200">
                      <p className="text-[10px] text-amber-600 font-medium mb-1.5">Messages épinglés</p>
                      <div className="space-y-1">
                        {messages
                          .filter(m => m.id && pinnedMessages.includes(m.id))
                          .map((m) => (
                            <div key={m.id} className="text-xs text-gray-600 truncate bg-white p-1.5 rounded-lg shadow-sm">
                              {m.text.substring(0, 60)}...
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <AnimatePresence>
                    {messages.map((message, index) => {
                      const isPinned = message.id && pinnedMessages.includes(message.id);
                      const isCopied = message.id && copiedId === message.id;
                      const feedbackType = message.id ? feedback[message.id] : null;

                      return (
                        <motion.div
                          key={`${message.role}-${index}`}
                          className={`flex items-start gap-2.5 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                          variants={messageVariants}
                          initial="hidden"
                          animate="visible"
                          transition={{ delay: 0.03 * index }}
                        >
                          <motion.div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-md ${
                              message.role === "user"
                                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                                : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
                            }`}
                            whileHover={{ scale: 1.1 }}
                          >
                            {message.role === "user" ? <User size={14} /> : <Bot size={14} />}
                          </motion.div>

                          <div className={`relative group max-w-[80%] ${message.role === "user" ? "flex flex-col items-end" : ""}`}>
                            <motion.div
                              className={`px-3.5 py-2.5 rounded-2xl text-sm ${
                                message.role === "user"
                                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-tr-none shadow-md shadow-blue-500/20"
                                  : "bg-white border border-gray-100 text-gray-700 rounded-tl-none shadow-sm hover:shadow-md transition-shadow"
                              } ${isPinned ? "ring-2 ring-amber-400 ring-offset-1" : ""}`}
                              whileHover={{ scale: 1.01 }}
                            >
                              {message.text}
                              {message.timestamp && (
                                <span className="text-[9px] opacity-50 ml-2">
                                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </motion.div>

                            <div className={`flex gap-0.5 mt-1 ${message.role === "user" ? "justify-end" : "justify-start"} opacity-0 group-hover:opacity-100 transition-opacity`}>
                              <motion.button
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-blue-600"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => message.id && togglePin(message.id)}
                                title={isPinned ? "Désépingler" : "Épingler"}
                              >
                                {isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                              </motion.button>

                              <motion.button
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-blue-600"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => message.id && copyMessage(message.text, message.id)}
                                title="Copier"
                              >
                                {isCopied ? <CheckCheck size={12} className="text-green-500" /> : <Copy size={12} />}
                              </motion.button>

                              {message.role === "model" && (
                                <>
                                  <motion.button
                                    className={`p-1 hover:bg-gray-100 rounded-lg transition-colors ${
                                      feedbackType === "like" ? "text-blue-500" : "text-gray-400 hover:text-blue-600"
                                    }`}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => message.id && handleFeedback(message.id, "like")}
                                    title="Utile"
                                  >
                                    <ThumbsUp size={12} />
                                  </motion.button>
                                  <motion.button
                                    className={`p-1 hover:bg-gray-100 rounded-lg transition-colors ${
                                      feedbackType === "dislike" ? "text-red-500" : "text-gray-400 hover:text-red-600"
                                    }`}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => message.id && handleFeedback(message.id, "dislike")}
                                    title="Pas utile"
                                  >
                                    <ThumbsDown size={12} />
                                  </motion.button>
                                </>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Typing indicator */}
                  <AnimatePresence>
                    {isTyping && (
                      <motion.div
                        className="flex items-start gap-2.5"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
                          <Bot size={14} />
                        </div>
                        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-2.5 shadow-sm">
                          <div className="flex items-center gap-1.5">
                            <motion.span
                              className="w-2 h-2 bg-blue-400 rounded-full"
                              animate={{ scale: [1, 1.5, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                            />
                            <motion.span
                              className="w-2 h-2 bg-blue-400 rounded-full"
                              animate={{ scale: [1, 1.5, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                            />
                            <motion.span
                              className="w-2 h-2 bg-blue-400 rounded-full"
                              animate={{ scale: [1, 1.5, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={messagesEndRef} />
                </div>

                {/* ===== QUICK REPLIES ===== */}
                <motion.div
                  className="px-4 py-2 border-t border-gray-100 flex gap-1.5 overflow-x-auto bg-gray-50/80"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {quickReplies[language as keyof typeof quickReplies]?.map((reply, index) => (
                    <motion.button
                      key={reply.label}
                      className="px-3 py-1.5 bg-white hover:bg-blue-50 hover:text-blue-600 transition-all rounded-full text-xs text-gray-600 whitespace-nowrap shrink-0 border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow"
                      whileHover={{ scale: 1.06, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.04 }}
                      onClick={() => {
                        setInput(reply.value);
                        inputRef.current?.focus();
                      }}
                      disabled={loading}
                    >
                      {reply.label}
                    </motion.button>
                  ))}
                </motion.div>

                {/* ===== INPUT ===== */}
                <form onSubmit={send} className="flex gap-2 border-t border-gray-100 p-3 bg-white">
                  <motion.div
                    className="flex-1 relative"
                    whileHover={{ scale: 1.01 }}
                  >
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      maxLength={4000}
                      placeholder={isListening ? "Écoute en cours..." : "Posez votre question..."}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${
                        isListening
                          ? "border-red-400 ring-2 ring-red-500/30 bg-red-50"
                          : "border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 bg-gray-50 hover:bg-white"
                      }`}
                      disabled={loading}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      {isListening && (
                        <motion.span
                          className="w-2 h-2 bg-red-500 rounded-full"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        />
                      )}
                      <kbd className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded hidden sm:block">
                        ⌘K
                      </kbd>
                    </div>
                  </motion.div>

                  <motion.button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-2.5 disabled:opacity-40 shadow-lg shadow-blue-500/25 transition-all"
                    variants={buttonVariants}
                    initial="idle"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    {loading ? (
                      <LoaderCircle size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </motion.button>
                </form>

                {/* ===== FOOTER ===== */}
                <div className="px-4 py-2 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Shield size={12} className="text-emerald-500" />
                      Sécurisé
                    </span>
                    <span className="w-px h-3 bg-gray-200" />
                    <span className="flex items-center gap-1">
                      <Sparkles size={12} className="text-amber-500" />
                      IA Gemini
                    </span>
                    <span className="w-px h-3 bg-gray-200" />
                    <span>{getLanguageLabel(language)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] text-gray-400">
                      {messages.length} messages
                    </span>
                    <span className="w-px h-3 bg-gray-200" />
                    <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-[8px] text-gray-500">Ctrl</kbd>
                    <span className="text-[8px]">+</span>
                    <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-[8px] text-gray-500">K</kbd>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== FLOATING BUTTON ===== */}
      <motion.button
        type="button"
        aria-label={open ? "Fermer le chatbot" : "Ouvrir le chatbot"}
        onClick={() => {
          setOpen(!open);
          if (!open) setIsMinimized(false);
        }}
        className="relative ml-auto flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-3 py-3 font-semibold text-white shadow-2xl shadow-blue-500/40 transition-all sm:px-5 sm:py-3.5"
        variants={buttonVariants}
        initial="idle"
        whileHover="hover"
        whileTap="tap"
      >
        <motion.div
          className="absolute inset-0 rounded-full bg-blue-500/30"
          variants={pulseRing}
          initial="initial"
          animate="animate"
        />

        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-indigo-400/20"
          variants={floatVariants}
          initial="initial"
          animate="animate"
        />

        <div className="relative flex items-center gap-2">
          <MessageCircle size={20} />
          <span className="hidden sm:inline text-sm">
            {open ? "Fermer" : "Assistant"}
          </span>
          {!open && (
            <>
              <motion.span
                className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </>
          )}
        </div>
      </motion.button>
    </div>
  );
}