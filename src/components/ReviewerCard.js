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
    // Estado para rastrear si se han cargado videos o eliminado documentos
    const [pendingChanges, setPendingChanges] = useState({
        videosLoaded: false,
        documentDeleted: false,
        tempLastVideo: ""
    });
    
    // Estado para controlar la carga paginada de videos
    const [loadingVideos, setLoadingVideos] = useState(false);
    const [hasMoreVideos, setHasMoreVideos] = useState(true);
    const [nextPageToken, setNextPageToken] = useState("");

    // Función para cargar videos pero guardar el estado pendiente
    const handleLoadVideosPending = async (channelId, reviewerId, reviewerName) => {
        try {
            setLoadingVideos(true);
            
            // Llamar a la función original para cargar videos
            const result = await handleLoadVideos(channelId, reviewerId, reviewerName, nextPageToken);
            
            if (result) {
                // Si es la primera carga, guardar el valor original
                if (!nextPageToken) {
                    setPendingChanges({
                        ...pendingChanges,
                        videosLoaded: true,
                        tempLastVideo: tempFormData.lastVideo
                    });
                }
                
                // Actualizar el token para la siguiente página
                setNextPageToken(result.nextPageToken);
                
                // Si no hay más token, no hay más videos para cargar
                if (!result.nextPageToken) {
                    setHasMoreVideos(false);
                }
            } else {
                // Si hay un error o no hay resultados, no hay más videos
                setHasMoreVideos(false);
            }
        } catch (error) {
            console.error("Error cargando los videos:", error);
            setHasMoreVideos(false);
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
            // Referencia al documento específico del reviewer
            const reviewerDocRef = doc(db, "VideosToEdit", reviewer.name);
            
            // Eliminar solo ese documento
            await deleteDoc(reviewerDocRef);
            
            alert(`Documento '${reviewer.name}' eliminado exitosamente de la colección 'VideosToEdit'`);
        } catch (error) {
            console.error(`Error eliminando el documento '${reviewer.name}':`, error);
            alert(`Error eliminando el documento '${reviewer.name}' de la colección 'VideosToEdit'`);
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
            
            // Reiniciar el estado de carga paginada
            setNextPageToken("");
            setHasMoreVideos(true);
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
        
        // Reiniciar el estado de carga paginada
        setNextPageToken("");
        setHasMoreVideos(true);
        
        // Llamar a la función original de cancelación
        handleCancelEdit();
    };

    // Determinar el texto del botón de carga de videos
    const getLoadButtonText = () => {
        if (loadingVideos) {
            return "Cargando...";
        }
        
        if (!nextPageToken) {
            return "Cargar últimos vídeos";
        }
        
        return "Cargar 10 siguientes";
    };

    return (
        <div key={reviewer.id} className="reviewer-card">
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
                            placeholder="Introduce ID de video para cargar solo los más nuevos"
                        />
                        {!hasMoreVideos && nextPageToken ? (
                            <div style={{ color: 'green', marginTop: '5px' }}>Ya no hay más videos</div>
                        ) : (
                            <button 
                                className="small-button" 
                                onClick={() => handleLoadVideosPending(tempFormData.channelId, reviewer.id, reviewer.name)}
                                title={!nextPageToken 
                                    ? "Si el campo está vacío, cargará todos los videos. Si hay un ID, cargará desde ese ID hasta el más nuevo" 
                                    : "Cargar los siguientes 10 videos"}
                                disabled={loadingVideos}
                            >
                                {getLoadButtonText()}
                            </button>
                        )}

                        <button 
                            className="small-button danger-button" 
                            style={{ backgroundColor: 'red', color: 'white' }}
                            onClick={() => markDocumentForDeletion()}
                        >
                            Borrar documento
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



