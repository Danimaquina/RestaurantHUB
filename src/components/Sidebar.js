import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaVideo, FaRegCommentDots, FaUtensils, FaBars } from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(window.innerWidth > 768);
  const location = useLocation();

  // Efecto para manejar el resize de la ventana
  useEffect(() => {
    const handleResize = () => {
      setIsExpanded(window.innerWidth > 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Función para determinar si un enlace está activo
  const isActive = (path) => {
    return location.pathname === path ? 'menuItem active' : 'menuItem';
  };

  // Función para alternar la expansión del Sidebar
  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* Botón para alternar el Sidebar en móviles */}
      <button className="toggleButton" onClick={toggleSidebar}>
        <FaBars size={20} />
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${isExpanded ? 'expanded' : ''}`}>
        <Link to="/" className={isActive('/')}>
          <FaVideo size={20} />
          <span>Editar Videos</span>
        </Link>

        <Link to="/EditReviewers" className={isActive('/EditReviewers')}>
          <FaRegCommentDots size={20} />
          <span>Editar Reviewers</span>
        </Link>

        <Link to="/EditRestaurants" className={isActive('/EditRestaurants')}>
          <FaUtensils size={20} />
          <span>Editar Restaurants</span>
        </Link>
      </div>
    </>
  );
};

export default Sidebar;