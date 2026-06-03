import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'

// 浏览器模式：同步注入 mock electronAPI（Electron 环境由 preload 提供）
// 用 top-level await 确保 mock 在 React 渲染前就位
if (!(window as any).electronAPI) {
  const { mockElectronAPI } = await import('./mock/api')
  ;(window as any).electronAPI = mockElectronAPI
  console.log('[Dev] Mock electronAPI injected')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
)
