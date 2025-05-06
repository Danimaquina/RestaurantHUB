import { useState, useEffect } from 'react';
import { collection, getDocs } from "firebase/firestore";
import { db } from "../FireBaseConfig";
import "./EditRestaurants.css"; 

import RestaurantCard from '../components/RestaurantCard';
import InfoOfVideoCard from '../components/infoOfVideoCard';



export default function EditRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const restaurantsPerPage = 1;

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, "Restaurants"));
        const restaurantsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRestaurants(restaurantsData);
        setFilteredRestaurants(restaurantsData);
        setLoading(false);
      } catch (error) {
        console.error("Error al obtener restaurantes:", error);
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  // Filtra los restaurantes cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredRestaurants(restaurants);
    } else {
      const filtered = restaurants.filter(restaurant => 
        restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (restaurant.address && restaurant.address.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredRestaurants(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, restaurants]);

  // Maneja la búsqueda
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Cálculo para la paginación
  const indexOfLastRestaurant = currentPage * restaurantsPerPage;
  const indexOfFirstRestaurant = indexOfLastRestaurant - restaurantsPerPage;
  const currentRestaurants = filteredRestaurants.slice(indexOfFirstRestaurant, indexOfLastRestaurant);

  return (
    <div className="container">
      <h1>Gestión de Restaurantes</h1>

      {/* Barra de búsqueda */}
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar por nombre o dirección..."
          value={searchTerm}
          onChange={handleSearch}
        />
        <span className="search-icon">🔍</span>
      </div>

      {loading ? (
        <div className="loading">Cargando restaurantes...</div>
      ) : filteredRestaurants.length === 0 ? (
        <p className="no-results">No se encontraron restaurantes con esos criterios</p>
      ) : (
        <div>
          {/* Paginación */}
          <div className="pagination">
            <button 
              onClick={() => setCurrentPage(currentPage - 1)} 
              disabled={currentPage === 1}
            >
              ← Previous
            </button>
            {Array.from({ length: Math.ceil(filteredRestaurants.length / restaurantsPerPage) }, (_, i) => (
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
              disabled={currentPage === Math.ceil(filteredRestaurants.length / restaurantsPerPage)}
            >
              Next →
            </button>
          </div>

          <div className="restaurants-list">
          {currentRestaurants.map(restaurant => (
            <div key={restaurant.id}>
              <RestaurantCard restaurant={restaurant} />
              <InfoOfVideoCard 
                restaurant={restaurant} 
                reviews={restaurant.reviews || []} 
              />
            </div>
          ))}
        </div>

         
        </div>
      )}
    </div>
  );
}