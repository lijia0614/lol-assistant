import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'

// 浏览器模式下注入 mock electronAPI（Electron 环境由 preload 提供）
if (!(window as any).electronAPI) {
  import('./mock/api').then(({ mockElectronAPI }) => {
    (window as any).electronAPI = mockElectronAPI
    console.log('[Dev] Mock electronAPI injected. 场景: 游戏中')
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
)
