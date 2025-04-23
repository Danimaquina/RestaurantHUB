import React, { useState } from "react";
import "./ReviewCard.css";
import apiKeys from "../utils/apiKeys";
import {searchPlaces, getPlaceDetails} from "../googlePlacesService";
import MiniMap from "../components/MiniMap";

const ReviewCard = ({ video, reviewerName }) => {
  const [reviews, setReviews] = useState([
    {
      id: 1,
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
    }
  ]);
  
  const [activeReviewId, setActiveReviewId] = useState(1);
  const [searchResults, setSearchResults] = useState([]);

  const activeReview = reviews.find(review => review.id === activeReviewId) || reviews[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setReviews(reviews.map(review => 
      review.id === activeReviewId ? { ...review, [name]: value } : review
    ));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Reviews to save:", reviews);
    // Guardar todas las reviews en Firebase
    // Cada review tendrá su campo 'id' con el número correspondiente
  };

  const handleVisitLink = (url) => {
    if (!url || url === "INEXISTENTE") {
      alert("No hay enlace disponible.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };
  
  const handleAddRestaurant = () => {
    const newId = reviews.length > 0 ? Math.max(...reviews.map(r => r.id)) + 1 : 1;
    setReviews([
      ...reviews,
      {
        id: newId,
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
      }
    ]);
    setActiveReviewId(newId);
  };

  const handleSearch = async () => {
    try {
      const results = await searchPlaces(activeReview.search);
      setSearchResults(results);
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleSelectPlace = async (e) => {
    const selectedPlaceName = e.target.value;
    const selectedPlace = searchResults.find(place => place.displayName.text === selectedPlaceName);
  
    if (selectedPlace) {
      try {
        // Update the active review with basic fields
        setReviews(reviews.map(review => 
          review.id === activeReviewId ? {
            ...review,
            name: selectedPlaceName,
            googlePlaceId: selectedPlace.id,
            address: selectedPlace.formattedAddress
          } : review
        ));
  
        // Get complete details
        const details = await getPlaceDetails(selectedPlace.id);
        console.log("Datos de la API:", details); 
  
        // Update the active review with all details
        setReviews(reviews.map(review => 
          review.id === activeReviewId ? {
            ...review,
            name: selectedPlaceName,
            googlePlaceId: selectedPlace.id,
            address: selectedPlace.formattedAddress,
            phone: details.internationalPhoneNumber || "", 
            googleMapsLink: details.googleMapsUri || "", 
            website: details.websiteUri?.trim() !== "" ? details.websiteUri : "INEXISTENTE",
            rating: details.rating?.toString() || "", 
            reviewCount: details.userRatingCount?.toString() || "", 
            priceLevel: details.priceLevel ? details.priceLevel.replace("PRICE_LEVEL_", "") : "",
            latitude: details.location?.latitude?.toString() || "",
            longitude: details.location?.longitude?.toString() || "",
            status: details.businessStatus || ""
          } : review
        ));
  
      } catch (error) {
        console.error("Error al cargar detalles:", error);
      }
    }
  };

  return (
    <div className="review-card">
      <div className="restaurant-form-container">
        <div className="restaurant-form-header">
          <h3>Añadir review para el video: {video.Title}</h3>
        </div>
        <form className="restaurant-form" onSubmit={handleSubmit}>
          <div className="form-tabs">
            {reviews.map(review => (
              <div 
                key={review.id}
                className={`tab ${activeReviewId === review.id ? 'active' : ''}`}
                onClick={() => setActiveReviewId(review.id)}
              >
                {review.name || `Review ${review.id}`}
              </div>
            ))}
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
                value={activeReview.startTime}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="search">Buscar restaurante:</label>
              <input 
                type="text" 
                id="search" 
                name="search" 
                value={activeReview.search}
                onChange={handleChange}
              />
              <div className="button-container">
                <button type="button" className="action-btn" onClick={handleSearch}>Buscar</button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="name">Nombre del restaurante:</label>
              {searchResults.length > 0 ? (
                <select id="name" name="name" value={activeReview.name} onChange={handleSelectPlace}>
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
                  value={activeReview.name}
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
                value={activeReview.googlePlaceId}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="address">Dirección del restaurante:</label>
              <input 
                type="text" 
                id="address" 
                name="address" 
                value={activeReview.address}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Teléfono del restaurante:</label>
              <input 
                type="text" 
                id="phone" 
                name="phone" 
                value={activeReview.phone}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="website">Website del restaurante:</label>
              <input 
                type="text" 
                id="website" 
                name="website" 
                value={activeReview.website}
                onChange={handleChange}
              />
              <div className="button-container">
                <button 
                  type="button" 
                  className="action-btn"
                  onClick={() => handleVisitLink(activeReview.website)}
                >
                  Visitar web →
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="tripAdvisorLink">Ficha en TripAdvisor:</label>
              <input 
                type="text" 
                id="tripAdvisorLink" 
                name="tripAdvisorLink" 
                value={activeReview.tripAdvisorLink}
                onChange={handleChange}
              />
              <div className="button-container">
                <button 
                  type="button" 
                  className="action-btn"
                  onClick={() => handleVisitLink(activeReview.tripAdvisorLink)}
                >
                  Visitar web →
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="googleMapsLink">Ficha en Google Maps:</label>
              <input 
                type="text" 
                id="googleMapsLink" 
                name="googleMapsLink" 
                value={activeReview.googleMapsLink}
                onChange={handleChange}
              />
              <div className="button-container">
                <button 
                  type="button" 
                  className="action-btn"
                  onClick={() => handleVisitLink(activeReview.googleMapsLink)}
                >
                  Visitar web →
                </button>
              </div>
            </div>
            
            <div className="form-group rating-group">
              <div>
                <label htmlFor="rating">Rating en Google Maps:</label>
                <input 
                  type="text" 
                  id="rating" 
                  name="rating" 
                  value={activeReview.rating}
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
                  value={activeReview.reviewCount}
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
                value={activeReview.priceLevel}
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
                  value={activeReview.latitude}
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
                  value={activeReview.longitude}
                  onChange={handleChange}
                  className="small-input"
                  placeholder="Ej: 2.1734"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Mapa:</label>
              <div className="map-container">
                <MiniMap lat={activeReview.latitude} lng={activeReview.longitude} />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="image">Imagen del restaurante:</label>
              <input 
                type="text" 
                id="image" 
                name="image" 
                value={activeReview.image}
                onChange={handleChange}
              />
              <div className="image-preview-container">
                {activeReview.image && (
                  <img src={activeReview.image} alt="Restaurant preview" className="image-preview" />
                )}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="status">Estado del restaurante:</label>
              <input 
                type="text" 
                id="status" 
                name="status" 
                value={activeReview.status}
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