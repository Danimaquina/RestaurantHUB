import React, { useState } from "react";
import "../screens/EditReviewers.css";
import { db } from "../FireBaseConfig";
import { collection, getDocs, writeBatch, doc, deleteDoc } from "firebase/firestore";

const ReviewerCard = ({ 
    reviewer, 
    editingReviewerId, 
    tempFormData, 
    handleChange, 
    handleLoadVideos, 
    handleEdit, 
    handleUpdate, 
    handleCancelEdit, 
    handleDelete, 
    extractChannelId, 
    fetchingChannelId 
}) => {
    const [pendingChanges, setPendingChanges] = useState({
        videosLoaded: false,
        documentDeleted: false,
        tempLastVideo: ""
    });
    
    const [loadingVideos, setLoadingVideos] = useState(false);

    // Función para cargar todos los videos
    const handleLoadVideosPending = async (channelId, reviewerId, reviewerName) => {
        try {
            setLoadingVideos(true);
            
            // Llamar a la función para cargar todos los videos
            await handleLoadVideos(channelId, reviewerId, reviewerName);
            
            // Marcar que los videos se han cargado
            setPendingChanges({
                ...pendingChanges,
                videosLoaded: true,
                tempLastVideo: tempFormData.lastVideo
            });
        } catch (error) {
            console.error("Error cargando los videos:", error);
            alert("Error al cargar los videos: " + error.message);
        } finally {
            setLoadingVideos(false);
        }
    };

    // Función para marcar el documento como pendiente de eliminación
    const markDocumentForDeletion = () => {
        // Guardar el valor actual de lastVideo para restaurarlo si se cancela
        setPendingChanges({
            ...pendingChanges,
            documentDeleted: true,
            tempLastVideo: tempFormData.lastVideo
        });
        
        // Limpiar el campo lastVideo en la interfaz
        handleChange({ target: { value: "" } }, 'lastVideo');
        
        alert(`Documento '${reviewer.name}' marcado para eliminación. Haga clic en 'Guardar' para confirmar o 'Cancelar' para descartar.`);
    };

    // Función para borrar el documento específico cuando se guarda
    const deleteReviewerDocument = async () => {
        try {
            // Obtener todos los documentos de la colección VideosToEdit
            const videosCollectionRef = collection(db, "VideosToEdit");
            const querySnapshot = await getDocs(videosCollectionRef);
            
            // Crear un batch para operaciones en lote
            const batch = writeBatch(db);
            
            // Contador para los documentos eliminados
            let deletedCount = 0;
            
            // Recorrer todos los documentos y eliminar los que coincidan con el ReviewerID
            querySnapshot.forEach((document) => {
                const videoData = document.data();
                
                // Verificar si el ReviewerID coincide con el ID del reviewer actual
                if (videoData.ReviewerID === reviewer.id) {
                    batch.delete(document.ref);
                    deletedCount++;
                }
            });
            
            // Ejecutar el batch solo si hay documentos para eliminar
            if (deletedCount > 0) {
                await batch.commit();
                alert(`Se han eliminado ${deletedCount} videos asociados al reviewer '${reviewer.name}' de la colección 'VideosToEdit'`);
            } else {
                alert(`No se encontraron videos asociados al reviewer '${reviewer.name}' en la colección 'VideosToEdit'`);
            }
        } catch (error) {
            console.error(`Error eliminando los videos del reviewer '${reviewer.name}':`, error);
            alert(`Error eliminando los videos del reviewer '${reviewer.name}' de la colección 'VideosToEdit'`);
        }
    };

    // Función personalizada para manejar la actualización
    const handleUpdateWithPendingChanges = async (id) => {
        try {
            // Si hay un documento marcado para eliminación, eliminarlo
            if (pendingChanges.documentDeleted) {
                await deleteReviewerDocument();
            }
            
            // Llamar a la función original de actualización
            await handleUpdate(id);
            
            // Restablecer el estado de cambios pendientes
            setPendingChanges({
                videosLoaded: false,
                documentDeleted: false,
                tempLastVideo: ""
            });
        } catch (error) {
            console.error("Error al actualizar con cambios pendientes:", error);
        }
    };

    // Función personalizada para manejar la cancelación
    const handleCancelWithPendingChanges = () => {
        // Si hay cambios pendientes, restaurar el valor original de lastVideo
        if (pendingChanges.documentDeleted || pendingChanges.videosLoaded) {
            handleChange({ target: { value: pendingChanges.tempLastVideo } }, 'lastVideo');
        }
        
        // Restablecer el estado de cambios pendientes
        setPendingChanges({
            videosLoaded: false,
            documentDeleted: false,
            tempLastVideo: ""
        });
        
        // Llamar a la función original de cancelación
        handleCancelEdit();
    };

    return (
        <div key={reviewer.id} className="reviewer-card">
            {/* Loading Spinner Popup */}
            {loadingVideos && (
                <div className="loading-popup">
                    <div className="loading-spinner"></div>
                    <p>Cargando videos...</p>
                </div>
            )}
            
            <img src={reviewer.avatarUrl} alt="Avatar" className="avatar" />
            <p>
                <strong>URL del Avatar:</strong> 
                {editingReviewerId === reviewer.id ? (
                    <input 
                        type="text" 
                        value={tempFormData.avatarUrl} 
                        onChange={(e) => handleChange(e, 'avatarUrl')} 
                    />
                ) : (
                    reviewer.avatarUrl
                )}
            </p>
            <p>
                <strong>Last Video Checked:</strong> 
                {editingReviewerId === reviewer.id ? (
                    <>
                        <input 
                            type="text" 
                            value={tempFormData.lastVideo} 
                            onChange={(e) => handleChange(e, 'lastVideo')} 
                            placeholder="Introduce ID del video (Cargara los 10 siguiente) si no hay ID cargara todos los que se encuentre."
                        />
                        <button 
                            className="small-button" 
                            onClick={() => handleLoadVideosPending(tempFormData.channelId, reviewer.id, reviewer.name)}
                            disabled={loadingVideos}
                        >
                            Cargar últimos vídeos
                        </button>
                        <button 
                            className="small-button danger-button" 
                            style={{ backgroundColor: 'red', color: 'white' }}
                            onClick={() => markDocumentForDeletion()}
                        >
                            Borrar videos del Reviewer
                        </button>
                    </>
                ) : (
                    reviewer.lastVideo
                )}
            </p>
            <p>
                <strong>Name:</strong> 
                {editingReviewerId === reviewer.id ? (
                    <input 
                        type="text" 
                        value={tempFormData.name} 
                        onChange={(e) => handleChange(e, 'name')} 
                    />
                ) : (
                    reviewer.name
                )}
            </p>
            <p>
                <strong>Web:</strong> 
                {editingReviewerId === reviewer.id ? (
                    <input 
                        type="text" 
                        value={tempFormData.web} 
                        onChange={(e) => handleChange(e, 'web')} 
                    />
                ) : (
                    reviewer.web
                )}
            </p>
            <button 
                className="small-button" 
                onClick={() => window.open(reviewer.web, "_blank")}
            >
                Visitar web
            </button>
            <p>
                <strong>Channel ID:</strong> 
                {editingReviewerId === reviewer.id ? (
                    <input 
                        type="text" 
                        value={tempFormData.channelId} 
                        onChange={(e) => handleChange(e, 'channelId')} 
                    />
                ) : (
                    reviewer.channelId
                )}
            </p>

            {editingReviewerId === reviewer.id ? (
                <>
                    <button 
                        className="small-button" 
                        onClick={extractChannelId}
                        disabled={fetchingChannelId}
                    >
                        {fetchingChannelId ? "Extrayendo..." : "Obtener Channel ID"}
                    </button>
                    <button 
                        className="submit-button" 
                        onClick={() => handleUpdateWithPendingChanges(reviewer.id)}
                    >
                        Guardar
                    </button>
                    <button 
                        className="delete-button" 
                        onClick={handleCancelWithPendingChanges}
                    >
                        Cancelar
                    </button>
                </>
            ) : (
                <>
                    <button className="submit-button" onClick={() => handleEdit(reviewer)}>
                        Editar
                    </button>
                    <button className="delete-button" onClick={() => handleDelete(reviewer.id)}>
                        Eliminar Reviewer
                    </button>
                </>
            )}
        </div>
    );
};

export default ReviewerCard;