import React, { useState } from "react";
import "./ReviewCard.css";
import apiKeys from "../utils/apiKeys";
import {searchPlaces, getPlaceDetails} from "../googlePlacesService";


const ReviewCard = ({ video, reviewerName }) => {
  const [formData, setFormData] = useState({
    startTime: "",
    googlePlaceId: "",
    search: "",
    name: "",
    address: "",
    phone: "",
    website: "",
    tripAdvisorLink: "",
    googleMapsLink: "",
    rating: "",
    reviewCount: "",
    priceLevel: "",
    latitude: "",
    longitude: "",
    image: "",
    status: ""
  });

  const [searchResults, setSearchResults] = useState([]); 

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Here you would add the logic to save the data to Firebase
  };

  const handleAddRestaurant = () => {
    console.log("Adding another restaurant");
    // Logic to add another restaurant form would go here
  };

  const handleUpdateMap = () => {
    console.log("Updating map with coordinates:", formData.latitude, formData.longitude);
    // Here you would add the logic to update the map with the given coordinates
  };

  const handleSearch = async () => {
    try {
      const results = await searchPlaces(formData.search); // Usa tu función
      setSearchResults(results); // Guarda los resultados
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleSelectPlace = (e) => {
    const selectedPlaceName = e.target.value;
    setFormData({
      ...formData,
      name: selectedPlaceName
    });
  };

  return (
    <div className="review-card">
      <div className="restaurant-form-container">
        <div className="restaurant-form-header">
          <h3>Añadir review para el video: {video.Title}</h3>
        </div>
        <form className="restaurant-form" onSubmit={handleSubmit}>
          <div className="form-tabs">
            <div className="tab active">Review 1</div>
            <button 
              type="button" 
              className="add-restaurant-btn" 
              onClick={handleAddRestaurant}
            >
              + Añadir Restaurante
            </button>
          </div>
          
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="startTime">Segundo en el que empieza la review:</label>
              <input 
                type="text" 
                id="startTime" 
                name="startTime" 
                value={formData.startTime}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
            <label htmlFor="search">Buscar restaurante:</label>
            <input 
              type="text" 
              id="search" 
              name="search" 
              value={formData.search}
              onChange={handleChange}
            />
            <div className="button-container">
              <button type="button" className="action-btn" onClick={handleSearch}>Buscar</button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="name">Nombre del restaurante:</label>
            {searchResults.length > 0 ? (
              <select id="name" name="name" value={formData.name} onChange={handleSelectPlace}>
                <option value="">Selecciona un restaurante</option>
                {searchResults.map((place) => (
                  <option key={place.id} value={place.displayName.text}>
                    {place.displayName.text}
                  </option>
                ))}
              </select>
            ) : (
              <input 
                type="text" 
                id="name" 
                name="name" 
                value={formData.name}
                onChange={handleChange}
              />
            )}
          </div>
            
            <div className="form-group">
              <label htmlFor="googlePlaceId">Google Place ID:</label>
              <input 
                type="text" 
                id="googlePlaceId" 
                name="googlePlaceId" 
                value={formData.googlePlaceId}
                onChange={handleChange}
              />
            </div>
            
            
            <div className="form-group">
              <label htmlFor="address">Dirección del restaurante:</label>
              <input 
                type="text" 
                id="address" 
                name="address" 
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Teléfono del restaurante:</label>
              <input 
                type="text" 
                id="phone" 
                name="phone" 
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="website">Website del restaurante:</label>
              <input 
                type="text" 
                id="website" 
                name="website" 
                value={formData.website}
                onChange={handleChange}
              />
              <div className="button-container">
                <button type="button" className="action-btn">Visitar web →</button>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="tripAdvisorLink">Ficha en TripAdvisor:</label>
              <input 
                type="text" 
                id="tripAdvisorLink" 
                name="tripAdvisorLink" 
                value={formData.tripAdvisorLink}
                onChange={handleChange}
              />
              <div className="button-container">
                <button type="button" className="action-btn">Visitar web →</button>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="googleMapsLink">Ficha en Google Maps:</label>
              <input 
                type="text" 
                id="googleMapsLink" 
                name="googleMapsLink" 
                value={formData.googleMapsLink}
                onChange={handleChange}
              />
              <div className="button-container">
                <button type="button" className="action-btn">Visitar web →</button>
              </div>
            </div>
            
            <div className="form-group rating-group">
              <div>
                <label htmlFor="rating">Rating en Google Maps:</label>
                <input 
                  type="text" 
                  id="rating" 
                  name="rating" 
                  value={formData.rating}
                  onChange={handleChange}
                  className="small-input"
                />
              </div>
              <div>
                <label htmlFor="reviewCount"># Reseñas de Google Maps:</label>
                <input 
                  type="text" 
                  id="reviewCount" 
                  name="reviewCount" 
                  value={formData.reviewCount}
                  onChange={handleChange}
                  className="small-input"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="priceLevel">Price Level de Google Maps:</label>
              <input 
                type="text" 
                id="priceLevel" 
                name="priceLevel" 
                value={formData.priceLevel}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group coordinates-group">
              <div>
                <label htmlFor="latitude">Latitud:</label>
                <input 
                  type="text" 
                  id="latitude" 
                  name="latitude" 
                  value={formData.latitude}
                  onChange={handleChange}
                  className="small-input"
                  placeholder="Ej: 41.3851"
                />
              </div>
              <div>
                <label htmlFor="longitude">Longitud:</label>
                <input 
                  type="text" 
                  id="longitude" 
                  name="longitude" 
                  value={formData.longitude}
                  onChange={handleChange}
                  className="small-input"
                  placeholder="Ej: 2.1734"
                />
              </div>
              <div className="update-map-btn-container">
                <button 
                  type="button" 
                  className="action-btn update-map-btn"
                  onClick={handleUpdateMap}
                >
                  Actualizar Mapa
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label>Mapa:</label>
              <div className="map-container">
                {/* Map would be displayed here */}
                <img 
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${formData.latitude || "41.3851"},${formData.longitude || "2.1734"}&zoom=15&size=600x300&maptype=roadmap&markers=color:red%7C${formData.latitude || "41.3851"},${formData.longitude || "2.1734"}&key=YOUR_API_KEY`} 
                  alt="Map" 
                  className="map-preview" 
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="image">Imagen del restaurante:</label>
              <input 
                type="text" 
                id="image" 
                name="image" 
                value={formData.image}
                onChange={handleChange}
              />
              <div className="image-preview-container">
                {formData.image && (
                  <img src={formData.image} alt="Restaurant preview" className="image-preview" />
                )}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="status">Estado del restaurante:</label>
              <input 
                type="text" 
                id="status" 
                name="status" 
                value={formData.status}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewCard;