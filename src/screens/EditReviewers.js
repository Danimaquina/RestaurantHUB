import { useState, useEffect } from "react";
import { db, addReviewer, updateReviewer } from "../FireBaseConfig";
import { collection, getDocs, deleteDoc, doc, writeBatch } from "firebase/firestore";
import "./EditReviewers.css";
import apiKeys from "../utils/apiKeys";
import ReviewerCard from "../components/ReviewerCard"; // Importa el nuevo componente

export default function EditReviewers() {
    const [reviewers, setReviewers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const reviewersPerPage = 1;
    const [fetchingChannelId, setFetchingChannelId] = useState(false);
    const [editingReviewerId, setEditingReviewerId] = useState(null);
    const [tempFormData, setTempFormData] = useState({});
    const [showForm, setShowForm] = useState(false);

    const defaultFormData = {
        avatarUrl: "",
        lastVideo: "",
        name: "",
        web: "",
        channelId: "",
    };

    const [formData, setFormData] = useState(defaultFormData);

    useEffect(() => {
        fetchReviewers();
    }, []);

    const fetchReviewers = async () => {
        const querySnapshot = await getDocs(collection(db, "reviewers"));
        const reviewersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReviewers(reviewersList);
    };

    const deleteVideosToEditCollection = async () => {
        try {
            const videosCollectionRef = collection(db, "VideosToEdit");
            const querySnapshot = await getDocs(videosCollectionRef);
    
            const batch = writeBatch(db);
            querySnapshot.forEach((doc) => {
                batch.delete(doc.ref); // Añade cada documento al batch para eliminarlo
            });
    
            await batch.commit(); // Ejecuta el batch
            alert("Colección 'VideosToEdit' eliminada exitosamente");
        } catch (error) {
            console.error("Error eliminando la colección 'VideosToEdit':", error);
            alert("Error eliminando la colección 'VideosToEdit'");
        }
    };

    const handleCancelEdit = () => {
        // Clear any pending video IDs when canceling
        window.pendingVideoIds = null;
        setEditingReviewerId(null);
        setTempFormData({});
    };

    const toggleForm = () => {
        setShowForm(!showForm);
        setFormData(defaultFormData);
    };

    const handleChange = (e, field) => {
        if (editingReviewerId) {
            setTempFormData({ ...tempFormData, [field]: e.target.value });
        } else {
            setFormData({ ...formData, [field]: e.target.value });
        }
    };

    const handleSubmit = async () => {
        try {
            await addReviewer(formData);
            alert("Reviewer creado exitosamente");
            setFormData(defaultFormData);
            setShowForm(false);
            fetchReviewers();
        } catch (error) {
            console.error("Error al crear reviewer:", error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, "reviewers", id));
            alert("Reviewer eliminado");
            fetchReviewers();
        } catch (error) {
            console.error("Error al eliminar reviewer:", error);
        }
    };

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

    const fetchVideosFromChannel = async (channelId, nextPageToken = "") => {
        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=50&order=date&type=video&key=${apiKeys.YOUTUBE_API_KEY}&pageToken=${nextPageToken}`
            );
    
            if (!response.ok) {
                throw new Error("Error al obtener los videos del canal");
            }
    
            const data = await response.json();
            return {
                videoIds: data.items.map(item => item.id.videoId),
                nextPageToken: data.nextPageToken || null, // Devuelve el nextPageToken si existe
            };
        } catch (error) {
            console.error("Error obteniendo los videos:", error);
            throw error;
        }
    };

    const saveVideoIdsToFirestore = async (videoIds, reviewerId, reviewerName) => {
        try {
            const batch = writeBatch(db); // Usa writeBatch para operaciones en lote
            const videosCollectionRef = collection(db, "VideosToEdit");
    
            // Crear un documento con el nombre del reviewer
            const reviewerDocRef = doc(videosCollectionRef, reviewerName);
    
            // Guardar los videoIds en un campo del documento
            batch.set(reviewerDocRef, { videoIds });
    
            // Actualizar el campo "lastVideo" en el documento del reviewer
            const lastVideoId = videoIds[0]; // El primer video es el más reciente
            const lastVideoDate = new Date().toLocaleString(); // Fecha y hora actual
            const lastVideoValue = `${lastVideoId} (Última carga: ${lastVideoDate})`;
    
            const reviewerRef = doc(db, "reviewers", reviewerId);
            batch.update(reviewerRef, { lastVideo: lastVideoValue });
    
            await batch.commit(); // Ejecutar el batch
            alert("Videos guardados exitosamente en Firestore y lastVideo actualizado");
        } catch (error) {
            console.error("Error guardando los videos en Firestore:", error);
            throw error;
        }
    };

    const handleLoadVideos = async (channelId, reviewerId, reviewerName) => {
        try {
            if (!channelId) {
                throw new Error("El Channel ID está vacío.");
            }
    
            let nextPageToken = ""; // Inicializa el nextPageToken
            let allVideoIds = []; // Almacena todos los videoIds
    
            // Obtener videos en bucle hasta que no haya más páginas
            do {
                const { videoIds, nextPageToken: newNextPageToken } = await fetchVideosFromChannel(channelId, nextPageToken);
                allVideoIds = [...allVideoIds, ...videoIds]; // Agrega los nuevos videoIds
                nextPageToken = newNextPageToken; // Actualiza el nextPageToken
            } while (nextPageToken); // Continúa mientras haya un nextPageToken
    
            if (allVideoIds.length === 0) {
                throw new Error("No se encontraron videos para este canal.");
            }
    
            // Crear el valor para mostrar en la interfaz sin guardar en Firestore todavía
            const lastVideoId = allVideoIds[0]; // El primer video es el más reciente
            const lastVideoDate = new Date().toLocaleString(); // Fecha y hora actual
            const lastVideoValue = `${lastVideoId} (Última carga: ${lastVideoDate})`;
            
            // Actualizar solo el campo en el formulario temporal
            setTempFormData(prev => ({
                ...prev,
                lastVideo: lastVideoValue
            }));
            
            // Guardar los IDs para usarlos cuando se guarde el formulario
            window.pendingVideoIds = allVideoIds;
            
            alert("Videos cargados. Haga clic en 'Guardar' para confirmar o 'Cancelar' para descartar.");
            
        } catch (error) {
            console.error("Error cargando los videos:", error);
            alert(error.message || "Error cargando los videos. Por favor, inténtalo de nuevo.");
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

    const indexOfLastReviewer = currentPage * reviewersPerPage;
    const indexOfFirstReviewer = indexOfLastReviewer - reviewersPerPage;
    const currentReviewers = reviewers.slice(indexOfFirstReviewer, indexOfLastReviewer);

    return (
        <div className="container">
            <h1>Gestión de Reviewers</h1>

            {reviewers.length === 0 ? (
                <p>No hay Reviewers</p>
            ) : (
                <div>
                    <div className="pagination">
                        <button 
                            onClick={() => setCurrentPage(currentPage - 1)} 
                            disabled={currentPage === 1}
                        >
                            ← Previous
                        </button>
                        {Array.from({ length: Math.ceil(reviewers.length / reviewersPerPage) }, (_, i) => (
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
                            disabled={currentPage === Math.ceil(reviewers.length / reviewersPerPage)}
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
                            Name:
                            <input 
                                type="text" 
                                name="name" 
                                value={formData.name} 
                                onChange={(e) => handleChange(e, 'name')} 
                                placeholder="Reviewer Name"
                            />
                        </label>

                        <label>
                            Web:
                            <input 
                                type="text" 
                                name="web" 
                                value={formData.web} 
                                onChange={(e) => handleChange(e, 'web')} 
                                placeholder="https://..."
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