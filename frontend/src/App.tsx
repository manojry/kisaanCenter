import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppStateProvider } from './components/AppStateContext';
import AppRoutes from './routes/AppRoutes';
import NotificationContainer from './components/NotificationContainer';

function App() {
  return (
    <AppStateProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <AppRoutes />
            <NotificationContainer />
          </div>
        </Router>
      </AuthProvider>
    </AppStateProvider>
  );
}

export default App;
