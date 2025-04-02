import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GroupTable from './components/GroupTable';
import DeleteGroupPage from './components/DeleteGroupPage';

function App() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <Router>
        <Routes>
          <Route path="/" element={<GroupTable />} />
          <Route path="/delgroup" element={<DeleteGroupPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
