import './header.css';
import { Link } from 'react-router-dom'
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useState, useCallback, useEffect } from 'react';


function Header() {

  const [searchTerm, setSearchTerm] = useState('');
  const [Loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

  const searchWithFallback = useCallback(async (type) => {
    try {
      const ptResponse = await api.get(`search/${type}`, {
        params: {
          api_key: API_KEY,
          language: "pt-BR",
          query: searchTerm,
          page: 1,
        }
      });

      if (!ptResponse.data.results?.length) {
        const enResponse = await api.get(`search/${type}`, {
          params: {
            api_key: API_KEY,
            language: "en-US",
            query: searchTerm,
            page: 1,
          }
        });
        return enResponse.data.results;
      }
      return ptResponse.data.results;
    } catch (error) {
      const enResponse = await api.get(`search/${type}`, {
        params: {
          api_key: API_KEY,
          language: "en-US",
          query: searchTerm,
          page: 1,
        }
      });
      return enResponse.data.results;
    }
  }, [searchTerm]);

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const [movies, tvShows] = await Promise.all([
        searchWithFallback('movie'),
        searchWithFallback('tv')
      ]);

      const combinedResults = [
        ...movies.map(movie => ({
          ...movie,
          media_type: 'movie',
          title: movie.title || movie.name,
          name: movie.name || movie.title
        })),
        ...tvShows.map(tv => ({
          ...tv,
          media_type: 'tv',
          title: tv.title || tv.name,
          name: tv.name || tv.title
        }))
      ];

      navigate(`/search/${encodeURIComponent(searchTerm)}`, {
        state: {
          results: combinedResults,
          type: 'all',
          searchTerm: searchTerm
        }
      });
    } catch (error) {
      console.error('Erro ao buscar conteúdo:', error);
      setError('Erro ao buscar conteúdo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, searchWithFallback, navigate]);

  return (
    <header>
      <Link className="logo" to="/">CineVerse</Link>

      <div className="search-container">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-container">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              placeholder="Buscar filmes e séries..."
              aria-label="Buscar filmes e séries"
              disabled={Loading}
            />
          </div>
          <button
            type="submit"
            className="search-button"
            disabled={Loading}
          >Buscar
          </button>
        </form>
        {error && <div className="error-message">{error}</div>}
      </div>

      <Link className="favoritos" to="/MeusFilmes">Meus filmes</Link>
    </header>

  )
}

export default Header;