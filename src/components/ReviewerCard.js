import React from "react";
import "../screens/EditReviewers.css";
import { db } from "../FireBaseConfig"; // Asegúrate de importar tu configuración de Firestore
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

    // Función para borrar la colección VideosToEdit
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

            // Limpiar el campo "Last Video Checked"
            if (editingReviewerId === reviewer.id) {
                handleChange({ target: { value: "" } }, 'lastVideo'); // Limpia el campo en el estado temporal
            } else {
                handleChange({ target: { value: "" } }, 'lastVideo'); // Limpia el campo en el estado del formulario
            }
        } catch (error) {
            console.error("Error eliminando la colección 'VideosToEdit':", error);
            alert("Error eliminando la colección 'VideosToEdit'");
        }
    };

    // Función para borrar el documento específico del reviewer en la colección VideosToEdit
    const deleteReviewerDocument = async () => {
        try {
            // Referencia al documento específico del reviewer
            const reviewerDocRef = doc(db, "VideosToEdit", reviewer.name);
            
            // Eliminar solo ese documento
            await deleteDoc(reviewerDocRef);
            
            alert(`Documento '${reviewer.name}' eliminado exitosamente de la colección 'VideosToEdit'`);

            // Limpiar el campo "Last Video Checked"
            if (editingReviewerId === reviewer.id) {
                handleChange({ target: { value: "" } }, 'lastVideo'); // Limpia el campo en el estado temporal
            } else {
                handleChange({ target: { value: "" } }, 'lastVideo'); // Limpia el campo en el estado del formulario
            }
        } catch (error) {
            console.error(`Error eliminando el documento '${reviewer.name}':`, error);
            alert(`Error eliminando el documento '${reviewer.name}' de la colección 'VideosToEdit'`);
        }
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
                        />
                       <button 
                            className="small-button" 
                                onClick={() => handleLoadVideos(tempFormData.channelId, reviewer.id, reviewer.name)}
                        >
                            Cargar últimos vídeos
                        </button>

                        <button 
                            className="small-button danger-button" 
                            style={{ backgroundColor: 'red', color: 'white' }}
                            onClick={() => deleteReviewerDocument()}
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
    );
};

export default ReviewerCard;