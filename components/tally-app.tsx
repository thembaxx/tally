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
import { useSoundscape } from './use-soundscape';
import { Logo, Blob } from './brand';
import { Modal } from './modal';
import { LessonPlayer } from './lesson-player';
import { Segmented, Switch } from './ui/controls';
import { MotionPage } from './motion-page';
import { PracticeStudio } from './practice-studio';
import { SkillMap } from './skill-map';
import { recallEvidence } from '@/lib/skills';
import { readBackup } from '@/lib/backup';
import { scheduleReview, weakestReviews } from '@/lib/reviews';
import { practiceTopics, recommendedChallenge } from '@/lib/adaptive';
import { addDays, dateLabel, learningContext } from '@/lib/south-africa';
import {
  matchesDraft,
  sessionId,
  type LessonDraft,
  type Session,
  type SessionResult,
} from '@/lib/session';
const Scene = dynamic(() => import('./scene'), {
  ssr: false,
  loading: () => <div className="scene scene-loading" />,
});
type Tab = 'home' | 'learn' | 'practice' | 'me';
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
export default function TallyApp() {
  const { progress: p, setProgress, ready, storageError, today } = useTally();
  const [tab, setTab] = useState<Tab>('home');
  const [settings, setSettings] = useState(false);
  const [active, setActive] = useState<Session | null>(null);
  const [onboarding, setOnboarding] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftGoal, setDraftGoal] = useState(5);
  const [toast, setToast] = useState('');
  const [filter, setFilter] = useState('all');
  const [learnView, setLearnView] = useState('lessons');
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [installInfo, setInstallInfo] = useState(false);
  const [online, setOnline] = useState(true);
  const [reset, setReset] = useState(false);
  const reviews = p.reviews;
  const [imported, setImported] = useState<Progress | null>(null);
  const [importError, setImportError] = useState('');
  const importInput = useRef<HTMLInputElement | null>(null);
  const [about, setAbout] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const sw = useRef<ServiceWorkerRegistration | null>(null);
  const lessonLinkOpened = useRef(false);
  const showToast = useCallback((s: string) => setToast(s), []);
  const playSound = useSoundscape(p.sound, p.soundVolume);
  const focus = useFocus(() => {
    playSound('focus-end');
    const day = localDay();
    const alreadyEarned = p.focusDays.includes(day);
    showToast(
      alreadyEarned
        ? 'Focus session complete. You already earned focus XP today.'
        : 'Focus session complete. +10 XP earned.',
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
    setActive(lesson);
  }, [ready]);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('tab');
    if (navItems.some((i) => i.id === t)) setTab(t as Tab);
    setLearnView(params.get('view') === 'skills' ? 'skills' : 'lessons');
    const pop = () => {
      const params = new URLSearchParams(location.search);
      const value = params.get('tab');
      setTab(navItems.some((i) => i.id === value) ? (value as Tab) : 'home');
      setLearnView(params.get('view') === 'skills' ? 'skills' : 'lessons');
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
  function navigate(next: Tab, view = 'lessons') {
    if (next !== tab) playSound('navigate');
    setTab(next);
    setLearnView(view);
    const url = new URL(location.href);
    url.searchParams.delete('lesson');
    if (next === 'home') url.searchParams.delete('tab');
    else url.searchParams.set('tab', next);
    if (next === 'learn' && view === 'skills') url.searchParams.set('view', 'skills');
    else url.searchParams.delete('view');
    history.pushState({}, '', url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function patch(update: Partial<Progress>) {
    setProgress((v) => ({ ...v, ...update }));
  }
  function feedback(success: boolean) {
    if (p.haptics && 'vibrate' in navigator) navigator.vibrate(success ? [12, 35, 12] : 25);
    playSound(success ? 'correct' : 'incorrect');
  }
  function celebrate() {
    if (p.haptics && 'vibrate' in navigator) navigator.vibrate([12, 40, 16, 55, 22]);
    playSound('complete');
  }
  function launch(lesson: Session) {
    playSound('open');
    setActive(lesson);
  }
  function resumeLesson() {
    const draft = p.draft;
    if (!draft) return;
    if (draft.lessonId === 'review') launch({ kind: 'review', ids: draft.reviewIds });
    else if (draft.lessonId === 'daily' && draft.day === today) launch('daily');
    else {
      const lesson = lessons.find((l) => l.id === draft.lessonId);
      if (lesson) launch(lesson);
    }
  }
  function closeLesson() {
    setActive(null);
    if (!p.onboarded && !p.draft) {
      setDraftName(p.name);
      setDraftGoal(p.goal);
      setOnboarding(true);
    }
  }
  function finishOnboarding() {
    patch({ name: draftName.trim(), goal: draftGoal, onboarded: true });
    setOnboarding(false);
  }
  const saveDraft = useCallback(
    (draft: LessonDraft) => {
      setProgress((old) => ({ ...old, draft }));
    },
    [setProgress],
  );
  function complete(result: SessionResult) {
    if (!active) return 0;
    const day = localDay();
    const daily = active === 'daily';
    const challengeDay = daily ? result.day : day;
    const review = typeof active === 'object' && 'kind' in active;
    const lesson = typeof active === 'object' && !('kind' in active) ? active : null;
    const amount = daily
      ? p.dailyRuns[challengeDay]
        ? 15
        : 90
      : review
        ? result.concepts.length * 10
        : p.completed.includes(lesson?.id || '')
          ? 10
          : 60;
    setProgress((old) => {
      const nextReviews = { ...old.reviews };
      for (const concept of result.concepts) {
        nextReviews[concept.id] = scheduleReview(
          old.reviews[concept.id],
          concept,
          result.confidence,
          day,
        );
      }
      return {
        ...old,
        xp: old.xp + amount,
        draft: null,
        reviews: nextReviews,
        notes: lesson ? { ...old.notes, [lesson.id]: result.note } : old.notes,
        completed:
          lesson && !old.completed.includes(lesson.id)
            ? [...old.completed, lesson.id]
            : old.completed,
        activity: {
          ...old.activity,
          [day]:
            (old.activity[day] || 0) +
            (daily ? 5 : review ? result.concepts.length : lesson?.minutes || 4),
        },
        dailyRuns: daily
          ? { ...old.dailyRuns, [challengeDay]: (old.dailyRuns[challengeDay] || 0) + 1 }
          : old.dailyRuns,
      };
    });
    return amount;
  }
  async function readImport(file: File) {
    setImportError('');
    setImported(null);
    try {
      if (file.size > 1000000) throw new Error('Choose a Tally backup smaller than 1 MB.');
      setImported(readBackup(await file.text()));
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'This backup could not be read.');
    }
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
    const blob = new BlobConstructor(
      [JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), progress: p }, null, 2)],
      {
        type: 'application/json',
      },
    );
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
  const dueIds = weakestReviews(reviews, today);
  const due = lessons.filter((l) => dueIds.includes(l.id));
  const reviewIds = practiceTopics(
    reviews,
    today,
    p.completed,
    lessons.filter((l) => !l.locked).map((l) => l.id),
  );
  const resumable = p.draft && (p.draft.lessonId !== 'daily' || p.draft.day === today);
  const reviewAction = reviewIds.length ? (
    <section className="next-action review-action" aria-label="Your next review">
      <div>
        <span className="eyebrow">PERSONALIZED PRACTICE</span>
        <h2>{reviewIds.length === 1 ? 'One topic to review.' : 'Two topics to review.'}</h2>
        <p>
          {reviewIds.map((id) => lessons.find((l) => l.id === id)?.title).join(' · ')} · about{' '}
          {reviewIds.length}–{reviewIds.length * 2} min
        </p>
        <ul className="review-reasons">
          {reviewIds.map((id) => (
            <li key={id}>
              <strong>{lessons.find((l) => l.id === id)?.title}:</strong>{' '}
              {(reviews[id] || p.completed.includes(id)) &&
                `${recallEvidence(reviews[id], p.completed.includes(id))} `}
              {recommendedChallenge(reviews[id]).reason}
            </li>
          ))}
        </ul>
      </div>
      <button className="button primary" onClick={() => launch({ kind: 'review', ids: reviewIds })}>
        {reviewIds.some((id) => p.completed.includes(id) || reviews[id]?.attempts)
          ? `Review ${reviewIds.length === 1 ? 'this concept' : 'these concepts'}`
          : 'Start guided practice'}{' '}
        <ArrowRightIcon />
      </button>
    </section>
  ) : null;
  const todayMinutes = p.activity[today] || 0;
  const level = Math.floor(p.xp / 200) + 1;
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, -6 + i);
    return {
      key: day,
      label: dateLabel(day, { weekday: 'narrow' }),
      full: dateLabel(day, { weekday: 'long', month: 'short', day: 'numeric' }),
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
          <div className="sidebar-caption">ACCOUNTING PRACTICE</div>
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
                Learn at
                <br />
                your pace.
              </p>
              <span>Pick up where you left off.</span>
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
              <MotionPage
                key={tab}
                ready={ready}
                revealKey={tab === 'learn' ? `${learnView}-${filter}` : tab}
              >
                {tab === 'home' ? (
                  <>
                    <section className="page-heading">
                      <div>
                        <span className="eyebrow">YOUR LEARNING</span>
                        <h1>
                          {p.name ? `Welcome back, ${p.name}.` : 'Welcome to Tally.'}
                          <SparkleIcon className="greeting-spark" weight="duotone" />
                        </h1>
                        <p>Learn accounting with South African examples, in rand.</p>
                      </div>
                      <div className="date-display">
                        <CalendarDotsIcon size={18} />
                        {ready ? dateLabel(today) : 'A new day to learn'}
                      </div>
                    </section>
                    {resumable && (
                      <section
                        className="next-action resume-action"
                        aria-label="Unfinished session"
                      >
                        <div>
                          <span className="eyebrow">PICK UP WHERE YOU LEFT OFF</span>
                          <h2>
                            {p.draft?.lessonId === 'review'
                              ? 'Your targeted review'
                              : p.draft?.lessonId === 'daily'
                                ? 'The Daily Mix'
                                : lessons.find((l) => l.id === p.draft?.lessonId)?.title}
                          </h2>
                          <p>
                            Your place and takeaway are saved. Continue with the current activity.
                          </p>
                        </div>
                        <button className="button dark" onClick={resumeLesson}>
                          Resume learning <ArrowRightIcon />
                        </button>
                      </section>
                    )}
                    {reviewAction}
                    <div className="welcome-grid">
                      <section className="hero-card">
                        <div className="hero-text">
                          <span className="hero-tag">
                            <span /> YOUR NEXT LESSON
                          </span>
                          <h2>
                            Accounting,
                            <br />
                            <span>
                              one lesson
                              <br className="desktop-break" /> at a time.
                            </span>
                          </h2>
                          <p>
                            Work through an example.
                            <br />
                            Then try it yourself.
                          </p>
                          <button className="button dark" onClick={() => launch(nextLesson)}>
                            {count ? 'Continue learning' : 'Start learning'}
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
                            <span className="tiny-dot" /> Assets = Liabilities + Equity
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
                          Three challenges.
                          <br />
                          About five minutes.
                        </h2>
                        <p>
                          Sort accounts, answer a question,
                          <br className="desktop-break" /> and order the steps.
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
                          {p.dailyRuns[today] ? 'Repeat daily mix' : 'Start daily mix'}
                          <ArrowUpRightIcon />
                        </button>
                        <div className="daily-reward">
                          <span>
                            <SparkleIcon weight="fill" /> +{p.dailyRuns[today] ? 15 : 90} XP
                          </span>
                          <span>Resets at 00:00 SAST</span>
                        </div>
                      </section>
                    </div>
                    <section className="learning-section">
                      <div className="section-heading">
                        <div>
                          <span className="eyebrow">BUILD YOUR FOUNDATION</span>
                          <h2>Foundation lessons</h2>
                        </div>
                        <button className="text-button" onClick={() => navigate('learn')}>
                          View all lessons <ArrowRightIcon />
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
                    <button className="skill-map-link" onClick={() => navigate('learn', 'skills')}>
                      <PathIcon size={28} weight="duotone" />
                      <span>
                        <strong>See how your skills are growing.</strong>
                        <small>What’s steady, what needs practice, and your next step.</small>
                      </span>
                      <ArrowRightIcon size={22} />
                    </button>
                    <div className="home-bottom">
                      <section className="weekly-card">
                        <div className="section-heading">
                          <div>
                            <h2>Your activity this week</h2>
                            <p>Minutes spent learning over the last seven days.</p>
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
                              ? 'Daily goal reached.'
                              : `${todayMinutes} of ${p.goal} minutes today.`}
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
                            Focus mode.
                            <br />
                            <strong>Five minutes.</strong>
                          </span>
                          <Switch
                            checked={focus.active}
                            onChange={(v) => (v ? focus.start() : focus.stop())}
                            label="Focus mode"
                          />
                        </div>
                        <p>
                          Start a five-minute timer.
                          <br />
                          It pauses when you leave the tab.
                        </p>
                        <button
                          className="text-button"
                          onClick={() => {
                            playSound(focus.active ? 'focus-pause' : 'focus-start');
                            if (focus.active) focus.stop();
                            else focus.start();
                          }}
                        >
                          {focus.active ? 'End focus session' : 'Start focus session'}{' '}
                          <ArrowRightIcon />
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
                        <strong>A note from Tali</strong>“An asset is a resource the business owns
                        or controls, such as cash or equipment.”
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
                      eyebrow="LEARN ACCOUNTING"
                      title="Lessons and skills"
                      description="Choose a lesson or check your practice history in the skill map."
                    />
                    <div className="learn-view-switch">
                      <Segmented
                        label="Learn view"
                        items={[
                          { id: 'lessons', label: 'Lessons' },
                          { id: 'skills', label: 'Skill map' },
                        ]}
                        value={learnView}
                        onChange={(view) => navigate('learn', view)}
                      />
                    </div>
                    {learnView === 'skills' ? (
                      <SkillMap progress={p} today={today} onLaunch={launch} />
                    ) : (
                      <>
                        <div className="path-summary">
                          <div className="path-progress">
                            <GraduationCapIcon size={30} weight="duotone" />
                            <div>
                              <h3>Lesson progress</h3>
                              <p>
                                {count} of {lessons.filter((l) => !l.locked).length} lessons
                                explored
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
                          <span className="fine">Choose any lesson.</span>
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
                                      ? 'Accounting basics'
                                      : group === 'Next level'
                                        ? 'Apply the basics'
                                        : 'More accounting topics'}
                                  </h2>
                                  <p>
                                    {group === 'Foundations'
                                      ? 'Start with the accounting equation, entries, and statements.'
                                      : group === 'Next level'
                                        ? 'Make the leap from recording numbers to understanding them.'
                                        : 'Explore decisions, timing, and the bigger financial picture.'}
                                  </p>
                                </div>
                                <span className="chapter-tag">
                                  {group === 'Foundations' ? 'START HERE' : 'MORE TOPICS'}
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
                            foundations for a refresher.
                          </p>
                        </div>
                      </>
                    )}
                  </>
                ) : tab === 'practice' ? (
                  <>
                    {reviewAction}
                    <PageHeading
                      eyebrow="MAKE IT STICK"
                      title="Practice accounting"
                      description="Try a daily mix, choose an activity, or review a topic."
                    />
                    <div className="practice-hero">
                      <div>
                        <span className="pill">
                          <LightningIcon weight="fill" /> TODAY’S DAILY MIX
                        </span>
                        <h2>
                          Sort, answer,
                          <br />
                          and build.
                        </h2>
                        <p>
                          Three activities from different topics
                          <br />
                          in today’s daily mix.
                        </p>
                        <button className="button dark" onClick={() => launch('daily')}>
                          {p.dailyRuns[today] ? 'Repeat daily mix' : 'Start daily mix'}{' '}
                          <ArrowRightIcon />
                        </button>
                      </div>
                      <Scene kind="tower" order={['Sort', 'Type', 'Build', 'Understand']} />
                    </div>
                    <PracticeStudio onLaunch={launch} completed={p.completed} />
                    <section className="path-section">
                      <div className="section-heading">
                        <div>
                          <span className="eyebrow">SPACED REVIEW</span>
                          <h2>{due.length ? 'Topics due for review' : 'Your review schedule'}</h2>
                          <p>Review dates adapt to your answers, hints, and confidence.</p>
                        </div>
                        <span className="count-badge mono">{due.length} DUE</span>
                      </div>
                      {p.completed.length || Object.keys(reviews).length ? (
                        <div className="review-list">
                          {lessons
                            .filter((l) => p.completed.includes(l.id) || reviews[l.id])
                            .sort((a, b) =>
                              (reviews[a.id]?.due || '').localeCompare(reviews[b.id]?.due || ''),
                            )
                            .map((l) => (
                              <button
                                key={l.id}
                                className="review-row"
                                onClick={() => launch({ kind: 'review', ids: [l.id] })}
                              >
                                <span className={`lesson-icon ${l.color}`}>
                                  {lessonIcon(l.icon)}
                                </span>
                                <span>
                                  <strong>{l.title}</strong>
                                  <small>
                                    {reviews[l.id]?.due <= today
                                      ? 'Ready to revisit'
                                      : reviews[l.id]?.due
                                        ? `Next review: ${dateLabel(reviews[l.id].due, { month: 'short', day: 'numeric' })}`
                                        : 'Practice whenever you like'}
                                  </small>
                                  {reviews[l.id]?.total > 0 && (
                                    <small>
                                      {reviews[l.id].firstTry} of {reviews[l.id].total} activities
                                      answered independently · {reviews[l.id].interval || 1}-day
                                      spacing
                                    </small>
                                  )}
                                  {p.notes[l.id] && (
                                    <small className="saved-takeaway">
                                      My takeaway: {p.notes[l.id]}
                                    </small>
                                  )}
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
                          <h3>No reviews scheduled yet</h3>
                          <p>
                            Complete a lesson to schedule your first review.
                            <br />
                            Your review date will appear here.
                          </p>
                          <button className="text-button" onClick={() => launch(lessons[0])}>
                            Start your first lesson <ArrowRightIcon />
                          </button>
                        </div>
                      )}
                    </section>
                    <div className="billi-note">
                      <Blob small />
                      <p>
                        <strong>Try recalling before checking.</strong> If you get stuck, use a
                        hint. You can retry any activity.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <PageHeading
                      eyebrow="YOUR PROFILE"
                      title="Your progress"
                      description="View your activity, completed lessons, and achievements."
                    />
                    <section className="profile-card">
                      <div className="profile-avatar">
                        <Blob happy />
                      </div>
                      <div>
                        <span className="eyebrow">CURIOUS MIND · LEVEL {level}</span>
                        <h2>{p.name || 'Tally learner'}</h2>
                        <p>
                          {count
                            ? `${count} ${count === 1 ? 'lesson' : 'lessons'} explored.`
                            : 'No lessons completed yet.'}
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
                          <span className="eyebrow">MILESTONES</span>
                          <h2>Your achievements</h2>
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
                    <Logo /> <span>Accounting at your pace.</span>
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
                <strong>Focus timer</strong>
                <span>{focus.paused ? 'Paused' : 'Session in progress'}</span>
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
                onClick={() => {
                  playSound(focus.paused ? 'focus-start' : 'focus-pause');
                  focus.togglePause();
                }}
              >
                {focus.paused ? <PlayIcon weight="fill" /> : <PauseIcon weight="fill" />}
              </button>
              <button
                className="icon-button"
                aria-label="End focus session"
                onClick={() => {
                  playSound('focus-pause');
                  focus.stop();
                }}
              >
                <XIcon />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <Modal
          open={!!active}
          onClose={closeLesson}
          title={
            active === 'daily'
              ? 'The Daily Mix'
              : active && 'kind' in active
                ? 'Your targeted review'
                : active?.title || 'Your lesson'
          }
          wide
        >
          {active && (
            <LessonPlayer
              key={`${sessionId(active)}-${active !== 'daily' && 'kind' in active ? active.ids.join('-') : ''}`}
              draft={matchesDraft(p.draft, active, today) ? p.draft : null}
              attempt={
                active === 'daily'
                  ? p.dailyRuns[today] || 0
                  : 'kind' in active
                    ? active.ids.reduce(
                        (n, id) => n + (reviews[id]?.nextQuestion ?? reviews[id]?.attempts ?? 0),
                        0,
                      )
                    : (reviews[active.id]?.nextQuestion ?? reviews[active.id]?.attempts ?? 0)
              }
              reviewAttempts={
                active !== 'daily' && 'kind' in active
                  ? Object.fromEntries(
                      active.ids.map((id) => [
                        id,
                        reviews[id]?.nextQuestion ?? reviews[id]?.attempts ?? 0,
                      ]),
                    )
                  : {}
              }
              reviews={reviews}
              savedNote={active !== 'daily' && !('kind' in active) ? p.notes[active.id] : ''}
              quickStart={
                !p.onboarded &&
                active !== 'daily' &&
                !('kind' in active) &&
                active.id === 'equation'
              }
              onDraft={saveDraft}
              lesson={active}
              day={today}
              onComplete={complete}
              onCelebrate={celebrate}
              onCue={playSound}
              onClose={closeLesson}
              onFocus={() => {
                playSound('focus-start');
                focus.start();
                showToast('Focus session started.');
              }}
              feedback={feedback}
            />
          )}
        </Modal>
        <Modal
          open={onboarding}
          onClose={() => {
            patch({ onboarded: true });
            setOnboarding(false);
          }}
          title="Your preferences"
          description="Set your name and daily learning goal."
        >
          <div className="onboarding">
            <Blob happy />
            <h2>Set a daily goal</h2>
            <p>Make this your learning space. You can change these preferences anytime.</p>
            <label htmlFor="first-name">
              What should I call you? <span className="muted">(optional)</span>
            </label>
            <input
              id="first-name"
              maxLength={30}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Your first name"
            />
            <p>How many minutes would you like to practice each day?</p>
            <div className="goal-options">
              {[
                { n: 3, title: '3 minutes' },
                { n: 5, title: '5 minutes' },
                { n: 10, title: '10 minutes' },
              ].map((g) => (
                <button
                  key={g.n}
                  className={draftGoal === g.n ? 'selected' : ''}
                  aria-pressed={draftGoal === g.n}
                  onClick={() => setDraftGoal(g.n)}
                >
                  <strong>{g.title}</strong>
                  <span className="mono">per day {draftGoal === g.n && <CheckIcon />}</span>
                </button>
              ))}
            </div>
            <button className="button primary full" onClick={finishOnboarding}>
              Save my preferences <ArrowRightIcon />
            </button>
            <button
              className="text-button"
              onClick={() => {
                patch({ onboarded: true });
                setOnboarding(false);
              }}
            >
              Maybe later
            </button>
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
                  <TargetIcon /> Daily goal
                </strong>
                <small>Minutes of practice per day.</small>
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
                  <VibrateIcon /> Haptic feedback
                </strong>
                <small>Vibration feedback on supported phones.</small>
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
                  <SpeakerHighIcon /> Sound effects
                </strong>
                <small>Audio cues for navigation, answers, and completed sessions.</small>
              </span>
              <Switch
                checked={p.sound}
                onChange={(v) => {
                  patch({ sound: v });
                  if (v) playSound('correct', { force: true });
                }}
                label="Sound effects"
              />
            </div>
            <div className="setting-row sound-volume-row">
              <span>
                <strong>Sound volume</strong>
                <small>Gentle, short cues. No background music.</small>
              </span>
              <div className="sound-volume-control">
                <input
                  aria-label="Sound volume"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={p.soundVolume}
                  disabled={!p.sound}
                  onChange={(e) => patch({ soundVolume: Number(e.target.value) })}
                  onPointerUp={() => playSound('select')}
                  onKeyUp={() => playSound('select')}
                />
                <span className="mono" aria-hidden="true">
                  {p.soundVolume}%
                </span>
                <button
                  className="small-button"
                  type="button"
                  disabled={!p.sound || p.soundVolume === 0}
                  aria-label="Preview sounds"
                  onClick={() => playSound('complete')}
                >
                  <SpeakerHighIcon /> Try
                </button>
              </div>
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
              <input
                ref={importInput}
                type="file"
                accept=".json,application/json"
                aria-label="Tally progress backup"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void readImport(file);
                  e.target.value = '';
                }}
              />
              <button onClick={() => importInput.current?.click()}>
                <DownloadSimpleIcon /> Import my progress <ArrowRightIcon />
              </button>
              <button
                onClick={() => {
                  setSettings(false);
                  setDraftName(p.name);
                  setDraftGoal(p.goal);
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
            {importError && (
              <p role="alert" className="import-error">
                {importError}
              </p>
            )}
            {imported && (
              <div className="import-confirm" role="region" aria-label="Review imported progress">
                <h3>Restore this backup?</h3>
                <p>
                  {imported.name || 'Learner'} · {imported.xp} XP · {imported.completed.length}{' '}
                  completed lessons.
                </p>
                <p>
                  This replaces the progress and preferences on this device. Export your current
                  progress first if you want to keep both.
                </p>
                <button
                  className="button primary"
                  onClick={() => {
                    setProgress(imported);
                    setImported(null);
                    setImportError('');
                    showToast('Your progress, takeaways, and review schedule have been restored.');
                  }}
                >
                  Restore this progress
                </button>
                <button className="text-button" onClick={() => setImported(null)}>
                  Keep current progress
                </button>
              </div>
            )}
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
                    localStorage.removeItem('tally-reviews-v1');
                    setReset(false);
                    showToast('Progress reset.');
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
        <Modal open={installInfo} onClose={() => setInstallInfo(false)} title="Install Tally">
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
          title="How learning works"
          description="Built for understanding, one discovery at a time."
        >
          <div className="about-learning">
            <Blob small />
            <h3>South African context</h3>
            <p>{learningContext}</p>
            <p>
              Trade receivables and payables are also called debtors and creditors. The statement of
              profit or loss is the income statement; the statement of financial position is the
              balance sheet. Daily practice and streaks use South African Standard Time (SAST).
            </p>
            <a
              href="https://www.sars.gov.za/types-of-tax/value-added-tax/"
              target="_blank"
              rel="noreferrer"
            >
              Read SARS guidance on VAT <ArrowUpRightIcon />
            </a>
            <p>
              Tally uses familiar examples, visual models, active recall, and spaced review. You try
              an idea, get specific feedback, then revisit it after a break.
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
                <strong>Make it stick.</strong> Save your own takeaway. Reviews return after 1 to 30
                days, adapting to your answers, hints, and confidence.
              </li>
              <li>
                <strong>Practice at the right difficulty.</strong> Guided questions show the method;
                stretch questions ask you to apply it in more steps. Reviews use your practice
                history and choices to select questions. You can ask for guidance or a harder
                follow-up. Extra questions do not add XP.
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
