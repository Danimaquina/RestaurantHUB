import firebase_admin
from firebase_admin import credentials, firestore

# Ruta a tu archivo JSON descargado desde Firebase
cred = credentials.Certificate("utils/restaurant-app-288123-firebase-adminsdk-9445j-4678c90597.json")

# Inicializar la app de Firebase
firebase_admin.initialize_app(cred)

# Conectar con Firestore
db = firestore.client()