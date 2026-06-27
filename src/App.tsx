import { useState, useEffect } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { usePremium } from './lib/usePremium'
import { useAdmin } from './lib/useAdmin'
import { useProfile } from './lib/useProfile'
import './index.css'
import './App.css'
import Pricing from './components/Pricing'
import Courses from './components/Courses'
import CoursePlayer from './components/CoursePlayer'
import HowItWorksPage from './components/HowItWorksPage'
import logoFull from './assets/Zasob1.svg'
import logoSmall from './assets/ScoreLabSmall.png'
import Settings from './components/Settings'
import Statistics from './components/Statistics'
import AdminPanel from './components/AdminPanel'

/* ── Navbar ────────────────────────────────────────────────── */
function Navbar({ user, isSettingsPage, isPremium, isAdmin, avatarUrl, displayName }: { user: any, isSettingsPage?: boolean, isPremium?: boolean, isAdmin?: boolean, avatarUrl?: string | null, displayName?: string | null }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const isHomePage = location.pathname === '/'
  const sectionHref = (sectionId: string) => (isHomePage ? `#${sectionId}` : `/#${sectionId}`)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsUserMenuOpen(false)
    navigate('/')
  }

  const handleLogoClick = () => {
    navigate('/')
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <nav className={`navbar${(scrolled || !isHomePage) ? ' scrolled' : ''}${menuOpen ? ' menu-open' : ''}${isSettingsPage ? ' navbar--settings' : ''}`}>
        <div
          className="navbar__logo"
          role="button"
          tabIndex={0}
          aria-label="Przejdź na stronę główną"
          onClick={handleLogoClick}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              handleLogoClick()
            }
          }}
        >
          <img className="logo--full invert-logo" src={logoFull} alt="ScoreLab" />
          <img className="logo--small" src={logoSmall} alt="ScoreLab" />
        </div>
        
        {!isSettingsPage && (
          <div className="navbar__nav">
            <Link to="/kursy">Kursy</Link>
            <Link to="/jak-to-dziala">Jak to działa</Link>
            <a href={sectionHref('opinie')}>Opinie</a>
            <Link to="/wip" className="navbar__support-link" style={{ color: 'var(--blue-light)', fontWeight: 700 }}>Wesprzyj</Link>
          </div>
        )}

        <div className="navbar__actions">
          {user ? (
            <div className="navbar__user-container">
              <div
                className={`navbar__avatar${isPremium ? ' navbar__avatar--premium' : ''}${isAdmin ? ' navbar__avatar--admin' : ''}${avatarUrl ? ' navbar__avatar--image' : ''}`}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                title={displayName || user.user_metadata?.full_name || user.email}
                style={avatarUrl ? { backgroundImage: `url(${avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
              >
                {!isAdmin && isPremium && <span className="navbar__avatar-crown">👑</span>}
                {!avatarUrl && (displayName?.charAt(0).toUpperCase() || user.user_metadata?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase())}
              </div>
              
              {isUserMenuOpen && (
                <>
                  <div className="user-menu-overlay" onClick={() => setIsUserMenuOpen(false)} />
                  <div className="user-dropdown">
                    <div className="user-dropdown__header">
                      <div className="user-dropdown__name">
                        {displayName || user.user_metadata?.full_name || 'Użytkownik'}
                        {isAdmin && <span className="user-dropdown__admin-badge">🛡️ Admin</span>}
                        {!isAdmin && isPremium && <span className="user-dropdown__premium-badge">👑 Premium</span>}
                      </div>
                      <div className="user-dropdown__email">{user.email}</div>
                    </div>
                    
                    <div className="user-dropdown__divider" />
                    
                    {isAdmin && (
                      <Link to="/admin" className="user-dropdown__item user-dropdown__item--admin" onClick={() => setIsUserMenuOpen(false)}>
                        <span className="user-dropdown__icon">🛡️</span> Panel Admina
                      </Link>
                    )}
                    <Link to="/cennik" className="user-dropdown__item user-dropdown__item--featured" onClick={() => setIsUserMenuOpen(false)}>
                      <span className="user-dropdown__icon">🚀</span> Panel Platformy
                    </Link>

                    <div className="user-dropdown__divider" />
                    
                    <Link to="/statystyki" className="user-dropdown__item" onClick={() => setIsUserMenuOpen(false)}>
                      <span className="user-dropdown__icon">📊</span> Statystyki
                    </Link>
                    <Link to="/ustawienia" className="user-dropdown__item" onClick={() => setIsUserMenuOpen(false)}>
                      <span className="user-dropdown__icon">⚙️</span> Customizuj konto
                    </Link>
                    
                    <div className="user-dropdown__divider" />
                    
                    <button className="user-dropdown__item user-dropdown__item--logout" onClick={handleLogout}>
                      <span className="user-dropdown__icon">🚪</span> Wyloguj się
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link className="navbar__platform-label" to="/cennik">Platforma</Link>
          )}
        </div>
        <button
          className={`hamburger${menuOpen ? ' hamburger--open' : ''}`}
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(prev => !prev)}
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* Mobile drawer */}
      <div className={`mobile-menu${menuOpen ? ' mobile-menu--open' : ''}`} aria-hidden={!menuOpen}>
        <nav className="mobile-menu__nav">
          {isSettingsPage ? (
            <>
              <Link to="/" onClick={closeMenu} style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--blue-light)', fontWeight: 700, fontSize: '15px' }}>
                <span>←</span> Wróć do strony głównej
              </Link>
              <div className="mobile-menu__header">Ustawienia użytkownika</div>
              <Link to="/ustawienia?tab=account" onClick={closeMenu}>Moje konto</Link>
              <Link to="/ustawienia?tab=privacy" onClick={closeMenu}>Prywatność i bezpieczeństwo</Link>
              
              <div className="mobile-menu__header" style={{ marginTop: '20px' }}>Premium</div>
              <Link to="/ustawienia?tab=premium" onClick={closeMenu}>Premium</Link>
              <Link to="/ustawienia?tab=premium-settings" onClick={closeMenu}>Ustawienia Premium</Link>
              
              <div className="mobile-menu__header" style={{ marginTop: '20px' }}>Ustawienia aplikacji</div>
              <Link to="/ustawienia?tab=appearance" onClick={closeMenu}>Wygląd</Link>
              <Link to="/ustawienia?tab=notifications" onClick={closeMenu}>Powiadomienia</Link>
            </>
          ) : (
            <>
              <Link to="/kursy" onClick={closeMenu}>Kursy</Link>
              <Link to="/jak-to-dziala" onClick={closeMenu}>Jak to działa</Link>
              <Link to="/cennik" onClick={closeMenu}>Cennik</Link>
              <a href={sectionHref('opinie')} onClick={closeMenu}>Opinie</a>
              <Link to="/wip" onClick={closeMenu} style={{ color: 'var(--blue-light)' }}>Wesprzyj</Link>
            </>
          )}
        </nav>
      </div>

      {/* Backdrop */}
      {menuOpen && <div className="mobile-menu__backdrop" onClick={closeMenu} />}
    </>
  )
}

/* ── Hero ──────────────────────────────────────────────────── */
function Hero({ user }: { user: any }) {
  return (
    <section className="hero" id="hero">
      <div className="hero__bg-blob hero__bg-blob--1" />
      <div className="hero__bg-blob hero__bg-blob--2" />
      <div className="container">
        {/* Left – text */}
        <div className="hero__content">
          <div className="hero__badge animate-fade-up">
            <span className="hero__badge-dot" />
            Dostępne już teraz · Matematyka maturalna
          </div>
          <h1 className="hero__title animate-fade-up delay-1">
            Ogarnij maturę<br />
            <span className="highlight">z matematyki</span><br />
            na 100%.
          </h1>
          <p className="hero__subtitle animate-fade-up delay-2">
            Interaktywne lekcje, ćwiczenia i arkusze maturalne w jednym miejscu.
            Ucz się we własnym tempie i sprawdzaj postępy na bieżąco.
          </p>
          <div className="hero__actions animate-fade-up delay-3">
            {user ? (
              <Link to="/kursy" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                Przejdź do kursów →
              </Link>
            ) : (
              <a href="#cennik" id="hero-cta-start" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                Zacznij za darmo →
              </a>
            )}
            <Link to="/kursy" id="hero-cta-preview" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              Podgląd kursu
            </Link>
          </div>
          <div className="hero__stats animate-fade-up delay-4">
            <div>
              <div className="hero__stat-value">+2400</div>
              <div className="hero__stat-label">Uczniów</div>
            </div>
            <div>
              <div className="hero__stat-value">98%</div>
              <div className="hero__stat-label">Zdawalność</div>
            </div>
            <div>
              <div className="hero__stat-value">4.9★</div>
              <div className="hero__stat-label">Ocena</div>
            </div>
          </div>
        </div>

        {/* Right – app mockup placeholder */}
        <div className="hero__visual animate-fade-up delay-2">
          <div className="hero__mockup-container">
            {/* Floating badges */}
            <div className="hero__floating-badge hero__fl oating-badge--1" style={{ zIndex: 10 }}>
              <div className="hero__floating-badge-icon">🎯</div>
              <div>
                <div className="hero__floating-badge-text">Zadanie rozwiązane!</div>
                <div className="hero__floating-badge-sub">+15 punktów</div>
              </div>
            </div>

            {/* Main card – VIDEO/SCREENSHOT placeholder */}
            <div className="hero__app-card">
              <div className="hero__placeholder">
                <div className="hero__placeholder-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
                <span>📹 Tutaj wjedzie demo aplikacji</span>
              </div>
            </div>

            <div className="hero__floating-badge hero__floating-badge--2">
              <div className="hero__floating-badge-icon">📈</div>
              <div>
                <div className="hero__floating-badge-text">Twój wynik rośnie</div>
                <div className="hero__floating-badge-sub">82% → 94%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Features Showcase ───────────────────────────────────────── */
const featuresData = [
  {
    icon: '🎓',
    title: 'Lekcje video od eksperta',
    text: 'Jasne, zwięzłe wyjaśnienia każdego działu. Wróć do lekcji ile razy potrzebujesz, bez presji czasu.',
    color: 'var(--blue-light)'
  },
  {
    icon: '✏️',
    title: 'Ćwiczenia krok po kroku',
    text: 'Setki zadań z pełnymi rozwiązaniami i wskazówkami. System inteligentnie dobiera trudność do Twojego poziomu.',
    color: '#FFBFA2'
  },
  {
    icon: '📊',
    title: 'Śledzenie postępów',
    text: 'Widzisz dokładnie, jakie działy opanowałeś, a gdzie masz luki. Planer nauki dostosowuje się do Twojego harmonogramu.',
    color: '#95E2B4'
  },
  {
    icon: '📝',
    title: 'Archiwum arkuszy CKE',
    text: 'Rozwiązuj oryginalne arkusze maturalne z lat 2010–2024. Pełne omówienia po każdym teście.',
    color: 'var(--blue-pale)'
  },
  {
    icon: '⚡',
    title: 'Szybkie powtórki',
    text: 'Karty powtórkowe i błyskawiczne quizy do nauki wzorów i reguł przed samym egzaminem.',
    color: 'var(--cream)'
  },
  {
    icon: '💬',
    title: 'Wsparcie społeczności',
    text: 'Grono uczniów i nauczycieli zawsze gotowe do pomocy. Forum, czat i live Q&A sesje co tydzień.',
    color: '#95E2B4'
  },
]

function Features() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="features-showcase" id="cechy">
      <div className="container">
        <div className="features-showcase__header">
          <div className="section-label">Dlaczego ScoreLab?</div>
          <h2 className="section-title">Wszystko, czego<br />potrzebujesz do matury</h2>
        </div>
        
        <div className="features-showcase__layout-horizontal">
          {/* Top Row: Tabs */}
          <div className="features-showcase__tabs">
            {featuresData.map((f, index) => {
              const isActive = index === activeIndex;
              return (
                <button 
                  key={f.title} 
                  className={`showcase-tab ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveIndex(index)}
                  style={{
                    backgroundColor: isActive ? 'var(--black)' : 'var(--white)',
                    color: isActive ? 'var(--white)' : 'var(--text-secondary)',
                    borderColor: isActive ? 'var(--black)' : 'var(--border)'
                  }}
                >
                  <span className="showcase-tab__title">{f.title}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Area: Visual */}
          <div className="features-showcase__visual-wide">
            <Link to="/kursy" className="showcase-visual-card-wide" style={{ textDecoration: 'none' }}>
              <div 
                className="showcase-visual-card-wide__bg" 
                style={{ 
                  background: `radial-gradient(circle at 80% 50%, ${featuresData[activeIndex].color} 0%, transparent 60%)` 
                }}
              />
              <div className="showcase-visual-card-wide__inner">
                <div className="showcase-visual-card-wide__text-content">
                  <h3 key={`title-${activeIndex}`}>{featuresData[activeIndex].title}</h3>
                  <p key={`text-${activeIndex}`}>{featuresData[activeIndex].text}</p>
                  <div className="showcase-visual-card-wide__cta">Zobacz kursy →</div>
                </div>
                <div 
                  className="showcase-visual-card-wide__icon"
                  key={`icon-${activeIndex}`}
                >
                  {featuresData[activeIndex].icon}
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Bento grid ────────────────────────────────────────────── */
function Bento() {
  return (
    <section className="bento">
      <div className="container">
        <div className="bento__header">
          <div className="section-label">Platforma</div>
          <h2 className="section-title">Nauka, która<br />naprawdę działa</h2>
        </div>
        <div className="bento__grid">

          {/* Wide – video placeholder */}
          <div className="bento-cell bento-cell--wide">
            <div className="bento-cell__inner">
              <div className="bento-cell__label">Lekcja video</div>
              <div className="bento-cell__title">Funkcje kwadratowe od podstaw</div>
              <p className="bento-cell__text">Kompletne omówienie działu — od definicji, przez wierzchołek, po zastosowania w zadaniach maturalnych.</p>
              {/* 📹 placeholder – tu wejdzie screen z lekcji */}
              <div className="bento-cell__media-placeholder">
                <div className="play-btn">▶</div>
                <span>Tutaj wejdzie screenshot/fragment lekcji video</span>
              </div>
            </div>
          </div>

          {/* Narrow – score stat */}
          <div className="bento-cell bento-cell--narrow" style={{ background: 'var(--black)' }}>
            <div className="bento-cell__inner">
              <div className="bento-cell__label" style={{ color: 'rgba(255,255,255,0.4)' }}>Średni wynik uczniów</div>
              <div className="score-display">
                <span className="score-number" style={{ color: 'var(--white)' }}>94</span>
                <span className="score-unit">%</span>
              </div>
              <div className="score-label">na maturze po ukończeniu kursu</div>
              <div className="math-symbols">
                {['∫', 'Δ', 'π', 'sin²+cos²', 'lim'].map(s => (
                  <span key={s} className="math-tag" style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Half – progress */}
          <div className="bento-cell bento-cell--half">
            <div className="bento-cell__inner">
              <div className="bento-cell__label">Postępy w kursie</div>
              <div className="bento-cell__title" style={{ fontSize: 'var(--text-xl)' }}>Twój plan nauki</div>
              <div className="progress-stat">
                {[
                  { label: 'Funkcje', pct: 85 },
                  { label: 'Trygonometria', pct: 62 },
                  { label: 'Geometria', pct: 40 },
                  { label: 'Rachunek różniczkowy', pct: 20 },
                ].map(item => (
                  <div key={item.label} className="progress-item">
                    <div className="progress-item__header">
                      <span>{item.label}</span>
                      <span>{item.pct}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar__fill" style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Half – arkusze CKE placeholder */}
          <div className="bento-cell bento-cell--half" style={{ background: 'linear-gradient(135deg, var(--blue-pale) 0%, var(--bg-light) 100%)' }}>
            <div className="bento-cell__inner">
              <div className="bento-cell__label">Arkusze CKE</div>
              <div className="bento-cell__title" style={{ fontSize: 'var(--text-xl)' }}>Matura 2024 – już dostępna</div>
              <p className="bento-cell__text">Pełne omówienie arkusza + nagranie z rozwiązywaniem zadań.</p>
              {/* 📷 placeholder – screen z interfejsu arkuszy */}
              <div className="bento-cell__media-placeholder" style={{ marginTop: 'auto', minHeight: '120px' }}>
                <span>📄 Tutaj wejdzie podgląd sekcji Arkusze CKE</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

/* ── Testimonials ──────────────────────────────────────────── */
const testimonials = [
  {
    stars: 5,
    text: '„Zacząłem od poziomu podstawowego i po 3 miesiącach z ScoreLab napisałem maturę na 92%. Polecam każdemu, kto nie lubi się uczyć z podręcznika."',
    initials: 'MK',
    name: 'Mateusz K.',
    meta: 'Matura 2024 · 92%',
  },
  {
    stars: 5,
    text: '„Wreszcie ktoś wytłumaczył funkcje tak, żebym rozumiała. Lekcje są krótkie i konkretne, nie tracę czasu na zbędną teorię. Świetna platforma!"',
    initials: 'ZN',
    name: 'Zofia N.',
    meta: 'Matura 2024 · 88%',
  },
  {
    stars: 5,
    text: '„Arkusze CKE z omówieniem to strzał w dziesiątkę. Przed maturą robiłam po jednym dziennie i dokładnie wiedziałam, czego się spodziewać na egzaminie."',
    initials: 'AP',
    name: 'Aleksandra P.',
    meta: 'Matura 2024 · 96%',
  },
  {
    stars: 5,
    text: '„Bardzo podoba mi się przejrzysty interfejs i system śledzenia postępów. Dzięki temu wiedziałem, na czym muszę się jeszcze skupić."',
    initials: 'JK',
    name: 'Jan K.',
    meta: 'Matura 2024 · 90%',
  },
  {
    stars: 4,
    text: '„Super sprawa z tymi krótkimi wideo. Mogłem uczyć się w drodze do szkoły. Zdecydowanie polecam każdemu maturzyście!"',
    initials: 'PW',
    name: 'Piotr W.',
    meta: 'Matura 2024 · 84%',
  },
  {
    stars: 5,
    text: '„Zawsze miałam problem z prawdopodobieństwem, ale po przerobieniu tego działu na ScoreLab nagle wszystko stało się logiczne."',
    initials: 'KW',
    name: 'Karolina W.',
    meta: 'Matura 2024 · 98%',
  },
  {
    stars: 5,
    text: '„Nie wierzyłem, że można się tak dobrze przygotować do matury przez internet. A jednak! Dziękuję całej ekipie ScoreLab."',
    initials: 'MD',
    name: 'Michał D.',
    meta: 'Matura 2024 · 100%',
  },
  {
    stars: 5,
    text: '„Najlepsza inwestycja przed maturą. Zamiast wydawać fortunę na korepetycje, miałam dostęp do świetnych materiałów 24/7."',
    initials: 'AL',
    name: 'Anna L.',
    meta: 'Matura 2024 · 94%',
  }
]

function Testimonials() {
  return (
    <section className="testimonials" id="opinie">
      <div className="container">
        <div className="testimonials__header">
          <div className="section-label">Opinie</div>
          <h2 className="section-title">Mówią o nas uczniowie</h2>
          <p className="section-subtitle">Ponad 2 400 osób zdało maturę z pomocą ScoreLab. Oto, co o nas mówią.</p>
        </div>
        <div className="testimonials__slider">
          <div className="testimonials__group">
            {testimonials.map(t => (
              <div key={t.name} className="testimonial-card">
                <div className="testimonial-card__stars">
                  {Array.from({ length: t.stars }).map((_, i) => <span key={i}>⭐</span>)}
                </div>
                <p className="testimonial-card__text">{t.text}</p>
                <div className="testimonial-card__author">
                  <div className="testimonial-card__avatar">{t.initials}</div>
                  <div>
                    <div className="testimonial-card__name">{t.name}</div>
                    <div className="testimonial-card__meta">{t.meta}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="testimonials__group" aria-hidden="true">
            {testimonials.map(t => (
              <div key={`${t.name}-copy`} className="testimonial-card">
                <div className="testimonial-card__stars">
                  {Array.from({ length: t.stars }).map((_, i) => <span key={i}>⭐</span>)}
                </div>
                <p className="testimonial-card__text">{t.text}</p>
                <div className="testimonial-card__author">
                  <div className="testimonial-card__avatar">{t.initials}</div>
                  <div>
                    <div className="testimonial-card__name">{t.name}</div>
                    <div className="testimonial-card__meta">{t.meta}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── FAQ ───────────────────────────────────────────────────── */
const faqData = [
  {
    question: 'Czy darmowe kursy obejmują całą wiedzę do matury?',
    answer: 'Tak, kursy są w 100% darmowe i zawierają kompleksową wiedzę potrzebną do zdania matury. Z kontem Premium oglądasz je bez reklam.'
  },
  {
    question: 'Jakie przedmioty są dostępne?',
    answer: 'Obecnie skupiamy się na matematyce, języku polskim i języku angielskim na poziomie podstawowym. Stale poszerzamy naszą ofertę.'
  },
  {
    question: 'Czy muszę zakładać konto, żeby się uczyć?',
    answer: 'Nie, wszystkie materiały wideo możesz przeglądać bez logowania. Darmowe konto przydaje się jednak do śledzenia postępów i rozwiązywania testów.'
  },
  {
    question: 'Co jeszcze daje status Premium?',
    answer: 'Oprócz braku reklam podczas oglądania lekcji wideo, zyskujesz dostęp do priorytetowej pomocy nauczycieli na naszym forum oraz ekskluzywnych arkuszy zadań.'
  }
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="faq" id="faq">
      <div className="container">
        <div className="faq__header">
          <div className="section-label">FAQ</div>
          <h2 className="section-title">Często zadawane pytania</h2>
          <p className="section-subtitle">Masz wątpliwości? Tutaj znajdziesz odpowiedzi na najpopularniejsze pytania.</p>
        </div>
        <div className="faq__list">
          {faqData.map((item, index) => (
            <div 
              key={index} 
              className={`faq__item ${openIndex === index ? 'faq__item--open' : ''}`}
            >
              <button className="faq__question" onClick={() => toggle(index)}>
                {item.question}
                <span className="faq__icon">{openIndex === index ? '−' : '+'}</span>
              </button>
              <div className="faq__answer">
                <p className="faq__answer-inner">{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── CTA Banner ────────────────────────────────────────────── */
function CTABanner({ user }: { user: any }) {
  return (
    <section className="cta-banner">
      <div className="container">
        <h2 className="cta-banner__title">
          {user ? 'Kontynuuj swoją naukę' : 'Gotowy na 100% z matmy?'}
        </h2>
        <p className="cta-banner__subtitle">
          {user ? 'Twoje postępy czekają. Wróć do lekcji i szlifuj swoje umiejętności.' : 'Dołącz do ponad 2 400 uczniów. Pierwsze 7 dni za darmo — bez karty kredytowej.'}
        </p>
        <div className="cta-banner__actions">
          {user ? (
            <Link to="/kursy" className="btn btn-blue" style={{ textDecoration: 'none' }}>Przejdź do kursów →</Link>
          ) : (
            <>
              <Link to="/cennik" id="cta-start-free" className="btn btn-blue" style={{ textDecoration: 'none' }}>Zacznij za darmo →</Link>
              <Link to="/cennik" id="cta-view-plans" className="btn btn-secondary" style={{ textDecoration: 'none' }}>Przeglądaj plany</Link>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

/* ── Footer ────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div>
            <div className="footer__logo">
              <img className="invert-logo" src={logoFull} alt="ScoreLab"/>
            </div>
            <p className="footer__tagline">
              Platforma maturalna nowej generacji. Ucz się świadomie, zdawaj pewnie.
            </p>
          </div>
          <div>
            <div className="footer__col-title">Kursy</div>
            <ul className="footer__links">
              <li><a href="#">Matematyka — Podstawa</a></li>
              <li><a href="#">Matematyka — Rozszerzenie</a></li>
              <li><a href="#">Arkusze CKE</a></li>
              <li><a href="#">Więcej wkrótce…</a></li>
            </ul>
          </div>
          <div>
            <div className="footer__col-title">Platforma</div>
            <ul className="footer__links">
              <li><a href="#">Jak to działa</a></li>
              <li><a href="#">Cennik</a></li>
              <li><a href="#">Dla szkół</a></li>
              <li><a href="#">Blog</a></li>
            </ul>
          </div>
          <div>
            <div className="footer__col-title">Firma</div>
            <ul className="footer__links">
              <li><a href="#">O nas</a></li>
              <li><a href="#">Kontakt</a></li>
              <li><a href="#">Polityka prywatności</a></li>
              <li><a href="#">Regulamin</a></li>
            </ul>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© 2024 ScoreLab. Wszelkie prawa zastrzeżone.</span>
          <span>Made with ❤️ in Poland</span>
        </div>
      </div>
    </footer>
  )
}

/* ── App ───────────────────────────────────────────────────── */
export default function App() {
  const [user, setUser] = useState<any>(null)
  const premium = usePremium(user?.id)
  const admin = useAdmin(user?.id)
  const { profile } = useProfile(user?.id)
  const avatarUrl = profile?.avatar_url ?? null
  const displayName = profile?.display_name ?? null

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <Navbar user={user} isPremium={premium.isPremium} isAdmin={admin.isAdmin} avatarUrl={avatarUrl} displayName={displayName} />
            <Hero user={user} />
            <Features />
            <Bento />
            <Testimonials />
            <FAQ />
            <CTABanner user={user} />
            <Footer />
          </>
        }
      />
      <Route
        path="/cennik"
        element={
          <>
            <Navbar user={user} isPremium={premium.isPremium} isAdmin={admin.isAdmin} avatarUrl={avatarUrl} displayName={displayName} />
            <Pricing user={user} isPremium={premium.isPremium} />
            <Footer />
          </>
        }
      />
      <Route
        path="/kursy"
        element={
          <>
            <Navbar user={user} isPremium={premium.isPremium} isAdmin={admin.isAdmin} avatarUrl={avatarUrl} displayName={displayName} />
            <Courses />
            <Footer />
          </>
        }
      />
      <Route
        path="/kursy/:courseId"
        element={
          <>
            <Navbar user={user} isPremium={premium.isPremium} isAdmin={admin.isAdmin} avatarUrl={avatarUrl} displayName={displayName} />
            <CoursePlayer />
            <Footer />
          </>
        }
      />
      <Route
        path="/wip"
        element={
          <>
            <Navbar user={user} isPremium={premium.isPremium} isAdmin={admin.isAdmin} avatarUrl={avatarUrl} displayName={displayName} />
            <div style={{ paddingTop: '150px', paddingBottom: '100px', textAlign: 'center', minHeight: '80vh', background: 'var(--surface-alt)' }}>
              <div className="container">
                <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '24px' }}>Work In Progress 🛠️</h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Ta strona jest w budowie. Wkrótce dodamy tutaj link do zbiórki,<br/>gdzie będziesz mógł wesprzeć rozwój ScoreLab!</p>
              </div>
            </div>
            <Footer />
          </>
        }
      />
      <Route
        path="/jak-to-dziala"
        element={
          <>
            <Navbar user={user} isPremium={premium.isPremium} isAdmin={admin.isAdmin} avatarUrl={avatarUrl} displayName={displayName} />
            <HowItWorksPage />
            <Footer />
          </>
        }
      />
      <Route
        path="/statystyki"
        element={
          <>
            <Navbar user={user} isPremium={premium.isPremium} isAdmin={admin.isAdmin} avatarUrl={avatarUrl} displayName={displayName} />
            <Statistics />
            <Footer />
          </>
        }
      />
      <Route
        path="/ustawienia"
        element={
          <>
            <Navbar user={user} isSettingsPage={true} isPremium={premium.isPremium} isAdmin={admin.isAdmin} avatarUrl={avatarUrl} displayName={displayName} />
            <Settings />
          </>
        }
      />
      <Route
        path="/admin"
        element={<AdminPanel />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
