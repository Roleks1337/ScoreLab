import { useParams, Link } from 'react-router-dom';
import './Courses.css';

export default function CoursePlayer() {
  const { courseId } = useParams();

  // Mock data based on URL parameter
  const courseName = courseId === 'matematyka' ? 'Matematyka podstawowa' :
                     courseId === 'jezyk-polski' ? 'Język polski podstawowy' : 
                     'Angielski podstawowy';

  return (
    <div className="course-player-page">
      <div className="course-player__header">
        <div className="container">
          <Link to="/kursy" className="back-link">← Wróć do kursów</Link>
          <h2>{courseName}</h2>
        </div>
      </div>

      <div className="container">
        <div className="course-player__layout">
          {/* Main Content - Video */}
          <div className="course-player__main">
            <div className="course-player__video-placeholder">
              <div className="play-circle">▶</div>
              <p>Odtwarzacz wideo pojawi się tutaj</p>
            </div>
            
            <div className="course-player__tabs">
              <button className="tab active">Opis lekcji</button>
              <button className="tab">Zadania (15)</button>
              <button className="tab">Pliki PDF</button>
            </div>
            
            <div className="course-player__tab-content">
              <h3>Wprowadzenie do materiału</h3>
              <p>W tej lekcji dowiesz się najważniejszych rzeczy o danym temacie. Przygotuj zeszyt i długopis. Jeśli masz pytania, zostaw komentarz pod wideo.</p>
              
              <div className="placeholder-box">
                <span className="icon">📄</span>
                <div>
                  <h4>Materiały do pobrania</h4>
                  <p className="text-sm text-muted">Tutaj w przyszłości pojawią się notatki w PDF i arkusze zadań.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Playlist */}
          <div className="course-player__sidebar">
            <div className="playlist-header">
              <h3>Spis treści</h3>
              <span>2/99 ukończono</span>
            </div>
            
            <div className="playlist-modules">
              {/* Module 1 */}
              <div className="module open">
                <div className="module__header">
                  <h4>Moduł 1: Podstawy</h4>
                  <span>3 lekcje</span>
                </div>
                <div className="module__lessons">
                  <div className="lesson completed">
                    <span className="lesson-icon">✓</span>
                    <span className="lesson-title">1. Wstęp teoretyczny</span>
                    <span className="lesson-time">12:45</span>
                  </div>
                  <div className="lesson active">
                    <span className="lesson-icon">▶</span>
                    <span className="lesson-title">2. Praktyczne przykłady</span>
                    <span className="lesson-time">18:20</span>
                  </div>
                  <div className="lesson">
                    <span className="lesson-icon">🔒</span>
                    <span className="lesson-title">3. Zadania sprawdzające</span>
                    <span className="lesson-time">15:00</span>
                  </div>
                </div>
              </div>

              {/* Module 2 */}
              <div className="module">
                <div className="module__header">
                  <h4>Moduł 2: Rozszerzenie</h4>
                  <span>5 lekcji</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
