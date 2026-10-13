import { Suspense, lazy, useEffect } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import QuizPage from './pages/QuizPage';
import CalculatingPage from './pages/CalculatingPage';
import ResultPage from './pages/ResultPage';
import { GalleryPage, PersonalityDetailPage } from './pages/GalleryPage';
import AboutPage from './pages/AboutPage';
import { Page } from './components/common';

/**
 * 调试器只在开发环境进入构建产物与路由表（§18 的“双层屏蔽”）。
 * import.meta.env.DEV 为编译期常量，生产构建时该分支会被摇树移除。
 */
const DebugPage = import.meta.env.DEV ? lazy(() => import('./pages/DebugPage')) : null;

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

function NotFoundPage() {
  return (
    <Page>
      <p className="eyebrow">404</p>
      <h1 style={{ fontSize: 24 }}>这个页面不存在</h1>
      <p className="lead" style={{ marginTop: 12 }}>
        可能是链接过期了，或者地址打错了。
      </p>
      <div className="btn-row">
        <Link className="btn" to="/" style={{ textDecoration: 'none' }}>
          回到首页
        </Link>
      </div>
    </Page>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/calculating" element={<CalculatingPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/gallery/:type" element={<PersonalityDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        {DebugPage ? (
          <Route
            path="/debug"
            element={(
              <Suspense fallback={<Page><p className="muted">正在加载调试器…</p></Page>}>
                <DebugPage />
              </Suspense>
            )}
          />
        ) : null}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
