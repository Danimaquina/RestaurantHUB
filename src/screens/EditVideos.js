import React, { useState, useEffect } from "react";
import { db } from "../FireBaseConfig";
import { collection, getDocs, query, where, doc, getDoc, setDoc, deleteDoc, arrayUnion, updateDoc} from "firebase/firestore";
import VideoCard from "../components/VideoCard";
import ReviewCard from "../components/ReviewCard";
import "./EditVideos.css";

export default function EditVideos() {
  const [videos, setVideos] = useState([]);
  const [reviewers, setReviewers] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredVideos, setFilteredVideos] = useState([]);
  const videosPerPage = 1;

  // Efecto para obtener los videos y reviewers al cargar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener todos los reviewers para mostrar sus nombres
        const reviewersSnapshot = await getDocs(collection(db, "reviewers"));
        const reviewersData = {};
        reviewersSnapshot.forEach(doc => {
          reviewersData[doc.id] = doc.data().name;
        });
        setReviewers(reviewersData);
        
        // Obtener todos los videos
        const videosSnapshot = await getDocs(collection(db, "VideosToEdit"));
        const videosData = videosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setVideos(videosData);
        setFilteredVideos(videosData);
        
        setLoading(false);
      } catch (error) {
        console.error("Error al obtener datos:", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filtra los videos cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredVideos(videos);
    } else {
      const filtered = videos.filter(video => 
        video.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (video.Description && video.Description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (video.Transcription && video.Transcription.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredVideos(filtered);
    }
    // Reinicia a la primera página cuando se realiza una búsqueda
    setCurrentPage(1);
  }, [searchTerm, videos]);

  // Maneja la búsqueda
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  

  const handlePublishReviews = async (videoId) => {
    if (!window.confirm("¿Estás seguro que quieres publicar todas las reviews de este video? Esta acción no se puede deshacer.")) {
      return;
    }
  
    try {
      // Obtener el video específico
      const video = videos.find(v => v.id === videoId);
      if (!video) {
        alert("Video no encontrado");
        return;
      }
  
      // Verificar que hay reviews para publicar
      if (!video.Review || video.Review.length === 0) {
        alert("No hay reviews para publicar en este video");
        return;
      }
  
      // Procesar cada review del video
      for (const review of video.Review) {
        // 1. Crear/actualizar documento en Restaurants
        const restaurantRef = doc(db, "Restaurants", review.googlePlaceId);
        const restaurantDoc = await getDoc(restaurantRef);
  
        const reviewData = {
          videoId: video.id,
          startTime: review.startTime,
          publishDate: new Date()
        };
  
        if (restaurantDoc.exists()) {
          // Actualizar restaurante existente
          await updateDoc(restaurantRef, {
            reviews: arrayUnion(reviewData),
            lastUpdated: new Date()
          });
        } else {
          // Crear nuevo restaurante
          await setDoc(restaurantRef, {
            googlePlaceId: review.googlePlaceId,
            name: review.name,
            address: review.address,
            phone: review.phone,
            website: review.website,
            tripAdvisorLink: review.tripAdvisorLink,
            googleMapsLink: review.googleMapsLink,
            rating: review.rating,
            reviewCount: review.reviewCount,
            priceLevel: review.priceLevel,
            latitude: review.latitude,
            longitude: review.longitude,
            image: review.image,
            status: review.status,
            reviews: [reviewData],
            createdAt: new Date()
          });
        }
      }

      // Crear un solo documento en Reviews por video
      const reviewDocRef = doc(db, "Reviews", video.id);
      await setDoc(reviewDocRef, {
        videoId: video.id,
        reviewerId: video.ReviewerID,
        title: video.Title,
        publishDate: new Date(),
      });
  
      // 3. Eliminar el video de VideosToEdit
      const videoRef = doc(db, "VideosToEdit", video.id);
      await deleteDoc(videoRef);
  
      alert("Todas las reviews han sido publicadas correctamente!");
      
      // Actualizar la lista de videos
      setVideos(prev => prev.filter(v => v.id !== videoId));
      setFilteredVideos(prev => prev.filter(v => v.id !== videoId));
      
    } catch (error) {
      console.error("Error al publicar reviews:", error);
      alert("Error al publicar: " + error.message);
    }
  };

  // Cálculo para la paginación
  const indexOfLastVideo = currentPage * videosPerPage;
  const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
  const currentVideos = filteredVideos.slice(indexOfFirstVideo, indexOfLastVideo);

  return (
    <div className="container">
      <h1>Gestión de Videos</h1>

      {/* Barra de búsqueda */}
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar por título, descripción o transcripción..."
          value={searchTerm}
          onChange={handleSearch}
        />
        <span className="search-icon">🔍</span>
      </div>

      {loading ? (
        <div className="loading">Cargando videos...</div>
      ) : filteredVideos.length === 0 ? (
        <p className="no-results">No se encontraron videos con esos criterios</p>
      ) : (
        <div>
          {/* Paginación */}
          <div className="pagination">
            <button 
              onClick={() => setCurrentPage(currentPage - 1)} 
              disabled={currentPage === 1}
            >
              ← Previous
            </button>
            {Array.from({ length: Math.ceil(filteredVideos.length / videosPerPage) }, (_, i) => (
              <button 
                key={i} 
                className={currentPage === i + 1 ? "active" : ""}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button 
              onClick={() => setCurrentPage(currentPage + 1)} 
              disabled={currentPage === Math.ceil(filteredVideos.length / videosPerPage)}
            >
              Next →
            </button>
          </div>

          <div className="videos-list">
            {currentVideos.map(video => (
              <div key={video.id} className="video-container">
                <VideoCard
                  video={video}
                  reviewerName={reviewers[video.ReviewerID]}
                />
                <ReviewCard 
                  video={video} 
                  reviewerName={reviewers[video.ReviewerID]}
                  alwaysOpen={true} 
                />
                <button 
                  className="publish-btn"
                  onClick={() => handlePublishReviews(video.id)}
                >
                  Volcar Infomarcion
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}