import { Link } from 'react-router-dom';
import './Courses.css';

const coursesData = [
  {
    id: 'jezyk-polski',
    title: 'Język polski podstawowy',
    description: 'Opanujesz pisanie wypracowań pod klucz CKE i zrozumiesz lektury tak, by trafiać w punkt w każdym zadaniu.',
    lessons: 99,
    tasks: 3859,
    rating: 4.9,
    students: '9.578',
    theme: 'var(--blue-pale)',
    wip: true
  },
  {
    id: 'matematyka',
    title: 'Matematyka podstawowa',
    description: 'Poznasz schematy i metody, które pozwolą Ci szybko i pewnie rozwiązywać zadania z każdego działu.',
    lessons: 93,
    tasks: 1333,
    rating: 4.8,
    students: '8.237',
    theme: 'var(--cream)'
  },
  {
    id: 'jezyk-angielski',
    title: 'Angielski podstawowy',
    description: 'Kurs pozwoli Ci opanować kompetencje językowe i pokaże Ci, jak podejść do matury z angielskiego.',
    lessons: 120,
    tasks: 1219,
    rating: 4.8,
    students: '7.297',
    theme: 'var(--bg-light)',
    wip: true
  }
];

export default function Courses() {
  return (
    <div className="courses-page">
      <div className="container">
        <header className="courses-page__header">
          <h1 className="courses-page__title">
            Darmowe Kursy Matrualne<br/>
            <span className="highlight">Gwarantują Zdanie Egzaminu</span>
          </h1>
        </header>

        <div className="courses-grid">
          {coursesData.map(course => {
            const CardWrapper = course.wip ? 'div' : Link;
            // Omijamy problem z typowaniem dynamicznego komponentu rzutując 'to' na cokolwiek lub używając 'as any'
            const wrapperProps: any = course.wip ? {} : { to: `/kursy/${course.id}` };

            return (
              <CardWrapper {...wrapperProps} className={`course-card ${course.wip ? 'course-card--wip' : ''}`} key={course.id} style={{ textDecoration: 'none' }}>
                {course.wip && (
                  <div className="course-card__wip-overlay">
                    <span className="course-card__wip-badge">Wkrótce!</span>
                  </div>
                )}
                
                <div className="course-card__thumbnail" style={{ background: `linear-gradient(135deg, ${course.theme} 0%, var(--surface-alt) 100%)` }}>
                  <span className="course-card__play-icon">▶</span>
                </div>
                
                <div className="course-card__content">
                  <div className="course-card__meta" style={{ opacity: course.wip ? 0.5 : 1 }}>
                    {course.lessons} lekcji · {course.tasks} zadań · ⭐ ({course.rating})
                  </div>
                  
                  <h3 className="course-card__title" style={{ textDecoration: course.wip ? 'line-through' : 'none', opacity: course.wip ? 0.6 : 1 }}>
                    {course.title}
                  </h3>
                  <p className="course-card__desc" style={{ opacity: course.wip ? 0.5 : 1 }}>
                    {course.description}
                  </p>
                  
                  <div className="course-card__social" style={{ opacity: course.wip ? 0.5 : 1 }}>
                    <div className="avatars">
                      <div className="avatar" style={{ background: '#FFC8A2' }}></div>
                      <div className="avatar" style={{ background: '#A2E1FF' }}></div>
                      <div className="avatar" style={{ background: '#E2A2FF' }}></div>
                      <div className="avatar" style={{ background: '#A2FFCD' }}></div>
                    </div>
                    <span className="social-text">+{course.students} osób {course.wip ? 'już czeka' : 'już się uczy'}</span>
                  </div>
                  
                  <div className="course-card__footer">
                    <div className="course-card__price-box">
                      <div className="current-price" style={{ color: 'var(--black)' }}>Darmowy</div>
                    </div>
                    <button 
                      className={`btn btn-sm ${course.wip ? 'btn-secondary' : 'btn-primary'}`} 
                      disabled={course.wip}
                      style={course.wip ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
                    >
                      {course.wip ? 'Prace trwają...' : 'Oglądaj od razu'}
                    </button>
                  </div>
                  
                  <div className="course-card__promo" style={{ opacity: course.wip ? 0.5 : 1 }}>
                    Dla wszystkich. <span className="promo-badge">Bez reklam w Premium</span>
                  </div>
                </div>
              </CardWrapper>
            );
          })}
        </div>
      </div>
    </div>
  );
}
