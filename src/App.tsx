import React, { useState, useEffect, useMemo, useRef } from 'react'
import Frame54 from '@/imports/Frame54/index'
import { deriveMetrics, measureAll, runQualityChecks } from '@/analysis'
import type { ImageStats, QualityCheck } from '@/analysis'
import {
  METRIC_DEFS,
  SEED_SCANS,
  averageScore,
  bestScore,
  byNewest,
  createScan,
  formatDate,
  formatShortDate,
  formatTime,
  latestScan,
  previousScan,
  scoreDelta,
  scoreFromMetrics,
} from '@/scans'
import type { Scan } from '@/scans'
import imgHero from '@/assets/img/hero-skin.webp'
import imgOnboard1 from '@/assets/img/onboarding-1.webp'
import imgOnboard2 from '@/assets/img/onboarding-2.webp'
import imgOnboard3 from '@/assets/img/onboarding-3.webp'

type Screen =
  | 'splash'
  | 'onboard1'
  | 'onboard2'
  | 'onboard3'
  | 'login'
  | 'signup'
  | 'home'
  | 'scan'
  | 'scan-prep'
  | 'scan-upload'
  | 'scan-quality'
  | 'scan-analyzing'
  // One report screen, reached both from a finished scan and from history.
  | 'report'
  | 'history'
  | 'profile'
  | 'settings'
  | 'location'

const PRIMARY = '#9598ea'

// ─── Status Bar ──────────────────────────────────────────────────────────────
function StatusBar({ light = false, overlay = false }: { light?: boolean; overlay?: boolean }) {
  const color = light ? 'white' : '#1f2024'
  return (
    <div className={`status-bar flex items-center justify-between px-5 pb-1 shrink-0${overlay ? ' status-bar--overlay' : ''}`}>
      <span style={{ fontSize: 15, fontWeight: 600, color, letterSpacing: -0.16 }}>9:41</span>
      <div className="flex items-center gap-1">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="none">
          <rect x="0" y="6" width="3" height="5" rx="0.5" fill={color} opacity="0.4" />
          <rect x="4.5" y="4" width="3" height="7" rx="0.5" fill={color} opacity="0.6" />
          <rect x="9" y="2" width="3" height="9" rx="0.5" fill={color} opacity="0.8" />
          <rect x="13.5" y="0" width="3" height="11" rx="0.5" fill={color} />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path d="M8 2.4C5.6 2.4 3.4 3.4 1.8 5L0 3.2C2.1 1.2 4.9 0 8 0s5.9 1.2 8 3.2L14.2 5C12.6 3.4 10.4 2.4 8 2.4z" fill={color} opacity="0.4" />
          <path d="M8 5.6c-1.6 0-3 .6-4.1 1.7L2 5.4C3.5 4 5.6 3.2 8 3.2s4.5.8 6 2.2L12.1 7.3C11 6.2 9.6 5.6 8 5.6z" fill={color} opacity="0.7" />
          <circle cx="8" cy="10" r="1.5" fill={color} />
        </svg>
        <span style={{ fontSize: 13, fontWeight: 400, color }}>100%</span>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke={color} strokeOpacity="0.35" />
          <rect x="2" y="2" width="16" height="8" rx="2" fill={color} />
          <path d="M23 4.5v3a1.5 1.5 0 000-3z" fill={color} fillOpacity="0.4" />
        </svg>
      </div>
    </div>
  )
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────
function BottomNav({ active, nav }: { active: Screen; nav: (s: Screen) => void }) {
  const tabs: { screen: Screen; label: string; icon: React.ReactNode }[] = [
    {
      screen: 'home',
      label: 'Home',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      screen: 'scan',
      label: 'Scan',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
          <line x1="12" y1="2" x2="12" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="2" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="19" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      screen: 'history',
      label: 'History',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      screen: 'profile',
      label: 'Profile',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
    },
  ]

  return (
    <div
      className="flex items-center justify-around bg-white border-t shrink-0"
      style={{ height: 83, borderColor: '#f0f0f0', paddingBottom: 20 }}
    >
      {tabs.map((t) => {
        const isActive = active === t.screen
        return (
          <button
            key={t.screen}
            className="flex flex-col items-center gap-0.5"
            style={{ color: isActive ? PRIMARY : '#8f9098', minWidth: 60 }}
            onClick={() => nav(t.screen)}
          >
            {t.icon}
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}>{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Splash ───────────────────────────────────────────────────────────────────
function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="flex flex-col items-center justify-center size-full bg-white">
      <div style={{ width: 160, height: 160 }}>
        <Frame54 />
      </div>
    </div>
  )
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
const onboardingData: { image: string; overlay: string | null; dot: number; title: string; desc: string }[] = [
  {
    image: imgOnboard1,
    overlay: null,
    dot: 0,
    title: 'See beyond\na normal skin photo',
    desc: 'Use controlled optical imaging to reduce glare and reveal skin signals that ordinary photos often miss.',
  },
  {
    image: imgOnboard2,
    overlay: null,
    dot: 1,
    title: 'Multiple channels,\nclearer insight',
    desc: 'RGB and polarized imaging work together to show redness, texture and lesion boundaries more clearly.',
  },
  {
    image: imgOnboard3,
    overlay: null,
    dot: 2,
    title: 'Track changes\nwith confidence',
    desc: 'Compare your scans over time, so visible skin changes are easier to follow and discuss.',
  },
]

function OnboardingScreen({ index, onNext, onSkip }: { index: number; onNext: () => void; onSkip: () => void }) {
  const d = onboardingData[index]
  return (
    <div className="relative flex flex-col size-full bg-white">
      <StatusBar overlay />
      <div className="flex-1 relative overflow-hidden">
        <img src={d.image} alt="" className="absolute inset-0 size-full object-cover" />
        {d.overlay && <img src={d.overlay} alt="" className="absolute inset-0 size-full object-cover" />}
      </div>
      <div className="shrink-0 p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-6 px-2 py-4">
          <div className="flex gap-2 items-center">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 8, height: 8, borderRadius: 24,
                  background: i === d.dot ? PRIMARY : '#1f2024',
                  opacity: i === d.dot ? 1 : 0.1,
                }}
              />
            ))}
          </div>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#000', letterSpacing: 0.24, lineHeight: 1.2, whiteSpace: 'pre-line' }}>
            {d.title}
          </p>
          <p style={{ fontSize: 12, fontWeight: 400, color: '#71727a', lineHeight: '16px', letterSpacing: 0.12 }}>
            {d.desc}
          </p>
        </div>
        <button
          className="w-full flex items-center justify-center rounded-xl"
          style={{ height: 48, background: PRIMARY }}
          onClick={onNext}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>
            {index < 2 ? 'Next' : "Get Started"}
          </span>
        </button>
        {index < 2 && (
          <button className="w-full text-center" onClick={onSkip}>
            <span style={{ fontSize: 12, color: '#71727a' }}>Skip</span>
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginScreen({ nav, onSignIn }: { nav: (s: Screen) => void; onSignIn: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  return (
    <div className="relative flex flex-col size-full bg-white">
      <StatusBar overlay light />
      <div className="flex-1 relative overflow-hidden" style={{ maxHeight: 300 }}>
        <img src={imgHero} alt="" className="absolute inset-0 size-full object-cover" />
      </div>
      <div className="flex flex-col gap-6 px-6 py-10">
        <p style={{ fontSize: 24, fontWeight: 800, color: '#000', letterSpacing: 0.24 }}>Welcome!</p>
        <div className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-2">
            <div
              className="flex items-center px-4 rounded-xl"
              style={{ height: 48, border: email ? `1.5px solid ${PRIMARY}` : '1px solid #c5c6cc' }}
            >
              <input
                className="flex-1 outline-none bg-transparent"
                style={{ fontSize: 14, color: '#1f2024' }}
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          {/* Password */}
          <div className="flex flex-col gap-2">
            <div
              className="flex items-center px-4 rounded-xl"
              style={{ height: 48, border: password ? `1.5px solid ${PRIMARY}` : '1px solid #c5c6cc' }}
            >
              <input
                className="flex-1 outline-none bg-transparent"
                style={{ fontSize: 14, color: '#1f2024' }}
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button onClick={() => setShowPw(!showPw)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#8f9098" strokeWidth="2" />
                  <circle cx="12" cy="12" r="3" stroke="#8f9098" strokeWidth="2" />
                  {showPw && <line x1="4" y1="4" x2="20" y2="20" stroke="#8f9098" strokeWidth="2" strokeLinecap="round" />}
                </svg>
              </button>
            </div>
          </div>
          <button onClick={() => setResetSent(true)}>
            <span style={{ fontSize: 12, fontWeight: 600, color: resetSent ? '#10b981' : PRIMARY }}>
              {resetSent ? 'Reset link sent ✓' : 'Forgot password?'}
            </span>
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <button
            className="w-full flex items-center justify-center rounded-xl"
            style={{ height: 48, background: PRIMARY }}
            onClick={onSignIn}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>Login</span>
          </button>
          <p className="text-center" style={{ fontSize: 12, color: '#71727a' }}>
            Not a member?{' '}
            <button onClick={() => nav('signup')}>
              <span style={{ fontWeight: 600, color: PRIMARY }}>Register now</span>
            </button>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div style={{ flex: 1, height: 0.5, background: '#D4D6DD' }} />
          <span style={{ fontSize: 12, color: '#71727a' }}>Or continue with</span>
          <div style={{ flex: 1, height: 0.5, background: '#D4D6DD' }} />
        </div>
        <div className="flex items-center justify-center gap-3">
          <button className="flex items-center justify-center rounded-full size-10" style={{ background: '#ed3241' }} onClick={onSignIn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M21.8 10.4H12v3.6h5.7c-.6 3-3.2 4.8-5.7 4.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.5 0 2.8.6 3.8 1.5l2.7-2.7C16.8 3.8 14.5 3 12 3 7 3 3 7 3 12s4 9 9 9c5 0 9-3.6 9-8.6 0-.7-.1-1.4-.2-2z" />
            </svg>
          </button>
          <button className="flex items-center justify-center rounded-full size-10" style={{ background: '#1f2024' }} onClick={onSignIn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.5 2 2 6.5 2 12c0 4.4 2.9 8.2 6.8 9.5.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1.1.8-.2 1.7-.3 2.5-.3s1.7.1 2.5.3c2-1.4 2.8-1.1 2.8-1.1.5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.8-2.3 4.7-4.6 4.9.4.3.7 1 .7 2v2.9c0 .3.2.6.7.5 4-1.3 6.8-5.1 6.8-9.5C22 6.5 17.5 2 12 2z" />
            </svg>
          </button>
          <button className="flex items-center justify-center rounded-full size-10" style={{ background: PRIMARY }} onClick={onSignIn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.266 5.64z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sign Up ──────────────────────────────────────────────────────────────────
function SignUpScreen({ nav, onSignUp }: { nav: (s: Screen) => void; onSignUp: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [focused, setFocused] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const fields = [
    { id: 'name', label: 'First Name', value: name, setValue: setName, placeholder: 'Your name', type: 'text' },
    { id: 'email', label: 'Email', value: email, setValue: setEmail, placeholder: 'name@email.com', type: 'email' },
    { id: 'password', label: 'Password', value: password, setValue: setPassword, placeholder: 'Create a password', type: 'password' },
    { id: 'confirm', label: 'Confirm Password', value: confirm, setValue: setConfirm, placeholder: 'Confirm password', type: 'password' },
  ]

  const emailLooksValid = /\S+@\S+\.\S+/.test(email)
  const passwordLongEnough = password.length >= 6
  const passwordsMatch = password.length > 0 && password === confirm
  const problems: Record<string, string | null> = {
    name: name.trim() ? null : 'Enter your first name',
    email: emailLooksValid ? null : 'Enter a valid email address',
    password: passwordLongEnough ? null : 'Use at least 6 characters',
    confirm: passwordsMatch ? null : 'Passwords do not match',
  }
  const canSubmit = Object.values(problems).every((v) => v === null)

  const submit = () => {
    setTouched(true)
    if (canSubmit) setShowModal(true)
  }

  return (
    <div className="flex flex-col size-full bg-white">
      <StatusBar />
      <div className="flex items-center px-6 pb-2 gap-3">
        <button onClick={() => nav('login')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="#1f2024" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="flex flex-col gap-4 px-6 pt-2 pb-6 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-2">
          <p style={{ fontSize: 20, fontWeight: 800, color: '#1f2024', letterSpacing: 0.08 }}>Sign up</p>
          <p style={{ fontSize: 12, color: '#71727a', lineHeight: '16px' }}>Create an account to get started</p>
        </div>

        {fields.map((field) => {
          // The mock hard-coded the first field as focused and drew a fake
          // keyboard below. Focus is now real and the device supplies the keyboard.
          const isFocused = focused === field.id
          const error = touched ? problems[field.id] : null
          const border = error ? '#ef4444' : isFocused ? PRIMARY : '#c5c6cc'
          return (
            <div key={field.id} className="flex flex-col gap-1.5">
              <div
                className="flex items-center px-4 rounded-xl"
                style={{ height: 48, border: `${isFocused || error ? 1.5 : 1}px solid ${border}` }}
              >
                <input
                  className="flex-1 outline-none bg-transparent"
                  style={{ fontSize: 14, color: '#1f2024' }}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={field.value}
                  autoComplete={field.id === 'name' ? 'given-name' : field.id === 'email' ? 'email' : 'new-password'}
                  onFocus={() => setFocused(field.id)}
                  onBlur={() => setFocused(null)}
                  onChange={(e) => field.setValue(e.target.value)}
                />
              </div>
              {error && <p style={{ fontSize: 11, color: '#ef4444' }}>{error}</p>}
            </div>
          )
        })}

        <button
          className="w-full flex items-center justify-center rounded-xl mt-2 transition-opacity"
          style={{ height: 48, background: PRIMARY, opacity: touched && !canSubmit ? 0.6 : 1 }}
          onClick={submit}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>Create Account</span>
        </button>

        <p className="text-center" style={{ fontSize: 12, color: '#71727a' }}>
          Already have an account?{' '}
          <button onClick={() => nav('login')}>
            <span style={{ fontWeight: 600, color: PRIMARY }}>Log in</span>
          </button>
        </p>
      </div>

      {showModal && (
        <div className="absolute inset-0 flex items-end z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full bg-white rounded-t-3xl p-8 flex flex-col gap-6 items-center">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex items-center justify-center rounded-full size-14" style={{ background: '#e8e9f1' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke={PRIMARY} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#1f2024' }}>You&apos;re all set</p>
              <p style={{ fontSize: 13, color: '#71727a', lineHeight: '18px' }}>
                Account created. Your first scan will set the baseline every later scan is measured against.
              </p>
            </div>
            <button
              className="w-full flex items-center justify-center rounded-xl"
              style={{ height: 48, background: PRIMARY }}
              onClick={onSignUp}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>Get started</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Home / Dashboard ─────────────────────────────────────────────────────────
function HomeScreen({
  nav,
  navToLocation,
  scans,
  onOpenReport,
}: {
  nav: (s: Screen) => void
  navToLocation: () => void
  scans: Scan[]
  onOpenReport: (id: string) => void
}) {
  // Home used to show four beauty-app metrics (Moisture, Pores, UV Protection,
  // Anti-aging) that three photographs cannot measure, all frozen at constants.
  // It now shows what the optical module actually produced, from the same store
  // the report and history read.
  const latest = latestScan(scans)
  const delta = latest ? scoreDelta(scans, latest) : null
  const prev = latest ? previousScan(scans, latest.id) : null
  const score = latest ? scoreFromMetrics(latest.metrics) : null
  const trend = useMemo(() => byNewest(scans).slice(0, 6).reverse(), [scans])

  return (
    <div className="flex flex-col size-full bg-[#f8f9fe]">
      <StatusBar />
      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-4">
        <div className="flex flex-col gap-0.5">
          <button
            className="flex items-center gap-1.5 self-start"
            onClick={navToLocation}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill={PRIMARY} />
              <circle cx="12" cy="9" r="2.5" fill="white" />
            </svg>
            <span style={{ fontSize: 11, color: PRIMARY, fontWeight: 600 }}>New York, US</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke={PRIMARY} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#1f2024' }}>Ava Johnson</p>
        </div>
        <button
          className="flex items-center justify-center rounded-full size-9 overflow-hidden"
          style={{ background: '#e8e9f1' }}
          onClick={() => nav('profile')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="#8f9098" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="7" r="4" stroke="#8f9098" strokeWidth="2" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-4">
        {!latest ? (
          /* First run: no fabricated history, just the one action that matters. */
          <div
            className="rounded-3xl p-6 flex flex-col gap-3"
            style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, #6b8ff8 100%)` }}
          >
            <p style={{ fontSize: 17, fontWeight: 800, color: 'white' }}>Set your baseline</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: '17px' }}>
              Your first scan is the reference every later scan is compared against. It takes three
              photographs through the clip-on module — about two minutes.
            </p>
            <button
              className="flex items-center justify-center rounded-xl mt-2"
              style={{ height: 44, background: 'white' }}
              onClick={() => nav('scan')}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: PRIMARY }}>Start first scan →</span>
            </button>
          </div>
        ) : (
          <>
            {/* Latest score — the most recent reading, not the running average */}
            <div
              className="rounded-3xl p-5 flex items-center gap-4"
              style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, #6b8ff8 100%)` }}
            >
              <div className="flex flex-col gap-1 flex-1">
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Latest Optical Score</p>
                <div className="flex items-baseline gap-1">
                  <p style={{ fontSize: 48, fontWeight: 900, color: 'white', lineHeight: 1 }}>{score}</p>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>/100</p>
                </div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                  {delta === null
                    ? `Baseline · ${formatDate(latest.takenAt)}`
                    : `${delta >= 0 ? '↑ +' : '↓ '}${delta} since last scan · ${formatDate(latest.takenAt)}`}
                </p>
                <button
                  className="mt-3 flex items-center justify-center rounded-xl"
                  style={{ height: 36, background: 'rgba(255,255,255,0.2)', width: 120 }}
                  onClick={() => onOpenReport(latest.id)}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'white' }}>View report →</span>
                </button>
              </div>
              <div
                className="flex items-center justify-center rounded-full shrink-0 overflow-hidden"
                style={{ width: 80, height: 80, background: 'rgba(255,255,255,0.15)' }}
              >
                {latest.thumbs[0] ? (
                  <img src={latest.thumbs[0]} alt="" className="size-full object-cover" />
                ) : (
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{ width: 60, height: 60, background: 'rgba(255,255,255,0.2)' }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Latest measurements */}
            <div className="bg-white rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1f2024' }}>Latest measurements</p>
                <button onClick={() => nav('scan')}>
                  <span style={{ fontSize: 11, color: PRIMARY, fontWeight: 600 }}>Scan now</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {METRIC_DEFS.slice(0, 4).map((def) => {
                  const value = latest.metrics[def.key]
                  const before = prev ? prev.metrics[def.key] : null
                  const change = before === null ? null : value - before
                  const improved = change === null
                    ? null
                    : def.betterWhen === 'higher' ? change >= 0 : change <= 0
                  return (
                    <div key={def.key} className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: '#f8f9fe' }}>
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: 11, color: '#8f9098' }}>{def.label}</span>
                        {change !== null && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: improved ? '#10b981' : '#ef4444' }}>
                            {change > 0 ? '+' : ''}{change}
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <p style={{ fontSize: 20, fontWeight: 800, color: '#1f2024' }}>{value}</p>
                        <p style={{ fontSize: 10, color: '#8f9098' }}>{def.unit}</p>
                      </div>
                      <div className="rounded-full overflow-hidden" style={{ height: 4, background: '#e8e9f1' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${value}%`, background: def.color }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Trend */}
            <div className="bg-white rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1f2024' }}>Score trend</p>
                <button onClick={() => nav('history')}>
                  <span style={{ fontSize: 11, color: PRIMARY, fontWeight: 600 }}>All scans</span>
                </button>
              </div>
              {trend.length < 2 ? (
                <p style={{ fontSize: 11, color: '#8f9098', lineHeight: '15px' }}>
                  One more scan and a trend line appears here.
                </p>
              ) : (() => {
                const scores = trend.map((sc) => scoreFromMetrics(sc.metrics))
                const lo = Math.max(0, Math.min(...scores) - 6)
                const hi = Math.min(100, Math.max(...scores) + 6)
                const span = Math.max(1, hi - lo)
                return (
                  <div className="flex items-end gap-2" style={{ height: 90 }}>
                    {trend.map((sc, i) => (
                      <button
                        key={sc.id}
                        className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
                        onClick={() => onOpenReport(sc.id)}
                      >
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#1f2024' }}>{scores[i]}</span>
                        <div
                          className="rounded-t-lg w-full transition-all"
                          style={{
                            height: `${Math.max(4, ((scores[i] - lo) / span) * 100)}%`,
                            background: i === trend.length - 1 ? PRIMARY : '#c7cdf5',
                          }}
                        />
                        <span style={{ fontSize: 9, color: '#8f9098' }}>{formatShortDate(sc.takenAt)}</span>
                      </button>
                    ))}
                  </div>
                )
              })()}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Scan Screen ──────────────────────────────────────────────────────────────

type ScanStep = 'prep' | 'upload' | 'quality' | 'analyzing' | 'result'

const CHANNELS = [
  {
    id: 'rgb',
    label: 'RGB / White-light',
    tag: 'Channel 1 of 3',
    color: '#f59e0b',
    bgLight: '#fef3c7',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
        <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    filterInstruction: 'Remove all filters from the clip-on module',
    filterColor: 'No filter — white LED ring only',
    desc: 'Overall skin tone, lesion location, colour distribution',
    tip: 'Use the LED ring as the only light source. Room lights off.',
  },
  {
    id: 'cross-pol',
    label: 'Cross-polarized',
    tag: 'Channel 2 of 3',
    color: '#6366f1',
    bgLight: '#eef2ff',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="8" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
        <path d="M11 9.27A5 5 0 0 1 13 9.27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M11 14.73A5 5 0 0 0 13 14.73" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    filterInstruction: 'Attach the cross-polarized filter (marked ✕)',
    filterColor: 'Dark grey filter — arrows at 90°',
    desc: 'Suppresses surface glare; reveals redness, diffuse signals and lesion boundaries',
    tip: 'Ensure the analyzer filter on the module is perpendicular to the light polarizer.',
  },
  {
    id: 'parallel-pol',
    label: 'Parallel-polarized',
    tag: 'Channel 3 of 3',
    color: '#0ea5e9',
    bgLight: '#e0f2fe',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="4" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    filterInstruction: 'Swap to the parallel-polarized filter (marked ∥)',
    filterColor: 'Light grey filter — arrows aligned',
    desc: 'Surface-selective: shininess, oiliness, scaling, texture roughness',
    tip: 'Rotate the analyzer to align with the light polarizer (same angle).',
  },
]

const PREP_STEPS = [
  { icon: '🧼', title: 'Clean the area', desc: 'Gently cleanse the skin region you plan to image. Pat dry.' },
  { icon: '🌑', title: 'Darken the room', desc: 'Turn off ambient lights. The LED ring is your only light source for consistent results.' },
  { icon: '💡', title: 'Power the LED ring', desc: 'Activate the ring light on the module. Keep it on for all three captures.' },
  { icon: '🎨', title: 'Prepare the colour card', desc: 'Hold the grey reference card beside the skin area in every shot. It stays in frame for all three images — this is how we calibrate each scan.' },
  { icon: '📏', title: 'Set distance', desc: 'Hold the phone 15–20 cm from the skin. Keep the framing consistent across all three shots.' },
]

function QualityBadge({ pass, manual = false }: { pass: boolean; manual?: boolean }) {
  // A manual check that is not yet answered is pending, not failed — showing it
  // in red would read as "your photo is bad" when nothing is wrong with it.
  const tone = pass
    ? { bg: '#d1fae5', dot: '#10b981', text: '#065f46', label: 'Pass' }
    : manual
      ? { bg: '#eef0ff', dot: PRIMARY, text: '#3f3f8f', label: 'Confirm' }
      : { bg: '#fee2e2', dot: '#ef4444', text: '#991b1b', label: 'Review' }
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full shrink-0" style={{ background: tone.bg }}>
      <div className="rounded-full" style={{ width: 6, height: 6, background: tone.dot }} />
      <span style={{ fontSize: 10, fontWeight: 600, color: tone.text }}>{tone.label}</span>
    </div>
  )
}

function ScanScreen({
  nav,
  initialStep = 'prep',
  onStepChange,
  onComplete,
}: {
  nav: (s: Screen) => void
  initialStep?: ScanStep
  onStepChange?: (step: ScanStep) => void
  onComplete: (scan: Scan) => void
}) {
  const [step, setStep] = useState<ScanStep>(initialStep)
  const [prepChecked, setPrepChecked] = useState<boolean[]>(Array(PREP_STEPS.length).fill(false))
  const [uploads, setUploads] = useState<(string | null)[]>(Array(CHANNELS.length).fill(null))
  const [activeChannel, setActiveChannel] = useState(0)
  const [progress, setProgress] = useState(0)
  const [stats, setStats] = useState<ImageStats[] | null>(null)
  const [measuring, setMeasuring] = useState(false)
  const [measureError, setMeasureError] = useState<string | null>(null)
  const [cardConfirmed, setCardConfirmed] = useState(false)
  const animRef = useRef<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  /** Object URLs this screen owns, so they can be released if it unmounts. */
  const ownedUrls = useRef<string[]>([])

  // The shell needs the current step to decide whether the tab bar is safe to show.
  useEffect(() => { onStepChange?.(step) }, [step, onStepChange])

  useEffect(() => () => {
    cancelAnimationFrame(animRef.current)
    ownedUrls.current.forEach((u) => URL.revokeObjectURL(u))
  }, [])

  const allPrepDone = prepChecked.every(Boolean)
  const allUploaded = uploads.every(Boolean)
  const uploadedCount = uploads.filter(Boolean).length

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    ownedUrls.current.push(url)
    setUploads((prev) => {
      const next = [...prev]
      const replaced = next[activeChannel]
      if (replaced) {
        URL.revokeObjectURL(replaced)
        ownedUrls.current = ownedUrls.current.filter((u) => u !== replaced)
      }
      next[activeChannel] = url
      return next
    })
    // Re-measuring is driven off `uploads`, so drop the stale reading.
    setStats(null)
    const nextEmpty = uploads.findIndex((u, i) => i > activeChannel && i < CHANNELS.length && !u)
    if (nextEmpty !== -1) setActiveChannel(nextEmpty)
    e.target.value = ''
  }

  // Read the pixels once all channels are in and the user reaches the gate.
  useEffect(() => {
    if (step !== 'quality') return
    const srcs = uploads.filter(Boolean) as string[]
    if (srcs.length !== CHANNELS.length) return
    let cancelled = false
    setMeasuring(true)
    setMeasureError(null)
    measureAll(srcs)
      .then((result) => { if (!cancelled) { setStats(result); setMeasuring(false) } })
      .catch((err: Error) => { if (!cancelled) { setMeasureError(err.message); setMeasuring(false) } })
    return () => { cancelled = true }
  }, [step, uploads])

  const checks: QualityCheck[] = stats
    ? [
      ...runQualityChecks(stats, CHANNELS.length),
      {
        key: 'card',
        label: 'Colour reference card',
        detail: cardConfirmed
          ? 'Confirmed in frame for all three channels'
          : 'Tap to confirm the grey card is in frame — this is the one check pixels cannot make for you',
        pass: cardConfirmed,
        manual: true,
      },
    ]
    : []
  const canAnalyze = checks.length > 0 && checks.every((c) => c.pass)

  const startAnalysis = () => {
    if (!stats || !canAnalyze) return
    setStep('analyzing')
    let p = 0
    const tick = () => {
      p += 0.6
      setProgress(Math.min(p, 100))
      if (p < 100) {
        animRef.current = requestAnimationFrame(tick)
      } else {
        setTimeout(() => {
          const scan = createScan(deriveMetrics(stats), uploads.filter(Boolean) as string[])
          // The saved scan owns these URLs now, so this screen must not revoke them.
          ownedUrls.current = []
          onComplete(scan)
        }, 400)
      }
    }
    animRef.current = requestAnimationFrame(tick)
  }

  // ── Prep ────────────────────────────────────────────────────────────────────
  if (step === 'prep') {
    return (
      <div className="flex flex-col size-full bg-[#f8f9fe]">
        <StatusBar />
        <div className="flex items-center px-5 pb-3 gap-3">
          <button onClick={() => nav('home')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#1f2024" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex-1">
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1f2024' }}>Setup Checklist</p>
            <p style={{ fontSize: 10, color: '#8f9098' }}>{prepChecked.filter(Boolean).length} of {PREP_STEPS.length} steps done</p>
          </div>
          {/* Step indicator */}
          <div className="flex gap-1">
            {(['prep','upload','quality','result'] as const).map((s) => (
              <div key={s} className="rounded-full" style={{ width: 6, height: 6, background: step === s ? PRIMARY : '#e0e7ff' }} />
            ))}
          </div>
        </div>

        {/* Module illustration */}
        <div
          className="mx-5 mb-4 rounded-2xl p-4 flex items-center gap-4"
          style={{ background: `linear-gradient(135deg, ${PRIMARY}15 0%, #6b8ff815 100%)`, border: `1px solid ${PRIMARY}30` }}
        >
          <div
            className="flex items-center justify-center rounded-2xl shrink-0"
            style={{ width: 56, height: 56, background: `linear-gradient(135deg, ${PRIMARY} 0%, #6b8ff8 100%)` }}
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="10" stroke="white" strokeWidth="2" />
              <circle cx="16" cy="16" r="6" stroke="white" strokeWidth="1.5" />
              <circle cx="16" cy="16" r="2.5" fill="white" />
              <path d="M6 16H2M26 16H30M16 6V2M16 26V30" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#1f2024' }}>Clip-on Optical Module</p>
            <p style={{ fontSize: 11, color: '#71727a', marginTop: 2, lineHeight: '15px' }}>
              Attach to front-facing camera before starting. You'll swap filters between shots.
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-3">
          {PREP_STEPS.map((s, i) => (
            <button
              key={i}
              className="flex items-start gap-3 p-4 rounded-2xl text-left transition-all"
              style={{
                background: prepChecked[i] ? '#f0fdf4' : 'white',
                border: prepChecked[i] ? '1.5px solid #86efac' : '1.5px solid transparent',
              }}
              onClick={() => setPrepChecked((prev) => { const n = [...prev]; n[i] = !n[i]; return n })}
            >
              <div
                className="flex items-center justify-center rounded-full shrink-0 transition-all"
                style={{ width: 28, height: 28, background: prepChecked[i] ? '#10b981' : '#f0f0f5', marginTop: 1 }}
              >
                {prepChecked[i] ? (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l3.5 3.5L13 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span style={{ fontSize: 14 }}>{s.icon}</span>
                )}
              </div>
              <div className="flex-1">
                <p style={{ fontSize: 13, fontWeight: 600, color: prepChecked[i] ? '#065f46' : '#1f2024' }}>{s.title}</p>
                <p style={{ fontSize: 11, color: '#71727a', marginTop: 2, lineHeight: '15px' }}>{s.desc}</p>
              </div>
            </button>
          ))}

          <button
            className="w-full flex items-center justify-center rounded-xl mt-2 transition-opacity"
            style={{ height: 56, background: allPrepDone ? PRIMARY : '#c5c6cc', opacity: allPrepDone ? 1 : 0.6 }}
            disabled={!allPrepDone}
            onClick={() => setStep('upload')}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>
              {allPrepDone ? 'Continue to Upload Images →' : `Complete all ${PREP_STEPS.length} steps to continue`}
            </span>
          </button>
        </div>
      </div>
    )
  }

  // ── Upload ───────────────────────────────────────────────────────────────────
  if (step === 'upload') {
    const safeChannel = Math.min(activeChannel, CHANNELS.length - 1)
    const ch = CHANNELS[safeChannel]

    return (
      <div className="flex flex-col size-full bg-[#f8f9fe]">
        <StatusBar />
        <div className="flex items-center px-5 pb-3 gap-3">
          <button onClick={() => setStep('prep')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#1f2024" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex-1">
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1f2024' }}>Upload Images</p>
            <p style={{ fontSize: 10, color: '#8f9098' }}>{uploadedCount} of {CHANNELS.length} channels uploaded</p>
          </div>
          <div className="flex gap-1">
            {(['prep','upload','quality','result'] as const).map((s, i) => (
              <div key={s} className="rounded-full" style={{ width: 6, height: 6, background: step === s ? PRIMARY : i < 1 ? '#10b981' : '#e0e7ff' }} />
            ))}
          </div>
        </div>

        {/* Channel selector pills */}
        <div className="flex gap-2 px-5 mb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {CHANNELS.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setActiveChannel(i)}
              className="flex items-center gap-1.5 px-3 rounded-full shrink-0 transition-all"
              style={{
                height: 32,
                background: activeChannel === i ? c.color : uploads[i] ? '#f0fdf4' : 'white',
                border: activeChannel === i ? 'none' : uploads[i] ? '1.5px solid #86efac' : '1.5px solid #e0e0e8',
              }}
            >
              {uploads[i] && activeChannel !== i && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l2.5 2.5L10 4" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              <span style={{ fontSize: 11, fontWeight: 600, color: activeChannel === i ? 'white' : uploads[i] ? '#065f46' : '#1f2024', whiteSpace: 'nowrap' }}>
                {i + 1}. {c.label.split('/')[0].trim()}
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-4">
          {/* Colour card reminder */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: '#fef9ee', border: '1.5px solid #fcd34d' }}
          >
            <span style={{ fontSize: 20 }}>🎨</span>
            <p style={{ fontSize: 11, color: '#92400e', lineHeight: '15px' }}>
              <strong>Hold the grey reference card beside the skin area in every shot.</strong> It must appear in all three images for calibration to work.
            </p>
          </div>

          {/* Channel detail card */}
          <div
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: ch.bgLight, border: `1.5px solid ${ch.color}40` }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex items-center justify-center rounded-xl shrink-0"
                style={{ width: 44, height: 44, background: ch.color, color: 'white' }}
              >
                {ch.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1f2024' }}>{ch.label}</p>
                  <span style={{ fontSize: 9, fontWeight: 600, color: ch.color, background: `${ch.color}20`, borderRadius: 6, padding: '2px 6px' }}>{ch.tag}</span>
                </div>
                <p style={{ fontSize: 11, color: '#71727a', marginTop: 3, lineHeight: '15px' }}>{ch.desc}</p>
              </div>
            </div>

            {/* Filter instruction */}
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'white' }}>
              <div
                className="flex items-center justify-center rounded-lg shrink-0"
                style={{ width: 36, height: 36, background: `${ch.color}15` }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke={ch.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#1f2024' }}>Filter Setup</p>
                <p style={{ fontSize: 11, color: '#71727a', marginTop: 1 }}>{ch.filterInstruction}</p>
                <p style={{ fontSize: 10, color: ch.color, fontWeight: 600, marginTop: 2 }}>{ch.filterColor}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: `${ch.color}10` }}>
              <span style={{ fontSize: 13 }}>💡</span>
              <p style={{ fontSize: 11, color: '#1f2024', lineHeight: '15px' }}>{ch.tip}</p>
            </div>
          </div>

          {/* Upload zone */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {uploads[activeChannel] ? (
            <div className="flex flex-col gap-3">
              <div
                className="rounded-2xl overflow-hidden relative"
                style={{ height: 180 }}
              >
                <img src={uploads[activeChannel]!} alt="" className="size-full object-cover" />
                <div className="absolute inset-0 flex items-end p-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.6)' }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3.5 3.5L13 5" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ fontSize: 11, color: 'white', fontWeight: 600 }}>{ch.label} uploaded</span>
                  </div>
                </div>
              </div>
              <button
                className="w-full flex items-center justify-center gap-2 rounded-xl"
                style={{ height: 44, background: 'white', border: `1.5px solid ${ch.color}` }}
                onClick={() => fileInputRef.current?.click()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke={ch.color} strokeWidth="2" />
                  <circle cx="12" cy="13" r="4" stroke={ch.color} strokeWidth="2" />
                </svg>
                <span style={{ fontSize: 12, fontWeight: 600, color: ch.color }}>Replace Image</span>
              </button>
            </div>
          ) : (
            <button
              className="w-full flex flex-col items-center justify-center gap-3 rounded-2xl"
              style={{ height: 180, background: 'white', border: `2px dashed ${ch.color}50` }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div
                className="flex items-center justify-center rounded-2xl"
                style={{ width: 56, height: 56, background: ch.bgLight }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke={ch.color} strokeWidth="2" strokeLinecap="round" />
                  <polyline points="17 8 12 3 7 8" stroke={ch.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="3" x2="12" y2="15" stroke={ch.color} strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="text-center">
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1f2024' }}>Choose from Gallery</p>
                <p style={{ fontSize: 11, color: '#8f9098', marginTop: 3 }}>Upload {ch.label} image</p>
              </div>
            </button>
          )}

          {/* Progress strip */}
          <div className="flex gap-2">
            {CHANNELS.map((c, i) => (
              <div key={c.id} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-full"
                  style={{ height: 4, background: uploads[i] ? c.color : '#e0e0e8' }}
                />
                <span style={{ fontSize: 9, color: uploads[i] ? c.color : '#c5c6cc', fontWeight: 600 }}>
                  {uploads[i] ? '✓' : i + 1}
                </span>
              </div>
            ))}
          </div>

          <button
            className="w-full flex items-center justify-center rounded-xl transition-opacity"
            style={{ height: 48, background: allUploaded ? PRIMARY : '#c5c6cc', opacity: allUploaded ? 1 : 0.6 }}
            disabled={!allUploaded}
            onClick={() => setStep('quality')}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>
              {allUploaded ? 'Continue to Quality Check →' : `${CHANNELS.length - uploadedCount} image${CHANNELS.length - uploadedCount > 1 ? 's' : ''} remaining`}
            </span>
          </button>
        </div>
      </div>
    )
  }

  // ── Quality Check ────────────────────────────────────────────────────────────
  if (step === 'quality') {
    return (
      <div className="flex flex-col size-full bg-[#f8f9fe]">
        <StatusBar />
        <div className="flex items-center px-5 pb-3 gap-3">
          <button onClick={() => setStep('upload')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#1f2024" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex-1">
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1f2024' }}>Image Quality Check</p>
            <p style={{ fontSize: 10, color: '#8f9098' }}>
              {measuring ? 'Reading your images…' : canAnalyze ? 'All checks passed' : 'Review before analysis'}
            </p>
          </div>
          <div className="flex gap-1">
            {(['prep','upload','quality','result'] as const).map((s, i) => (
              <div key={s} className="rounded-full" style={{ width: 6, height: 6, background: step === s ? PRIMARY : i < 2 ? '#10b981' : '#e0e7ff' }} />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-4">
          {/* Thumbnail strip */}
          <div className="flex gap-2">
            {CHANNELS.map((c, i) => (
              <div
                key={c.id}
                className="flex-1 rounded-xl overflow-hidden relative"
                style={{ height: 72, background: '#f0f0f8' }}
              >
                {uploads[i] && <img src={uploads[i]!} alt="" className="size-full object-cover" />}
                <div
                  className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-1.5 py-1"
                  style={{ background: 'rgba(0,0,0,0.55)' }}
                >
                  <span style={{ fontSize: 8, color: 'white', fontWeight: 600 }}>{i + 1}</span>
                  <div className="rounded-full" style={{ width: 6, height: 6, background: c.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Quality checks — measured from the uploaded pixels, not hard-coded */}
          <div className="bg-white rounded-2xl overflow-hidden">
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1f2024' }}>Automated Checks</p>
              {stats && (
                <span style={{ fontSize: 10, color: '#8f9098' }}>
                  {checks.filter((c) => c.pass).length}/{checks.length} passed
                </span>
              )}
            </div>

            {measureError && (
              <div className="px-4 pb-4">
                <p style={{ fontSize: 11, color: '#991b1b' }}>Could not read the images: {measureError}</p>
              </div>
            )}

            {!measuring && !measureError && !stats && (
              <div className="px-4 pb-4 flex flex-col gap-3">
                <p style={{ fontSize: 11, color: '#8f9098', lineHeight: '15px' }}>
                  Nothing to check yet — all {CHANNELS.length} channel images have to be in before the
                  gate can read them.
                </p>
                <button
                  className="w-full flex items-center justify-center rounded-xl"
                  style={{ height: 40, background: 'white', border: `1.5px solid ${PRIMARY}` }}
                  onClick={() => setStep('upload')}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: PRIMARY }}>Back to upload</span>
                </button>
              </div>
            )}

            {measuring && !measureError && (
              <div className="px-4 pb-4 flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="rounded-lg" style={{ height: 40, background: '#f4f4f8' }} />
                ))}
              </div>
            )}

            {!measuring && checks.map((c, i) => (
              <button
                key={c.key}
                className="flex items-center gap-3 px-4 w-full text-left"
                style={{ height: 60, borderTop: i === 0 ? 'none' : '1px solid #f0f0f5', cursor: c.manual ? 'pointer' : 'default' }}
                onClick={c.manual ? () => setCardConfirmed((v) => !v) : undefined}
                disabled={!c.manual}
              >
                <div
                  className="flex items-center justify-center rounded-full shrink-0"
                  style={{ width: 32, height: 32, background: c.pass ? '#d1fae5' : c.manual ? '#eef0ff' : '#fee2e2' }}
                >
                  {c.pass ? (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3.5 3.5L13 5" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : c.manual ? (
                    <div className="rounded-full" style={{ width: 14, height: 14, border: `2px solid ${PRIMARY}` }} />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M4 4l8 8M12 4l-8 8" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#1f2024' }}>{c.label}</p>
                  <p style={{ fontSize: 10, color: '#8f9098', marginTop: 1, lineHeight: '13px' }}>{c.detail}</p>
                </div>
                <QualityBadge pass={c.pass} manual={c.manual} />
              </button>
            ))}
          </div>

          {/* Note */}
          <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: '#fffbeb', border: '1.5px solid #fcd34d' }}>
            <span style={{ fontSize: 16 }}>ℹ️</span>
            <p style={{ fontSize: 11, color: '#78350f', lineHeight: '15px' }}>
              This report is <strong>non-diagnostic</strong>. It shows optical features only — redness area, boundary clarity, surface shine, texture roughness, and repeatability. It is not a medical assessment.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              className="w-full flex items-center justify-center rounded-xl transition-opacity"
              style={{ height: 48, background: canAnalyze ? PRIMARY : '#c5c6cc', opacity: canAnalyze ? 1 : 0.6 }}
              disabled={!canAnalyze}
              onClick={startAnalysis}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>
                {measuring
                  ? 'Checking images…'
                  : !stats
                    ? 'Waiting for all three channels'
                    : canAnalyze
                      ? 'Analyze Images'
                      : `Resolve ${checks.filter((c) => !c.pass).length} issue${checks.filter((c) => !c.pass).length === 1 ? '' : 's'} to continue`}
              </span>
            </button>
            {!measuring && !canAnalyze && checks.some((c) => !c.pass && !c.manual) && (
              <button
                className="w-full flex items-center justify-center rounded-xl"
                style={{ height: 44, background: 'white', border: `1.5px solid ${PRIMARY}` }}
                onClick={() => setStep('upload')}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: PRIMARY }}>Re-shoot the flagged channel</span>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Analyzing ────────────────────────────────────────────────────────────────
  if (step === 'analyzing') {
    const analysisTasks = [
      { label: 'Loading RGB channel…', threshold: 10, channel: CHANNELS[0].color },
      { label: 'Extracting cross-polarized signal…', threshold: 30, channel: CHANNELS[1].color },
      { label: 'Mapping surface texture (parallel-pol)…', threshold: 55, channel: CHANNELS[2].color },
      { label: 'Calibrating colour card reference…', threshold: 70, channel: '#10b981' },
      { label: 'Computing redness area…', threshold: 80, channel: '#ef4444' },
      { label: 'Scoring boundary clarity…', threshold: 88, channel: '#f59e0b' },
      { label: 'Measuring surface shine index…', threshold: 94, channel: '#0ea5e9' },
      { label: 'Generating longitudinal report…', threshold: 100, channel: PRIMARY },
    ]

    return (
      <div className="flex flex-col size-full" style={{ background: '#07070f' }}>
        <StatusBar light />
        <div className="flex items-center px-5 pb-4 gap-3">
          <p style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>Multi-channel Analysis</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-between px-6 pb-8">
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
            Do not close the app
          </p>
          {/* Circular progress */}
          <div className="flex flex-col items-center gap-6">
            <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
              <svg width="200" height="200" viewBox="0 0 200 200" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle
                  cx="100" cy="100" r="88" fill="none"
                  stroke={PRIMARY} strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                  style={{ transition: 'stroke-dashoffset 0.04s linear' }}
                />
              </svg>
              {/* Four channel arcs */}
              {CHANNELS.map((c, i) => {
                const r = 68
                const segAngle = 360 / 4
                const startDeg = i * segAngle - 90
                const endDeg = startDeg + segAngle - 4
                const toRad = (d: number) => (d * Math.PI) / 180
                const x1 = 100 + r * Math.cos(toRad(startDeg))
                const y1 = 100 + r * Math.sin(toRad(startDeg))
                const x2 = 100 + r * Math.cos(toRad(endDeg))
                const y2 = 100 + r * Math.sin(toRad(endDeg))
                const lit = progress >= (i + 1) * 25
                return (
                  <svg key={c.id} width="200" height="200" viewBox="0 0 200 200" style={{ position: 'absolute' }}>
                    <path
                      d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                      fill="none" stroke={lit ? c.color : 'rgba(255,255,255,0.08)'} strokeWidth="5" strokeLinecap="round"
                    />
                  </svg>
                )
              })}
              <div className="flex flex-col items-center gap-0.5">
                <p style={{ fontSize: 44, fontWeight: 900, color: 'white', lineHeight: 1 }}>{Math.round(progress)}%</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>processing</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full" style={{ maxWidth: 280 }}>
              {analysisTasks.map((task) => {
                const done = progress >= task.threshold
                return (
                  <div key={task.label} className="flex items-center gap-2.5">
                    <div
                      className="rounded-full shrink-0 transition-all"
                      style={{ width: 8, height: 8, background: done ? task.channel : 'rgba(255,255,255,0.12)' }}
                    />
                    <span style={{ fontSize: 11, color: done ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.28)', transition: 'color 0.3s' }}>
                      {task.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          <div />
        </div>
      </div>
    )
  }

  // The finished report is no longer a step of this wizard — it is a screen of
  // its own (ReportScreen), reached both from here and from history.
  return null
}

// ─── Report ───────────────────────────────────────────────────────────────────

function EmptyReport({ nav }: { nav: (s: Screen) => void }) {
  return (
    <div className="flex flex-col items-center justify-center size-full bg-[#f8f9fe] px-8 gap-4">
      <p style={{ fontSize: 15, fontWeight: 700, color: '#1f2024' }}>No report yet</p>
      <p style={{ fontSize: 12, color: '#71727a', textAlign: 'center', lineHeight: '17px' }}>
        Run a scan and the optical feature report will appear here.
      </p>
      <button
        className="flex items-center justify-center rounded-xl px-6"
        style={{ height: 44, background: PRIMARY }}
        onClick={() => nav('scan')}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>Start a scan</span>
      </button>
    </div>
  )
}

function ReportScreen({
  scan,
  scans,
  onBack,
  onNewScan,
}: {
  scan: Scan
  scans: Scan[]
  onBack: () => void
  onNewScan: () => void
}) {
  const score = scoreFromMetrics(scan.metrics)
  const delta = scoreDelta(scans, scan)
  const prev = previousScan(scans, scan.id)

  return (
    <div className="flex flex-col size-full bg-[#f8f9fe]">
      <StatusBar />
      <div className="flex items-center px-5 pb-3 gap-3">
        <button onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="#1f2024" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#1f2024' }}>Optical Feature Report</p>
        <span
          className="ml-auto px-2 py-0.5 rounded-full"
          style={{ fontSize: 10, fontWeight: 600, background: '#fef3c7', color: '#92400e' }}
        >
          Non-diagnostic
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-4">
        {/* Header score */}
        <div
          className="rounded-3xl p-5 flex items-center gap-4"
          style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, #6b8ff8 100%)` }}
        >
          <div className="flex flex-col gap-1 flex-1">
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Optical Scan Score</p>
            <div className="flex items-baseline gap-1.5">
              <p style={{ fontSize: 52, fontWeight: 900, color: 'white', lineHeight: 1 }}>{score}</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>/100</p>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
              {delta === null
                ? `First scan · ${formatDate(scan.takenAt)}`
                : `${delta >= 0 ? '↑ +' : '↓ '}${delta} from last scan · ${formatDate(scan.takenAt)}`}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {CHANNELS.map((c) => (
              <div key={c.id} className="flex items-center gap-1.5">
                <div className="rounded-full" style={{ width: 6, height: 6, background: c.color }} />
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>{c.label.split('/')[0].trim()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="bg-white rounded-2xl p-4 flex flex-col gap-3">
          <p style={{ fontSize: 13, fontWeight: 700, color: '#1f2024' }}>Optical Feature Metrics</p>
          {METRIC_DEFS.map((def) => {
            const value = scan.metrics[def.key]
            const before = prev ? prev.metrics[def.key] : null
            const change = before === null ? null : value - before
            const improved = change === null
              ? null
              : def.betterWhen === 'higher' ? change >= 0 : change <= 0
            return (
              <div key={def.key} className="flex flex-col gap-1.5 p-3 rounded-xl" style={{ background: '#f8f9fe' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#1f2024' }}>{def.label}</p>
                    <p style={{ fontSize: 10, color: '#8f9098', marginTop: 1, lineHeight: '13px' }}>{def.desc}</p>
                  </div>
                  <div className="flex items-baseline gap-1 ml-3 shrink-0">
                    <span style={{ fontSize: 20, fontWeight: 800, color: def.color }}>{value}</span>
                    <span style={{ fontSize: 10, color: '#8f9098' }}>{def.unit}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, background: '#e8e9f1' }}>
                    <div className="h-full rounded-full" style={{ width: `${value}%`, background: def.color }} />
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      minWidth: 26,
                      textAlign: 'right',
                      color: change === null ? '#8f9098' : improved ? '#10b981' : '#ef4444',
                    }}
                  >
                    {change === null ? '—' : `${change > 0 ? '+' : ''}${change}`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Channel thumbnails */}
        <div className="bg-white rounded-2xl p-4 flex flex-col gap-3">
          <p style={{ fontSize: 13, fontWeight: 700, color: '#1f2024' }}>Captured Images</p>
          <div className="grid grid-cols-3 gap-2">
            {CHANNELS.map((c, i) => (
              <div key={c.id} className="flex flex-col gap-1">
                <div className="rounded-xl overflow-hidden" style={{ height: 64, background: '#f0f0f8' }}>
                  {scan.thumbs[i] && <img src={scan.thumbs[i]} alt="" className="size-full object-cover" />}
                </div>
                <div className="flex items-center gap-1">
                  <div className="rounded-full shrink-0" style={{ width: 5, height: 5, background: c.color }} />
                  <span style={{ fontSize: 8, color: '#8f9098', lineHeight: '11px' }}>{c.label.split('/')[0].trim()}</span>
                </div>
              </div>
            ))}
          </div>
          {!scan.thumbs.length && (
            <p style={{ fontSize: 10, color: '#8f9098' }}>
              Images from this session are no longer stored on the device.
            </p>
          )}
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: '#fffbeb', border: '1.5px solid #fcd34d' }}>
          <span style={{ fontSize: 14 }}>⚠️</span>
          <p style={{ fontSize: 10, color: '#78350f', lineHeight: '14px' }}>
            This is an optical feature analysis only. It does not constitute a medical diagnosis. Consult a licensed dermatologist for clinical evaluation.
          </p>
        </div>

        <button
          className="w-full flex items-center justify-center rounded-xl"
          style={{ height: 48, background: 'white', border: `1.5px solid ${PRIMARY}` }}
          onClick={onNewScan}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: PRIMARY }}>Run another scan</span>
        </button>
      </div>
    </div>
  )
}

// ─── History ──────────────────────────────────────────────────────────────────

/**
 * One screen, three views of the same list. "Face Visited" used to be a separate
 * destination showing a third set of totals that disagreed with both this screen
 * and Profile; it is now the Grid tab, reading the same scans as everything else.
 */
function HistoryScreen({
  scans,
  nav,
  onOpenReport,
}: {
  scans: Scan[]
  nav: (s: Screen) => void
  onOpenReport: (id: string) => void
}) {
  const [tab, setTab] = useState<'list' | 'chart' | 'grid'>('list')
  const ordered = useMemo(() => byNewest(scans), [scans])
  const avg = averageScore(scans)

  if (!scans.length) {
    return (
      <div className="flex flex-col size-full bg-[#f8f9fe]">
        <StatusBar />
        <div className="px-5 pb-4">
          <p style={{ fontSize: 18, fontWeight: 700, color: '#1f2024' }}>History</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-3">
          <div className="flex items-center justify-center rounded-full" style={{ width: 64, height: 64, background: '#e8e9f1' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#8f9098" strokeWidth="2" />
              <polyline points="12,6 12,12 16,14" stroke="#8f9098" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1f2024' }}>No scans yet</p>
          <p style={{ fontSize: 12, color: '#71727a', textAlign: 'center', lineHeight: '17px' }}>
            Your first scan sets the baseline. Everything after it is measured against that.
          </p>
          <button
            className="flex items-center justify-center rounded-xl px-6 mt-2"
            style={{ height: 44, background: PRIMARY }}
            onClick={() => nav('scan')}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>Run first scan</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col size-full bg-[#f8f9fe]">
      <StatusBar />
      <div className="flex items-center justify-between px-5 pb-4">
        <p style={{ fontSize: 18, fontWeight: 700, color: '#1f2024' }}>History</p>
        <div className="flex items-center justify-center rounded-xl px-3" style={{ height: 30, background: '#e8e9f1' }}>
          <span style={{ fontSize: 11, color: '#1f2024' }}>{scans.length} scans · avg {avg}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex mx-5 mb-4 p-1 rounded-xl gap-1" style={{ background: '#e8e9f1' }}>
        {([['list', 'List'], ['chart', 'Trend'], ['grid', 'Grid']] as const).map(([t, label]) => (
          <button
            key={t}
            className="flex-1 flex items-center justify-center rounded-lg"
            style={{ height: 32, background: tab === t ? 'white' : 'transparent' }}
            onClick={() => setTab(t)}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: tab === t ? '#1f2024' : '#8f9098' }}>{label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-3">
        {tab === 'list' && ordered.map((scan) => {
          const score = scoreFromMetrics(scan.metrics)
          const delta = scoreDelta(scans, scan)
          return (
            <button
              key={scan.id}
              className="bg-white rounded-2xl p-4 flex items-center gap-4 w-full text-left"
              onClick={() => onOpenReport(scan.id)}
            >
              <div
                className="flex items-center justify-center rounded-xl shrink-0 overflow-hidden"
                style={{ width: 52, height: 52, background: '#f0f0f8' }}
              >
                {scan.thumbs[0]
                  ? <img src={scan.thumbs[0]} alt="" className="size-full object-cover" />
                  : <p style={{ fontSize: 22, fontWeight: 900, color: PRIMARY }}>{score}</p>}
              </div>
              <div className="flex-1">
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1f2024' }}>{formatDate(scan.takenAt)}</p>
                <p style={{ fontSize: 11, color: '#8f9098', marginTop: 2 }}>
                  {formatTime(scan.takenAt)} · score {score}
                </p>
              </div>
              {delta !== null && (
                <span
                  style={{
                    fontSize: 11, fontWeight: 600, paddingInline: 6, paddingBlock: 2, borderRadius: 8,
                    color: delta >= 0 ? '#16a34a' : '#dc2626',
                    background: delta >= 0 ? '#dcfce7' : '#fee2e2',
                  }}
                >
                  {delta > 0 ? '+' : ''}{delta}
                </span>
              )}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path d="M9 6l6 6-6 6" stroke="#c5c6cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )
        })}

        {tab === 'chart' && (() => {
          const series = [...ordered].reverse()
          const scores = series.map((s) => scoreFromMetrics(s.metrics))
          // Scale to the data with a little headroom, instead of the fixed
          // 70-90 window the mock assumed — that clipped any real score.
          const lo = Math.max(0, Math.min(...scores) - 6)
          const hi = Math.min(100, Math.max(...scores) + 6)
          const span = Math.max(1, hi - lo)
          return (
            <div className="bg-white rounded-2xl p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1f2024' }}>Score Trend</p>
                <span style={{ fontSize: 10, color: '#8f9098' }}>{lo}–{hi}</span>
              </div>
              <div className="flex items-end gap-2" style={{ height: 140 }}>
                {series.map((scan, i) => (
                  <button
                    key={scan.id}
                    className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
                    onClick={() => onOpenReport(scan.id)}
                  >
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#1f2024' }}>{scores[i]}</span>
                    <div
                      className="rounded-t-lg w-full transition-all"
                      style={{
                        height: `${Math.max(4, ((scores[i] - lo) / span) * 100)}%`,
                        background: `linear-gradient(to top, ${PRIMARY}, #6b8ff8)`,
                      }}
                    />
                    <span style={{ fontSize: 9, color: '#8f9098' }}>{formatShortDate(scan.takenAt)}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })()}

        {tab === 'grid' && (
          <div className="grid grid-cols-3 gap-3">
            {ordered.map((scan) => (
              <button
                key={scan.id}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl"
                style={{ background: 'white' }}
                onClick={() => onOpenReport(scan.id)}
              >
                <div
                  className="flex items-center justify-center rounded-full overflow-hidden"
                  style={{ width: 60, height: 60, background: '#f0f0f8' }}
                >
                  {scan.thumbs[0] ? (
                    <img src={scan.thumbs[0]} alt="" className="size-full object-cover" />
                  ) : (
                    <svg width="28" height="36" viewBox="0 0 40 50" fill="none">
                      <ellipse cx="20" cy="20" rx="14" ry="16" fill="#d4d6e0" />
                      <ellipse cx="20" cy="45" rx="18" ry="10" fill="#d4d6e0" />
                    </svg>
                  )}
                </div>
                <p style={{ fontSize: 16, fontWeight: 800, color: PRIMARY }}>{scoreFromMetrics(scan.metrics)}</p>
                <p style={{ fontSize: 9, color: '#8f9098', textAlign: 'center' }}>{formatShortDate(scan.takenAt)}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Profile ──────────────────────────────────────────────────────────────────
function ProfileScreen({ nav, scans }: { nav: (s: Screen) => void; scans: Scan[] }) {
  // Every figure here used to be a literal, and disagreed with History.
  const avg = averageScore(scans)
  const best = bestScore(scans)
  const recent = byNewest(scans).slice(0, 3)
  return (
    <div className="flex flex-col size-full bg-[#f8f9fe]">
      <StatusBar />
      <div className="flex items-center justify-between px-5 pb-4">
        <p style={{ fontSize: 18, fontWeight: 700, color: '#1f2024' }}>Profile</p>
        <button
          className="flex items-center justify-center rounded-full size-9"
          style={{ background: '#e8e9f1' }}
          onClick={() => nav('settings')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="#8f9098" strokeWidth="2" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="#8f9098" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-4">
        {/* Avatar + stats */}
        <div className="bg-white rounded-3xl p-5 flex flex-col items-center gap-3">
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 80, height: 80, background: '#e8e9f1' }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="#8f9098" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="7" r="4" stroke="#8f9098" strokeWidth="2" />
            </svg>
          </div>
          <div className="text-center">
            <p style={{ fontSize: 16, fontWeight: 700, color: '#1f2024' }}>Ava Johnson</p>
            <p style={{ fontSize: 12, color: '#8f9098', marginTop: 2 }}>ava.johnson@email.com</p>
          </div>
          <div className="flex gap-6 mt-1">
            {[
              { label: 'Scans', value: String(scans.length) },
              { label: 'Avg Score', value: avg === null ? '—' : String(avg) },
              { label: 'Best', value: best === null ? '—' : String(best) },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <p style={{ fontSize: 20, fontWeight: 800, color: PRIMARY }}>{s.value}</p>
                <p style={{ fontSize: 10, color: '#8f9098' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Info fields — only name, email, age */}
        <div className="bg-white rounded-2xl overflow-hidden">
          {[
            { label: 'Full Name', value: 'Ava Johnson' },
            { label: 'Email', value: 'ava.johnson@email.com' },
            { label: 'Age', value: '28' },
          ].map((f, i, arr) => (
            <div
              key={f.label}
              className="flex items-center justify-between px-4"
              style={{ height: 52, borderBottom: i < arr.length - 1 ? '1px solid #f0f0f5' : 'none' }}
            >
              <span style={{ fontSize: 12, color: '#8f9098' }}>{f.label}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#1f2024' }}>{f.value}</span>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-2xl p-4 flex flex-col gap-3">
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1f2024' }}>Recent Activity</p>
          {recent.length === 0 && (
            <p style={{ fontSize: 11, color: '#8f9098' }}>Nothing yet — your scans will show up here.</p>
          )}
          {recent.map((scan) => {
            const delta = scoreDelta(scans, scan)
            return (
              <div key={scan.id} className="flex items-center gap-3">
                <div className="size-8 rounded-full flex items-center justify-center shrink-0" style={{ background: '#f0f0f8' }}>
                  <span style={{ fontSize: 14 }}>🧴</span>
                </div>
                <div className="flex-1">
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#1f2024' }}>Skin Scan Completed</p>
                  <p style={{ fontSize: 10, color: '#8f9098' }}>
                    {formatDate(scan.takenAt)} · Score: {scoreFromMetrics(scan.metrics)}
                  </p>
                </div>
                {delta !== null && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: delta >= 0 ? '#16a34a' : '#dc2626' }}>
                    {delta > 0 ? '+' : ''}{delta}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function SettingsScreen({
  nav,
  navToLocation,
  onSignOut,
}: {
  nav: (s: Screen) => void
  navToLocation: () => void
  onSignOut: () => void
}) {
  const [notifs, setNotifs] = useState(true)
  const [autoScan, setAutoScan] = useState(false)
  const [editName, setEditName] = useState('Ava Johnson')
  const [editEmail, setEditEmail] = useState('ava.johnson@email.com')
  const [editAge, setEditAge] = useState('28')
  const [editing, setEditing] = useState(false)

  const Toggle = ({ value, onToggle }: { value: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className="flex items-center rounded-full transition-all"
      style={{
        width: 44, height: 24,
        background: value ? PRIMARY : '#d1d5db',
        padding: 3,
        justifyContent: value ? 'flex-end' : 'flex-start',
      }}
    >
      <div className="rounded-full bg-white" style={{ width: 18, height: 18 }} />
    </button>
  )

  return (
    <div className="flex flex-col size-full bg-[#f8f9fe]">
      <StatusBar />
      <div className="flex items-center px-5 pb-4 gap-3">
        <button onClick={() => nav('profile')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="#1f2024" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#1f2024' }}>Settings</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-3">
        {/* Edit Profile */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <p style={{ fontSize: 11, fontWeight: 600, color: '#8f9098', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Edit Profile</p>
            <button onClick={() => setEditing(!editing)}>
              <span style={{ fontSize: 12, fontWeight: 600, color: PRIMARY }}>{editing ? 'Save' : 'Edit'}</span>
            </button>
          </div>
          {[
            { label: 'Full Name', value: editName, setter: setEditName },
            { label: 'Email', value: editEmail, setter: setEditEmail },
            { label: 'Age', value: editAge, setter: setEditAge },
          ].map((f, i, arr) => (
            <div
              key={f.label}
              className="flex items-center justify-between px-4"
              style={{ height: 52, borderBottom: i < arr.length - 1 ? '1px solid #f0f0f5' : 'none' }}
            >
              <span style={{ fontSize: 12, color: '#8f9098', width: 70, flexShrink: 0 }}>{f.label}</span>
              {editing ? (
                <input
                  className="flex-1 text-right outline-none bg-transparent"
                  style={{ fontSize: 13, color: '#1f2024', fontWeight: 500 }}
                  value={f.value}
                  onChange={(e) => f.setter(e.target.value)}
                />
              ) : (
                <span style={{ fontSize: 13, fontWeight: 500, color: '#1f2024' }}>{f.value}</span>
              )}
            </div>
          ))}
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="px-4 pt-3 pb-1">
            <p style={{ fontSize: 11, fontWeight: 600, color: '#8f9098', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Preferences</p>
          </div>
          {[
            { label: 'Notifications', toggle: notifs, onToggle: () => setNotifs(!notifs) },
            { label: 'Auto Scan Reminder', toggle: autoScan, onToggle: () => setAutoScan(!autoScan) },
          ].map((item, i, arr) => (
            <div
              key={item.label}
              className="flex items-center justify-between px-4"
              style={{ height: 52, borderBottom: i < arr.length - 1 ? '1px solid #f0f0f5' : 'none' }}
            >
              <span style={{ fontSize: 13, color: '#1f2024' }}>{item.label}</span>
              <Toggle value={item.toggle} onToggle={item.onToggle} />
            </div>
          ))}
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="px-4 pt-3 pb-1">
            <p style={{ fontSize: 11, fontWeight: 600, color: '#8f9098', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Location</p>
          </div>
          <button
            className="w-full flex items-center justify-between px-4"
            style={{ height: 52 }}
            onClick={navToLocation}
          >
            <span style={{ fontSize: 13, color: '#1f2024' }}>Manage Location</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="#c5c6cc" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* About */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="px-4 pt-3 pb-1">
            <p style={{ fontSize: 11, fontWeight: 600, color: '#8f9098', letterSpacing: '0.8px', textTransform: 'uppercase' }}>About</p>
          </div>
          {[
            { label: 'Privacy Policy' },
            { label: 'Terms of Service' },
            { label: 'Help & Support' },
          ].map((item, i, arr) => (
            <button
              key={item.label}
              className="w-full flex items-center justify-between px-4"
              style={{ height: 52, borderBottom: i < arr.length - 1 ? '1px solid #f0f0f5' : 'none' }}
            >
              <span style={{ fontSize: 13, color: '#1f2024' }}>{item.label}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="#c5c6cc" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          className="w-full flex items-center justify-center rounded-2xl"
          style={{ height: 52, background: 'white', border: '1px solid #fee2e2' }}
          onClick={onSignOut}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>Log Out</span>
        </button>
      </div>
    </div>
  )
}

// ─── Location ─────────────────────────────────────────────────────────────────
function LocationScreen({ nav, from = 'home' }: { nav: (s: Screen) => void; from?: Screen }) {
  const [enabled, setEnabled] = useState(true)
  const [selected, setSelected] = useState('New York, US')
  const locations = ['New York, US', 'Los Angeles, US', 'London, UK', 'Tokyo, Japan', 'Sydney, Australia']

  return (
    <div className="flex flex-col size-full bg-[#f8f9fe]">
      <StatusBar />
      <div className="flex items-center px-5 pb-4 gap-3">
        <button onClick={() => nav(from)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="#1f2024" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#1f2024' }}>Location</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-4">
        <div className="bg-white rounded-2xl p-4 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1f2024' }}>Location Services</p>
            <p style={{ fontSize: 11, color: '#8f9098' }}>Enable to get local UV index data</p>
          </div>
          <button
            className="flex items-center rounded-full transition-all"
            style={{ width: 44, height: 24, background: enabled ? PRIMARY : '#d1d5db', padding: 3, justifyContent: enabled ? 'flex-end' : 'flex-start' }}
            onClick={() => setEnabled(!enabled)}
          >
            <div className="rounded-full bg-white" style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="px-4 pt-3 pb-1">
            <p style={{ fontSize: 11, fontWeight: 600, color: '#8f9098', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Select Location</p>
          </div>
          {locations.map((loc, i) => (
            <button
              key={loc}
              className="w-full flex items-center justify-between px-4"
              style={{ height: 52, borderBottom: i < locations.length - 1 ? '1px solid #f0f0f5' : 'none' }}
              onClick={() => setSelected(loc)}
            >
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 16 }}>📍</span>
                <span style={{ fontSize: 13, color: '#1f2024' }}>{loc}</span>
              </div>
              {selected === loc && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke={PRIMARY} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* UV Info card */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-2"
          style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, #6b8ff8 100%)` }}
        >
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>Current UV Index · {selected}</p>
          <p style={{ fontSize: 32, fontWeight: 900, color: 'white', lineHeight: 1 }}>7.2</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>High — Wear SPF 50+</p>
        </div>

        <button
          className="w-full flex items-center justify-center rounded-xl"
          style={{ height: 48, background: PRIMARY }}
          onClick={() => nav(from)}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>Save Location</span>
        </button>
      </div>
    </div>
  )
}

// ─── App Shell ────────────────────────────────────────────────────────────────

export default function App({ initialScreen }: { initialScreen?: Screen } = {}) {
  const [screen, setScreen] = useState<Screen>(initialScreen ?? 'splash')
  const [locationFrom, setLocationFrom] = useState<Screen>('home')

  // Scan history lives here so every screen reads the same list. A deep link
  // (?screen=home) skips sign-in, so it gets the sample account.
  const [scans, setScans] = useState<Scan[]>(initialScreen ? SEED_SCANS : [])
  const [scanStep, setScanStep] = useState<ScanStep>('prep')
  const [openScanId, setOpenScanId] = useState<string | null>(null)
  const [reportFrom, setReportFrom] = useState<Screen>('home')

  const nav = (s: Screen) => setScreen(s)
  const navToLocation = (from: Screen) => { setLocationFrom(from); setScreen('location') }

  const openReport = (id: string, from: Screen) => {
    setOpenScanId(id)
    setReportFrom(from)
    setScreen('report')
  }

  /** Signing in to the sample account loads demo history; a new account starts empty. */
  const signIn = (withHistory: boolean) => {
    setScans(withHistory ? SEED_SCANS : [])
    setScreen('home')
  }

  const signOut = () => {
    setScans([])
    setOpenScanId(null)
    setScreen('login')
  }

  const completeScan = (scan: Scan) => {
    setScans((prev) => [...prev, scan])
    setOpenScanId(scan.id)
    setReportFrom('home')
    setScreen('report')
  }

  // The tab bar stays up on browsing destinations and on the first step of the
  // scan wizard, where there is nothing to lose yet. It hides once images are in
  // flight so a stray tab tap cannot discard an upload mid-flow.
  const showNav =
    screen === 'home' ||
    screen === 'history' ||
    screen === 'profile' ||
    screen === 'settings' ||
    screen === 'report' ||
    ((screen === 'scan' || screen === 'scan-prep') && scanStep === 'prep')

  const activeTab: Screen = screen === 'settings'
    ? 'profile'
    : screen === 'report'
      ? (reportFrom === 'history' ? 'history' : 'home')
      : screen.startsWith('scan')
        ? 'scan'
        : screen

  const renderScreen = () => {
    if (screen === 'splash') return <SplashScreen onDone={() => setScreen('onboard1')} />
    if (screen === 'onboard1' || screen === 'onboard2' || screen === 'onboard3') {
      const idx = screen === 'onboard1' ? 0 : screen === 'onboard2' ? 1 : 2
      return (
        <OnboardingScreen
          index={idx}
          onNext={() => {
            if (idx < 2) nav((['onboard1', 'onboard2', 'onboard3'] as Screen[])[idx + 1])
            else nav('login')
          }}
          onSkip={() => nav('login')}
        />
      )
    }
    if (screen === 'login') return <LoginScreen nav={nav} onSignIn={() => signIn(true)} />
    if (screen === 'signup') return <SignUpScreen nav={nav} onSignUp={() => signIn(false)} />
    if (screen === 'home') {
      return (
        <HomeScreen
          nav={nav}
          navToLocation={() => navToLocation('home')}
          scans={scans}
          onOpenReport={(id) => openReport(id, 'home')}
        />
      )
    }
    if (screen === 'scan' || screen.startsWith('scan-')) {
      const step: ScanStep =
        screen === 'scan-upload' ? 'upload'
          : screen === 'scan-quality' ? 'quality'
            : screen === 'scan-analyzing' ? 'analyzing'
              : 'prep'
      return (
        <ScanScreen
          nav={nav}
          initialStep={step}
          onStepChange={setScanStep}
          onComplete={completeScan}
        />
      )
    }
    if (screen === 'report') {
      const scan = scans.find((s) => s.id === openScanId) ?? latestScan(scans)
      if (!scan) return <EmptyReport nav={nav} />
      return (
        <ReportScreen
          scan={scan}
          scans={scans}
          onBack={() => nav(reportFrom)}
          onNewScan={() => nav('scan')}
        />
      )
    }
    if (screen === 'history') {
      return <HistoryScreen scans={scans} nav={nav} onOpenReport={(id) => openReport(id, 'history')} />
    }
    if (screen === 'profile') return <ProfileScreen nav={nav} scans={scans} />
    if (screen === 'settings') {
      return (
        <SettingsScreen
          nav={nav}
          navToLocation={() => navToLocation('settings')}
          onSignOut={signOut}
        />
      )
    }
    if (screen === 'location') return <LocationScreen nav={nav} from={locationFrom} />
    return null
  }

  return (
    <div className="app-stage">
      {/* iPhone 15 Pro frame (collapses to full-screen on real phones — see index.css) */}
      <div className="phone-frame">
        {/* Dynamic Island */}
        <div
          className="phone-island absolute z-50 flex items-center justify-center"
          style={{
            top: 12, left: '50%', transform: 'translateX(-50%)',
            width: 126, height: 37, borderRadius: 20,
            background: '#0d0d0d',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full" style={{ width: 10, height: 10, background: '#1a1a1a' }} />
            <div className="rounded-full" style={{ width: 14, height: 14, background: '#1a1a1a', border: '1px solid #2a2a2a' }} />
          </div>
        </div>

        {/* Screen content */}
        <div className="phone-screen flex flex-col size-full overflow-hidden">
          <div className="flex flex-col flex-1 overflow-hidden relative">
            {renderScreen()}
          </div>
          {showNav && <BottomNav active={activeTab} nav={nav} />}
        </div>

        {/* Home indicator */}
        <div
          className="phone-home absolute bottom-2 left-1/2"
          style={{ transform: 'translateX(-50%)', width: 134, height: 5, borderRadius: 3, background: '#d1d5db' }}
        />
      </div>
    </div>
  )
}
