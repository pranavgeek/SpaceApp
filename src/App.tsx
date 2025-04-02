import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { Explore } from './pages/Explore';
import { Create } from './pages/Create';
import { Profile } from './pages/Profile';
import { Messages } from './pages/Messages';
import { Pricing } from './pages/Pricing';
import { InfluencerProgram } from './pages/InfluencerProgram';

type Page = 'explore' | 'create' | 'profile' | 'messages' | 'pricing' | 'influencer';

function App() {
  const [currentPage, setCurrentPage] = React.useState<Page>('explore');

  const renderPage = () => {
    switch (currentPage) {
      case 'create':
        return <Create />;
      case 'profile':
        return <Profile />;
      case 'messages':
        return <Messages />;
      case 'pricing':
        return <Pricing />;
      case 'influencer':
        return <InfluencerProgram />;
      default:
        return <Explore />;
    }
  };

  return (
    <div className="min-h-screen bg-black ios-scroll max-w-screen-3xl mx-auto">
      <Navbar />
      <main className="pb-[calc(env(safe-area-inset-bottom)+4rem)] pt-[calc(env(safe-area-inset-top)+4rem)]">
        <Routes>
          <Route path="/" element={<Navigate to="/explore" replace />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/create" element={<Create />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/influencer" element={<InfluencerProgram />} />
        </Routes>
      </main>
      <BottomNav onPageChange={setCurrentPage} currentPage={currentPage} />
    </div>
  );
}

export default App;
