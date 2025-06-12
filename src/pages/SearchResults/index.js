import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { HiOutlineBan } from 'react-icons/hi';
import './search-results.css';

function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get search term and results directly from state
    if (location.state) {
      const { results: searchResults, type } = location.state;
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
        <div className="loading-spinner"></div>
        <h2>Carregando resultados...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h2>Ocorreu um erro</h2>
        <p>{error.message || 'Erro ao carregar os resultados'}</p>
        <button onClick={() => navigate(-1)}>Voltar para Home</button>
      </div>
    );
  }

  return (
    <div className="container-search-results">
      {results.length === 0 ? (
        <div className="no-results">
          <p>Nenhum resultado encontrado com esse termo de busca.</p>
          <p>Tente uma busca diferente ou verifique a ortografia.</p>
          <button onClick={() => navigate(-1)}>Voltar para Home</button>
        </div>
      ) : (
        <div className="movie-grid">
          {results.slice(0, 100).map((filme) => (
            <div key={filme.id} className="movie-card">
              <Link to={filme.media_type === 'tv' ? `/serie/${filme.id}-${filme.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : `/filme/${filme.id}`}>
                <div className="movie-image-container">
                  <img
                    src={`https://image.tmdb.org/t/p/w500${filme.poster_path}`}
                    alt={filme.media_type === 'tv' ? filme.name : filme.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement.querySelector('.fallback-icon').style.display = 'flex';
                    }}
                  />
                  <HiOutlineBan className="fallback-icon" style={{ display: 'none', alignItems: 'center', justifyContent: 'center' }} />
                </div>
                <h3>{filme.media_type === 'tv' ? filme.name : filme.title}</h3>
                <p>{filme.overview ? `${filme.overview.substring(0, 150)}...` : 'Sinopse não disponível'}</p>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchResults;
