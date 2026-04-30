import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthModal from './Register';

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
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'register' | 'login'>('register');

  const handleCtaClick = (planName: string) => {
    if (planName === 'Bez logowania') {
      navigate('/kursy');
    } else {
      setModalMode('register');
      setIsModalOpen(true);
    }
  };

  const switchMode = () => {
    setModalMode(prev => prev === 'register' ? 'login' : 'register');
  };

  return (
    <>
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
                <button 
                  id={`pricing-btn-${plan.name.toLowerCase()}`} 
                  className={`btn ${plan.ctaClass}`}
                  onClick={() => handleCtaClick(plan.name)}
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      </section>

      <AuthModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialMode={modalMode} 
      />
    </>
  )
}

export default Pricing ;