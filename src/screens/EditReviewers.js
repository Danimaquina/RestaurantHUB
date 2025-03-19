import { useState, useEffect } from "react";
import { db, addReviewer, updateReviewer } from "../FireBaseConfig";
import { collection, getDocs, deleteDoc, doc, writeBatch } from "firebase/firestore";
import "./EditReviewers.css";
import apiKeys from "../utils/apiKeys";
import ReviewerCard from "../components/ReviewerCard"; 

export default function EditReviewers() {
     // Estado para almacenar la lista de reviewers
    const [reviewers, setReviewers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const reviewersPerPage = 1;
    const [fetchingChannelId, setFetchingChannelId] = useState(false);
    const [editingReviewerId, setEditingReviewerId] = useState(null);
    const [tempFormData, setTempFormData] = useState({});
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredReviewers, setFilteredReviewers] = useState([]);
    
    // Datos por defecto del formulario
    const defaultFormData = {
        avatarUrl: "",
        lastVideo: "",
        name: "",
        web: "",
        channelId: "",
    };

    const [formData, setFormData] = useState(defaultFormData);

    // Efecto para obtener la lista de reviewers al cargar el componente
    useEffect(() => {
        fetchReviewers();
    }, []);

    // Filtra los reviewers cuando cambia el término de búsqueda o la lista de reviewers
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredReviewers(reviewers);
        } else {
            const filtered = reviewers.filter(reviewer => 
                reviewer.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredReviewers(filtered);
        }
        // Reinicia a la primera página cuando se realiza una búsqueda
        setCurrentPage(1);
    }, [searchTerm, reviewers]);

    // Obtiene la lista de reviewers desde Firestore
    const fetchReviewers = async () => {
        const querySnapshot = await getDocs(collection(db, "reviewers"));
        const reviewersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReviewers(reviewersList);
        // Initialize filtered reviewers with all reviewers
        setFilteredReviewers(reviewersList);
    };

    // Maneja la búsqueda
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    // Cancela la edición del reviewer actual
    const handleCancelEdit = () => {
        window.pendingVideoIds = null;
        setEditingReviewerId(null);
        setTempFormData({});
    };

    // Alterna la visibilidad del formulario
    const toggleForm = () => {
        setShowForm(!showForm);
        setFormData(defaultFormData);
    };

    // Maneja cambios en los campos del formulario
    const handleChange = (e, field) => {
        if (editingReviewerId) {
            setTempFormData({ ...tempFormData, [field]: e.target.value });
        } else {
            setFormData({ ...formData, [field]: e.target.value });
        }
    };

    // Envía el formulario para agregar un nuevo reviewer
    const handleSubmit = async () => {
        try {
            // Validar que los campos obligatorios estén completos
            if (!formData.name.trim()) {
                alert("El campo 'Name' es obligatorio");
                return;
            }
            
            if (!formData.web.trim()) {
                alert("El campo 'Web' es obligatorio");
                return;
            }
            
            await addReviewer(formData);
            alert("Reviewer creado exitosamente");
            setFormData(defaultFormData);
            setShowForm(false);
            fetchReviewers();
        } catch (error) {
            console.error("Error al crear reviewer:", error);
        }
    };

    // Elimina un reviewer
    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, "reviewers", id));
            alert("Reviewer eliminado");
            fetchReviewers();
        } catch (error) {
            console.error("Error al eliminar reviewer:", error);
        }
    };

    // Activa el modo edición con los datos del reviewer seleccionado
    const handleEdit = (reviewer) => {
        setEditingReviewerId(reviewer.id);
        setTempFormData({
            avatarUrl: reviewer.avatarUrl,
            lastVideo: reviewer.lastVideo,
            name: reviewer.name,
            web: reviewer.web,
            channelId: reviewer.channelId,
        });
    };

    // Extrae el ID del canal de YouTube desde la URL
    const extractChannelId = async () => {
        setFetchingChannelId(true);
        try {
            let channelIdentifier = "";
            const url = new URL(editingReviewerId ? tempFormData.web : formData.web);

            if (url.pathname.includes("/channel/")) {
                channelIdentifier = url.pathname.split("/channel/")[1];
                if (editingReviewerId) {
                    setTempFormData(prev => ({ ...prev, channelId: channelIdentifier }));
                } else {
                    setFormData(prev => ({ ...prev, channelId: channelIdentifier }));
                }
                setFetchingChannelId(false);
                return;
            } else if (url.pathname.startsWith("/@")) {
                channelIdentifier = url.pathname.substring(2);
            } else {
                throw new Error("Formato de URL de YouTube no válido");
            }

            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${channelIdentifier}&key=${apiKeys.YOUTUBE_API_KEY}`
            );

            if (!response.ok) {
                throw new Error("Error al obtener datos del canal");
            }

            const data = await response.json();
            if (data.items && data.items.length > 0) {
                if (editingReviewerId) {
                    setTempFormData(prev => ({ ...prev, channelId: data.items[0].snippet.channelId }));
                } else {
                    setFormData(prev => ({ ...prev, channelId: data.items[0].snippet.channelId }));
                }
            } else {
                throw new Error("Canal no encontrado");
            }
        } catch (error) {
            console.error("Error obteniendo el Channel ID:", error);
            alert("Error obteniendo el Channel ID. Verifique la URL e intente nuevamente.");
        } finally {
            setFetchingChannelId(false);
        }
    };

    const fetchAllVideosFromChannel = async (channelId) => {
        let allVideos = [];
        let nextPageToken = "";
    
        do {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=50&order=date&type=video&key=${apiKeys.YOUTUBE_API_KEY}&pageToken=${nextPageToken}`
            );
    
            if (!response.ok) {
                throw new Error("Error al obtener los videos del canal");
            }
    
            const data = await response.json();
            const videos = data.items.map(item => ({
                id: item.id.videoId,
                publishedAt: item.snippet.publishedAt,
                title: item.snippet.title
            }));
    
            allVideos = [...allVideos, ...videos];
            nextPageToken = data.nextPageToken || "";
        } while (nextPageToken);
    
        return allVideos;
    };

    // Función para obtener los detalles de un video
    const getVideoDetails = async (videoId) => {
        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKeys.YOUTUBE_API_KEY}`
            );
    
            if (!response.ok) {
                throw new Error("Error al obtener los detalles del video");
            }
    
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                const snippet = data.items[0].snippet;
                return {
                    description: snippet.description,
                    thumbnailUrl: snippet.thumbnails?.high?.url || 
                                 snippet.thumbnails?.medium?.url || 
                                 snippet.thumbnails?.default?.url || ""
                };
            } else {
                return { description: "", thumbnailUrl: "" };
            }
        } catch (error) {
            console.error("Error obteniendo los detalles del video:", error);
            return { description: "", thumbnailUrl: "" };
        }
    };

    // Nueva función para guardar los IDs de los videos en Firestore
    const saveVideoIdsToFirestore = async (videos, reviewerId, reviewerName) => {
        try {
            const batch = writeBatch(db); // Usa writeBatch para operaciones en lote
            const videosCollectionRef = collection(db, "VideosToEdit");
            
            // For each video, create a document with the video ID as the document name
            for (const video of videos) {
                // Get additional video details from the API
                const videoDetails = await getVideoDetails(video.id);
                
                // Create a document reference with the video ID as the document name
                const videoDocRef = doc(videosCollectionRef, video.id);
                
                // Set the document data with all required fields
                batch.set(videoDocRef, {
                    PublishDate: video.publishedAt,
                    Title: video.title,
                    ReviewerID: reviewerId,
                    Description: videoDetails.description || "",
                    ThumbnailUrl: videoDetails.thumbnailUrl || ""
                });
            }
    
            // Actualizar el campo "lastVideo" en el documento del reviewer
            const lastVideoId = videos[0].id; // El primer video es el más reciente
            const lastVideoDate = new Date().toLocaleString(); // Fecha y hora actual
            const lastVideoValue = `${lastVideoId} (Última carga: ${lastVideoDate})`;
    
            const reviewerRef = doc(db, "reviewers", reviewerId);
            batch.update(reviewerRef, { lastVideo: lastVideoValue });
    
            await batch.commit(); // Ejecutar el batch
            alert("Videos guardados exitosamente en Firestore y lastVideo actualizado");
            
            // Return the updated lastVideo value for UI updates
            return { lastVideoValue };
        } catch (error) {
            console.error("Error guardando los videos en Firestore:", error);
            throw error;
        }
    };

    // Función para obtener la fecha de publicación de un video
    const getVideoPublishDate = async (videoId) => {
        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKeys.YOUTUBE_API_KEY}`
            );
    
            if (!response.ok) {
                throw new Error("Error al obtener la fecha de publicación del video");
            }
    
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                return data.items[0].snippet.publishedAt; // Retorna la fecha de publicación del video
            } else {
                throw new Error("Video no encontrado");
            }
        } catch (error) {
            console.error("Error obteniendo la fecha de publicación del video:", error);
            throw error;
        }
    };

    // Función para cargar todos los videos desde un canal y guardarlos en Firestore
    const handleLoadVideos = async (channelId, reviewerId, reviewerName) => {
        try {
            if (!channelId) {
                throw new Error("El Channel ID está vacío.");
            }
    
            const lastVideoId = editingReviewerId ? tempFormData.lastVideo : formData.lastVideo;
            let allVideos = [];
    
            if (lastVideoId) {
                // Obtener la fecha de publicación del video con la ID proporcionada
                const publishDate = await getVideoPublishDate(lastVideoId);
    
                // Si hay una ID en el campo "Last Video Checked", cargar solo los 10 videos más nuevos después de esa fecha
                const response = await fetch(
                    `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=10&order=date&type=video&key=${apiKeys.YOUTUBE_API_KEY}&publishedAfter=${publishDate}`
                );
    
                if (!response.ok) {
                    throw new Error("Error al obtener los videos del canal");
                }
    
                const data = await response.json();
                allVideos = data.items.map(item => ({
                    id: item.id.videoId,
                    publishedAt: item.snippet.publishedAt,
                    title: item.snippet.title
                }));
            } else {
                // Si no hay una ID en el campo "Last Video Checked", cargar todos los videos
                allVideos = await fetchAllVideosFromChannel(channelId);
            }
    
            if (allVideos.length === 0) {
                throw new Error("No se encontraron videos para este canal.");
            }
    
            // Guardar los videos en Firestore
            const reviewer = reviewers.find(r => r.id === reviewerId);
            if (reviewer) {
                // Pass the full video objects instead of just IDs
                const result = await saveVideoIdsToFirestore(allVideos, reviewerId, reviewer.name);
                
                // Update the tempFormData if we're in edit mode
                if (editingReviewerId === reviewerId && result && result.lastVideoValue) {
                    setTempFormData(prev => ({
                        ...prev,
                        lastVideo: result.lastVideoValue
                    }));
                }
            }
    
            alert(`${allVideos.length} videos cargados exitosamente.`);
            
            // Return the result for UI updates in ReviewerCard
            return { lastVideoValue: allVideos[0].id };
        } catch (error) {
            console.error("Error cargando los videos:", error);
            alert(error.message || "Error cargando los videos. Por favor, inténtalo de nuevo.");
            return null;
        }
    };
    
    // Modificar la función handleUpdate para guardar los videos pendientes
    const handleUpdate = async (id) => {
        try {
            // Si hay videos pendientes, guardarlos en Firestore
            if (window.pendingVideoIds && window.pendingVideoIds.length > 0) {
                const reviewer = reviewers.find(r => r.id === id);
                if (reviewer) {
                    await saveVideoIdsToFirestore(window.pendingVideoIds, id, reviewer.name);
                    // Limpiar los videos pendientes
                    window.pendingVideoIds = null;
                }
            }
            
            await updateReviewer(id, tempFormData);
            alert("Reviewer actualizado exitosamente");
            setEditingReviewerId(null);
            setTempFormData({});
            fetchReviewers();
        } catch (error) {
            console.error("Error al actualizar reviewer:", error);
        }
    };

    // Update pagination to use filteredReviewers instead of reviewers
    const indexOfLastReviewer = currentPage * reviewersPerPage;
    const indexOfFirstReviewer = indexOfLastReviewer - reviewersPerPage;
    const currentReviewers = filteredReviewers.slice(indexOfFirstReviewer, indexOfLastReviewer);

    return (
        <div className="container">
            <h1>Gestión de Reviewers</h1>

            {/* Add search bar */}
            <div className="search-container">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Buscar reviewer por nombre..."
                    value={searchTerm}
                    onChange={handleSearch}
                />
                <span className="search-icon">🔍</span>
            </div>

            {filteredReviewers.length === 0 ? (
                <p className="no-results">No se encontraron reviewers con ese nombre</p>
            ) : (
                <div>
                    <div className="pagination">
                        <button 
                            onClick={() => setCurrentPage(currentPage - 1)} 
                            disabled={currentPage === 1}
                        >
                            ← Previous
                        </button>
                        {Array.from({ length: Math.ceil(filteredReviewers.length / reviewersPerPage) }, (_, i) => (
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
                            disabled={currentPage === Math.ceil(filteredReviewers.length / reviewersPerPage)}
                        >
                            Next →
                        </button>
                    </div>

                    {currentReviewers.map(reviewer => (
                        <ReviewerCard
                            key={reviewer.id}
                            reviewer={reviewer}
                            editingReviewerId={editingReviewerId}
                            tempFormData={tempFormData}
                            handleChange={handleChange}
                            handleLoadVideos={handleLoadVideos}
                            handleEdit={handleEdit}
                            handleUpdate={handleUpdate}
                            handleCancelEdit={handleCancelEdit}
                            handleDelete={handleDelete}
                            extractChannelId={extractChannelId}
                            fetchingChannelId={fetchingChannelId}
                        />
                    ))}
                </div>
            )}

            <button className="create-button" onClick={toggleForm}>
                + Crear Reviewer
            </button>

            {showForm && (
                <div className="modal">
                    <div className="modal-content">
                        <label>
                            URL del Avatar:
                            <input 
                                type="text" 
                                name="avatarUrl" 
                                value={formData.avatarUrl} 
                                onChange={(e) => handleChange(e, 'avatarUrl')} 
                                placeholder="https://..."
                            />
                        </label>

                        <label>
                            Last Video Checked:
                            <input 
                                type="text" 
                                name="lastVideo" 
                                value={formData.lastVideo} 
                                onChange={(e) => handleChange(e, 'lastVideo')} 
                                placeholder="Video ID"
                            />
                        </label>

                        <label>
                            Name: <span className="required-field">*</span>
                            <input 
                                type="text" 
                                name="name" 
                                value={formData.name} 
                                onChange={(e) => handleChange(e, 'name')} 
                                placeholder="Reviewer Name"
                                required
                            />
                        </label>

                        <label>
                            Web: <span className="required-field">*</span>
                            <input 
                                type="text" 
                                name="web" 
                                value={formData.web} 
                                onChange={(e) => handleChange(e, 'web')} 
                                placeholder="https://..."
                                required
                            />
                        </label>

                        <label>
                            Channel ID:
                            <input 
                                type="text" 
                                name="channelId" 
                                value={formData.channelId} 
                                onChange={(e) => handleChange(e, 'channelId')} 
                                placeholder="Channel ID"
                            />
                            <button 
                                className="small-button" 
                                onClick={extractChannelId}
                                disabled={fetchingChannelId}
                            >
                                {fetchingChannelId ? "Extrayendo..." : "Obtener Channel ID"}
                            </button>
                        </label>

                        <button className="submit-button" onClick={handleSubmit}>
                            Crear nuevo Reviewer
                        </button>

                        <button className="close-button" onClick={toggleForm}>Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
}