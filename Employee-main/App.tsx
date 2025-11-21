import React, { useState, useCallback } from 'react';
import { ClerkProvider, SignIn, SignedIn, SignedOut } from '@clerk/clerk-react';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import PunchPage from './pages/PunchPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import { AuthProvider } from './context/AuthContext';

type Page = 'home' | 'punch' | 'history' | 'profile';

const pages: Record<Page, React.FC> = {
  home: HomePage,
  punch: PunchPage,
  history: HistoryPage,
  profile: ProfilePage,
};

const AppShell: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('home');

  const renderPage = useCallback(() => {
    const Component = pages[activePage];
    return <Component />;
  }, [activePage]);

  return (
    <>
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center bg-white">
          <SignIn
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'shadow-lg border border-gray-200 rounded-3xl',
              },
            }}
          />
        </div>
      </SignedOut>
      <SignedIn>
        <Layout activePage={activePage} setActivePage={setActivePage}>
          {renderPage()}
        </Layout>
      </SignedIn>
    </>
  );
};

const App: React.FC = () => {
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!clerkPubKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black">
        <p>Missing Clerk publishable key</p>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ClerkProvider>
  );
};

export default App;
