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
    theme: 'var(--blue-pale)'
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
    theme: 'var(--bg-light)'
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
          {coursesData.map(course => (
            <Link to={`/kursy/${course.id}`} className="course-card" key={course.id}>
              <div className="course-card__thumbnail" style={{ background: `linear-gradient(135deg, ${course.theme} 0%, var(--surface-alt) 100%)` }}>
                <span className="course-card__play-icon">▶</span>
              </div>
              
              <div className="course-card__content">
                <div className="course-card__meta">
                  {course.lessons} lekcji · {course.tasks} zadań · ⭐ ({course.rating})
                </div>
                
                <h3 className="course-card__title">{course.title}</h3>
                <p className="course-card__desc">{course.description}</p>
                
                <div className="course-card__social">
                  <div className="avatars">
                    <div className="avatar" style={{ background: '#FFC8A2' }}></div>
                    <div className="avatar" style={{ background: '#A2E1FF' }}></div>
                    <div className="avatar" style={{ background: '#E2A2FF' }}></div>
                    <div className="avatar" style={{ background: '#A2FFCD' }}></div>
                  </div>
                  <span className="social-text">+{course.students} osób już się uczy</span>
                </div>
                
                <div className="course-card__footer">
                  <div className="course-card__price-box">
                    <div className="current-price" style={{ color: 'var(--black)' }}>Darmowy</div>
                  </div>
                  <button className="btn btn-primary btn-sm">Oglądaj od razu</button>
                </div>
                
                <div className="course-card__promo">
                  Dla wszystkich. <span className="promo-badge">Bez reklam w Premium</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
