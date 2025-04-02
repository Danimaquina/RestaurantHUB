import time
import firebase_admin
from firebase_admin import credentials, firestore
import sys
import os

# Ruta a tu archivo JSON descargado desde Firebase
cred = credentials.Certificate("restauranthub-52c3a-firebase-adminsdk-fbsvc-b082fdd792.json")

# Inicializar la app de Firebase
firebase_admin.initialize_app(cred)

# Conectar con Firestore
db = firestore.client()

# Añadir la ruta del directorio padre al path para poder importar firebase_config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Importar correctamente la API de YouTube Transcript
from youtube_transcript_api import YouTubeTranscriptApi

def obtener_subtitulos(video_id):
    """Obtiene los subtítulos de un video de YouTube."""
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=['es', 'en'])
        texto = " ".join([segment['text'] for segment in transcript])
        return texto
    except Exception as e:
        print(f"⚠️ No se pudieron obtener subtítulos para {video_id}: {e}")
        return None

def procesar_documento(doc_id):
    """Procesa un documento de Firebase y le agrega subtítulos."""
    doc_ref = db.collection("VideosToEdit").document(doc_id)
    doc = doc_ref.get()

    if doc.exists:
        data = doc.to_dict()
        if not data.get("Transcription"):  # Verifica si el campo 'Transcription' está vacío
            print(f"🔍 Procesando video: {doc_id}")
            subtitulos = obtener_subtitulos(doc_id)

            if subtitulos:
                doc_ref.update({"Transcription": subtitulos})
                print(f"✅ Subtítulos guardados en {doc_id}")
            else:
                print(f"⚠️ No se encontraron subtítulos para {doc_id}")
        else:
            print(f"📄 El documento {doc_id} ya tiene una transcripción.")

def procesar_nuevo_video(video_id):
    """Función que se llama desde React para procesar un nuevo video."""
    procesar_documento(video_id)

def procesar_todos_los_videos():
    """Recorre todos los documentos en la colección y procesa aquellos sin transcripción."""
    videos_ref = db.collection("VideosToEdit")
    docs = videos_ref.stream()

    for doc in docs:
        procesar_documento(doc.id)

def listener(col_snapshot, changes, read_time):
    """Escucha cambios en la colección de videos."""
    for change in changes:
        if change.type.name == 'ADDED':  # Solo detecta documentos nuevos
            procesar_documento(change.document.id)

def main():
    print("👀 Escuchando nuevos videos en Firebase...")

    # Procesar todos los videos existentes al iniciar
    procesar_todos_los_videos()

    # Escuchar cambios en la colección
    videos_ref = db.collection("VideosToEdit")
    watch = videos_ref.on_snapshot(listener)

    # Mantener el script corriendo
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("🛑 Deteniendo el servicio de escucha...")
        watch.unsubscribe()
        print("✅ Servicio detenido correctamente")

if __name__ == "__main__":
    main()