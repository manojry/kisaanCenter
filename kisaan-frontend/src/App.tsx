import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Login from './pages/Login';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/Layout/AppLayout';


const App = () => (
  <AuthProvider>
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;
