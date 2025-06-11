import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { HiOutlineBan } from 'react-icons/hi';
import './search-results.css';

function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get search term and results directly from state
    if (location.state) {
      const { results: searchResults, type } = location.state;
      setSearchTerm(location.state.searchTerm || '');
      setResults(searchResults || []);
      setLoading(false);
    } else {
      // Handle case where state is not available
      setError('Nenhum resultado encontrado');
      setLoading(false);
    }
  }, [location]);

  if (loading) {
    return (
      <div className="loading">
        <h2>Carregando resultados...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h2>{error}</h2>
      </div>
    );
  }

  return (
    <div className="container-search-results">
      {results.length === 0 ? (
        <div className="no-results">
          <p>Nenhum filme encontrado com esse termo de busca.</p>
          <button onClick={() => navigate(-1)}>Voltar</button>
        </div>
      ) : (
        <div className="movie-grid">
          {results.slice(0, 100).map((filme) => (
            <div key={filme.id} className="movie-card">
              <Link to={`/filme/${filme.id}`}>
                <div className="movie-image-container">
                  <img
                    src={`https://image.tmdb.org/t/p/w500${filme.poster_path}`}
                    alt={filme.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      e.currentTarget.parentElement.querySelector('.fallback-icon').style.display = 'block';
                    }}
                  />
                  <HiOutlineBan className="fallback-icon" style={{ display: 'none' }} />
                </div>
                <h3>{filme.title}</h3>
                <p>{filme.overview.substring(0, 10
                )}...</p>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchResults;
