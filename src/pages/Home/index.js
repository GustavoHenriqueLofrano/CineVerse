import { useEffect, useState, } from 'react';
import api from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineBan } from 'react-icons/hi';
import { FaSearch } from 'react-icons/fa';
import './home.css';

// URL DA API: /movie/now_playing?api_key=28fc232cc001c31e8a031f419d0a14ca&language=pt-BR

const API_KEY = process.env.REACT_APP_TMDB_API_KEY || 'sua-chave-api-aqui';

function Home() {
  const [filmes, setFilmes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {

    async function loadFilmes() {
      const response = await api.get("movie/now_playing", {
        params: {
          api_key: API_KEY,
          language: "pt-BR",
          page: 1,
        }
      })


      setFilmes(response.data.results.slice(0, 20))
      setLoading(false);

    }

    loadFilmes();

  }, [])

  async function handleSearch(item) {
    item.preventDefault();
    if (searchTerm.trim() === '') return;

    try {
      setLoading(true);
      
      // Buscar filmes e séries simultaneamente
      const [movieResponse, tvResponse] = await Promise.all([
        api.get("search/movie", {
          params: {
            api_key: API_KEY,
            language: "pt-BR",
            query: searchTerm,
            page: 1,
          }
        }),
        api.get("search/tv", {
          params: {
            api_key: API_KEY,
            language: "pt-BR",
            query: searchTerm,
            page: 1,
          }
        })
      ]);

      // Adicionar media_type aos resultados e combiná-los
      const combinedResults = [
        ...movieResponse.data.results.map(movie => ({
          ...movie,
          media_type: 'movie'
        })),
        ...tvResponse.data.results.map(tv => ({
          ...tv,
          media_type: 'tv'
        }))
      ];
      
      navigate(`/search/${searchTerm}`, { 
        state: { 
          results: combinedResults,
          type: 'all',
          searchTerm: searchTerm
        } 
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar conteúdo:', error);
      setError('Erro ao buscar conteúdo. Tente novamente.');
      setLoading(false);
    }
  }



  if (loading) {
    return (
      <div className="loading">
        <h2>Carregando filmes...</h2>
      </div>
    )
  }

  return (
    <div>
      <div className="container-home">
      <h2>Filmes em Cartaz</h2>
        <div className="lista-filmes">
          {filmes.map((filme) => {
            return (
              <article key={filme.id}>
                <strong>{filme.title}</strong>
                <Link to={`/filme/${filme.id}`}>
                  <div className="movie-image-container">
                    <img 
                      src={`https://image.tmdb.org/t/p/original/${filme.poster_path}`} 
                      alt={filme.title}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        e.currentTarget.parentElement.querySelector('.fallback-icon').style.display = 'block';
                      }}
                    />
                    <HiOutlineBan className="fallback-icon" style={{ display: 'none' }} />
                  </div>
                </Link>
              </article>
            )
          })}
        </div>
      </div>
      <div>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Pesquisar filmes..."
              value={searchTerm}
              onChange={(item) => setSearchTerm(item.target.value)}
              className="search-input"
            />
            <button type="submit"><FaSearch className="search-icon" /></button>
          </div>
        </form>

        {searchTerm && (
          <div className="search-results">
            <div className="movie-grid">
              {searchResults.map((filme) => (
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
                  </Link>
                  <h3>{filme.media_type === 'tv' ? filme.name : filme.title}</h3>
                  <p>{filme.overview.substring(0, 10)}...</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home;