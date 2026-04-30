import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './Courses.css';

type Task = { id: string; title: string; type: string; url?: string; premium?: boolean };
type Pdf = { id: string; title: string; size: string; url?: string; premium?: boolean };
type Lesson = {
  id: string;
  title: string;
  time: string;
  locked: boolean;
  completed: boolean;
  type: 'video' | 'quiz';
  description: string;
  tasks: Task[];
  pdfs: Pdf[];
};
type Module = {
  id: string;
  title: string;
  lessons: Lesson[];
};

const courseDataMap: Record<string, Module[]> = {
  'matematyka': [
    {
      id: 'm1',
      title: 'Moduł 1: Podstawy',
      lessons: [
        {
          id: 'l1',
          title: '1. Wstęp teoretyczny',
          time: '12:45',
          locked: false,
          completed: true,
          type: 'video',
          description: 'Wprowadzenie do podstawowych zagadnień. W tej lekcji dowiesz się najważniejszych rzeczy o danym temacie.',
          tasks: [
            { id: 't1', title: 'Zadanie 1. Oblicz pole powierzchni...', type: 'pdf' }
          ],
          pdfs: [
            { id: 'p1', title: 'Notatki do lekcji 1', size: '1.2 MB' }
          ]
        },
        {
          id: 'l2',
          title: '2. Praktyczne przykłady',
          time: '18:20',
          locked: false,
          completed: false,
          type: 'video',
          description: 'Rozwiązujemy wspólnie pierwsze zadania. Zobaczysz jak zastosować teorię w praktyce.',
          tasks: [
            { id: 't2', title: 'Zadanie 1. Rozwiąż równanie kwadratowe', type: 'interactive' },
            { id: 't3', title: 'Zadanie 2. Wyznacz dziedzinę funkcji', type: 'interactive' },
            { id: 't4', title: 'Zestaw 15 zadań utrwalających', type: 'pdf', premium: true }
          ],
          pdfs: [
            { id: 'p2', title: 'Karta wzorów maturalnych', size: '0.8 MB' },
            { id: 'p3', title: 'Rozwiązania zadań z tablicy', size: '2.5 MB', premium: true }
          ]
        },
        {
          id: 'l3',
          title: '3. Zadania sprawdzające',
          time: '15:00',
          locked: false,
          completed: false,
          type: 'quiz',
          description: 'Czas na samodzielną pracę. Sprawdź swoją wiedzę z tego modułu.',
          tasks: [
            { id: 't5', title: 'Test 10 pytań', type: 'interactive' },
            { id: 't6', title: 'Test trudny 15 pytań', type: 'interactive', premium: true }
          ],
          pdfs: []
        }
      ]
    },
    {
      id: 'm2',
      title: 'Moduł 2: Rozszerzenie',
      lessons: [
        {
          id: 'l4',
          title: '1. Trudniejsze przypadki',
          time: '25:10',
          locked: false,
          completed: false,
          type: 'video',
          description: 'Zagłębiamy się w bardziej zaawansowane tematy na poziomie rozszerzonym.',
          tasks: [
            { id: 't7', title: 'Karta pracy (Trudne przypadki)', type: 'pdf', premium: true }
          ],
          pdfs: [
            { id: 'p4', title: 'Rozbudowane notatki', size: '4.1 MB', premium: true }
          ]
        }
      ]
    }
  ],
  'jezyk-polski': [
    {
      id: 'pl_m1',
      title: 'Moduł 1: Wypracowanie Maturalne',
      lessons: [
        {
          id: 'pl_l1',
          title: '1. Struktura rozprawki problemowej',
          time: '20:15',
          locked: false,
          completed: true,
          type: 'video',
          description: 'Omówienie zasad pisania wypracowania maturalnego. Zobaczysz, jak postawić trafną tezę i dobrze argumentować.',
          tasks: [
            { id: 'pl_t1', title: 'Napisz próbny wstęp do rozprawki', type: 'interactive' },
            { id: 'pl_t2', title: 'Analiza błędnych argumentów', type: 'interactive', premium: true }
          ],
          pdfs: [
            { id: 'pl_p1', title: 'Schemat wypracowania CKE', size: '1.5 MB' },
            { id: 'pl_p2', title: 'Lista przydatnego słownictwa', size: '0.5 MB', premium: true }
          ]
        },
        {
          id: 'pl_l2',
          title: '2. Odwołania do "Lalki"',
          time: '18:40',
          locked: false,
          completed: false,
          type: 'video',
          description: 'Przegląd najważniejszych motywów z "Lalki" B. Prusa, idealnych do użycia w wypracowaniu.',
          tasks: [
            { id: 'pl_t3', title: 'Przyporządkuj motyw do bohatera', type: 'interactive' }
          ],
          pdfs: [
            { id: 'pl_p3', title: 'Streszczenie szczegółowe "Lalki"', size: '2.1 MB', premium: true }
          ]
        }
      ]
    }
  ]
};

export default function CoursePlayer() {
  const { courseId } = useParams();
  
  const [expandedModules, setExpandedModules] = useState<string[]>(['m1']);
  const [activeLessonId, setActiveLessonId] = useState<string>('l2');
  const [activeTab, setActiveTab] = useState<'opis' | 'zadania' | 'pdf'>('opis');

  const courseName = courseId === 'matematyka' ? 'Matematyka podstawowa' :
                     courseId === 'jezyk-polski' ? 'Język polski podstawowy' : 
                     'Angielski podstawowy';

  const modules = courseDataMap[courseId || ''] || courseDataMap['matematyka'];

  // Find active lesson
  let activeLesson: Lesson | null = null;
  for (const mod of modules) {
    const found = mod.lessons.find(l => l.id === activeLessonId);
    if (found) {
      activeLesson = found;
      break;
    }
  }

  // Fallback to first lesson if activeLessonId is not found in this course's modules
  if (!activeLesson && modules.length > 0 && modules[0].lessons.length > 0) {
    activeLesson = modules[0].lessons[0];
  }

  const toggleModule = (id: string) => {
    setExpandedModules(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (!lesson.locked) {
      setActiveLessonId(lesson.id);
      setActiveTab('opis'); // Reset tab on lesson change
    }
  };

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
              <p>{activeLesson ? `Odtwarzacz: ${activeLesson.title}` : 'Wybierz lekcję'}</p>
            </div>
            
            {activeLesson && (
              <>
                <div className="course-player__tabs">
                  <button 
                    className={`tab ${activeTab === 'opis' ? 'active' : ''}`}
                    onClick={() => setActiveTab('opis')}
                  >
                    Opis lekcji
                  </button>
                  <button 
                    className={`tab ${activeTab === 'zadania' ? 'active' : ''}`}
                    onClick={() => setActiveTab('zadania')}
                  >
                    Zadania ({activeLesson.tasks.length})
                  </button>
                  <button 
                    className={`tab ${activeTab === 'pdf' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pdf')}
                  >
                    Pliki PDF ({activeLesson.pdfs.length})
                  </button>
                </div>
                
                <div className="course-player__tab-content">
                  {activeTab === 'opis' && (
                    <>
                      <h3>{activeLesson.title}</h3>
                      <p>{activeLesson.description}</p>
                    </>
                  )}

                  {activeTab === 'zadania' && (
                    <div className="resource-list">
                      {activeLesson.tasks.length > 0 ? activeLesson.tasks.map(task => (
                        <div key={task.id} className="resource-item cursor-pointer hover-bg">
                          <span className="icon">{task.premium ? '🔒' : '✏️'}</span>
                          <div className="resource-info">
                            <h4>{task.title} {task.premium && <span className="promo-badge" style={{marginLeft: '8px', fontSize: '10px'}}>PREMIUM</span>}</h4>
                            <span className="text-sm text-muted">{task.type === 'interactive' ? 'Interaktywne' : 'Dokument'}</span>
                          </div>
                          <Link to={task.premium ? '/cennik' : '#'} className={`btn btn-sm ${task.premium ? 'btn-secondary' : 'btn-primary'}`} style={{marginLeft: 'auto'}}>
                            {task.premium ? 'Kup Premium' : 'Rozwiąż'}
                          </Link>
                        </div>
                      )) : (
                        <p className="text-muted" style={{ padding: '24px 0', textAlign: 'center' }}>Brak zadań do tej lekcji.</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'pdf' && (
                    <div className="resource-list">
                      {activeLesson.pdfs.length > 0 ? activeLesson.pdfs.map(pdf => (
                        <div key={pdf.id} className="resource-item cursor-pointer hover-bg">
                          <span className="icon">{pdf.premium ? '🔒' : '📄'}</span>
                          <div className="resource-info">
                            <h4>{pdf.title} {pdf.premium && <span className="promo-badge" style={{marginLeft: '8px', fontSize: '10px'}}>PREMIUM</span>}</h4>
                            <span className="text-sm text-muted">{pdf.size}</span>
                          </div>
                          <Link to={pdf.premium ? '/cennik' : '#'} className="btn btn-sm btn-secondary" style={{marginLeft: 'auto'}}>
                            {pdf.premium ? 'Kup Premium' : 'Pobierz'}
                          </Link>
                        </div>
                      )) : (
                        <p className="text-muted" style={{ padding: '24px 0', textAlign: 'center' }}>Brak plików PDF do tej lekcji.</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Sidebar - Playlist */}
          <div className="course-player__sidebar">
            <div className="playlist-header">
              <h3>Spis treści</h3>
              <span>2/99 ukończono</span>
            </div>
            
            <div className="playlist-modules">
              {modules.map((mod) => {
                const isOpen = expandedModules.includes(mod.id);
                return (
                  <div key={mod.id} className={`module ${isOpen ? 'open' : ''}`}>
                    <div className="module__header" onClick={() => toggleModule(mod.id)}>
                      <h4>{mod.title}</h4>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {mod.lessons.length} lekcje
                        <span style={{ fontSize: '10px', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                      </span>
                    </div>
                    {isOpen && (
                      <div className="module__lessons">
                        {mod.lessons.map(lesson => {
                          const isActive = activeLesson ? lesson.id === activeLesson.id : false;
                          let icon = '▶';
                          if (lesson.locked) icon = '🔒';
                          else if (lesson.completed && !isActive) icon = '✓';

                          return (
                            <div 
                              key={lesson.id} 
                              className={`lesson ${isActive ? 'active' : ''} ${lesson.completed ? 'completed' : ''} ${lesson.locked ? 'locked' : ''}`}
                              onClick={() => handleLessonClick(lesson)}
                              style={{ cursor: lesson.locked ? 'not-allowed' : 'pointer', opacity: lesson.locked ? 0.6 : 1 }}
                            >
                              <span className="lesson-icon">{icon}</span>
                              <span className="lesson-title">{lesson.title}</span>
                              <span className="lesson-time">{lesson.time}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
