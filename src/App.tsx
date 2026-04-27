import { useState, useEffect } from 'react'
import './index.css'
import './App.css'
import logoFull from './assets/Extended_ScoreLab.png'

/* ── Navbar ────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="navbar__logo">
        <img src={logoFull} alt="ScoreLab" />
      </div>
      <div className="navbar__nav">
        <a href="#kursy">Kursy</a>
        <a href="#jak-to-dziala">Jak to działa</a>
        <a href="#cennik">Cennik</a>
        <a href="#opinie">Opinie</a>
      </div>
      <div className="navbar__actions">
        <span className="navbar__platform-label">Platforma</span>
      </div>
      <button className="hamburger" aria-label="Menu">
        <span /><span /><span />
      </button>
    </nav>
  )
}

/* ── Hero ──────────────────────────────────────────────────── */
function Hero() {
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
            <button id="hero-cta-start" className="btn btn-primary">
              Zacznij za darmo →
            </button>
            <button id="hero-cta-preview" className="btn btn-secondary">
              Podgląd kursu
            </button>
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

/* ── Features ──────────────────────────────────────────────── */
const featuresData = [
  {
    icon: '🎓',
    iconClass: 'feature-card__icon--blue',
    title: 'Lekcje video od eksperta',
    text: 'Jasne, zwięzłe wyjaśnienia każdego działu. Wróć do lekcji ile razy potrzebujesz, bez presji czasu.',
  },
  {
    icon: '✏️',
    iconClass: 'feature-card__icon--cream',
    title: 'Ćwiczenia krok po kroku',
    text: 'Setki zadań z pełnymi rozwiązaniami i wskazówkami. System inteligentnie dobiera trudność do Twojego poziomu.',
  },
  {
    icon: '📊',
    iconClass: 'feature-card__icon--green',
    title: 'Śledzenie postępów',
    text: 'Widzisz dokładnie, jakie działy opanowałeś, a gdzie masz luki. Planer nauki dostosowuje się do Twojego harmonogramu.',
  },
  {
    icon: '📝',
    iconClass: 'feature-card__icon--blue',
    title: 'Archiwum arkuszy CKE',
    text: 'Rozwiązuj oryginalne arkusze maturalne z lat 2010–2024. Pełne omówienia po każdym teście.',
  },
  {
    icon: '⚡',
    iconClass: 'feature-card__icon--cream',
    title: 'Szybkie powtórki',
    text: 'Karty powtórkowe i błyskawiczne quizy do nauki wzorów i reguł przed samym egzaminem.',
  },
  {
    icon: '💬',
    iconClass: 'feature-card__icon--green',
    title: 'Wsparcie społeczności',
    text: 'Grono uczniów i nauczycieli zawsze gotowe do pomocy. Forum, czat i live Q&A sesje co tydzień.',
  },
]

function Features() {
  return (
    <section className="features" id="kursy">
      <div className="container">
        <div className="features__header">
          <div className="section-label">Dlaczego ScoreLab?</div>
          <h2 className="section-title">Wszystko, czego<br />potrzebujesz do matury</h2>
          <p className="section-subtitle">
            Kompleksowa platforma zaprojektowana specjalnie pod wymagania egzaminu maturalnego z matematyki.
          </p>
        </div>
        <div className="features__grid">
          {featuresData.map((f) => (
            <div key={f.title} className="feature-card">
              <div className={`feature-card__icon ${f.iconClass}`}>{f.icon}</div>
              <h3 className="feature-card__title">{f.title}</h3>
              <p className="feature-card__text">{f.text}</p>
            </div>
          ))}
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

/* ── How it works ──────────────────────────────────────────── */
const steps = [
  { icon: '🔍', title: 'Zrób test poziomujący', text: 'Krótki test na starcie wskaże Twoje mocne strony i luki — bez oceniania, tylko po to, by uczyć się efektywniej.' },
  { icon: '📚', title: 'Oglądaj lekcje', text: 'Krótkie, konkretne lekcje wideo z podziałem na działy. Możesz wracać do nich w dowolnym momencie.' },
  { icon: '✏️', title: 'Rozwiązuj zadania', text: 'Tysiące zadań z pełnymi rozwiązaniami i wskazówkami. System wskazuje, co powtórzyć, jeśli popełnisz błąd.' },
  { icon: '🏆', title: 'Wejdź na maturę pewny', text: 'Symuluj prawdziwy egzamin na arkuszach CKE. Sprawdzaj, czy osiągnąłeś cel, zanim wejdziesz do sali.' },
]

function HowItWorks() {
  return (
    <section className="how-it-works" id="jak-to-dziala">
      <div className="container">
        <div className="section-label">Proces</div>
        <h2 className="section-title">Od zera do matury<br />w 4 krokach</h2>
        <p className="section-subtitle">Prosty system, który przeprowadzi Cię przez cały materiał — bez zbędnego stresu.</p>
        <div className="steps__grid">
          {steps.map((step, i) => (
            <div key={step.title} className="step-card">
              <div className="step-card__number">0{i + 1}</div>
              <div className="step-card__icon">{step.icon}</div>
              <h3 className="step-card__title">{step.title}</h3>
              <p className="step-card__text">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Pricing ───────────────────────────────────────────────── */
const plans = [
  {
    name: 'Bez logowania',
    price: 0,
    period: 'zawsze',
    badge: null,
    featured: false,
    features: [
      'Przeglądanie materiałów bez konta',
      'Dostęp do wybranych lekcji demo',
      'Darmowe arkusze CKE 2020–2024',
      'Test poziomujący',
    ],
    cta: 'Zacznij bez rejestracji',
    ctaClass: 'btn-secondary',
  },
  {
    name: 'Zalogowana',
    price: 0,
    period: 'zawsze',
    badge: 'Zalecany start',
    featured: true,
    features: [
      'Wszystko z planu Bez logowania',
      'Śledzenie postępów i statystyki',
      'Spersonalizowany plan nauki',
      'Forum społeczności',
      'Zapisywanie ulubionych materiałów',
      'Historia rozwiązanych zadań',
    ],
    cta: 'Załóż darmowe konto',
    ctaClass: 'btn-blue',
  },
  {
    name: 'Premium',
    price: 30,
    period: 'mies.',
    badge: null,
    featured: false,
    features: [
      'Wszystko z planu Zalogowana',
      'Pełny dostęp do wszystkich lekcji',
      'Live Q&A sesje z nauczycielem',
      'Priorytetowe wsparcie na czacie',
    ],
    cta: 'Wybierz Premium',
    ctaClass: 'btn-primary',
  },
]

function Pricing() {
  return (
    <section className="pricing" id="cennik">
      <div className="container">
        <div className="pricing__header">
          <div className="section-label">Cennik</div>
          <h2 className="section-title">Plan dla każdego</h2>
          <p className="section-subtitle">Zacznij za darmo, zapłać gdy zobaczysz efekty. Bez zobowiązań, cancel w dowolnej chwili.</p>
        </div>
        <div className="pricing__grid">
          {plans.map(plan => (
            <div key={plan.name} className={`pricing-card${plan.featured ? ' pricing-card--featured' : ''}`}>
              {plan.badge && <div className="pricing-card__badge">{plan.badge}</div>}
              <div className="pricing-card__name">{plan.name}</div>
              <div className="pricing-card__price">
                <span className="pricing-card__currency">zł</span>
                <span className="pricing-card__amount">{plan.price}</span>
                <span className="pricing-card__period">/{plan.period}</span>
              </div>
              <div className="pricing-card__divider" />
              <ul className="pricing-card__features">
                {plan.features.map(f => (
                  <li key={f} className="pricing-feature">
                    <span className="pricing-feature__check">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="pricing-card__cta">
                <button id={`pricing-btn-${plan.name.toLowerCase()}`} className={`btn ${plan.ctaClass}`}>{plan.cta}</button>
              </div>
            </div>
          ))}
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
        <div className="testimonials__grid">
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
      </div>
    </section>
  )
}

/* ── CTA Banner ────────────────────────────────────────────── */
function CTABanner() {
  return (
    <section className="cta-banner">
      <div className="container">
        <h2 className="cta-banner__title">Gotowy na 100%<br />z matmy?</h2>
        <p className="cta-banner__subtitle">Dołącz do ponad 2 400 uczniów. Pierwsze 7 dni za darmo — bez karty kredytowej.</p>
        <div className="cta-banner__actions">
          <button id="cta-start-free" className="btn btn-blue">Zacznij za darmo →</button>
          <button id="cta-view-plans" className="btn btn-secondary">Przeglądaj plany</button>
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
              <img src={logoFull} style={{filter: "invert(1)"}} alt="ScoreLab"/>
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
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <Bento />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <CTABanner />
      <Footer />
    </>
  )
}
