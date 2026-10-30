import React from 'react';
import { createRoot } from 'react-dom/client';
import Work6 from './work6';
import './work6.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing Work6 root');
createRoot(root).render(<React.StrictMode><Work6/></React.StrictMode>);
