import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaVideo, FaRegCommentDots, FaUtensils, FaBars } from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true); // Inicialmente expandido
  const location = useLocation();

  // Función para determinar si un enlace está activo
  const isActive = (path) => {
    return location.pathname === path ? 'menuItem active' : 'menuItem';
  };

  // Función para alternar la expansión del Sidebar
  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Contenido del sidebar */}
      <div className="sidebar-content">
        <Link to="/" className={isActive('/')}>
          <FaVideo size={20} />
          {isExpanded && <span>Videos to Edit</span>}
        </Link>

        <Link to="/EditReviewers" className={isActive('/EditReviewers')}>
          <FaRegCommentDots size={20} />
          {isExpanded && <span>Reviewers</span>}
        </Link>

        <Link to="/EditRestaurants" className={isActive('/EditRestaurants')}>
          <FaUtensils size={20} />
          {isExpanded && <span>Restaurants</span>}
        </Link>
      </div>

      {/* Botón para alternar el Sidebar */}
      <button className="toggleButton" onClick={toggleSidebar}>
        <FaBars size={20} />
      </button>
    </div>
  );
};

export default Sidebar;