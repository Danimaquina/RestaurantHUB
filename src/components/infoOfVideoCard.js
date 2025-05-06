import React, { useState, useEffect } from 'react';
import { deleteDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../FireBaseConfig";
import './infoOfVideoCard.css';

const InfoOfVideoCard = ({ restaurant, reviews }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [videoDetails, setVideoDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      if (!reviews || reviews.length === 0) return;
      
      const activeReview = reviews[activeTab];
      if (!activeReview || !activeReview.videoId) return;
      
      try {
        setLoading(true);
        const videoDoc = await getDoc(doc(db, "Reviews", activeReview.videoId));
        if (videoDoc.exists()) {
          setVideoDetails(videoDoc.data());
        } else {
          setVideoDetails(null);
        }
      } catch (error) {
        console.error("Error fetching video details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoDetails();
  }, [reviews, activeTab]);

  if (!reviews || reviews.length === 0) {
    return (
      <div className="no-reviews">
        <h3>Reseñas</h3>
        <p>No hay reseñas disponibles para este restaurante.</p>
      </div>
    );
  }

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return 'Fecha no disponible';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteReview = async (reviewIndex) => {
    if (!restaurant?.id) {
      console.error("No hay ID de restaurante para eliminar la reseña");
      return;
    }

    const reviewToDelete = reviews[reviewIndex];
    if (!reviewToDelete) return;

    if (window.confirm(`¿Estás seguro que deseas eliminar esta reseña del ${(videoDetails.title)}?`)) {
      try {
        const updatedReviews = [...reviews];
        updatedReviews.splice(reviewIndex, 1);
        
        const restaurantRef = doc(db, "Restaurants", restaurant.id);
        await updateDoc(restaurantRef, {
          reviews: updatedReviews
        });
        
        alert("Reseña eliminada correctamente");
        window.location.reload();
      } catch (error) {
        console.error("Error al eliminar reseña:", error);
        alert("No se pudo eliminar la reseña");
      }
    }
  };

  return (
    <div className="reviews-container">
      <h3>Reseñas</h3>
      
      <div className="tabs-container">
        <div className="tabs-header">
          {reviews.map((review, index) => (
            <button
              key={index}
              className={`tab-button ${activeTab === index ? 'active' : ''}`}
              onClick={() => setActiveTab(index)}
            >
              Reseña {index + 1}
              {review.date && <span className="tab-date">{formatDate(review.date).split(',')[0]}</span>}
            </button>
          ))}
        </div>
        
        <div className="tab-content">
          {loading ? (
            <div className="loading">Cargando información del video...</div>
          ) : (
            <>
              <div className="review-card">
                <div className="review-header">
                  <div className="review-meta">
                    {reviews[activeTab].startTime && (
                      <span className="review-time">
                        Inicio de la Review: {reviews[activeTab].startTime} min/seg
                      </span>
                    )}
                  </div>
                  
                  <button
                    className="delete-review-button"
                    onClick={() => handleDeleteReview(activeTab)}
                  >
                    Eliminar Reseña
                  </button>
                </div>
                
                <div className="review-content">
                  {reviews[activeTab].text && (
                    <p className="review-text">{reviews[activeTab].text}</p>
                  )}



                  
                {videoDetails && (
                    <div style={{
                        margin: "20px 0",
                        width: "100%"
                    }}>
                        <div style={{ marginBottom: "15px" }}>
                        <p><strong>Título:</strong> {videoDetails.title || 'No disponible'}</p>
                        <p><strong>Fecha de publicación:</strong> {formatDate(videoDetails.publishDate)}</p>
                        </div>
                        
                        <div style={{
                        display: "flex",
                        justifyContent: "center",
                        width: "100%",
                        margin: "0 auto",
                        padding: "10px 0"
                        }}>
                        <div style={{
                            position: "relative",
                            width: "80%",
                            maxWidth: "800px",
                            paddingBottom: "45%",
                            overflow: "hidden",
                            borderRadius: "8px",
                            backgroundColor: "#000",
                            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)"
                        }}>
                            <iframe
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                border: "none"
                            }}
                            src={`https://www.youtube.com/embed/${reviews[activeTab].videoId}`}
                            title={videoDetails.title || 'Video de reseña'}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            ></iframe>
                        </div>
                        </div>
                    </div>
                    )}


                  
                  {reviews[activeTab].images && reviews[activeTab].images.length > 0 && (
                    <div className="review-images">
                      <h4>Imágenes adjuntas:</h4>
                      <div className="image-grid">
                        {reviews[activeTab].images.map((image, imgIndex) => (
                          <div key={imgIndex} className="image-item">
                            <img 
                              src={image} 
                              alt={`Reseña ${activeTab + 1} - Imagen ${imgIndex + 1}`} 
                              onClick={() => window.open(image, '_blank')}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfoOfVideoCard;