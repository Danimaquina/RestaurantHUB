import React, { useState, useEffect } from "react";
import { db } from "../FireBaseConfig";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import VideoCard from "../components/VideoCard";
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

          {/* Lista de videos */}
          <div className="videos-list">
            {currentVideos.map(video => (
              <VideoCard
                key={video.id}
                video={video}
                reviewerName={reviewers[video.ReviewerID]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}