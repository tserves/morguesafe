import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import BodyIntake from '@/pages/BodyIntake';
import DecedentDetail from '@/pages/DecedentDetail';
import ChainOfCustody from '@/pages/ChainOfCustody';
import StorageManagement from '@/pages/StorageManagement';
import Examinations from '@/pages/Examinations';
import PersonalEffects from '@/pages/PersonalEffects';
import Release from '@/pages/Release';
import AuditLog from '@/pages/AuditLog';
import ScanLookup from '@/pages/ScanLookup';
import DailyOverview from '@/pages/DailyOverview';
import IntakeList from '@/pages/IntakeList';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-mono tracking-wider">LOADING SECURE SESSION</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/daily" element={<DailyOverview />} />
        <Route path="/intake-list" element={<IntakeList />} />
        <Route path="/intake" element={<BodyIntake />} />
        <Route path="/decedent/:id" element={<DecedentDetail />} />
        <Route path="/custody" element={<ChainOfCustody />} />
        <Route path="/storage" element={<StorageManagement />} />
        <Route path="/examinations" element={<Examinations />} />
        <Route path="/effects" element={<PersonalEffects />} />
        <Route path="/release" element={<Release />} />
        <Route path="/audit" element={<AuditLog />} />
        <Route path="/scan" element={<ScanLookup />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App