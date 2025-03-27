import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Templates from './components/Templates';
import Login from './components/Login';
import TaskManagement from './components/TaskManagement';
import { useAuth } from './contexts/AuthContext';

const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <ToastContainer position="top-right" autoClose={3000} />
        {user && <Navbar />}
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route
              path="/login"
              element={user ? <Navigate to="/dashboard" /> : <Login />}
            />
            <Route
              path="/dashboard"
              element={user ? <Dashboard /> : <Navigate to="/login" />}
            />
            <Route
              path="/templates"
              element={user ? <Templates /> : <Navigate to="/login" />}
            />
            <Route
              path="/tasks"
              element={user ? <TaskManagement /> : <Navigate to="/login" />}
            />
            <Route
              path="/"
              element={<Navigate to={user ? "/dashboard" : "/login"} />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App; 