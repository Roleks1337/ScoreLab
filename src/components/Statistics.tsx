import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Statistics.css';

export default function Statistics() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="statistics-page">
        <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
          <h2>Ładowanie statystyk...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="statistics-page">
        <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
          <h2>Zaloguj się, aby zobaczyć swoje statystyki</h2>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>Wróć do strony głównej</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="statistics-page">
      <div className="container">
        <header className="stats-header">
          <h1 className="stats-header__welcome">Cześć, {user.user_metadata?.full_name || 'Użytkowniku'}! 👋</h1>
          <p className="stats-header__subtitle">Oto podsumowanie Twoich postępów w nauce.</p>
        </header>

        <div className="stats-grid">
          {/* Main Progress Card */}
          <div className="stats-card stats-card--main">
            <div className="progress-info">
              <h3>Twoja gotowość do matury</h3>
              <p>Na podstawie przerobionych lekcji i wyników z testów.</p>
            </div>
            <div className="progress-circle-container">
              <svg className="progress-circle-svg" width="120" height="120">
                <circle className="progress-circle-bg" cx="60" cy="60" r="45" />
                <circle className="progress-circle-fill" cx="60" cy="60" r="45" />
              </svg>
              <div className="progress-percentage">68%</div>
            </div>
          </div>

          {/* Activity Chart Card */}
          <div className="stats-card stats-card--chart">
            <div className="kpi-label">Aktywność w tym tygodniu</div>
            <div className="chart-placeholder">
              <div className="chart-bar" style={{ height: '40%' }} data-day="Pn" />
              <div className="chart-bar" style={{ height: '70%' }} data-day="Wt" />
              <div className="chart-bar" style={{ height: '55%' }} data-day="Śr" />
              <div className="chart-bar" style={{ height: '90%' }} data-day="Cz" />
              <div className="chart-bar" style={{ height: '30%' }} data-day="Pt" />
              <div className="chart-bar" style={{ height: '65%' }} data-day="Sb" />
              <div className="chart-bar" style={{ height: '45%' }} data-day="Nd" />
            </div>
          </div>

          {/* KPI Cards */}
          <div className="stats-card stats-card--kpi">
            <div className="kpi-label">Czas nauki</div>
            <div className="kpi-value">12h 45m</div>
          </div>
          <div className="stats-card stats-card--kpi">
            <div className="kpi-label">Rozwiązane zadania</div>
            <div className="kpi-value">142/350</div>
          </div>
          <div className="stats-card stats-card--kpi">
            <div className="kpi-label">Obejrzane lekcje</div>
            <div className="kpi-value">24/93</div>
          </div>
          <div className="stats-card stats-card--kpi">
            <div className="kpi-label">Zdobyte punkty</div>
            <div className="kpi-value">2,840 XP</div>
          </div>

          {/* Activity List */}
          <div className="stats-card stats-card--activity">
            <div className="kpi-label">Ostatnia aktywność</div>
            <div className="activity-list">
              {[
                { name: 'Funkcje kwadratowe - Podstawy', date: 'Dzisiaj, 14:20', icon: '📹' },
                { name: 'Trygonometria - Zadania maturalne', date: 'Wczoraj, 19:45', icon: '✏️' },
                { name: 'Ciągi arytmetyczne - Test', date: '12 maja, 16:10', icon: '📝' },
              ].map((item, i) => (
                <div key={i} className="activity-item">
                  <div className="activity-icon">{item.icon}</div>
                  <div className="activity-info">
                    <div className="activity-name">{item.name}</div>
                    <div className="activity-date">{item.date}</div>
                  </div>
                  <Link to="/kursy" className="activity-link">Kontynuuj →</Link>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="stats-card stats-card--skills">
            <div className="kpi-label">Mocne i słabe strony</div>
            <div className="skills-container">
              <div className="skill-list">
                <h4 style={{ color: '#2E7D32' }}>Wymiatasz w:</h4>
                <div className="skill-tag skill-tag--good">Funkcje</div>
                <div className="skill-tag skill-tag--good">Geometria</div>
                <div className="skill-tag skill-tag--good">Planimetria</div>
              </div>
              <div className="skill-list">
                <h4 style={{ color: '#C62828' }}>Do powtórki:</h4>
                <div className="skill-tag skill-tag--bad">Trygonometria</div>
                <div className="skill-tag skill-tag--bad">Stereometria</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
