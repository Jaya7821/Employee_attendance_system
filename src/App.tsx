import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthPage } from './pages/AuthPage';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { EmployeeHistory } from './pages/EmployeeHistory';
import { EmployeeProfile } from './pages/EmployeeProfile';
import { ManagerDashboard } from './pages/ManagerDashboard';
import { AllAttendance } from './pages/AllAttendance';
import { TeamCalendar } from './pages/TeamCalendar';
import { Reports } from './pages/Reports';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthPage />;
  }

  const renderPage = () => {
    if (profile.role === 'employee') {
      switch (currentPage) {
        case 'dashboard':
          return <EmployeeDashboard />;
        case 'attendance':
          return <EmployeeDashboard />;
        case 'history':
          return <EmployeeHistory />;
        case 'profile':
          return <EmployeeProfile />;
        default:
          return <EmployeeDashboard />;
      }
    } else {
      switch (currentPage) {
        case 'dashboard':
          return <ManagerDashboard />;
        case 'all-attendance':
          return <AllAttendance />;
        case 'calendar':
          return <TeamCalendar />;
        case 'reports':
          return <Reports />;
        default:
          return <ManagerDashboard />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
      {renderPage()}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
