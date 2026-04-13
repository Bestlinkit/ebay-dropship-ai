import React from 'react'
import ReactDOMClient from 'react-dom/client'
import ReactDOM from 'react-dom'
import App from './App.jsx'
import './index.css'

// React 18 & Legacy Library Compatibility Shim
if (typeof window !== 'undefined' && !ReactDOM.findDOMNode) {
    ReactDOM.findDOMNode = (instance) => {
        if (!instance) return null;
        if (instance instanceof HTMLElement) return instance;
        try {
            return instance.getDOMNode ? instance.getDOMNode() : null;
        } catch (e) {
            return null;
        }
    };
}

ReactDOMClient.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
