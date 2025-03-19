import time
from firebase_admin import firestore
import sys
import os

# Añadir la ruta del directorio padre al path para poder importar firebase_config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from firebase_config import db

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
    # Cambiar "videos" por "VideosToEdit"
    doc_ref = db.collection("VideosToEdit").document(doc_id)
    doc = doc_ref.get()

    if doc.exists:
        print(f"🔍 Procesando video: {doc_id}")
        subtitulos = obtener_subtitulos(doc_id)

        if subtitulos:
            doc_ref.update({"subtitulos": subtitulos})
            print(f"✅ Subtítulos guardados en {doc_id}")
        else:
            print(f"⚠️ No se encontraron subtítulos para {doc_id}")

def listener(col_snapshot, changes, read_time):
    """Escucha cambios en la colección de videos."""
    for change in changes:
        if change.type.name == 'ADDED':  # Solo detecta documentos nuevos
            procesar_documento(change.document.id)

def main():
    print("👀 Escuchando nuevos videos en Firebase...")

    # Cambiar "videos" por "VideosToEdit"
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
