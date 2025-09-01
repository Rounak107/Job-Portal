import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';


// 👇 ADD THIS LINE
import { setAuthToken } from './api';

// 👇 Restore token from localStorage (if user already logged in before reload)
const token = localStorage.getItem('jobportal_token');
setAuthToken(token);

console.log('VITE_API_BASE (compiled):', import.meta.env.VITE_API_BASE);

createRoot(document.getElementById('root')!).render(<App />);
