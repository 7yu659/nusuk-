import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, CheckCircle2, KeyRound, Play, RotateCcw, ShieldCheck, Smartphone } from 'lucide-react';
import { OverlayWidget } from './web/OverlayWidget';
import { PhoneApp } from './web/PhoneApp';
import { QuizBankPanel, getQuizEntries } from './web/QuizBankPanel';
import { fmtNum, t } from './web/i18n';
import type {
  AutomationMode,
  DayStat,
  Lang,
  NoticeItem,
  OverlayState,
  PermissionState,
  ScreenId,
} from './web/types';

type DesktopSection = 'simulator' | 'quizBank';
type MobileTab = 'app' | 'simulator' | 'quizBank';

const SAMPLE_CODES = [
  'NG-p36wAxup',
  'NG-7mRt9KqL',
  'NG-2xVn8WzC',
  'NG-5bYp4JdH',
  'NG-8fQs1McN',
  'NG-3kTw6BvR',
];

export default function App() {
  const quizEntries = useMemo(() => getQuizEntries(), []);

  const [lang, setLang] = useState<Lang>('en');
  const [screen, setScreen] = useState<ScreenId>('home');
  const [desktopSection, setDesktopSection] = useState<DesktopSection>('simulator');
  const [mobileTab, setMobileTab] = useState<MobileTab>('app');

  const [permissions, setPermissions] = useState<PermissionState>({
    nusukInstalled: true,
    accessibilityEnabled: true,
    overlayAllowed: true,
  });

  const [codesToday, setCodesToday] = useState(14);
  const [quizToday, setQuizToday] = useState(28);
  const [codesTotal, setCodesTotal] = useState(142);
  const [quizTotal, setQuizTotal] = useState(318);
  const [dayStats, setDayStats] = useState<DayStat[]>([
    { date: 'Today', codes: 14, quiz: 28 },
    { date: 'Yesterday', codes: 36, quiz: 64 },
    { date: 'Before daily tracking', codes: 92, quiz: 226 },
  ]);

  const [paceNormal, setPaceNormal] = useState(true);
  const [minSec, setMinSec] = useState(2);
  const [maxSec, setMaxSec] = useState(5);

  const [notices, setNotices] = useState<NoticeItem[]>([
    {
      id: 102,
      title: 'Quiz database updated',
      body: 'Added newly verified Umrah challenge questions for faster offline solving.',
      at: Date.now() - 3600_000,
      url: 'https://nusuk.minbars.net/',
      unread: true,
    },
    {
      id: 101,
      title: 'Version 2.1 released',
      body: 'Customizable thinking time range and improved key extraction.',
      at: Date.now() - 86400_000,
      unread: false,
    },
  ]);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  const firstQuiz = quizEntries[0] || {
    question: 'what is the blessed well located in the sacred mosque',
    answer: 'Zamzam',
  };

  const [overlay, setOverlay] = useState<OverlayState>({
    visible: true,
    minimized: false,
    mode: 'QUIZ',
    targetCount: 100,
    completedCount: 0,
    correctCount: 0,
    running: false,
    paused: false,
    humanPace: true,
    statusText: 'Ready',
    thinkingProgress: 0,
    activeCode: SAMPLE_CODES[0],
    activeDoor: 1,
    activeQuestion: firstQuiz.question,
    activeAnswer: firstQuiz.answer,
  });

  // Live simulation loop for the Floating Overlay Widget
  const tickRef = useRef(0);
  useEffect(() => {
    if (!overlay.running || overlay.paused) return;

    const stepMs = overlay.humanPace && overlay.mode === 'QUIZ' ? 180 : 120;
    const timer = window.setInterval(() => {
      tickRef.current += 1;
      setOverlay((prev) => {
        if (!prev.running || prev.paused) return prev;

        if (prev.completedCount >= prev.targetCount) {
          const doneMsg =
            prev.mode === 'QUIZ'
              ? `Done (${prev.completedCount} quizzes, ${prev.correctCount} ✓)`
              : `Done (${prev.completedCount} codes)`;
          return {
            ...prev,
            running: false,
            thinkingProgress: 0,
            statusText: doneMsg,
          };
        }

        const nextPct = prev.thinkingProgress + (prev.humanPace ? 20 : 50);

        if (nextPct < 100) {
          const status =
            prev.mode === 'QUIZ'
              ? prev.humanPace
                ? `Thinking... ${Math.max(1, Math.ceil(((100 - nextPct) / 100) * minSec))}s`
                : `Selecting Door ${((prev.completedCount % 3) + 1)}...`
              : `Checking ${prev.activeCode} (${prev.completedCount + 1}/${prev.targetCount})`;
          return {
            ...prev,
            thinkingProgress: nextPct,
            statusText: status,
          };
        }

        // Complete one item
        const nextDone = prev.completedCount + 1;
        const nextCorrect = prev.mode === 'QUIZ' ? prev.correctCount + 1 : prev.correctCount;
        const nextEntry = quizEntries[nextDone % Math.max(1, quizEntries.length)] || firstQuiz;
        const nextCode = SAMPLE_CODES[nextDone % SAMPLE_CODES.length];

        if (prev.mode === 'QUIZ') {
          setQuizToday((c) => c + 1);
          setQuizTotal((c) => c + 1);
          setDayStats((rows) =>
            rows.map((r, i) => (i === 0 ? { ...r, quiz: r.quiz + 1 } : r)),
          );
        } else {
          setCodesToday((c) => c + 1);
          setCodesTotal((c) => c + 1);
          setDayStats((rows) =>
            rows.map((r, i) => (i === 0 ? { ...r, codes: r.codes + 1 } : r)),
          );
        }

        if (nextDone >= prev.targetCount) {
          const doneMsg =
            prev.mode === 'QUIZ'
              ? `Done (${nextDone} quizzes, ${nextCorrect} ✓)`
              : `Done (${nextDone} codes)`;
          return {
            ...prev,
            completedCount: nextDone,
            correctCount: nextCorrect,
            running: false,
            thinkingProgress: 0,
            statusText: doneMsg,
          };
        }

        return {
          ...prev,
          completedCount: nextDone,
          correctCount: nextCorrect,
          thinkingProgress: 0,
          activeDoor: (nextDone % 3) + 1,
          activeQuestion: nextEntry.question,
          activeAnswer: nextEntry.answer,
          activeCode: nextCode,
          statusText:
            prev.mode === 'QUIZ'
              ? `Selected (saved): ${prev.activeAnswer}`
              : `Checking ${nextCode} (${nextDone + 1}/${prev.targetCount})`,
        };
      });
    }, stepMs);

    return () => window.clearInterval(timer);
  }, [overlay.running, overlay.paused, overlay.humanPace, overlay.mode, minSec, quizEntries, firstQuiz]);

  const handleLaunchMode = (mode: AutomationMode) => {
    if (!permissions.nusukInstalled) {
      showToast(t(lang, 'Install the Nusuk app first'));
      return;
    }
    if (!permissions.accessibilityEnabled) {
      showToast(t(lang, 'Enable the accessibility service first'));
      return;
    }
    if (!permissions.overlayAllowed) {
      showToast(t(lang, 'Allow the floating overlay first'));
      return;
    }

    setOverlay((prev) => ({
      ...prev,
      visible: true,
      minimized: false,
      mode,
      targetCount: mode === 'QUIZ' ? 100 : 300,
      completedCount: 0,
      correctCount: 0,
      running: false,
      paused: false,
      thinkingProgress: 0,
      statusText: 'Ready',
    }));
    setDesktopSection('simulator');
    setMobileTab('simulator');
    showToast(
      lang === 'bn'
        ? 'ভাসমান ওভারলে উইজেট খোলা হয়েছে — Start চাপুন'
        : 'Floating overlay launched — press Start in the widget',
    );
  };

  const handleStartStopWidget = () => {
    setOverlay((prev) => {
      if (prev.running) {
        return {
          ...prev,
          running: false,
          paused: false,
          thinkingProgress: 0,
          statusText: 'Stopped by user',
        };
      }
      return {
        ...prev,
        running: true,
        paused: false,
        completedCount: 0,
        correctCount: 0,
        thinkingProgress: 10,
        statusText: prev.mode === 'QUIZ' ? 'Starting Quiz...' : 'Starting Codes...',
      };
    });
  };

  const handleFixPermission = (key: keyof PermissionState) => {
    setPermissions((prev) => ({ ...prev, [key]: true }));
    showToast(lang === 'bn' ? 'অনুমতি চালু করা হয়েছে' : 'Permission enabled');
  };

  const handleNavClick = (target: 'home' | 'stats' | 'simulator' | 'quizBank') => {
    if (target === 'home') {
      setScreen('home');
      setMobileTab('app');
    } else if (target === 'stats') {
      setScreen('stats');
      setMobileTab('app');
    } else if (target === 'simulator') {
      setDesktopSection('simulator');
      setMobileTab('simulator');
      setOverlay((p) => ({ ...p, visible: true }));
    } else if (target === 'quizBank') {
      setDesktopSection('quizBank');
      setMobileTab('quizBank');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-[#1C1917] flex flex-col">
      {/* Three-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E7E5E4]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className="text-[19px] font-semibold tracking-tight text-[#1C1917] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#3A6A98] rounded-md"
          >
            Nusuk Auto
          </button>

          <nav className="hidden md:flex items-center gap-6 text-[14px] font-medium text-[#78716C]">
            <button
              type="button"
              onClick={() => handleNavClick('home')}
              className={`py-2 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                screen === 'home'
                  ? 'text-[#1C1917] border-[#3A6A98]'
                  : 'border-transparent hover:text-[#1C1917]'
              }`}
            >
              {t(lang, 'Home')}
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('stats')}
              className={`py-2 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                screen === 'stats'
                  ? 'text-[#1C1917] border-[#3A6A98]'
                  : 'border-transparent hover:text-[#1C1917]'
              }`}
            >
              {t(lang, 'Statistics')}
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('simulator')}
              className={`py-2 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                desktopSection === 'simulator'
                  ? 'text-[#1C1917] border-[#3A6A98]'
                  : 'border-transparent hover:text-[#1C1917]'
              }`}
            >
              {lang === 'bn' ? 'ওভারলে সিমুলেটর' : 'Widget Simulator'}
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('quizBank')}
              className={`py-2 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                desktopSection === 'quizBank'
                  ? 'text-[#1C1917] border-[#3A6A98]'
                  : 'border-transparent hover:text-[#1C1917]'
              }`}
            >
              {lang === 'bn' ? 'কুইজ ব্যাংক' : 'Quiz Bank'}
            </button>
          </nav>

          <button
            type="button"
            onClick={() => setLang((prev) => (prev === 'en' ? 'bn' : 'en'))}
            className="px-4 py-2 min-h-[40px] rounded-lg bg-[#3A6A98] hover:bg-[#325C84] text-white text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3A6A98]"
          >
            {lang === 'en' ? 'বাংলা ভাষা' : 'English'}
          </button>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-8">
        <div className="flex flex-col lg:flex-row lg:items-start gap-8">
          {/* Left Column: Interactive Android App Screens */}
          <section
            className={`w-full lg:w-[400px] shrink-0 space-y-4 ${
              mobileTab === 'app' ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="rounded-[28px] border border-[#D6D3D1] bg-[#F5F5F4] shadow-md overflow-hidden">
              <PhoneApp
                lang={lang}
                onLangChange={setLang}
                screen={screen}
                onNavigate={setScreen}
                permissions={permissions}
                onFixPermission={handleFixPermission}
                codesToday={codesToday}
                quizToday={quizToday}
                codesTotal={codesTotal}
                quizTotal={quizTotal}
                dayStats={dayStats}
                paceNormal={paceNormal}
                onPaceModeChange={(normal) => {
                  setPaceNormal(normal);
                  setOverlay((p) => ({ ...p, humanPace: normal }));
                }}
                minSec={minSec}
                maxSec={maxSec}
                onRangeChange={(lo, hi) => {
                  setMinSec(lo);
                  setMaxSec(hi);
                }}
                overlay={overlay}
                onLaunchMode={handleLaunchMode}
                onStopRunning={() =>
                  setOverlay((p) => ({
                    ...p,
                    running: false,
                    paused: false,
                    thinkingProgress: 0,
                    statusText: 'Stopped by user',
                  }))
                }
                notices={notices}
                onClearNotices={() => setNotices([])}
                onMarkNoticesRead={() =>
                  setNotices((prev) => prev.map((n) => ({ ...n, unread: false })))
                }
                onToast={showToast}
                onKeysSubmitted={(added) => {
                  setCodesTotal((c) => c + added);
                  showToast(
                    lang === 'bn'
                      ? `${fmtNum(lang, added)}টি নতুন কোড যোগ হয়েছে`
                      : `${added} new code${added === 1 ? '' : 's'} added`,
                  );
                }}
              />
            </div>

            {/* Setup Permission Simulator Controls */}
            <div className="rounded-2xl bg-white border border-[#E7E5E4] p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[14px] font-semibold text-[#1C1917]">
                  {lang === 'bn' ? 'অ্যান্ড্রয়েড পারমিশন টেস্ট' : 'Permission State Toggle'}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPermissions({
                      nusukInstalled: true,
                      accessibilityEnabled: true,
                      overlayAllowed: true,
                    })
                  }
                  className="text-[12px] font-medium text-[#3A6A98] hover:underline"
                >
                  {lang === 'bn' ? 'সব চালু করুন' : 'Enable all'}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ['nusukInstalled', lang === 'bn' ? 'নুসুক অ্যাপ' : 'Nusuk App'],
                    ['accessibilityEnabled', lang === 'bn' ? 'অ্যাক্সেসিবিলিটি' : 'Accessibility'],
                    ['overlayAllowed', lang === 'bn' ? 'ওভারলে' : 'Overlay'],
                  ] as const
                ).map(([key, label]) => {
                  const active = permissions[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setPermissions((p) => ({ ...p, [key]: !p[key] }))
                      }
                      className={`px-2.5 py-2 min-h-[40px] rounded-xl border text-[12px] font-medium transition-colors flex items-center justify-center gap-1.5 ${
                        active
                          ? 'bg-[#EAF2F9] border-[#3A6A98]/40 text-[#2C5379]'
                          : 'bg-[#FFFBEB] border-[#FCD34D] text-[#92400E]'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Right Column: Interactive Widget Simulator & Quiz Bank */}
          <section
            className={`flex-1 min-w-0 space-y-6 ${
              mobileTab !== 'app' ? 'block' : 'hidden lg:block'
            }`}
          >
            {/* Section Switcher on Desktop */}
            <div className="hidden lg:flex items-center justify-between gap-4">
              <div>
                <h1 className="text-[24px] font-semibold text-[#1C1917] tracking-tight">
                  {desktopSection === 'simulator'
                    ? lang === 'bn'
                      ? 'ভাসমান ওভারলে ও অটোমেশন প্রিভিউ'
                      : 'Floating Widget & Automation Preview'
                    : lang === 'bn'
                    ? 'অফলাইন কুইজ ডেটাবেজ'
                    : 'Offline Quiz Answer Bank'}
                </h1>
                <p className="text-[14px] text-[#78716C] mt-0.5">
                  {lang === 'bn'
                    ? 'Android 8.0+ · Java 17 · শূন্য থার্ড-পার্টি লাইব্রেরি'
                    : 'Android 8.0+ · Java 17 · Bilingual English & বাংলা'}
                </p>
              </div>

              <div className="inline-flex items-center p-1 rounded-xl bg-white border border-[#E7E5E4]">
                <button
                  type="button"
                  onClick={() => setDesktopSection('simulator')}
                  className={`px-3.5 py-2 min-h-[38px] rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors ${
                    desktopSection === 'simulator'
                      ? 'bg-[#3A6A98] text-white'
                      : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                >
                  {lang === 'bn' ? 'উইজেট সিমুলেটর' : 'Widget Simulator'}
                </button>
                <button
                  type="button"
                  onClick={() => setDesktopSection('quizBank')}
                  className={`px-3.5 py-2 min-h-[38px] rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors ${
                    desktopSection === 'quizBank'
                      ? 'bg-[#3A6A98] text-white'
                      : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                >
                  {lang === 'bn' ? 'কুইজ ব্যাংক' : 'Quiz Bank'}
                </button>
              </div>
            </div>

            {(desktopSection === 'simulator' || mobileTab === 'simulator') && (
              <div className="space-y-5">
                {/* Mock Nusuk Screen with Floating Overlay */}
                <div className="rounded-2xl bg-white border border-[#E7E5E4] p-5 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#F0EEEC]">
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="w-5 h-5 text-[#3A6A98]" />
                      <div>
                        <div className="text-[15px] font-medium text-[#1C1917]">
                          {lang === 'bn'
                            ? 'নুসুক অ্যাপ স্ক্রিন সিমুলেশন'
                            : 'Simulated Nusuk Challenge View'}
                        </div>
                        <div className="text-[13px] text-[#78716C]">
                          {overlay.mode === 'QUIZ'
                            ? lang === 'bn'
                              ? 'দরজা কুইজ মোড'
                              : 'Door Quiz Mode'
                            : lang === 'bn'
                            ? 'কী কোড এন্ট্রি মোড'
                            : 'Your Keys Code Entry Mode'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!overlay.visible && (
                        <button
                          type="button"
                          onClick={() =>
                            setOverlay((p) => ({ ...p, visible: true, minimized: false }))
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-lg bg-[#3A6A98] hover:bg-[#325C84] text-white text-[13px] font-medium"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>{lang === 'bn' ? 'উইজেট দেখান' : 'Show Widget'}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setOverlay((p) => ({
                            ...p,
                            running: false,
                            paused: false,
                            completedCount: 0,
                            correctCount: 0,
                            thinkingProgress: 0,
                            statusText: 'Ready',
                          }))
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-lg bg-[#F5F5F4] hover:bg-[#E7E5E4] text-[#1C1917] text-[13px] font-medium transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'রিসেট' : 'Reset'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-6 items-start">
                    {/* Simulated Nusuk Screen Surface */}
                    <div className="rounded-2xl bg-[#FAFAF9] border border-[#E7E5E4] p-5 space-y-4">
                      {overlay.mode === 'QUIZ' ? (
                        <>
                          <div className="flex items-center justify-between text-[13px] text-[#78716C]">
                            <span>Nusuk Umrah Challenge</span>
                            <span className="tabular-nums font-medium text-[#3A6A98]">
                              {lang === 'bn'
                                ? `দরজা ${fmtNum(lang, overlay.activeDoor)}`
                                : `Door ${overlay.activeDoor}`}
                            </span>
                          </div>
                          <div className="p-4 rounded-xl bg-white border border-[#E7E5E4]">
                            <div className="text-[12px] text-[#78716C] uppercase tracking-wider mb-1">
                              {lang === 'bn' ? 'চলমান প্রশ্ন' : 'Active Question'}
                            </div>
                            <p className="text-[16px] font-medium text-[#1C1917] capitalize leading-snug">
                              {overlay.activeQuestion}?
                            </p>
                          </div>
                          <div className="space-y-2">
                            {[
                              overlay.activeAnswer,
                              'Al-Bayt al-Ma’mur',
                              'Mount Uhud',
                            ].map((opt, idx) => {
                              const isCorrect = idx === 0;
                              return (
                                <div
                                  key={opt}
                                  className={`px-4 py-3 rounded-xl border text-[14px] flex items-center justify-between ${
                                    isCorrect && (overlay.running || overlay.completedCount > 0)
                                      ? 'bg-[#ECFDF5] border-[#6EE7B7] text-[#064E3B] font-medium'
                                      : 'bg-white border-[#E7E5E4] text-[#44403C]'
                                  }`}
                                >
                                  <span>{opt}</span>
                                  {isCorrect && (overlay.running || overlay.completedCount > 0) && (
                                    <Check className="w-4 h-4 text-[#059669]" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between text-[13px] text-[#78716C]">
                            <span>Nusuk — Your Keys</span>
                            <span className="tabular-nums font-medium text-[#3A6A98]">
                              {fmtNum(lang, overlay.completedCount)} / {fmtNum(lang, overlay.targetCount)}
                            </span>
                          </div>
                          <div className="p-4 rounded-xl bg-white border border-[#E7E5E4] space-y-3">
                            <div className="flex items-center gap-2 text-[13px] text-[#78716C]">
                              <KeyRound className="w-4 h-4 text-[#3A6A98]" />
                              <span>{lang === 'bn' ? 'কোড ইনপুট ফিল্ড' : 'Key Code Input Field'}</span>
                            </div>
                            <div className="h-12 px-4 rounded-xl bg-[#F5F5F4] border border-[#D6D3D1] flex items-center justify-between">
                              <span className="font-mono-code text-[16px] font-medium text-[#1C1917]">
                                {overlay.activeCode}
                              </span>
                              <span className="text-[12px] font-medium text-[#3A6A98]">Check</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-[13px] text-[#15803D]">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>
                              {lang === 'bn'
                                ? 'আগে ব্যবহার করা কোডগুলো স্বয়ংক্রিয়ভাবে বাদ দেওয়া হয়'
                                : 'Previously tried codes are automatically skipped.'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Floating Overlay Widget (overlay_layout.xml) */}
                    <div className="flex justify-center xl:justify-end">
                      <OverlayWidget
                        lang={lang}
                        overlay={overlay}
                        onMinimizeToggle={() =>
                          setOverlay((p) => ({ ...p, minimized: !p.minimized }))
                        }
                        onClose={() =>
                          setOverlay((p) => ({
                            ...p,
                            visible: false,
                            running: false,
                            paused: false,
                          }))
                        }
                        onModeChange={(mode) =>
                          setOverlay((p) => ({
                            ...p,
                            mode,
                            targetCount: mode === 'QUIZ' ? 100 : 300,
                            completedCount: 0,
                            thinkingProgress: 0,
                            statusText: 'Ready',
                          }))
                        }
                        onCountChange={(targetCount) =>
                          setOverlay((p) => ({ ...p, targetCount }))
                        }
                        onPaceToggle={() =>
                          setOverlay((p) => ({ ...p, humanPace: !p.humanPace }))
                        }
                        onStartStop={handleStartStopWidget}
                        onPauseResume={() =>
                          setOverlay((p) => ({
                            ...p,
                            paused: !p.paused,
                            statusText: !p.paused ? 'Paused' : 'Resuming...',
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Screen Shortcuts */}
                <div className="rounded-2xl bg-white border border-[#E7E5E4] p-5">
                  <div className="text-[15px] font-semibold text-[#1C1917] mb-3">
                    {lang === 'bn' ? 'সব স্ক্রিন সরাসরি দেখুন' : 'Jump Directly to App Screens'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ['home', 'Home'],
                        ['stats', 'Statistics'],
                        ['settings', 'Settings'],
                        ['addKeys', 'Add your own codes'],
                        ['notifications', 'Notifications'],
                        ['help', 'Help & guides'],
                        ['developer', 'About developer'],
                      ] as Array<[ScreenId, string]>
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setScreen(id);
                          setMobileTab('app');
                        }}
                        className={`px-3.5 py-2 min-h-[40px] rounded-xl text-[13px] font-medium border transition-colors whitespace-nowrap ${
                          screen === id
                            ? 'bg-[#3A6A98] border-[#3A6A98] text-white'
                            : 'bg-[#FAFAF9] border-[#E7E5E4] text-[#44403C] hover:border-[#3A6A98]/50'
                        }`}
                      >
                        {t(lang, label)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {(desktopSection === 'quizBank' || mobileTab === 'quizBank') && (
              <QuizBankPanel lang={lang} />
            )}
          </section>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (under 15% viewport height) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-[#E7E5E4] grid grid-cols-3">
        <button
          type="button"
          onClick={() => setMobileTab('app')}
          className={`flex flex-col items-center justify-center text-[12px] font-medium transition-colors ${
            mobileTab === 'app' ? 'text-[#3A6A98]' : 'text-[#78716C]'
          }`}
        >
          <span>{lang === 'bn' ? 'অ্যাপ' : 'App'}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMobileTab('simulator');
            setOverlay((p) => ({ ...p, visible: true }));
          }}
          className={`flex flex-col items-center justify-center text-[12px] font-medium transition-colors ${
            mobileTab === 'simulator' ? 'text-[#3A6A98]' : 'text-[#78716C]'
          }`}
        >
          <span>{lang === 'bn' ? 'উইজেট' : 'Widget'}</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('quizBank')}
          className={`flex flex-col items-center justify-center text-[12px] font-medium transition-colors ${
            mobileTab === 'quizBank' ? 'text-[#3A6A98]' : 'text-[#78716C]'
          }`}
        >
          <span>{lang === 'bn' ? 'কুইজ ব্যাংক' : 'Quiz Bank'}</span>
        </button>
      </nav>

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#1C1917] text-white text-[14px] shadow-lg max-w-[90vw] text-center"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
