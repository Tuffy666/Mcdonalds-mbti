import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';
import { validateConfig } from '../engine/validate.mjs';

// 开发环境启动即校验配置（§14）；生产环境失败时进入通用错误页而不是崩溃
const report = validateConfig();
if (!report.ok) {
  console.error('[麦门人格研究所] 配置校验失败：', report.errors);
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-alert
    alert(`配置校验失败：\n- ${report.errors.join('\n- ')}`);
  }
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      {report.ok ? <App /> : <ConfigErrorPage errors={report.errors} />}
    </BrowserRouter>
  </React.StrictMode>,
);

function ConfigErrorPage({ errors }: { errors: string[] }) {
  return (
    <main className="page page--error">
      <h1>测试暂时无法开始</h1>
      <p>人格配置校验未通过，我们已经记录下问题。</p>
      <p className="muted">请稍后刷新页面重试。</p>
    </main>
  );
}
