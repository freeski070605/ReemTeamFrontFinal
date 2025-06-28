import React from 'react';
import { GameProvider } from './components/GameContext';
import { UserProvider } from './components/UserContext';
import { SocketProvider } from './components/SocketContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/Home';
import GameBoard from './components/Gameboard';
import AiGameboard from './components/AiGameboard';
import UserProfilePage from './components/UserProfilePage';
import Lobby from './components/Lobby';
import TableComponent from './components/Table';
import Header from './components/Header';
import Rules from './components/Rules';

const App = () => {
  const isMobile = window.innerWidth <= 768;
  const isPortrait = window.innerHeight > window.innerWidth;

  if (isMobile && isPortrait) {
    return (
      <div className="orientation-message">
        Please rotate your device to landscape mode for the best experience.
      </div>
    );
  }

  return (
    <UserProvider>
      <SocketProvider>
        <GameProvider>
          <Router>
            <Header />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/gameboard" element={<GameBoard />} />
              <Route path="/aigameboard" element={<AiGameboard />} />
              <Route path="/userprofile" element={<UserProfilePage />} />
              <Route path="/lobby" element={<Lobby />} />
              <Route path="/table/:tableId" element={<TableComponent />} />
              <Route path="/rules" element={<Rules />} />
            </Routes>
          </Router>
        </GameProvider>
      </SocketProvider>
    </UserProvider>
  );
};

export default App;
