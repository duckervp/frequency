import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LogPage from './pages/LogPage';
import CalendarPage from './pages/CalendarPage';
import CreateActionPage from './pages/CreateActionPage';
import SettingsPage from './pages/SettingsPage';
import ManageActionsPage from './pages/ManageActionsPage';
import RegisterActionPage from './pages/RegisterActionPage';
import EditActionPage from './pages/EditActionPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="dark">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/log" element={<LogPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/manage-actions" element={<ManageActionsPage />} />
            <Route path="/create" element={<CreateActionPage />} />
            {/* /register?actionId=<id> */}
            <Route path="/register" element={<RegisterActionPage />} />
            {/* /edit?logId=<id> */}
            <Route path="/edit" element={<EditActionPage />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
