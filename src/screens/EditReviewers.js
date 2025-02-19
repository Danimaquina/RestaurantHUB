import { useState, useEffect } from "react";
import { db, addReviewer, updateReviewer } from "../FireBaseConfig";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import "./EditReviewers.css";
import apiKeys from "../utils/apiKeys";

export default function EditReviewers() {
    const [showForm, setShowForm] = useState(false);
    const [reviewers, setReviewers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const reviewersPerPage = 1;

    // Valores predeterminados para el formulario
    const defaultFormData = {
        avatarUrl: "",
        lastVideo: "",
        name: "",
        web: "",
        channelId: "",
    };

    const [formData, setFormData] = useState(defaultFormData);
    const [editingReviewer, setEditingReviewer] = useState(null);

    useEffect(() => {
        fetchReviewers();
    }, []);

    const fetchReviewers = async () => {
        const querySnapshot = await getDocs(collection(db, "reviewers"));
        const reviewersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReviewers(reviewersList);
    };

    const toggleForm = () => {
        setShowForm(!showForm);
        setEditingReviewer(null);
        setFormData(defaultFormData); // Reiniciar el formulario al valor predeterminado
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        try {
            if (editingReviewer) {
                await updateReviewer(editingReviewer.id, formData);
                alert("Reviewer actualizado exitosamente");
            } else {
                await addReviewer(formData);
                alert("Reviewer creado exitosamente");
            }
            setFormData(defaultFormData); // Reiniciar formulario
            setShowForm(false);
            fetchReviewers();
        } catch (error) {
            console.error("Error al agregar/actualizar reviewer:", error);
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
        setEditingReviewer(reviewer);
        setFormData({
            avatarUrl: reviewer.avatarUrl,
            lastVideo: reviewer.lastVideo,
            name: reviewer.name,
            web: reviewer.web,
            channelId: reviewer.channelId,
        });
        setShowForm(true);
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
                            <p><strong>URL del Avatar:</strong> {reviewer.avatarUrl}</p>
                            <p><strong>Last Video Checked:</strong> {reviewer.lastVideo}</p>
                            <button className="small-button">Cargar últimos vídeos</button>

                            <p><strong>Name:</strong> {reviewer.name}</p>

                            <p><strong>Web:</strong> {reviewer.web}</p>
                            <button 
                                className="small-button" 
                                onClick={() => window.open(reviewer.web, "_blank")}
                            >
                                Visitar web
                            </button>

                            <p><strong>Channel ID:</strong> {reviewer.channelId}</p>
                            <button className="small-button">Obtener Channel ID</button>

                            <button className="submit-button" onClick={() => handleEdit(reviewer)}>
                                Actualizar
                            </button>
                            <button className="delete-button" onClick={() => handleDelete(reviewer.id)}>
                                Eliminar Reviewer
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <button className="create-button" onClick={toggleForm}>
                + Crear Reviewer
            </button>

            {/* Modal para Editar */}
            {showForm && (
                <div className="modal">
                    <div className="modal-content">
                        <label>
                            URL del Avatar:
                            <input 
                                type="text" 
                                name="avatarUrl" 
                                value={formData.avatarUrl} 
                                onChange={handleChange} 
                                placeholder="https://..."
                            />
                        </label>

                        <label>
                            Last Video Checked:
                            <input 
                                type="text" 
                                name="lastVideo" 
                                value={formData.lastVideo} 
                                onChange={handleChange} 
                                placeholder="Video ID"
                            />
                        </label>

                        <label>
                            Name:
                            <input 
                                type="text" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                placeholder="Reviewer Name"
                            />
                        </label>

                        <label>
                            Web:
                            <input 
                                type="text" 
                                name="web" 
                                value={formData.web} 
                                onChange={handleChange} 
                                placeholder="https://..."
                            />
                        </label>

                        <label>
                            Channel ID:
                            <input 
                                type="text" 
                                name="channelId" 
                                value={formData.channelId} 
                                onChange={handleChange} 
                                placeholder="Channel ID"
                            />
                            <button className="small-button">Obtener Channel ID</button>
                        </label>

                        <button className="submit-button" onClick={handleSubmit}>
                            {editingReviewer ? "Actualizar Reviewer" : "Crear nuevo Reviewer"}
                        </button>

                        <button className="close-button" onClick={toggleForm}>Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
}
