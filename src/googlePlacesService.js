export async function getPlaceDetails(placeId) {
  try {
    const response = await fetch(`http://localhost:3001/api/getPlaceDetails/${placeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch place details');
    }

    const data = await response.json();
    console.log('Detalles completos del lugar:', JSON.stringify(data, null, 2));
    return data; // Aquí simplemente devuelves el objeto tal cual
  } catch (error) {
    console.error('Error fetching place details:', error);
    throw error;
  }
}

export const searchPlaces = async (query) => {
  if (!query.trim()) {
    throw new Error("Por favor, introduce un nombre para buscar.");
  }

  try {
    const response = await fetch("http://localhost:3001/api/searchPlaces", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    console.log('Resultados completos de la búsqueda:', JSON.stringify(data, null, 2));
    return data.places || [];
  } catch (error) {
    console.error("Error en la búsqueda de Google Places:", error);
    throw new Error("Hubo un problema al buscar en Google Places.");
  }
};
