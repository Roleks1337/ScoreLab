import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HowItWorksPage.css'; // Dodamy nowe style tutaj

/* ── How it works (przeniesione z App.tsx) ───────────────────────── */
const steps = [
  { icon: '🚀', title: 'Włącz kurs', text: 'Wybierz dowolny materiał na platformie i zacznij przygotowania natychmiast. Wszystko jest w 100% darmowe i nie wymaga nawet zakładania konta!', color: 'var(--blue-light)' },
  { icon: '📚', title: 'Oglądaj lekcje ZA DARMO', text: 'Krótkie, konkretne lekcje wideo z podziałem na działy. Choć konto nie jest wymagane, po bezpłatnej rejestracji zapisujesz swoje postępy (a z Premium oglądasz bez reklam).', color: '#FFBFA2' },
  { icon: '✏️', title: 'Rozwiązuj zadania', text: 'Przerabiaj tysiące darmowych zadań z pełnymi rozwiązaniami. Posiadacze konta Premium zyskują tu dodatkowo dostęp do innowacyjnego generatora próbnych matur.', color: '#95E2B4' },
  { icon: '🏆', title: 'Dostań świetny wynik z matury', text: 'Dzięki naszym darmowym materiałom zyskujesz pełną wiedzę. Symuluj prawdziwy egzamin na arkuszach i wejdź na salę bez żadnego stresu.', color: 'var(--blue-pale)' },
]

function HowItWorks() {
  return (
    <section className="how-it-works" id="jak-to-dziala" style={{ padding: '100px 0' }}>
      <div className="container">
        <div className="section-label">Proces</div>
        <h2 className="section-title">Od zera do matury<br />w 4 krokach</h2>
        <p className="section-subtitle">Prosty system, który przeprowadzi Cię przez cały materiał — bez zbędnego stresu.</p>
        <div className="steps__grid">
          {steps.map((step, i) => (
            <div key={step.title} className="step-card" style={{ '--accent-color': step.color } as any}>
              <div className="step-card__number">0{i + 1}</div>
              <div className="step-card__icon" style={{ background: `rgba(${step.color.startsWith('var') ? '155, 202, 242' : '255, 255, 255'}, 0.1)` }}>{step.icon}</div>
              <h3 className="step-card__title">{step.title}</h3>
              <p className="step-card__text">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Platform Mission ──────────────────────────────────────────── */
function PlatformMission() {
  return (
    <section className="mission-section" style={{ paddingTop: '160px' }}>
      <div className="container">
        <div className="mission-content">
          <div className="mission-text">
            <div className="section-label">Nasza misja</div>
            <h2 className="section-title">Darmowa edukacja<br />dla każdego</h2>
            <p className="mission-description">
              Wierzymy, że dostęp do najwyższej jakości przygotowań do matury nie powinien zależeć od grubości portfela. Cały projekt ScoreLab jest w pełni darmowy i dostępny dla każdego, bez przymusu zakładania konta czy podpinania karty.
            </p>
            <div className="mission-economics">
              <h3>Z czego się utrzymujemy?</h3>
              <ul>
                <li><strong>Datki i Zbiórki</strong> – wsparcie od społeczności, która docenia naszą pracę.</li>
                <li><strong>Reklamy</strong> – wyświetlane niezalogowanym użytkownikom.</li>
                <li><strong>ScoreLab Premium</strong> – opcjonalny pakiet dla wymagających, który zdejmuje reklamy i odblokowuje zaawansowane narzędzia (jak Generator Matur AI).</li>
              </ul>
            </div>
            <Link to="/wip" className="btn btn-secondary" style={{ marginTop: '24px' }}>Wesprzyj projekt</Link>
          </div>
          <div className="mission-visual">
            <div className="mission-card-stack">
              <div className="mission-card mission-card--front">
                <span className="emoji">❤️</span>
                <h4>W 100% darmowe</h4>
                <p>Wiedza nie musi być luksusem.</p>
              </div>
              <div className="mission-card mission-card--back">
                <span className="emoji">🤝</span>
                <h4>Zbudowane przez nas, wspierane przez Was</h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── AI Exam Generator ─────────────────────────────────────────── */
function AIExamGenerator() {
  return (
    <section className="ai-generator-section">
      <div className="container">
        <div className="ai-content">
          <div className="ai-visual">
            <div className="ai-mockup">
              <div className="ai-mockup-header">
                <div className="dots"><span></span><span></span><span></span></div>
                <div className="title">Generator CKE - AI</div>
              </div>
              <div className="ai-mockup-body">
                <div className="ai-chat-bubble ai-chat-bubble--user">
                  Wygeneruj mi próbną maturę z wielomianów i ciągów.
                </div>
                <div className="ai-chat-bubble ai-chat-bubble--system">
                  <span className="ai-icon">✨</span>
                  Analizuję 20 lat arkuszy CKE... Generuję idealny zestaw...
                </div>
                <div className="ai-exam-preview">
                  <div className="exam-title">Matura Próbna: Wielomiany & Ciągi</div>
                  <div className="exam-meta">Zadań: 12 • Czas: 120 min</div>
                  <button className="btn btn-sm btn-primary mt-2">Rozwiąż arkusz</button>
                </div>
              </div>
            </div>
          </div>
          <div className="ai-text">
            <div className="section-label" style={{ color: 'var(--blue-light)', background: 'rgba(155, 202, 242, 0.1)' }}>ScoreLab Premium</div>
            <h2 className="section-title">Generator Matur AI</h2>
            <p className="ai-description">
              Posiadacze konta Premium mają dostęp do potężnego narzędzia opartego na sztucznej inteligencji, które analizuje tysiące zadań z arkuszy maturalnych z ostatnich 20 lat.
            </p>
            <ul className="ai-features">
              <li>
                <span className="icon">🎯</span>
                <div>
                  <strong>Spersonalizowane arkusze</strong>
                  <p>Wybierasz działy, z którymi masz problem, a AI układa idealną próbę.</p>
                </div>
              </li>
              <li>
                <span className="icon">🤖</span>
                <div>
                  <strong>Automatyczne sprawdzanie</strong>
                  <p>System oceni Twoje rozwiązanie krok po kroku, identyfikując błędy.</p>
                </div>
              </li>
              <li>
                <span className="icon">📈</span>
                <div>
                  <strong>Feedback i rekomendacje</strong>
                  <p>Dostajesz jasną odpowiedź, czego dokładnie musisz się jeszcze douczyć.</p>
                </div>
              </li>
            </ul>
            <Link to="/cennik" className="btn btn-blue" style={{ marginTop: '24px' }}>Sprawdź Premium</Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Main Page Component ───────────────────────────────────────── */
export default function HowItWorksPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="how-it-works-page">
      <PlatformMission />
      <HowItWorks />
      <AIExamGenerator />
    </div>
  )
}
