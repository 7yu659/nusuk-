import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  ChevronRight,
  ExternalLink,
  Globe,
  HelpCircle,
  Plus,
  Settings,
  Share2,
  Users,
} from 'lucide-react';
import devAvatar from '../../res/drawable-nodpi/dev_avatar.jpg';
import { AutoCodesIcon, AutoQuizIcon, NusukLogo, StarDeco } from './NusukLogo';
import { fmtNum, t, toBnDigits } from './i18n';
import type {
  AutomationMode,
  DayStat,
  Lang,
  NoticeItem,
  OverlayState,
  PermissionState,
  ScreenId,
} from './types';

interface PhoneAppProps {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  screen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  permissions: PermissionState;
  onFixPermission: (key: keyof PermissionState) => void;
  codesToday: number;
  quizToday: number;
  codesTotal: number;
  quizTotal: number;
  dayStats: DayStat[];
  paceNormal: boolean;
  onPaceModeChange: (normal: boolean) => void;
  minSec: number;
  maxSec: number;
  onRangeChange: (min: number, max: number) => void;
  overlay: OverlayState;
  onLaunchMode: (mode: AutomationMode) => void;
  onStopRunning: () => void;
  notices: NoticeItem[];
  onClearNotices: () => void;
  onMarkNoticesRead: () => void;
  onToast: (message: string) => void;
  onKeysSubmitted: (addedCount: number) => void;
}

const VALID_KEY_RE = /(?<![A-Za-z0-9])NG-[A-Za-z0-9]{8}(?![A-Za-z0-9])/gi;
const LOOKS_LIKE_KEY_RE = /^NG-?[A-Za-z0-9-]*$/i;

export function PhoneApp({
  lang,
  onLangChange,
  screen,
  onNavigate,
  permissions,
  onFixPermission,
  codesToday,
  quizToday,
  codesTotal,
  quizTotal,
  dayStats,
  paceNormal,
  onPaceModeChange,
  minSec,
  maxSec,
  onRangeChange,
  overlay,
  onLaunchMode,
  onStopRunning,
  notices,
  onClearNotices,
  onMarkNoticesRead,
  onToast,
  onKeysSubmitted,
}: PhoneAppProps) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [keysInput, setKeysInput] = useState('NG-p36wAxup\nNG-9kLm2QrT\nNG-bad');
  const [parseResult, setParseResult] = useState<{
    added: string[];
    duplicate: string[];
    invalid: string[];
  } | null>(null);
  const [knownKeys] = useState(() => new Set<string>(['NG-9KLM2QRT']));
  const [updateChecked, setUpdateChecked] = useState(false);

  const unreadCount = notices.filter((n) => n.unread).length;
  const allPermsReady =
    permissions.nusukInstalled &&
    permissions.accessibilityEnabled &&
    permissions.overlayAllowed;

  const handleOpenNotifications = () => {
    onMarkNoticesRead();
    onNavigate('notifications');
  };

  const handleShareApp = () => {
    const shareUrl = 'https://nusuk.minbars.net/';
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    onToast(
      lang === 'bn'
        ? `শেয়ার লিংক কপি হয়েছে: ${shareUrl}`
        : `Share link copied: ${shareUrl}`,
    );
  };

  const handleParseAndAddKeys = () => {
    const normalized = keysInput.replace(/[\u2010-\u2015\u2212]/g, '-');
    const tokens = normalized.split(/[\s,;|]+/);
    const seen = new Set<string>();
    const badSeen = new Set<string>();
    const validKeys: string[] = [];
    const duplicate: string[] = [];
    const invalid: string[] = [];

    for (const rawTok of tokens) {
      const tok = rawTok.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9-]+$/g, '');
      if (!tok) continue;
      const matches = tok.match(VALID_KEY_RE);
      if (matches && matches.length > 0) {
        for (const m of matches) {
          const canonical = 'NG-' + m.slice(3);
          const lower = canonical.toLowerCase();
          if (!seen.has(lower)) {
            seen.add(lower);
            validKeys.push(canonical);
          } else {
            duplicate.push(canonical);
          }
        }
      } else if (tok.length >= 3 && LOOKS_LIKE_KEY_RE.test(tok) && !badSeen.has(tok)) {
        badSeen.add(tok);
        invalid.push(tok);
      }
    }

    if (validKeys.length === 0 && invalid.length === 0) {
      setParseResult({ added: [], duplicate: [], invalid: [] });
      onToast(t(lang, 'No codes found in the text. A code looks like NG-p36wAxup.'));
      return;
    }

    const added: string[] = [];
    for (const k of validKeys) {
      if (knownKeys.has(k.toUpperCase())) {
        duplicate.push(k);
      } else {
        knownKeys.add(k.toUpperCase());
        added.push(k);
      }
    }

    setParseResult({ added, duplicate, invalid });
    if (added.length > 0) {
      onKeysSubmitted(added.length);
      setKeysInput('');
    }
  };

  // Sub-screen Top Bar (activity_screen.xml)
  if (screen !== 'home') {
    const titles: Record<Exclude<ScreenId, 'home'>, string> = {
      stats: 'Statistics',
      settings: 'Settings',
      notifications: 'Notifications',
      addKeys: 'Add your own codes',
      developer: 'About developer',
      help: 'Help & guides',
    };

    return (
      <div className="flex flex-col h-full min-h-[640px] bg-[#F5F5F4] text-[#1C1917]">
        {/* Top bar */}
        <div className="hero-gradient px-3 pt-2.5 pb-3 flex items-center gap-3 text-white shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            aria-label={t(lang, 'Back')}
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="flex-1 text-[19px] font-medium truncate">
            {t(lang, titles[screen])}
          </h2>
          {screen === 'notifications' && notices.length > 0 && (
            <button
              type="button"
              onClick={onClearNotices}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-[14px] text-white whitespace-nowrap transition-colors"
            >
              {t(lang, 'Clear all')}
            </button>
          )}
        </div>

        {/* Sub-screen Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {screen === 'stats' && (
            <>
              <p className="text-[15px] text-[#78716C]">
                {t(lang, 'This is your own usage on this phone.')}
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-[18px] bg-white border border-[#E7E5E4] p-4">
                  <div className="text-[32px] font-light leading-none tabular-nums text-[#1C1917]">
                    {fmtNum(lang, codesToday)}
                  </div>
                  <div className="mt-1.5 text-[15px] text-[#1C1917]">{t(lang, 'Codes today')}</div>
                  <div className="mt-1.5 text-[13px] text-[#78716C] tabular-nums">
                    {t(lang, `Total ${codesTotal}`)}
                  </div>
                </div>
                <div className="rounded-[18px] bg-white border border-[#E7E5E4] p-4">
                  <div className="text-[32px] font-light leading-none tabular-nums text-[#1C1917]">
                    {fmtNum(lang, quizToday)}
                  </div>
                  <div className="mt-1.5 text-[15px] text-[#1C1917]">{t(lang, 'Quiz today')}</div>
                  <div className="mt-1.5 text-[13px] text-[#78716C] tabular-nums">
                    {t(lang, `Total ${quizTotal}`)}
                  </div>
                </div>
              </div>

              <div>
                <div className="px-1 mb-2 text-[12px] tracking-[0.12em] uppercase text-[#78716C]">
                  {t(lang, 'By date')}
                </div>
                <div className="rounded-[18px] bg-white border border-[#E7E5E4] px-4 py-1.5">
                  <div className="grid grid-cols-[1fr_64px_64px] items-center min-h-[36px] text-[12px] uppercase text-[#78716C]">
                    <span>{t(lang, 'Date')}</span>
                    <span className="text-right">{t(lang, 'Codes')}</span>
                    <span className="text-right">{t(lang, 'Quiz')}</span>
                  </div>
                  {dayStats.map((d, idx) => (
                    <div
                      key={d.date}
                      className={`grid grid-cols-[1fr_64px_64px] items-center min-h-[48px] text-[15px] text-[#1C1917] ${
                        idx === 0 ? 'border-t border-[#EFEDEB]' : 'border-t border-[#EFEDEB]'
                      }`}
                    >
                      <span>{t(lang, d.date)}</span>
                      <span className="text-right tabular-nums">{fmtNum(lang, d.codes)}</span>
                      <span className="text-right tabular-nums">{fmtNum(lang, d.quiz)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {screen === 'settings' && (
            <>
              {/* About card */}
              <div className="rounded-[18px] bg-white border border-[#E7E5E4] p-4 space-y-3.5">
                <div className="flex items-center gap-3.5">
                  <div className="w-[52px] h-[52px] rounded-2xl bg-[#EAF2F9] flex items-center justify-center shrink-0">
                    <NusukLogo className="w-8 h-8" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[18px] font-medium text-[#1C1917]">Nusuk Auto</div>
                    <div className="text-[14px] text-[#78716C] tabular-nums">
                      {t(lang, 'Version 2.1')}
                    </div>
                  </div>
                </div>
                <p className="text-[15px] text-[#44403C] leading-relaxed">
                  {t(lang, 'Adds Umrah codes and plays the Nusuk quiz for you, so you save time.')}
                </p>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-[14px] text-[#15803D]">
                    {updateChecked
                      ? t(lang, 'You have the latest version')
                      : t(lang, 'You have the latest version')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setUpdateChecked(true);
                      onToast(t(lang, 'You have the latest version'));
                    }}
                    className="px-4 py-2 min-h-[40px] rounded-full bg-[#EAF2F9] hover:bg-[#DCEAF7] text-[#2C5379] text-[14px] font-medium whitespace-nowrap transition-colors"
                  >
                    {t(lang, 'Check for updates')}
                  </button>
                </div>
              </div>

              {/* Language */}
              <div>
                <div className="px-1 mb-2 text-[12px] tracking-[0.12em] uppercase text-[#78716C]">
                  {t(lang, 'Language')}
                </div>
                <div className="rounded-[18px] bg-white border border-[#E7E5E4] p-4 space-y-3">
                  <p className="text-[15px] text-[#44403C]">
                    {t(lang, 'Choose the language of the app.')}
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => onLangChange('en')}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-colors min-h-[48px] ${
                        lang === 'en'
                          ? 'bg-[#EAF2F9] border-[#3E7CB1] border-2'
                          : 'bg-white border-[#D6D3D1]'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[13px] shrink-0 ${
                          lang === 'en'
                            ? 'bg-[#3E7CB1] text-white'
                            : 'border-2 border-[#D6D3D1] text-transparent'
                        }`}
                      >
                        ✓
                      </span>
                      <span className="text-[16px] font-medium text-[#1C1917]">English</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onLangChange('bn')}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-colors min-h-[48px] ${
                        lang === 'bn'
                          ? 'bg-[#EAF2F9] border-[#3E7CB1] border-2'
                          : 'bg-white border-[#D6D3D1]'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[13px] shrink-0 ${
                          lang === 'bn'
                            ? 'bg-[#3E7CB1] text-white'
                            : 'border-2 border-[#D6D3D1] text-transparent'
                        }`}
                      >
                        ✓
                      </span>
                      <span className="text-[16px] font-medium text-[#1C1917]">বাংলা</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quiz pace */}
              <div>
                <div className="px-1 mb-2 text-[12px] tracking-[0.12em] uppercase text-[#78716C]">
                  {t(lang, 'Quiz pace')}
                </div>
                <div className="rounded-[18px] bg-white border border-[#E7E5E4] p-4 space-y-3">
                  <p className="text-[15px] text-[#44403C]">
                    {t(lang, 'Choose how fast the quiz is played.')}
                  </p>
                  <button
                    type="button"
                    onClick={() => onPaceModeChange(true)}
                    className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-colors ${
                      paceNormal
                        ? 'bg-[#EAF2F9] border-[#3E7CB1] border-2'
                        : 'bg-white border-[#D6D3D1]'
                    }`}
                  >
                    <span
                      className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[13px] shrink-0 ${
                        paceNormal
                          ? 'bg-[#3E7CB1] text-white'
                          : 'border-2 border-[#D6D3D1] text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    <div>
                      <div className="text-[16px] font-medium text-[#1C1917]">
                        {t(lang, 'Normal (recommended)')}
                      </div>
                      <div className="mt-1 text-[14px] text-[#78716C] leading-snug">
                        {t(
                          lang,
                          'Thinks for a moment before giving each answer, like a real person. The next door is chosen at once. Safest for your account.',
                        )}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onPaceModeChange(false)}
                    className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-colors ${
                      !paceNormal
                        ? 'bg-[#EAF2F9] border-[#3E7CB1] border-2'
                        : 'bg-white border-[#D6D3D1]'
                    }`}
                  >
                    <span
                      className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[13px] shrink-0 ${
                        !paceNormal
                          ? 'bg-[#3E7CB1] text-white'
                          : 'border-2 border-[#D6D3D1] text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    <div>
                      <div className="text-[16px] font-medium text-[#1C1917]">
                        {t(lang, 'Fast')}
                      </div>
                      <div className="mt-1 text-[14px] text-[#78716C] leading-snug">
                        {t(
                          lang,
                          'No waiting at all. Quicker, but looks like a bot and your account may get limited.',
                        )}
                      </div>
                    </div>
                  </button>

                  {paceNormal && (
                    <div className="pt-2 space-y-2.5 border-t border-[#F0EEEC]">
                      <div className="text-[15px] text-[#44403C]">
                        {t(lang, 'Thinking time before each answer')}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[16px] text-[#1C1917]">{t(lang, 'Shortest')}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const next = Math.max(1, minSec - 1);
                              onRangeChange(next, Math.max(next, maxSec));
                            }}
                            className="w-11 h-9 rounded-full bg-[#EAF2F9] hover:bg-[#DCEAF7] text-[#2C5379] font-medium text-lg"
                          >
                            −
                          </button>
                          <span className="w-14 text-center text-[16px] font-medium tabular-nums">
                            {t(lang, `${minSec} s`)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = Math.min(10, minSec + 1);
                              onRangeChange(next, Math.max(next, maxSec));
                            }}
                            className="w-11 h-9 rounded-full bg-[#EAF2F9] hover:bg-[#DCEAF7] text-[#2C5379] font-medium text-lg"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[16px] text-[#1C1917]">{t(lang, 'Longest')}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const next = Math.max(minSec, maxSec - 1);
                              onRangeChange(Math.min(minSec, next), next);
                            }}
                            className="w-11 h-9 rounded-full bg-[#EAF2F9] hover:bg-[#DCEAF7] text-[#2C5379] font-medium text-lg"
                          >
                            −
                          </button>
                          <span className="w-14 text-center text-[16px] font-medium tabular-nums">
                            {t(lang, `${maxSec} s`)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = Math.min(15, maxSec + 1);
                              onRangeChange(minSec, next);
                            }}
                            className="w-11 h-9 rounded-full bg-[#EAF2F9] hover:bg-[#DCEAF7] text-[#2C5379] font-medium text-lg"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Your codes + Share + Support */}
              <div>
                <div className="px-1 mb-2 text-[12px] tracking-[0.12em] uppercase text-[#78716C]">
                  {t(lang, 'Your codes')}
                </div>
                <div className="rounded-[18px] bg-white border border-[#E7E5E4] p-4 space-y-3">
                  <p className="text-[15px] text-[#44403C]">
                    {t(
                      lang,
                      'Found some Nusuk codes? Add them to the shared list so everyone can use them.',
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('addKeys')}
                    className="px-4 py-2 min-h-[40px] rounded-full bg-[#EAF2F9] hover:bg-[#DCEAF7] text-[#2C5379] text-[15px] font-medium transition-colors"
                  >
                    {t(lang, 'Add your own codes')}
                  </button>
                </div>
              </div>

              <div>
                <div className="px-1 mb-2 text-[12px] tracking-[0.12em] uppercase text-[#78716C]">
                  {t(lang, 'Support')}
                </div>
                <div className="rounded-[18px] bg-white border border-[#E7E5E4] p-4 space-y-3">
                  <p className="text-[15px] text-[#44403C]">
                    {t(
                      lang,
                      'Something not working? Send a report with your app version, phone model and recent errors.',
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      onToast(
                        lang === 'bn'
                          ? 'ডিবাগ রিপোর্ট প্রস্তুত করা হয়েছে (App v2.1 · Web Preview)'
                          : 'Debug report prepared (App v2.1 · Web Preview)',
                      )
                    }
                    className="px-4 py-2 min-h-[40px] rounded-full bg-[#EAF2F9] hover:bg-[#DCEAF7] text-[#2C5379] text-[15px] font-medium transition-colors"
                  >
                    {t(lang, 'Share debug report')}
                  </button>
                </div>
              </div>
            </>
          )}

          {screen === 'addKeys' && (
            <>
              <div className="rounded-[18px] bg-white border border-[#E7E5E4] p-4 space-y-3.5">
                <p className="text-[15px] text-[#44403C] leading-relaxed">
                  {t(
                    lang,
                    'Paste your codes below, one or many, in any format. Codes look like NG-p36wAxup. We check each one and add the new ones to the shared list.',
                  )}
                </p>
                <textarea
                  rows={5}
                  value={keysInput}
                  onChange={(e) => setKeysInput(e.target.value)}
                  placeholder="NG-xxxxxxxx"
                  className="w-full rounded-xl bg-white border border-[#D6D3D1] p-3 text-[16px] font-mono-code text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#3A6A98]"
                />
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setKeysInput('NG-aB3dE9fG, NG-kL8mN2pQ\nNG-9kLm2QrT');
                    }}
                    className="px-4 py-2 min-h-[40px] rounded-full bg-[#EAF2F9] hover:bg-[#DCEAF7] text-[#2C5379] text-[15px] font-medium transition-colors"
                  >
                    {t(lang, 'Paste')}
                  </button>
                  <button
                    type="button"
                    onClick={handleParseAndAddKeys}
                    className="px-5 py-2 min-h-[40px] rounded-full bg-[#3E7CB1] hover:bg-[#356C9B] text-white text-[15px] font-medium transition-colors"
                  >
                    {t(lang, 'Add codes')}
                  </button>
                </div>
              </div>

              {parseResult && (
                <div className="space-y-3">
                  {parseResult.added.length > 0 && (
                    <div className="rounded-[18px] bg-white border border-[#E7E5E4] p-4">
                      <div className="text-[16px] font-medium text-[#15803D]">
                        {lang === 'bn'
                          ? `✓  ${toBnDigits(parseResult.added.length)}টা নতুন কোড অ্যাড হয়েছে। ধন্যবাদ!`
                          : `✓  ${parseResult.added.length} new code${parseResult.added.length === 1 ? '' : 's'} added. Thank you!`}
                      </div>
                      <pre className="mt-2 text-[14px] font-mono-code text-[#57534E] whitespace-pre-wrap">
                        {parseResult.added.join('\n')}
                      </pre>
                    </div>
                  )}
                  {parseResult.duplicate.length > 0 && (
                    <div className="rounded-[18px] bg-white border border-[#E7E5E4] p-4">
                      <div className="text-[16px] font-medium text-[#B45309]">
                        {lang === 'bn'
                          ? `＝  ${toBnDigits(parseResult.duplicate.length)}টা আগে থেকেই লিস্টে আছে`
                          : `＝  ${parseResult.duplicate.length} already in the list`}
                      </div>
                      <pre className="mt-2 text-[14px] font-mono-code text-[#57534E] whitespace-pre-wrap">
                        {parseResult.duplicate.join('\n')}
                      </pre>
                    </div>
                  )}
                  {parseResult.invalid.length > 0 && (
                    <div className="rounded-[18px] bg-white border border-[#E7E5E4] p-4">
                      <div className="text-[16px] font-medium text-[#B91C1C]">
                        {lang === 'bn'
                          ? `✗  ${toBnDigits(parseResult.invalid.length)}টা সঠিক কোড নয় (NG- আর ৮টা অক্ষর বা সংখ্যা)`
                          : `✗  ${parseResult.invalid.length} not a valid code (NG- and 8 letters or digits)`}
                      </div>
                      <pre className="mt-2 text-[14px] font-mono-code text-[#57534E] whitespace-pre-wrap">
                        {parseResult.invalid.join('\n')}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {screen === 'notifications' && (
            <>
              {notices.length === 0 ? (
                <div className="flex flex-col items-center text-center px-6 pt-14">
                  <div className="w-[76px] h-[76px] rounded-full bg-[#EAF2F9] flex items-center justify-center">
                    <Bell className="w-8 h-8 text-[#3A6A98]" />
                  </div>
                  <div className="mt-4 text-[18px] font-medium text-[#1C1917]">
                    {t(lang, 'No notifications yet')}
                  </div>
                  <p className="mt-1.5 text-[15px] text-[#78716C]">
                    {t(lang, 'News and updates we send from the server will be saved here.')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {notices.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-[18px] border p-4 flex items-start gap-3 ${
                        item.unread
                          ? 'bg-[#F0F7FC] border-[#9EC5E8]'
                          : 'bg-white border-[#E7E5E4]'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#EAF2F9] flex items-center justify-center shrink-0">
                        <Bell className="w-5 h-5 text-[#3A6A98]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[16px] font-medium text-[#1C1917]">{item.title}</div>
                        <p className="mt-1 text-[14px] text-[#44403C] leading-snug">{item.body}</p>
                        <div className="mt-2 text-[12px] text-[#78716C]">
                          {lang === 'bn' ? 'সাম্প্রতিক' : 'Recent'}
                          {item.url ? ` · ${t(lang, 'Tap to open')}` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {screen === 'developer' && (
            <>
              <div className="rounded-[18px] bg-white border border-[#E7E5E4] p-6 flex flex-col items-center text-center">
                {!avatarFailed ? (
                  <img
                    src={devAvatar}
                    alt="Jafran Hasan"
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarFailed(true)}
                    className="w-24 h-24 rounded-full object-cover border border-[#E7E5E4]"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[#EAF2F9] text-[#3A6A98] flex items-center justify-center text-2xl font-semibold">
                    JH
                  </div>
                )}
                <div className="mt-3.5 text-[22px] font-medium text-[#1C1917]">Jafran Hasan</div>
                <div className="mt-0.5 text-[15px] text-[#78716C]">
                  {t(lang, 'Developer of Nusuk Auto')}
                </div>
              </div>

              <div>
                <div className="px-1 mb-2 text-[12px] tracking-[0.12em] uppercase text-[#78716C]">
                  {t(lang, 'Connect')}
                </div>
                <div className="rounded-[18px] bg-white border border-[#E7E5E4] divide-y divide-[#F0EEEC]">
                  <a
                    href="https://www.facebook.com/jafranonline/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3.5 px-4 min-h-[64px] hover:bg-[#FAFAF9] transition-colors rounded-t-[18px]"
                  >
                    <Users className="w-5 h-5 text-[#3A6A98] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[16px] text-[#1C1917]">{t(lang, 'Facebook profile')}</div>
                      <div className="text-[14px] text-[#78716C] truncate">
                        facebook.com/jafranonline
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#A8A29E] shrink-0" />
                  </a>
                  <a
                    href="https://github.com/jafranonline"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3.5 px-4 min-h-[64px] hover:bg-[#FAFAF9] transition-colors"
                  >
                    <ExternalLink className="w-5 h-5 text-[#3A6A98] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[16px] text-[#1C1917]">{t(lang, 'GitHub')}</div>
                      <div className="text-[14px] text-[#78716C] truncate">
                        github.com/jafranonline
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#A8A29E] shrink-0" />
                  </a>
                  <a
                    href="https://jafran.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3.5 px-4 min-h-[64px] hover:bg-[#FAFAF9] transition-colors rounded-b-[18px]"
                  >
                    <Globe className="w-5 h-5 text-[#3A6A98] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[16px] text-[#1C1917]">{t(lang, 'Website')}</div>
                      <div className="text-[14px] text-[#78716C] truncate">jafran.dev</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#A8A29E] shrink-0" />
                  </a>
                </div>
              </div>

              <div>
                <div className="px-1 mb-2 text-[12px] tracking-[0.12em] uppercase text-[#78716C]">
                  {t(lang, 'About the app')}
                </div>
                <div className="rounded-[18px] bg-white border border-[#E7E5E4] p-4 space-y-2.5 text-[15px] text-[#44403C] leading-relaxed">
                  <p>
                    {t(
                      lang,
                      'Nusuk Auto is an unofficial helper made for Nusuk users. It is not connected to the Nusuk app or the Ministry of Hajj and Umrah.',
                    )}
                  </p>
                  <p>
                    {t(
                      lang,
                      'Questions, problems or ideas? Open Help for step-by-step fixes, or write in the Facebook group or to the developer.',
                    )}
                  </p>
                  <div className="pt-1 text-[14px] text-[#78716C] tabular-nums">
                    {t(lang, 'Version 2.1')}
                  </div>
                </div>
              </div>
            </>
          )}

          {screen === 'help' && (
            <div className="space-y-3">
              <div className="rounded-[18px] bg-white border border-[#E7E5E4] p-4 space-y-2">
                <div className="text-[16px] font-medium text-[#1C1917]">
                  {lang === 'bn'
                    ? '১. অ্যাক্সেসিবিলিটি সার্ভিস অন করা না গেলে?'
                    : '1. Can’t turn on Accessibility service?'}
                </div>
                <p className="text-[14px] text-[#44403C] leading-relaxed whitespace-pre-line">
                  {lang === 'bn'
                    ? 'Nusuk Auto-র সুইচ ধূসর হয়ে থাকলে বা "Restricted setting" দেখালে:\n\n১. "Open App info"-তে ট্যাপ করো\n২. ওপরে ডানে ৩ ডটে ট্যাপ করো\n৩. "Allow restricted settings"-এ ট্যাপ করো\n৪. ফিরে এসে অ্যাক্সেসিবিলিটিতে Nusuk Auto অন করো'
                    : 'If the Nusuk Auto switch is greyed out or shows "Restricted setting":\n\n1. Open App info\n2. Tap the 3 dots (top right)\n3. Tap "Allow restricted settings"\n4. Come back and turn on Nusuk Auto in Accessibility'}
                </p>
              </div>
              <div className="rounded-[18px] bg-white border border-[#E7E5E4] p-4 space-y-2">
                <div className="text-[16px] font-medium text-[#1C1917]">
                  {lang === 'bn'
                    ? '২. নুসুক অ্যাপ ইংরেজিতে রাখা জরুরি'
                    : '2. Keep Nusuk app in English'}
                </div>
                <p className="text-[14px] text-[#44403C] leading-relaxed">
                  {lang === 'bn'
                    ? 'নুসুক আরবিতে থাকলে অটোমেশন প্রশ্ন ও বাটন পড়তে পারবে না। নুসুকের ভাষা ইংরেজি করে তারপর Start চাপো।'
                    : 'If Nusuk is in Arabic, switch Nusuk to English before pressing Start in the floating widget.'}
                </p>
              </div>
              <a
                href="https://nusuk.minbars.net/help"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full min-h-[44px] rounded-xl bg-[#3A6A98] hover:bg-[#325C84] text-white text-[15px] font-medium transition-colors"
              >
                <span>{lang === 'bn' ? 'অনলাইন হেল্প পেজ দেখো' : 'Open nusuk.minbars.net/help'}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main Home Screen (activity_main.xml)
  return (
    <div className="flex flex-col h-full min-h-[640px] bg-[#F5F5F4] text-[#1C1917]">
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Compact Hero Header */}
        <div className="hero-gradient rounded-b-[24px] px-4 pt-3 pb-4 text-white shrink-0">
          <div className="flex items-center">
            <NusukLogo className="w-8 h-8 shrink-0" />
            <span className="ml-2.5 text-[18px] font-medium tracking-tight truncate">
              Nusuk Auto
            </span>
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleOpenNotifications}
              aria-label={t(lang, 'Notifications')}
              className="relative w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-white"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#DC2626] text-[10px] font-semibold text-white flex items-center justify-center tabular-nums">
                  {fmtNum(lang, unreadCount)}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              aria-label={t(lang, 'Settings')}
              className="ml-1.5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-white"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Strip */}
          <button
            type="button"
            onClick={() => onNavigate('stats')}
            aria-label={t(lang, 'Open statistics')}
            className="mt-3 w-full flex items-center text-left py-1 rounded-xl hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-white"
          >
            <div className="flex-1 pl-0.5">
              <div className="text-[30px] font-light leading-tight tabular-nums text-white">
                {fmtNum(lang, codesToday)}
              </div>
              <div className="text-[14px] text-white/75">{t(lang, 'Codes today')}</div>
            </div>
            <div className="w-px h-10 bg-white/20 mx-3 shrink-0" />
            <div className="flex-1 pl-1">
              <div className="text-[30px] font-light leading-tight tabular-nums text-white">
                {fmtNum(lang, quizToday)}
              </div>
              <div className="text-[14px] text-white/75">{t(lang, 'Quiz today')}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/80 shrink-0 mr-1" />
          </button>
        </div>

        {/* Main Content Stack */}
        <div className="px-4 pt-4 pb-6 space-y-3.5 flex-1">
          {/* Running Banner (only when automation is active) */}
          {overlay.running && (
            <div className="rounded-[18px] bg-[#ECFDF5] border border-[#6EE7B7] p-4 flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[16px] font-medium text-[#064E3B] truncate">
                  {t(lang, overlay.mode === 'QUIZ' ? 'Playing quiz' : 'Adding codes')}
                </div>
                <div className="text-[14px] text-[#78716C] truncate">
                  {t(lang, 'Running in the background')}
                </div>
              </div>
              <button
                type="button"
                onClick={onStopRunning}
                className="px-4 py-2 min-h-[38px] rounded-full bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[14px] font-medium whitespace-nowrap transition-colors"
              >
                {t(lang, 'Stop')}
              </button>
            </div>
          )}

          {/* Setup Required Banner (when a permission is off) */}
          {!allPermsReady && (
            <div className="rounded-[18px] bg-[#FFFBEB] border border-[#FCD34D] p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-[#92400E]">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span className="text-[17px] font-medium">{t(lang, 'Setup required')}</span>
              </div>
              <p className="text-[15px] text-[#78716C]">
                {t(lang, 'Finish setup to work inside Nusuk.')}
              </p>

              {!permissions.nusukInstalled && (
                <div className="flex items-center gap-2.5 pt-1">
                  <span className="w-2 h-2 rounded-full bg-[#DC2626] shrink-0" />
                  <span className="flex-1 text-[16px] text-[#1C1917]">
                    {t(lang, 'Nusuk app not installed')}
                  </span>
                  <button
                    type="button"
                    onClick={() => onFixPermission('nusukInstalled')}
                    className="px-4 py-1.5 min-h-[36px] rounded-full bg-[#059669] hover:bg-[#047857] text-white text-[14px] font-medium whitespace-nowrap transition-colors"
                  >
                    {t(lang, 'Install')}
                  </button>
                </div>
              )}

              {!permissions.accessibilityEnabled && (
                <div className="flex items-center gap-2.5 pt-1">
                  <span className="w-2 h-2 rounded-full bg-[#DC2626] shrink-0" />
                  <span className="flex-1 text-[16px] text-[#1C1917]">
                    {t(lang, 'Accessibility service')}
                  </span>
                  <button
                    type="button"
                    onClick={() => onFixPermission('accessibilityEnabled')}
                    className="px-4 py-1.5 min-h-[36px] rounded-full bg-[#059669] hover:bg-[#047857] text-white text-[14px] font-medium whitespace-nowrap transition-colors"
                  >
                    {t(lang, 'Enable')}
                  </button>
                </div>
              )}

              {!permissions.overlayAllowed && (
                <div className="flex items-center gap-2.5 pt-1">
                  <span className="w-2 h-2 rounded-full bg-[#DC2626] shrink-0" />
                  <span className="flex-1 text-[16px] text-[#1C1917]">
                    {t(lang, 'Floating overlay')}
                  </span>
                  <button
                    type="button"
                    onClick={() => onFixPermission('overlayAllowed')}
                    className="px-4 py-1.5 min-h-[36px] rounded-full bg-[#059669] hover:bg-[#047857] text-white text-[14px] font-medium whitespace-nowrap transition-colors"
                  >
                    {t(lang, 'Allow')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Auto Add Codes CTA Card */}
          <button
            type="button"
            onClick={() => onLaunchMode('CODES')}
            className="w-full rounded-[18px] bg-white border border-[#E7E5E4] hover:border-[#3A6A98]/40 px-4 py-5 flex items-center gap-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-[#3A6A98]"
          >
            <div className="w-11 h-11 flex items-center justify-center shrink-0">
              <AutoCodesIcon className="w-9 h-9" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[20px] font-medium text-[#1C1917] leading-tight">
                {t(lang, 'Auto Add Codes')}
              </div>
              <div className="mt-1 text-[15px] text-[#78716C] truncate">
                {t(lang, 'Enters Umrah codes for you')}
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#3A6A98] flex items-center justify-center shrink-0">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </button>

          {/* Auto Play Quiz CTA Card */}
          <button
            type="button"
            onClick={() => onLaunchMode('QUIZ')}
            className="w-full rounded-[18px] bg-white border border-[#E7E5E4] hover:border-[#3A6A98]/40 px-4 py-5 flex items-center gap-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-[#3A6A98]"
          >
            <div className="w-11 h-11 flex items-center justify-center shrink-0">
              <AutoQuizIcon className="w-9 h-9" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[20px] font-medium text-[#1C1917] leading-tight">
                {t(lang, 'Auto Play Quiz')}
              </div>
              <div className="mt-1 text-[15px] text-[#78716C] truncate">
                {t(lang, 'Answers the Nusuk quiz for you')}
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#3A6A98] flex items-center justify-center shrink-0">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </button>

          {/* Action Menu Card */}
          <div className="rounded-[18px] bg-white border border-[#E7E5E4] py-1 divide-y divide-[#F0EEEC]">
            <button
              type="button"
              onClick={() => onNavigate('addKeys')}
              className="w-full flex items-center gap-3.5 px-4 min-h-[60px] text-left hover:bg-[#FAFAF9] transition-colors rounded-t-[18px]"
            >
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5 text-[#1C1917]" />
              </div>
              <span className="flex-1 text-[16px] text-[#1C1917]">
                {t(lang, 'Add your own codes')}
              </span>
              <ChevronRight className="w-4 h-4 text-[#A8A29E] shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="w-full flex items-center gap-3.5 px-4 min-h-[60px] text-left hover:bg-[#FAFAF9] transition-colors"
            >
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <Settings className="w-5 h-5 text-[#1C1917]" />
              </div>
              <span className="flex-1 text-[16px] text-[#1C1917]">{t(lang, 'Settings')}</span>
              <ChevronRight className="w-4 h-4 text-[#A8A29E] shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('help')}
              className="w-full flex items-center gap-3.5 px-4 min-h-[60px] text-left hover:bg-[#FAFAF9] transition-colors"
            >
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5 text-[#059669]" />
              </div>
              <span className="flex-1 text-[16px] text-[#1C1917]">
                {t(lang, 'Help & guides')}
              </span>
              <ChevronRight className="w-4 h-4 text-[#A8A29E] shrink-0" />
            </button>

            <a
              href="https://www.facebook.com/groups/nusukauto/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3.5 px-4 min-h-[60px] text-left hover:bg-[#FAFAF9] transition-colors"
            >
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-[#3A6A98]" />
              </div>
              <span className="flex-1 text-[16px] text-[#1C1917]">
                {t(lang, 'Join our Facebook group')}
              </span>
              <ChevronRight className="w-4 h-4 text-[#A8A29E] shrink-0" />
            </a>

            <button
              type="button"
              onClick={handleShareApp}
              className="w-full flex items-center gap-3.5 px-4 min-h-[60px] text-left hover:bg-[#FAFAF9] transition-colors rounded-b-[18px]"
            >
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <Share2 className="w-5 h-5 text-[#1C1917]" />
              </div>
              <span className="flex-1 text-[16px] text-[#1C1917]">
                {t(lang, 'Share the app')}
              </span>
              <ChevronRight className="w-4 h-4 text-[#A8A29E] shrink-0" />
            </button>
          </div>

          {/* Al Fitan Promo Card */}
          <a
            href="https://alfitan.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="relative block overflow-hidden rounded-[20px] fitan-gradient border border-[#2D4A75] p-5 text-white hover:brightness-105 transition-all"
          >
            <div className="absolute -top-8 -right-8 opacity-35 pointer-events-none">
              <StarDeco className="w-28 h-28" />
            </div>
            <div className="text-[11px] tracking-[0.14em] uppercase text-[#E8C77A]">
              {t(lang, 'ALSO BY THE DEVELOPER')}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-[22px] font-medium text-white">{t(lang, 'Al Fitan')}</span>
              <span className="text-[24px] text-[#E8C77A]" aria-hidden="true">
                الفتن
              </span>
            </div>
            <p className="mt-2 pr-4 text-[15px] text-[#D5DDEA] leading-snug">
              {t(lang, 'The first and largest digital archive on Fitan and the end times.')}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-full bg-[#E8C77A] text-[#14284B] text-[14px] font-medium">
              <span>{t(lang, 'Visit alfitan.com')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </a>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex items-center justify-center gap-2 text-[14px]">
          <button
            type="button"
            onClick={() => onNavigate('developer')}
            className="min-h-[44px] px-2.5 text-[#78716C] hover:text-[#1C1917] transition-colors"
          >
            {t(lang, 'About developer')}
          </button>
          <span className="text-[#D6D3D1]" aria-hidden="true">
            ·
          </span>
          <button
            type="button"
            onClick={() => onToast(t(lang, 'You have the latest version'))}
            className="min-h-[44px] px-2.5 text-[#A8A29E] hover:text-[#78716C] tabular-nums transition-colors"
          >
            {t(lang, 'Version 2.1')}
          </button>
        </div>
      </div>
    </div>
  );
}
