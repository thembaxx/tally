'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import {
  HouseIcon,
  BookOpenIcon,
  ShapesIcon,
  UserIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  ArrowLeftIcon,
  GearSixIcon,
  PencilSimpleIcon,
  FireIcon,
  SparkleIcon,
  TargetIcon,
  CheckIcon,
  LockKeyIcon,
  ScalesIcon,
  ArrowsLeftRightIcon,
  ChartBarIcon,
  StackIcon,
  ClockIcon,
  LightningIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
  DownloadSimpleIcon,
  SpeakerHighIcon,
  VibrateIcon,
  PauseIcon,
  PlayIcon,
  XIcon,
  ArrowClockwiseIcon,
  GraduationCapIcon,
  TrophyIcon,
  CalendarDotsIcon,
  WifiSlashIcon,
  InfoIcon,
  ExportIcon,
  LeafIcon,
  CardsIcon,
  NotebookIcon,
  MagnifyingGlassIcon,
  PathIcon,
} from '@phosphor-icons/react';
import {
  initialProgress,
  lessons,
  localDay,
  streak,
  type Lesson,
  type Progress,
} from '@/lib/learning';
import { useTally, useFocus, useTheme } from './use-tally';
import { Logo, Blob } from './brand';
import { Modal } from './modal';
import { LessonPlayer } from './lesson-player';
import { Segmented, Switch } from './ui/controls';
import { MotionPage } from './motion-page';
import { PracticeStudio } from './practice-studio';
const Scene = dynamic(() => import('./scene'), {
  ssr: false,
  loading: () => <div className="scene scene-loading" />,
});
type Tab = 'home' | 'learn' | 'practice' | 'me';
type Review = { due: string; confidence: string; mistakes: number };
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
const navItems = [
  { id: 'home' as Tab, label: 'Home', icon: HouseIcon },
  { id: 'learn' as Tab, label: 'Learn', icon: BookOpenIcon },
  { id: 'practice' as Tab, label: 'Practice', icon: ShapesIcon },
  { id: 'me' as Tab, label: 'Me', icon: UserIcon },
];
function lessonIcon(icon: string, size = 25) {
  const studioIcons = {
    cards: CardsIcon,
    journal: NotebookIcon,
    detective: MagnifyingGlassIcon,
    flow: PathIcon,
  };
  if (icon in studioIcons) {
    const Icon = studioIcons[icon as keyof typeof studioIcons];
    return <Icon size={size} weight="duotone" />;
  }
  const Icon =
    icon === 'scale'
      ? ScalesIcon
      : icon === 'arrows'
        ? ArrowsLeftRightIcon
        : icon === 'chart'
          ? ChartBarIcon
          : icon === 'stack'
            ? StackIcon
            : icon === 'clock'
              ? ClockIcon
              : LockKeyIcon;
  return <Icon size={size} weight="duotone" />;
}
const enter = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45 },
};
export default function TallyApp() {
  const { progress: p, setProgress, ready, storageError, today } = useTally();
  const [tab, setTab] = useState<Tab>('home');
  const [settings, setSettings] = useState(false);
  const [active, setActive] = useState<Lesson | 'daily' | null>(null);
  const [onboarding, setOnboarding] = useState(false);
  const [onboardStep, setOnboardStep] = useState(0);
  const [draftName, setDraftName] = useState('');
  const [draftGoal, setDraftGoal] = useState(5);
  const [pending, setPending] = useState<Lesson | 'daily' | null>(null);
  const [toast, setToast] = useState('');
  const [filter, setFilter] = useState('all');
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [installInfo, setInstallInfo] = useState(false);
  const [online, setOnline] = useState(true);
  const [reset, setReset] = useState(false);
  const [reviews, setReviews] = useState<Record<string, Review>>({});
  const [about, setAbout] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const sw = useRef<ServiceWorkerRegistration | null>(null);
  const lessonLinkOpened = useRef(false);
  const showToast = useCallback((s: string) => setToast(s), []);
  const focus = useFocus(() => {
    const day = localDay();
    const alreadyEarned = p.focusDays.includes(day);
    showToast(
      alreadyEarned
        ? 'Five calm minutes. Nicely done. Your focus XP is already collected today.'
        : 'A little more focused. +10 XP earned.',
    );
    setProgress((old) =>
      old.focusDays.includes(day)
        ? old
        : {
            ...old,
            xp: old.xp + 10,
            focusDays: [...old.focusDays, day],
            activity: { ...old.activity, [day]: (old.activity[day] || 0) + 5 },
          },
    );
  });
  useTheme(p.theme, focus.active);
  useEffect(() => {
    if (!ready || lessonLinkOpened.current) return;
    lessonLinkOpened.current = true;
    const id = new URLSearchParams(location.search).get('lesson');
    const lesson = lessons.find((item) => item.id === id && !item.locked);
    if (!lesson) return;
    setTab('learn');
    if (p.onboarded) setActive(lesson);
    else {
      setPending(lesson);
      setDraftName(p.name);
      setDraftGoal(p.goal);
      setOnboardStep(0);
      setOnboarding(true);
    }
  }, [ready, p.onboarded, p.name, p.goal]);
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('tally-reviews-v1') || '{}');
      if (raw && typeof raw === 'object') {
        const safe = Object.fromEntries(
          Object.entries(raw).filter(
            ([id, v]) =>
              lessons.some((l) => l.id === id) &&
              v &&
              typeof v === 'object' &&
              'due' in v &&
              typeof v.due === 'string' &&
              /^\d{4}-\d{2}-\d{2}$/.test(v.due),
          ),
        );
        setReviews(safe as Record<string, Review>);
      }
    } catch {
      /* A fresh review schedule will be created. */
    }
    const params = new URLSearchParams(location.search);
    const t = params.get('tab');
    if (navItems.some((i) => i.id === t)) setTab(t as Tab);
    const pop = () => {
      const value = new URLSearchParams(location.search).get('tab');
      setTab(navItems.some((i) => i.id === value) ? (value as Tab) : 'home');
    };
    addEventListener('popstate', pop);
    return () => removeEventListener('popstate', pop);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 4800);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const capture = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallEvent);
    };
    const connected = () => setOnline(navigator.onLine);
    connected();
    addEventListener('beforeinstallprompt', capture);
    addEventListener('online', connected);
    addEventListener('offline', connected);
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          sw.current = reg;
          navigator.serviceWorker.ready.then(() => {
            const cacheSeen = () => {
              const urls = performance
                .getEntriesByType('resource')
                .map((e) => e.name)
                .filter((u) => u.includes('/_next/static/'));
              (navigator.serviceWorker.controller || reg.active)?.postMessage({
                type: 'CACHE_ASSETS',
                urls,
              });
            };
            cacheSeen();
            setTimeout(cacheSeen, 2500);
          });
          if (reg.waiting) setUpdateReady(true);
          reg.addEventListener('updatefound', () => {
            const next = reg.installing;
            next?.addEventListener('statechange', () => {
              if (next.state === 'installed' && navigator.serviceWorker.controller)
                setUpdateReady(true);
            });
          });
        })
        .catch(() =>
          showToast(
            'Offline support couldn’t start. Your learning progress is still saved on this device.',
          ),
        );
    }
    return () => {
      removeEventListener('beforeinstallprompt', capture);
      removeEventListener('online', connected);
      removeEventListener('offline', connected);
    };
  }, [showToast]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setSettings((v) => !v);
      }
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, []);
  function navigate(next: Tab) {
    setTab(next);
    const url = new URL(location.href);
    url.searchParams.delete('lesson');
    if (next === 'home') url.searchParams.delete('tab');
    else url.searchParams.set('tab', next);
    history.pushState({}, '', url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function patch(update: Partial<Progress>) {
    setProgress((v) => ({ ...v, ...update }));
  }
  function feedback(success: boolean) {
    if (p.haptics && 'vibrate' in navigator) navigator.vibrate(success ? [12, 35, 12] : 25);
    if (p.sound && success) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator(),
          gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(990, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.045, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.start();
        osc.stop(ctx.currentTime + 0.24);
        osc.onended = () => void ctx.close();
      } catch {
        /* Feedback remains visual. */
      }
    }
  }
  function launch(lesson: Lesson | 'daily') {
    if (lesson !== 'daily' && lesson.locked) {
      showToast('Cash Flow is coming soon. There’s plenty to discover in the meantime.');
      return;
    }
    if (!p.onboarded) {
      setPending(lesson);
      setDraftName(p.name);
      setDraftGoal(p.goal);
      setOnboardStep(0);
      setOnboarding(true);
    } else setActive(lesson);
  }
  function finishOnboarding() {
    patch({ name: draftName.trim(), goal: draftGoal, onboarded: true });
    setOnboarding(false);
    if (pending) setActive(pending);
  }
  function complete(mistakes: number, confidence: string) {
    const day = localDay();
    const daily = active === 'daily';
    const lesson = active !== 'daily' ? active : null;
    const amount = daily
      ? p.dailyRuns[day]
        ? 15
        : 90
      : p.completed.includes(lesson?.id || '')
        ? 10
        : 60;
    setProgress((old) => ({
      ...old,
      xp: old.xp + amount,
      completed:
        lesson && !old.completed.includes(lesson.id)
          ? [...old.completed, lesson.id]
          : old.completed,
      activity: {
        ...old.activity,
        [day]: (old.activity[day] || 0) + (daily ? 5 : lesson?.minutes || 4),
      },
      dailyRuns: daily ? { ...old.dailyRuns, [day]: (old.dailyRuns[day] || 0) + 1 } : old.dailyRuns,
    }));
    if (lesson) {
      const d = new Date();
      d.setDate(d.getDate() + (mistakes || confidence === 'Still learning' ? 1 : 3));
      const next = { ...reviews, [lesson.id]: { due: localDay(d), confidence, mistakes } };
      setReviews(next);
      try {
        localStorage.setItem('tally-reviews-v1', JSON.stringify(next));
      } catch {
        showToast('Review reminders are available for this visit. Device storage is full.');
      }
    }
    return amount;
  }
  async function installApp() {
    if (install) {
      await install.prompt();
      const choice = await install.userChoice;
      if (choice.outcome === 'accepted') {
        setInstall(null);
        showToast('Tally is getting a home on your device.');
      }
    } else setInstallInfo(true);
  }
  function exportProgress() {
    const blob = new BlobConstructor([JSON.stringify({ progress: p, reviews }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tally-progress.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Your learning progress has been exported.');
  }
  const count = p.completed.length;
  const nextLesson = lessons.find((l) => !l.locked && !p.completed.includes(l.id)) || lessons[0];
  const dayStreak = streak(p.activity, today);
  const due = lessons.filter((l) => reviews[l.id] && reviews[l.id].due <= today);
  const todayMinutes = p.activity[today] || 0;
  const level = Math.floor(p.xp / 200) + 1;
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${today}T12:00:00`);
    d.setDate(d.getDate() - 6 + i);
    return {
      key: localDay(d),
      label: d.toLocaleDateString('en', { weekday: 'narrow' }),
      full: d.toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' }),
    };
  });
  return (
    <MotionConfig reducedMotion="user">
      <div className={`app ${focus.active ? 'is-focusing' : ''}`}>
        <a href="#main" className="skip-link">
          Skip to learning
        </a>
        <aside className="sidebar">
          <button className="brand-button" onClick={() => navigate('home')} aria-label="Tally home">
            <Logo />
          </button>
          <div className="sidebar-caption">YOUR LITTLE LEARNING SPACE</div>
          <nav className="main-nav" aria-label="Main navigation">
            {navItems.map((item) => (
              <button
                key={item.id}
                aria-label={item.label}
                className={tab === item.id ? 'active' : ''}
                aria-current={tab === item.id ? 'page' : undefined}
                onClick={() => navigate(item.id)}
              >
                {tab === item.id && (
                  <motion.span
                    layoutId="nav-pill"
                    className="nav-pill"
                    transition={{ type: 'spring', stiffness: 440, damping: 32 }}
                  />
                )}
                <item.icon weight={tab === item.id ? 'fill' : 'regular'} size={22} />
                <span>{item.label}</span>
                {item.id === 'practice' && due.length > 0 && <i className="nav-notification" />}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-mascot">
              <Blob />
              <p>
                Big things start
                <br />
                with little steps.
              </p>
              <span>A little better, every day.</span>
            </div>
            <button onClick={() => setSettings(true)} className="sidebar-settings">
              <GearSixIcon size={21} /> Settings <span>⌘ ,</span>
            </button>
            <button className="install-link" onClick={installApp}>
              <DownloadSimpleIcon /> Take Tally with you <ArrowUpRightIcon />
            </button>
          </div>
        </aside>
        <div className="content-shell" inert={!ready} aria-busy={!ready}>
          <header className="topbar">
            <button
              className="mobile-brand brand-button"
              onClick={() => navigate('home')}
              aria-label="Tally home"
            >
              <Logo />
            </button>
            <div className="breadcrumb">
              Your space <span>/</span> <strong>{navItems.find((n) => n.id === tab)?.label}</strong>
            </div>
            <div className="header-actions">
              <div className="streak-chip" title={`${dayStreak} day learning streak`}>
                <FireIcon weight="fill" size={19} />
                <span className="mono">{dayStreak}</span>
                <span className="desktop-label"> day streak</span>
              </div>
              <div className="xp-chip">
                <SparkleIcon weight="fill" />
                <span className="mono">{p.xp}</span> XP
              </div>
              <button
                className="icon-button settings-trigger"
                onClick={() => setSettings(true)}
                aria-label="Open settings"
              >
                <GearSixIcon size={23} />
              </button>
              <button className="avatar" onClick={() => navigate('me')} aria-label="My profile">
                {p.name ? p.name[0].toUpperCase() : <UserIcon size={22} />}
                <span />
              </button>
            </div>
          </header>
          {!online && (
            <div className="connection-banner" role="status">
              <WifiSlashIcon /> You’re offline. Keep learning—your progress stays on this device.
            </div>
          )}
          {storageError && (
            <div className="connection-banner" role="status">
              Your browser can’t save progress. You can learn now and export your progress in
              Settings.
            </div>
          )}
          {updateReady && (
            <div className="connection-banner">
              A fresh Tally is ready.
              <button
                onClick={() => {
                  sw.current?.waiting?.postMessage('SKIP_WAITING');
                  navigator.serviceWorker.addEventListener(
                    'controllerchange',
                    () => location.reload(),
                    { once: true },
                  );
                }}
              >
                Update app <ArrowClockwiseIcon />
              </button>
            </div>
          )}
          <main id="main" className="main-content">
            <AnimatePresence mode="wait">
              <MotionPage key={tab} ready={ready} revealKey={tab === 'learn' ? filter : tab}>
                {tab === 'home' ? (
                  <>
                    <section className="page-heading">
                      <div>
                        <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
                        <h1>
                          {p.name ? `A little wiser, ${p.name}.` : 'Hey, future numbers person.'}
                          <SparkleIcon className="greeting-spark" weight="duotone" />
                        </h1>
                        <p>Learn accounting through tiny, satisfying discoveries.</p>
                      </div>
                      <div className="date-display">
                        <CalendarDotsIcon size={18} />
                        {ready
                          ? new Date(`${today}T12:00:00`).toLocaleDateString('en', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'A new day to learn'}
                      </div>
                    </section>
                    <div className="welcome-grid">
                      <section className="hero-card">
                        <div className="hero-text">
                          <span className="hero-tag">
                            <span /> YOUR DAILY DOSE OF “I GET IT”
                          </span>
                          <h2>
                            Small steps.
                            <br />
                            <span>
                              Big “aha!”
                              <br className="desktop-break" /> energy.
                            </span>
                          </h2>
                          <p>
                            Make sense of money.
                            <br />
                            Have a little fun figuring it out.
                          </p>
                          <button className="button dark" onClick={() => launch(nextLesson)}>
                            {count ? 'Continue learning' : 'Let’s make it click'}
                            <ArrowRightIcon />
                          </button>
                          <div className="hero-footnote">
                            <ClockIcon /> {nextLesson.minutes} minutes · at your pace
                          </div>
                        </div>
                        <div className="hero-visual">
                          <span className="hero-orbit" aria-hidden="true" />
                          <span className="floating-equation mono">A = L + E</span>
                          <Scene />
                          <span className="scene-hint">
                            <span className="tiny-dot" /> A little balance goes a long way
                          </span>
                          <span className="orbit-dot one" />
                          <span className="orbit-dot two" />
                        </div>
                      </section>
                      <section className="daily-card">
                        <div className="daily-card-top">
                          <span className="pill">
                            <LightningIcon weight="fill" /> THE DAILY MIX
                          </span>
                          <span className="daily-orbit">
                            <SparkleIcon size={24} weight="duotone" />
                          </span>
                        </div>
                        <h2>
                          Three tiny challenges.
                          <br />
                          One happy brain.
                        </h2>
                        <p>
                          A fresh mix to stretch your
                          <br className="desktop-break" /> accounting brain.
                        </p>
                        <div className="daily-steps">
                          <span>
                            <ScalesIcon size={23} weight="duotone" />
                            <small>Sort it</small>
                          </span>
                          <i />
                          <span>
                            <ArrowsLeftRightIcon size={23} weight="duotone" />
                            <small>Type it</small>
                          </span>
                          <i />
                          <span>
                            <StackIcon size={23} weight="duotone" />
                            <small>Build it</small>
                          </span>
                        </div>
                        <button className="button daily-button" onClick={() => launch('daily')}>
                          {p.dailyRuns[today] ? 'Play it again' : 'Take the challenge'}
                          <ArrowUpRightIcon />
                        </button>
                        <div className="daily-reward">
                          <span>
                            <SparkleIcon weight="fill" /> +{p.dailyRuns[today] ? 15 : 90} XP
                          </span>
                          <span>~5 min · no pressure</span>
                        </div>
                      </section>
                    </div>
                    <section className="learning-section">
                      <div className="section-heading">
                        <div>
                          <span className="eyebrow">BUILD YOUR FOUNDATION</span>
                          <h2>Your next “aha!” moment</h2>
                        </div>
                        <button className="text-button" onClick={() => navigate('learn')}>
                          Explore the path <ArrowRightIcon />
                        </button>
                      </div>
                      <div className="lesson-grid">
                        {lessons.slice(0, 3).map((l, i) => (
                          <LessonCard
                            key={l.id}
                            lesson={l}
                            index={i}
                            completed={p.completed.includes(l.id)}
                            onClick={() => launch(l)}
                          />
                        ))}
                      </div>
                    </section>
                    <div className="home-bottom">
                      <section className="weekly-card">
                        <div className="section-heading">
                          <div>
                            <h2>A little consistency, a lot of growth.</h2>
                            <p>Every small step counts. This is your week.</p>
                          </div>
                          <span className="week-total mono">
                            {week.reduce((sum, d) => sum + (p.activity[d.key] || 0), 0)}
                            <small> min</small>
                          </span>
                        </div>
                        <div className="week-days">
                          {week.map((d) => (
                            <div className={d.key === today ? 'today' : ''} key={d.key}>
                              <span>{d.label}</span>
                              <div
                                title={`${d.full}: ${p.activity[d.key] || 0} minutes`}
                                className={`day-circle ${p.activity[d.key] ? 'complete' : ''}`}
                              >
                                {p.activity[d.key] ? (
                                  <CheckIcon weight="bold" />
                                ) : d.key === today ? (
                                  <span className="today-dot" />
                                ) : (
                                  <span className="empty-dot" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="goal-caption">
                          <span>
                            {todayMinutes >= p.goal
                              ? 'Your daily goal? Beautifully done.'
                              : `${todayMinutes} of ${p.goal} minutes today. Your future self says thanks.`}
                          </span>
                          <span className="mono">
                            {Math.min(100, Math.round((todayMinutes / p.goal) * 100))}%
                          </span>
                        </div>
                        <div className="thin-progress">
                          <div
                            style={{ width: `${Math.min(100, (todayMinutes / p.goal) * 100)}%` }}
                          />
                        </div>
                      </section>
                      <section className="focus-card">
                        <div className="focus-title">
                          <span className="focus-icon">
                            <TargetIcon size={22} weight="duotone" />
                          </span>
                          <span>
                            Less noise.
                            <br />
                            <strong>More you.</strong>
                          </span>
                          <Switch
                            checked={focus.active}
                            onChange={(v) => (v ? focus.start() : focus.stop())}
                            label="Focus mode"
                          />
                        </div>
                        <p>
                          A calm space. Five minutes.
                          <br />
                          One thing at a time.
                        </p>
                        <button
                          className="text-button"
                          onClick={() => (focus.active ? focus.stop() : focus.start())}
                        >
                          {focus.active ? 'Leave focus mode' : 'Find your focus'} <ArrowRightIcon />
                        </button>
                        <span className="focus-decoration" />
                      </section>
                    </div>
                    <button className="studio-invitation" onClick={() => navigate('practice')}>
                      <span className="invitation-cards">
                        <CardsIcon size={26} weight="duotone" />
                      </span>
                      <span>
                        <strong>A different kind of brain break.</strong>
                        <small>Build an entry, play detective, or turn a card.</small>
                      </span>
                      <ArrowUpRightIcon size={22} />
                    </button>
                    <div className="billi-note">
                      <Blob small />
                      <p>
                        <strong>A little note from Tali</strong>“An asset is just something that
                        helps your business do its thing. Even a lemonade stand has them.”
                      </p>
                      <button
                        className="icon-button"
                        aria-label="Learn about assets"
                        onClick={() => launch(lessons[0])}
                      >
                        <ArrowUpRightIcon size={22} />
                      </button>
                    </div>
                  </>
                ) : tab === 'learn' ? (
                  <>
                    <PageHeading
                      eyebrow="UNDERSTANDING STARTS WITH CURIOSITY"
                      title="Little steps. Lasting skills."
                      description="From your first equation to the stories behind the statements. Go at your pace."
                    />
                    <div className="path-summary">
                      <div className="path-progress">
                        <GraduationCapIcon size={30} weight="duotone" />
                        <div>
                          <h3>Your accounting journey</h3>
                          <p>
                            {count} of {lessons.filter((l) => !l.locked).length} lessons explored
                          </p>
                        </div>
                      </div>
                      <span className="mono">
                        {Math.round((count / lessons.filter((l) => !l.locked).length) * 100)}%
                      </span>
                      <div className="thin-progress">
                        <div
                          style={{
                            width: `${(count / lessons.filter((l) => !l.locked).length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="learn-toolbar">
                      <Segmented
                        label="Lesson level"
                        items={[
                          { id: 'all', label: 'All lessons' },
                          { id: 'Foundations', label: 'Basics' },
                          { id: 'Next level', label: 'Next level' },
                          { id: 'Going deeper', label: 'Deeper' },
                        ]}
                        value={filter}
                        onChange={setFilter}
                      />
                      <span className="fine">No rush. No finish line.</span>
                    </div>
                    {['Foundations', 'Next level', 'Going deeper']
                      .filter((g) => filter === 'all' || filter === g)
                      .map((group) => (
                        <section className="path-section" key={group}>
                          <div className="section-heading">
                            <div>
                              <span className="eyebrow">
                                {group.toUpperCase()} ·{' '}
                                {lessons.filter((l) => l.level === group).length} LESSONS
                              </span>
                              <h2>
                                {group === 'Foundations'
                                  ? 'First, find your footing.'
                                  : group === 'Next level'
                                    ? 'Now, connect the dots.'
                                    : 'Think like an accountant.'}
                              </h2>
                              <p>
                                {group === 'Foundations'
                                  ? 'Every great accountant started right here.'
                                  : group === 'Next level'
                                    ? 'Make the leap from recording numbers to understanding them.'
                                    : 'Explore decisions, timing, and the bigger financial picture.'}
                              </p>
                            </div>
                            <span className="chapter-tag">
                              {group === 'Foundations' ? 'START HERE' : 'A LITTLE DEEPER'}
                            </span>
                          </div>
                          <div className="lesson-grid">
                            {lessons
                              .filter((l) => l.level === group)
                              .map((l, i) => (
                                <LessonCard
                                  key={l.id}
                                  lesson={l}
                                  index={i}
                                  completed={p.completed.includes(l.id)}
                                  onClick={() => launch(l)}
                                />
                              ))}
                          </div>
                        </section>
                      ))}
                    <div className="tutor-tip wide-tip">
                      <Blob small />
                      <p>
                        You can explore any open lesson. If an idea feels new, come back to the
                        foundations for a little boost.
                      </p>
                    </div>
                  </>
                ) : tab === 'practice' ? (
                  <>
                    <PageHeading
                      eyebrow="MAKE IT STICK"
                      title="Make a little room for play."
                      description="Different ways to learn. The same lovely feeling when it clicks."
                    />
                    <div className="practice-hero">
                      <div>
                        <span className="pill">
                          <LightningIcon weight="fill" /> TODAY’S DAILY MIX
                        </span>
                        <h2>
                          Find your
                          <br />
                          learning groove.
                        </h2>
                        <p>
                          Sort, type, and build. Three different ways
                          <br />
                          to make accounting feel second nature.
                        </p>
                        <button className="button dark" onClick={() => launch('daily')}>
                          {p.dailyRuns[today] ? 'Try today’s mix again' : 'Let’s play'}{' '}
                          <ArrowRightIcon />
                        </button>
                      </div>
                      <Scene kind="tower" order={['Sort', 'Type', 'Build', 'Understand']} />
                    </div>
                    <PracticeStudio onLaunch={launch} completed={p.completed} />
                    <section className="path-section">
                      <div className="section-heading">
                        <div>
                          <span className="eyebrow">YOUR MEMORY, A LITTLE STRONGER</span>
                          <h2>
                            {due.length ? 'Ready for a little refresh?' : 'Your review space'}
                          </h2>
                          <p>
                            Revisit ideas after a little time away. That’s when the learning sticks.
                          </p>
                        </div>
                        <span className="count-badge mono">{due.length} DUE</span>
                      </div>
                      {p.completed.length ? (
                        <div className="review-list">
                          {lessons
                            .filter((l) => p.completed.includes(l.id))
                            .sort((a, b) =>
                              (reviews[a.id]?.due || '').localeCompare(reviews[b.id]?.due || ''),
                            )
                            .map((l) => (
                              <button key={l.id} className="review-row" onClick={() => launch(l)}>
                                <span className={`lesson-icon ${l.color}`}>
                                  {lessonIcon(l.icon)}
                                </span>
                                <span>
                                  <strong>{l.title}</strong>
                                  <small>
                                    {reviews[l.id]?.due <= today
                                      ? 'Ready to revisit'
                                      : reviews[l.id]?.due
                                        ? `Next gentle review: ${new Date(reviews[l.id].due + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })}`
                                        : 'Practice whenever you like'}
                                  </small>
                                </span>
                                <span className="review-status">
                                  {reviews[l.id]?.confidence || 'Keep growing'}
                                </span>
                                <ArrowRightIcon />
                              </button>
                            ))}
                        </div>
                      ) : (
                        <div className="empty-review">
                          <span className="empty-icon">
                            <LeafIcon size={35} weight="duotone" />
                          </span>
                          <h3>A little learning goes a long way.</h3>
                          <p>
                            Finish your first lesson and I’ll build you a gentle review rhythm.
                            <br />
                            Come back tomorrow to help the new ideas take root.
                          </p>
                          <button className="text-button" onClick={() => launch(lessons[0])}>
                            Find your first lightbulb moment <ArrowRightIcon />
                          </button>
                        </div>
                      )}
                    </section>
                    <div className="billi-note">
                      <Blob small />
                      <p>
                        <strong>Trying to remember is the practice.</strong>A little effort is good.
                        If you get stuck, ask for a nudge. No hearts lost, no pressure added.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <PageHeading
                      eyebrow="LOOK HOW YOU’RE GROWING"
                      title="Your little corner of Tally."
                      description="Every attempt, every discovery. It all adds up."
                    />
                    <section className="profile-card">
                      <div className="profile-avatar">
                        <Blob happy />
                      </div>
                      <div>
                        <span className="eyebrow">CURIOUS MIND · LEVEL {level}</span>
                        <h2>{p.name || 'A future numbers person'}</h2>
                        <p>
                          {count
                            ? 'Building a little confidence, every day.'
                            : 'Your accounting story is just beginning.'}
                        </p>
                      </div>
                      <button
                        className="icon-button"
                        aria-label="Edit profile"
                        onClick={() => setSettings(true)}
                      >
                        <PencilSimpleIcon size={22} />
                      </button>
                    </section>
                    <div className="stats-grid">
                      <Stat
                        icon={<SparkleIcon weight="duotone" />}
                        value={p.xp}
                        label="Total XP"
                        color="lavender"
                      />
                      <Stat
                        icon={<FireIcon weight="duotone" />}
                        value={dayStreak}
                        label="Day streak"
                        color="peach"
                      />
                      <Stat
                        icon={<BookOpenIcon weight="duotone" />}
                        value={count}
                        label="Lessons explored"
                        color="mint"
                      />
                      <Stat
                        icon={<TargetIcon weight="duotone" />}
                        value={p.focusDays.length}
                        label="Focus sessions"
                        color="butter"
                      />
                    </div>
                    <section className="badges-section">
                      <div className="section-heading">
                        <div>
                          <span className="eyebrow">LITTLE MILESTONES, BIG FEELINGS</span>
                          <h2>A few things to be proud of.</h2>
                        </div>
                      </div>
                      <div className="badges">
                        {[
                          {
                            title: 'First Light',
                            sub: 'Finish your first lesson',
                            icon: SparkleIcon,
                            earned: count >= 1,
                            color: 'butter',
                          },
                          {
                            title: 'Finding Balance',
                            sub: 'Complete The Equation',
                            icon: ScalesIcon,
                            earned: p.completed.includes('equation'),
                            color: 'lavender',
                          },
                          {
                            title: 'Showing Up',
                            sub: 'Build a 3-day streak',
                            icon: FireIcon,
                            earned: dayStreak >= 3,
                            color: 'peach',
                          },
                          {
                            title: 'Deep Thinker',
                            sub: 'Finish a focus session',
                            icon: TargetIcon,
                            earned: p.focusDays.length > 0,
                            color: 'mint',
                          },
                          {
                            title: 'Foundation Pro',
                            sub: 'Finish all 3 foundations',
                            icon: TrophyIcon,
                            earned: lessons.slice(0, 3).every((l) => p.completed.includes(l.id)),
                            color: 'blue',
                          },
                        ].map((b) => (
                          <div
                            className={`badge-item ${b.earned ? 'earned' : 'unearned'}`}
                            key={b.title}
                          >
                            <div className={`hex-badge ${b.color}`}>
                              <b.icon size={37} weight="duotone" />
                              {!b.earned && (
                                <LockKeyIcon className="badge-lock" weight="fill" size={14} />
                              )}
                            </div>
                            <strong>{b.title}</strong>
                            <span>{b.sub}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )}
                <footer className="page-footer">
                  <span>
                    <Logo /> <span>A little better, every day.</span>
                  </span>
                  <a className="public-guides-link" href="/learn">
                    Learn accounting · Free guides
                  </a>
                  <button onClick={() => setAbout(true)}>
                    Made for curious minds <ArrowUpRightIcon />
                  </button>
                </footer>
              </MotionPage>
            </AnimatePresence>
          </main>
        </div>
        <AnimatePresence>
          {focus.active && (
            <motion.div
              className="focus-bar"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
            >
              <span className="breathing-dot" />
              <div>
                <strong>A little room to focus.</strong>
                <span>
                  {focus.paused ? 'Paused. Your time is yours.' : 'One calm moment at a time.'}
                </span>
              </div>
              <span className="focus-time mono">
                {Math.floor(Math.ceil(focus.remaining) / 60)
                  .toString()
                  .padStart(2, '0')}
                :{(Math.ceil(focus.remaining) % 60).toString().padStart(2, '0')}
              </span>
              <button
                aria-label={focus.paused ? 'Resume focus timer' : 'Pause focus timer'}
                className="icon-button"
                onClick={focus.togglePause}
              >
                {focus.paused ? <PlayIcon weight="fill" /> : <PauseIcon weight="fill" />}
              </button>
              <button className="icon-button" aria-label="End focus session" onClick={focus.stop}>
                <XIcon />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <Modal
          open={!!active}
          onClose={() => setActive(null)}
          title={active === 'daily' ? 'The Daily Mix' : active?.title || 'Your lesson'}
          wide
        >
          {active && (
            <LessonPlayer
              key={active === 'daily' ? `daily-${today}` : active.id}
              lesson={active}
              day={today}
              onComplete={complete}
              onClose={() => setActive(null)}
              onFocus={() => {
                focus.start();
                showToast('Focus is on. Take a breath, then take your next step.');
              }}
              feedback={feedback}
            />
          )}
        </Modal>
        <Modal
          open={onboarding}
          onClose={() => setOnboarding(false)}
          title="A little hello."
          description="Let’s make this your kind of learning."
        >
          <div className="onboarding">
            <div className="onboarding-dots">
              {[0, 1, 2].map((i) => (
                <span key={i} className={i === onboardStep ? 'active' : ''} />
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={onboardStep} {...enter}>
                {onboardStep === 0 ? (
                  <>
                    <Blob happy />
                    <h2>
                      Numbers are for everyone.
                      <br />
                      You included.
                    </h2>
                    <p>
                      I’m Tali, your little learning companion. We’ll turn big accounting ideas into
                      small, satisfying discoveries.
                    </p>
                    <label htmlFor="first-name">
                      What should I call you? <span className="muted">(optional)</span>
                    </label>
                    <input
                      id="first-name"
                      maxLength={30}
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      placeholder="Your first name"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setOnboardStep(1);
                      }}
                    />
                  </>
                ) : onboardStep === 1 ? (
                  <>
                    <span className="onboarding-symbol">
                      <ClockIcon size={48} weight="duotone" />
                    </span>
                    <h2>
                      A little time,
                      <br />
                      just for you.
                    </h2>
                    <p>
                      Choose a daily rhythm. You can change it anytime. There’s no penalty for
                      taking a break.
                    </p>
                    <div className="goal-options">
                      {[
                        { n: 3, title: 'A tiny spark', sub: 'Just getting curious' },
                        { n: 5, title: 'A steady glow', sub: 'A little every day' },
                        { n: 10, title: 'A brighter light', sub: 'Room to go deeper' },
                      ].map((g) => (
                        <button
                          key={g.n}
                          className={draftGoal === g.n ? 'selected' : ''}
                          onClick={() => setDraftGoal(g.n)}
                        >
                          <span>
                            <strong>{g.title}</strong>
                            <small>{g.sub}</small>
                          </span>
                          <span className="mono">
                            {g.n} min {draftGoal === g.n && <CheckIcon />}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="onboarding-symbol">
                      <ScalesIcon size={48} weight="duotone" />
                    </span>
                    <h2>
                      See it. Try it.
                      <br />
                      Make it click.
                    </h2>
                    <p>
                      Play with the idea, try an answer, and discover why it works. Mistakes are
                      welcome here. Hints, too.
                    </p>
                    <div className="onboarding-promises">
                      <span>
                        <CheckIcon /> Clear, everyday examples
                      </span>
                      <span>
                        <CheckIcon /> Playful practice, at your pace
                      </span>
                      <span>
                        <CheckIcon /> Gentle reviews to make it stick
                      </span>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
            <button
              className="button primary full"
              onClick={() =>
                onboardStep < 2 ? setOnboardStep(onboardStep + 1) : finishOnboarding()
              }
            >
              {onboardStep === 2
                ? 'Let’s find your first lightbulb moment'
                : 'A little more about you'}
              <ArrowRightIcon />
            </button>
            {onboardStep > 0 && (
              <button className="text-button" onClick={() => setOnboardStep(onboardStep - 1)}>
                <ArrowLeftIcon /> Back
              </button>
            )}
          </div>
        </Modal>
        <Modal
          open={settings}
          onClose={() => {
            setSettings(false);
            setReset(false);
          }}
          title="Settings"
          description="Make Tally work your way."
        >
          <div className="settings-body">
            <h3 className="settings-section-title">Profile</h3>
            <label htmlFor="profile-name">
              Your name
              <input
                id="profile-name"
                value={p.name}
                maxLength={30}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="What should we call you?"
              />
            </label>
            <h3 className="settings-section-title">Appearance</h3>
            <p className="settings-section-note">
              {focus.active
                ? 'Focus is keeping things calm and dark.'
                : 'Follow your system, or set your own mood.'}
            </p>
            <Segmented
              label="Choose theme"
              value={p.theme}
              onChange={(v) => patch({ theme: v as Progress['theme'] })}
              items={[
                { id: 'system', label: 'System', icon: <MonitorIcon /> },
                { id: 'light', label: 'Light', icon: <SunIcon /> },
                { id: 'dark', label: 'Dark', icon: <MoonIcon /> },
              ]}
            />
            <h3 className="settings-section-title">Learning</h3>
            <div className="setting-row">
              <span>
                <strong>
                  <TargetIcon /> Daily rhythm
                </strong>
                <small>A gentle goal, never a deadline.</small>
              </span>
              <select
                aria-label="Daily goal"
                value={p.goal}
                onChange={(e) => patch({ goal: Number(e.target.value) })}
              >
                {[3, 5, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} minutes
                  </option>
                ))}
              </select>
            </div>
            <h3 className="settings-section-title">Feedback</h3>
            <div className="setting-row">
              <span>
                <strong>
                  <VibrateIcon /> Little haptics
                </strong>
                <small>A little tap when something clicks, on supported phones.</small>
              </span>
              <Switch
                checked={p.haptics}
                onChange={(v) => patch({ haptics: v })}
                label="Haptic feedback"
              />
            </div>
            <div className="setting-row">
              <span>
                <strong>
                  <SpeakerHighIcon /> Sounds of progress
                </strong>
                <small>A soft chime for your lightbulb moments.</small>
              </span>
              <Switch
                checked={p.sound}
                onChange={(v) => patch({ sound: v })}
                label="Sound effects"
              />
            </div>
            <h3 className="settings-section-title">App &amp; data</h3>
            <div className="setting-row">
              <span>
                <strong>
                  <DownloadSimpleIcon /> A home on your home screen
                </strong>
                <small>Open faster. Learn offline after your first visit.</small>
              </span>
              <button className="small-button" onClick={installApp}>
                Install
              </button>
            </div>
            <div className="settings-links">
              <button onClick={exportProgress}>
                <ExportIcon /> Export my progress <ArrowUpRightIcon />
              </button>
              <button
                onClick={() => {
                  setSettings(false);
                  setPending(null);
                  setDraftName(p.name);
                  setDraftGoal(p.goal);
                  setOnboardStep(0);
                  setOnboarding(true);
                }}
              >
                <SparkleIcon /> Meet Tali again <ArrowRightIcon />
              </button>
              <button
                onClick={() => {
                  setSettings(false);
                  setAbout(true);
                }}
              >
                <InfoIcon /> How learning works <ArrowRightIcon />
              </button>
            </div>
            <div className="privacy-note">
              <LockKeyIcon /> Your progress lives on this device. No account, no tracking.
            </div>
            {reset ? (
              <div className="reset-confirm">
                <p>Start over? This clears your XP, lessons, and streak on this device.</p>
                <button
                  className="small-button"
                  onClick={() => {
                    setProgress({ ...initialProgress, theme: p.theme });
                    setReviews({});
                    localStorage.removeItem('tally-reviews-v1');
                    setReset(false);
                    showToast('A fresh page. Your next chapter is waiting.');
                  }}
                >
                  Yes, start fresh
                </button>
                <button className="text-button" onClick={() => setReset(false)}>
                  Keep my progress
                </button>
              </div>
            ) : (
              <button className="reset-link" onClick={() => setReset(true)}>
                Start a fresh chapter
              </button>
            )}
          </div>
        </Modal>
        <Modal
          open={installInfo}
          onClose={() => setInstallInfo(false)}
          title="Take a little learning with you."
        >
          <div className="install-instructions">
            <DownloadSimpleIcon size={45} weight="duotone" />
            <p>
              On iPhone or iPad, open Tally in Safari, tap <strong>Share</strong>, then{' '}
              <strong>Add to Home Screen</strong>.
            </p>
            <p>
              On Android or desktop, open your browser menu and choose <strong>Install app</strong>{' '}
              or <strong>Add to Home Screen</strong>.
            </p>
            <div className="tutor-tip">
              Visit once online to save lessons for offline learning. Installation depends on your
              browser.
            </div>
            <button className="button primary full" onClick={() => setInstallInfo(false)}>
              Got it <CheckIcon />
            </button>
          </div>
        </Modal>
        <Modal
          open={about}
          onClose={() => setAbout(false)}
          title="A tutor with a little patience."
          description="Built for understanding, one discovery at a time."
        >
          <div className="about-learning">
            <Blob small />
            <p>
              Tally uses familiar examples, visual models, active recall, and gentle spaced review.
              You try an idea, get specific feedback, then revisit it after a break.
            </p>
            <ul>
              <li>
                <strong>See the idea.</strong> A worked example makes a new concept concrete.
              </li>
              <li>
                <strong>Try it yourself.</strong> Sort, type, or build before checking your answer.
              </li>
              <li>
                <strong>Understand why.</strong> Feedback explains the reasoning. Hints help without
                penalties.
              </li>
              <li>
                <strong>Make it stick.</strong> Explain it in your own words. Reviews return after 1
                or 3 days, based on your experience.
              </li>
            </ul>
            <p>
              This is a guided learning app with authored lessons. Progress records practice and
              confidence; it isn’t a formal proficiency assessment.
            </p>
            <a
              href="https://www.learningscientists.org/blog/2019/11/28-1"
              target="_blank"
              rel="noreferrer"
            >
              Explore the learning science <ArrowUpRightIcon />
            </a>
          </div>
        </Modal>
        <AnimatePresence>
          {toast && (
            <motion.div
              className="toast"
              role="status"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12 }}
            >
              <SparkleIcon weight="fill" />
              <span>{toast}</span>
              <button aria-label="Dismiss message" onClick={() => setToast('')}>
                <XIcon />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <span className="sr-only" aria-live="polite">
          {ready ? 'Learning progress loaded.' : 'Loading your learning space.'}
        </span>
      </div>
    </MotionConfig>
  );
}
const BlobConstructor = globalThis.Blob;
function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  );
}
function LessonCard({
  lesson: l,
  index,
  completed,
  onClick,
}: {
  lesson: Lesson;
  index: number;
  completed: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      className={`lesson-card ${l.locked ? 'locked' : ''}`}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      aria-label={`${l.title}${l.locked ? ', coming soon' : completed ? ', review lesson' : ', start lesson'}`}
    >
      <div className="lesson-card-top">
        <span className={`lesson-icon ${l.color}`}>{lessonIcon(l.icon, 29)}</span>
        <span className="lesson-number mono">
          {completed ? (
            <CheckIcon size={17} />
          ) : l.locked ? (
            <LockKeyIcon size={17} />
          ) : (
            String(index + 1).padStart(2, '0')
          )}
        </span>
      </div>
      <h3>{l.title}</h3>
      <p>{l.subtitle}</p>
      <div className="lesson-card-bottom">
        <span>
          <ClockIcon />
          {l.locked
            ? 'Coming soon'
            : `${l.minutes} min · ${completed ? 'Review' : l.format === 'recall' ? 'Recall cards' : l.format === 'journal' ? 'Journal lab' : l.format === 'detective' ? 'Spot the slip' : l.format === 'story' ? 'Story lesson' : 'Bite-sized lesson'}`}
        </span>
        <span className={`lesson-arrow ${completed ? 'completed' : ''}`}>
          {completed ? <CheckIcon /> : <ArrowUpRightIcon />}
        </span>
      </div>
    </motion.button>
  );
}
function Stat({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="stat-card">
      <span className={`stat-icon ${color}`}>{icon}</span>
      <strong className="mono">{value}</strong>
      <span>{label}</span>
    </div>
  );
}
