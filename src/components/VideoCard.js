import React, { useState, useEffect } from "react";
import "./VideoCard.css";
import { db } from "../FireBaseConfig";
import { doc, getDoc } from "firebase/firestore";

const VideoCard = ({ video, reviewerName }) => {
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [showFullTranscription, setShowFullTranscription] = useState(false);
    const [reviewerAvatar, setReviewerAvatar] = useState("");

    // Obtener el avatar del reviewer
    useEffect(() => {
        const fetchReviewerAvatar = async () => {
            if (video.ReviewerID) {
                try {
                    const reviewerDoc = await getDoc(doc(db, "reviewers", video.ReviewerID));
                    if (reviewerDoc.exists()) {
                        const reviewerData = reviewerDoc.data();
                        if (reviewerData.avatarUrl) {
                            setReviewerAvatar(reviewerData.avatarUrl);
                        }
                    }
                } catch (error) {
                    console.error("Error al obtener el avatar del reviewer:", error);
                }
            }
        };

        fetchReviewerAvatar();
    }, [video.ReviewerID]);

    // Format the publish date
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    };

    // Truncate text with a "Show More" button
    const TruncatedText = ({ text, maxLength, isExpanded, toggleExpand, type }) => {
        if (!text) return <p className="empty-field">No hay {type} disponible</p>;
        
        if (text.length <= maxLength || isExpanded) {
            return (
                <div className="full-text">
                    <p>{text}</p>
                    {text.length > maxLength && (
                        <button className="show-less-btn" onClick={toggleExpand}>
                            Mostrar menos
                        </button>
                    )}
                </div>
            );
        }
        
        return (
            <div className="truncated-text">
                <p>{text.substring(0, maxLength)}...</p>
                <button className="show-more-btn" onClick={toggleExpand}>
                    Mostrar más
                </button>
            </div>
        );
    };

    return (
        <div className="video-card">
            <div className="video-header">
                <h2 className="video-title">{video.Title}</h2>
                <div className="reviewer-info">
                    {reviewerAvatar && (
                        <img 
                            src={reviewerAvatar} 
                            alt={`Avatar de ${reviewerName}`} 
                            className="reviewer-avatar" 
                        />
                    )}
                    {reviewerName && <p className="reviewer-name">Por: {reviewerName}</p>}
                </div>
            </div>
            
            <div className="video-content">
                <div className="video-player-container">
                    <iframe
                        className="video-player"
                        src={`https://www.youtube.com/embed/${video.id}`}
                        title={video.Title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
                
                <div className="video-details">
                    <div className="detail-item">
                        <span className="detail-label">Fecha de publicación:</span>
                        <span className="detail-value">{formatDate(video.PublishDate)}</span>
                    </div>
                    
                    {video.ThumbnailUrl && (
                        <div className="detail-item thumbnail-container">
                            <span className="detail-label">Miniatura:</span>
                            <div className="centered-thumbnail">
                                <img 
                                    src={video.ThumbnailUrl} 
                                    alt="Miniatura del video" 
                                    className="video-thumbnail" 
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* New layout for description and transcription side by side */}
            <div className="text-containers">
                <div className="detail-item description-container">
                    <span className="detail-label">Descripción:</span>
                    <TruncatedText 
                        text={video.Description} 
                        maxLength={200} 
                        isExpanded={showFullDescription} 
                        toggleExpand={() => setShowFullDescription(!showFullDescription)}
                        type="descripción"
                    />
                </div>
                
                <div className="detail-item transcription-container">
                    <span className="detail-label">Transcripción:</span>
                    <TruncatedText 
                        text={video.Transcription} 
                        maxLength={300} 
                        isExpanded={showFullTranscription} 
                        toggleExpand={() => setShowFullTranscription(!showFullTranscription)}
                        type="transcripción"
                    />
                </div>
            </div>
            
            <div className="video-footer">
                <a 
                    href={`https://www.youtube.com/watch?v=${video.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="watch-on-youtube"
                >
                    Ver en YouTube
                </a>
                <span className="video-id">ID: {video.id}</span>
            </div>
        </div>
    );
};

export default VideoCard;