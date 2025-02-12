import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';
import Sidebar from './components/Sidebar';

// Importación de componentes
import EditVideos from './screens/EditVideos';
import EditReviewers from './screens/EditReviewers';
import EditRestaurants from './screens/EditRestaurants';

const Layout = ({ children }) => {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar /> {/* Sidebar siempre visible */}
      <div style={{ flex: 1, padding: '20px' }}>
        {children} {/* Contenido de la página */}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<EditVideos />} />
          <Route path="/EditReviewers" element={<EditReviewers />} />
          <Route path="/EditRestaurants" element={<EditRestaurants />} />
        </Routes>
      </Layout>
    </Router>
  );
}