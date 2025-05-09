import React, { useState } from 'react';
import './RestaurantCard.css';
import MiniMap from './MiniMap';
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../FireBaseConfig";

const RestaurantCard = ({ restaurant}) => {
  const excludedFields = ['reviews', 'createdAt', 'lastUpdated', 'id'];
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...restaurant });
  
  const formatFieldName = (fieldName) => {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace('Google ', '');
  };

  const formatValue = (value) => {
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (!value || value === 'INEXISTENTE') return 'No disponible';
    return value;
  };

  const handleVisitLink = (url) => {
    if (!url || url === "INEXISTENTE") {
      alert("No hay enlace disponible.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDelete = async () => {
    if (!restaurant?.id) {
      console.error("No hay ID de restaurante para eliminar");
      return;
    }

    if (window.confirm(`¿Estás seguro que deseas eliminar permanentemente "${restaurant.name}"?`)) {
      try {
        await deleteDoc(doc(db, "Restaurants", restaurant.id));
        alert("Restaurante eliminado correctamente");
        window.location.reload();
      } catch (error) {
        console.error("Error al eliminar restaurante:", error);
        alert("No se pudo eliminar el restaurante");
      }
    }
  };



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSave = async () => {
    try {
      await updateDoc(doc(db, "Restaurants", restaurant.id), formData);
      alert("Restaurante actualizado correctamente");
      setIsEditing(false);
      window.location.reload(); 
    } catch (error) {
      console.error("Error al actualizar restaurante:", error);
      alert("No se pudo actualizar el restaurante");
    }
  };

  const renderEditForm = (fieldOrder = []) => {
    // Campos que siempre deben ser excluidos
    const excludedFields = ['id', 'createdAt', 'lastUpdated', 'reviews'];
    
    // Obtener todos los campos disponibles (excluyendo los campos excluidos)
    const availableFields = Object.keys(formData).filter(key => !excludedFields.includes(key));
    
    // Determinar el orden final de los campos:
    // 1. Primero los campos especificados en fieldOrder (en el orden dado)
    // 2. Luego los campos restantes en su orden original
    const orderedFields = [
      ...fieldOrder.filter(field => availableFields.includes(field)),
      ...availableFields.filter(field => !fieldOrder.includes(field))
    ];
  
    return (
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '24px',
          backgroundColor: '#f1f5f9',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}
      >
        {orderedFields.map(key => (
          <div
            key={key}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%'
            }}
          >
            <label
              style={{
                fontWeight: 600,
                marginBottom: '6px',
                color: '#334155',
                textAlign: 'center'
              }}
            >
              {formatFieldName(key)}:
            </label>
            <input
              type="text"
              name={key}
              value={formData[key] || ''}
              onChange={handleInputChange}
              style={{
                padding: '10px 14px',
                fontSize: '1rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                backgroundColor: 'transparent', 
                transition: 'border 0.2s ease',
                width: '60%' 
              }}
            />
          </div>
        ))}
    
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            marginTop: '20px'
          }}
        >
          <button
            onClick={handleSave}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              minWidth: '160px'
            }}
          >
            Guardar
          </button>
          <button
            onClick={() => setIsEditing(false)}
            style={{
              backgroundColor: '#94a3b8',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              minWidth: '160px'
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  };
  

  return (
    <div className="restaurant-card">
      <div className="restaurant-header">
        <h2>{restaurant.name || 'Nombre no disponible'}</h2>
        {restaurant.rating && (
          <div className="rating-badge">
            ⭐ {restaurant.rating} {restaurant.reviewCount && `(${restaurant.reviewCount})`}
          </div>
        )}
      </div>
  
      {isEditing ? (
        renderEditForm(['name', 'address', 'rating', 'reviewCount', 'website', 'googleMapsLink', 'tripAdvisorLink', 'image', 'latitude', 'longitude'])
      ) : (
        <div className="restaurant-content">
          <div className="info-section">
            <h3>Información básica</h3>
            <div className="info-grid">
              {Object.entries(restaurant)
                .filter(([key]) => !excludedFields.includes(key))
                .filter(([key]) => key !== 'image' && key !== 'latitude' && key !== 'longitude')
                .map(([key, value]) => (
                  <div key={key} className="info-row">
                    <span className="info-label">{formatFieldName(key)}:</span>
                    <span className="info-value">{formatValue(value)}</span>
                  </div>
                ))}
            </div>
          </div>
  
          {(restaurant.latitude && restaurant.longitude) && (
            <div className="map-section">
              <h3>Ubicación</h3>
              <div className="map-container">
                <MiniMap lat={restaurant.latitude} lng={restaurant.longitude} />
              </div>
              <div className="coordinates">
                <span>Lat: {restaurant.latitude}</span>
                <span>Lng: {restaurant.longitude}</span>
              </div>
            </div>
          )}
  
          <div className="links-section">
            <h3>Enlaces</h3>
            <div className="links-grid">
              {restaurant.website && (
                <button 
                  className="link-button"
                  onClick={() => handleVisitLink(restaurant.website)}
                >
                  Sitio Web
                </button>
              )}
              {restaurant.googleMapsLink && (
                <button 
                  className="link-button"
                  onClick={() => handleVisitLink(restaurant.googleMapsLink)}
                >
                  Google Maps
                </button>
              )}
              {restaurant.tripAdvisorLink && (
                <button 
                  className="link-button"
                  onClick={() => handleVisitLink(restaurant.tripAdvisorLink)}
                >
                  TripAdvisor
                </button>
              )}
            </div>
          </div>
  
          {restaurant.image && restaurant.image !== 'INEXISTENTE' && (
            <div className="image-section">
              <h3>Imagen</h3>
              <div className="image-container">
                <img src={restaurant.image} alt={restaurant.name} />
              </div>
              <div className="image-info">
                <span className="info-label">Dirección:</span>
                <span className="info-value">{restaurant.image || 'No disponible'}</span>
              </div>
            </div>
          )}
  
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '20px', 
            marginTop: '30px', 
            paddingTop: '20px', 
            borderTop: '1px solid #e2e8f0' 
          }}>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                background: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '1rem',
                fontWeight: '500',
                minWidth: '180px'
              }}>
              Actualizar Restaurante
            </button>
  
            <button 
              onClick={handleDelete}
              style={{
                background: '#dc2626',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '1rem',
                fontWeight: '500',
                minWidth: '180px'
              }}>
              Borrar Restaurante
            </button>
          </div>
        </div>
      )}
    </div>
  );
};  

export default RestaurantCard;