import { useState, useEffect } from "react";
import { db, addReviewer, updateReviewer } from "../FireBaseConfig";
import { collection, getDocs, deleteDoc, doc, writeBatch } from "firebase/firestore";
import "./EditReviewers.css";
import apiKeys from "../utils/apiKeys";

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

    const handleUpdate = async (id) => {
        try {
            await updateReviewer(id, tempFormData);
            alert("Reviewer actualizado exitosamente");
            setEditingReviewerId(null);
            setTempFormData({});
            fetchReviewers();
        } catch (error) {
            console.error("Error al actualizar reviewer:", error);
        }
    };

    const handleCancelEdit = () => {
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

    const saveVideoIdsToFirestore = async (videoIds, reviewerId) => {
        try {
            const batch = writeBatch(db); // Usa writeBatch en lugar de batch
            const videosCollectionRef = collection(db, "VideosToEdit");
    
            videoIds.forEach(videoId => {
                const videoDocRef = doc(videosCollectionRef, videoId);
                batch.set(videoDocRef, { videoId });
            });
    
            const reviewerDocRef = doc(db, "reviewers", reviewerId);
            const lastVideoId = videoIds[0]; // El primer video es el más reciente
            const lastVideoDate = new Date().toLocaleString(); // Fecha y hora actual
            const lastVideoValue = `${lastVideoId} (Última carga: ${lastVideoDate})`;
    
            batch.update(reviewerDocRef, { lastVideo: lastVideoValue });
    
            await batch.commit();
            alert("Videos guardados exitosamente en Firestore y lastVideo actualizado");
        } catch (error) {
            console.error("Error guardando los videos en Firestore:", error);
            throw error;
        }
    };

    const handleLoadVideos = async (channelId, reviewerId) => {
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
    
            await saveVideoIdsToFirestore(allVideoIds, reviewerId);
            fetchReviewers(); // Actualizar la lista de reviewers
        } catch (error) {
            console.error("Error cargando los videos:", error);
            alert(error.message || "Error cargando los videos. Por favor, inténtalo de nuevo.");
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
                                        />
                                        <button 
                                            className="small-button" 
                                            onClick={() => handleLoadVideos(tempFormData.channelId, reviewer.id)}
                                        >
                                            Cargar últimos vídeos
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
                                    <button className="submit-button" onClick={() => handleUpdate(reviewer.id)}>
                                        Guardar
                                    </button>
                                    <button className="delete-button" onClick={handleCancelEdit}>
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