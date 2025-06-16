import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineBan } from 'react-icons/hi';
import { FaSearch } from 'react-icons/fa';
import './home.css';

const API_KEY = process.env.REACT_APP_TMDB_API_KEY;


function Home() {
  const [filmes, setFilmes] = useState([]);
  const [airingToday, setAiringToday] = useState([]);
  const [popularSeries, setPopularSeries] = useState([]);
  const [topRatedSeries, setTopRatedSeries] = useState([]);
  const [activeCategory, setActiveCategory] = useState('airing');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const seriesCategories = [
    { id: 'airing', name: 'Em Exibição', data: airingToday },
    { id: 'popular', name: 'Populares', data: popularSeries },
    { id: 'top-rated', name: 'Mais Bem Avaliadas', data: topRatedSeries }
  ];

  const activeSeries = seriesCategories.find(cat => cat.id === activeCategory)?.data || [];


  const loadFilmes = useCallback(async () => {
    try {
      let response;
      try {
        // Primeiro tenta buscar em português
        response = await api.get("movie/now_playing", {
          params: {
            api_key: API_KEY,
            language: "pt-BR",
            page: 1,
          }
        });

        // Se não encontrar resultados em português, tenta em inglês
        if (!response.data.results?.length) {
          response = await api.get("movie/now_playing", {
            params: {
              api_key: API_KEY,
              language: "en-US",
              page: 1,
            }
          });
        }
      } catch (error) {
        // Se der erro, tenta em inglês
        response = await api.get("movie/now_playing", {
          params: {
            api_key: API_KEY,
            language: "en-US",
            page: 1,
          }
        });
      }
      setFilmes(response.data.results.slice(0, 30));
    } catch (error) {
      console.error('Erro ao carregar filmes em cartaz:', error);
      setError('Erro ao carregar filmes em cartaz. Tente novamente mais tarde.');
    }
  }, []);

  const loadSeries = useCallback(async () => {
    try {
      const endpoints = [
        { url: "tv/on_the_air", setter: setAiringToday, name: "séries em exibição" },
        { url: "tv/popular", setter: setPopularSeries, name: "séries populares" },
        { url: "tv/top_rated", setter: setTopRatedSeries, name: "séries mais bem avaliadas" }
      ];

      const fetchWithFallback = async (endpoint) => {
        try {
          // Tenta buscar em português primeiro
          let response = await api.get(endpoint.url, {
            params: {
              api_key: API_KEY,
              language: "pt-BR",
              page: 1,
            }
          });

          // Se não encontrar resultados em português, tenta em inglês
          if (!response.data.results?.length) {
            response = await api.get(endpoint.url, {
              params: {
                api_key: API_KEY,
                language: "en-US",
                page: 1,
              }
            });
          }
          return response.data.results.slice(0, 20);
        } catch (error) {
          console.error(`Erro ao buscar ${endpoint.name} em português:`, error);
          // Se der erro, tenta em inglês
          try {
            const response = await api.get(endpoint.url, {
              params: {
                api_key: API_KEY,
                language: "en-US",
                page: 1,
              }
            });
            return response.data.results.slice(0, 20);
          } catch (error) {
            console.error(`Erro ao buscar ${endpoint.name} em inglês:`, error);
            throw error;
          }
        }
      };

      // Busca todas as categorias em paralelo
      const results = await Promise.all(
        endpoints.map(endpoint =>
          fetchWithFallback(endpoint)
            .then(data => ({ setter: endpoint.setter, data }))
            .catch(error => {
              console.error(`Erro ao carregar ${endpoint.name}:`, error);
              return { setter: endpoint.setter, data: [] };
            })
        )
      );

      // Atualiza os estados com os resultados
      results.forEach(({ setter, data }) => {
        setter(data);
      });

    } catch (error) {
      console.error('Erro ao carregar as séries:', error);
      setError('Erro ao carregar as séries. Tente novamente mais tarde.');
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([loadFilmes(), loadSeries()]);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setError('Erro ao carregar os dados. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [loadFilmes, loadSeries]);

  const searchWithFallback = useCallback(async (type) => {
    try {
      // Primeiro tenta em português
      const ptResponse = await api.get(`search/${type}`, {
        params: {
          api_key: API_KEY,
          language: "pt-BR",
          query: searchTerm,
          page: 1,
        }
      });

      // Se não encontrar resultados em português, tenta em inglês
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
      // Se der erro, tenta em inglês
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

      // Buscar filmes e séries simultaneamente
      const [movies, tvShows] = await Promise.all([
        searchWithFallback('movie'),
        searchWithFallback('tv')
      ]);

      // Adicionar media_type aos resultados e combiná-los
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

  if (loading) {
    return (
      <div className="loading">
        <h2>Carregando...</h2>
      </div>
    );
  }
  // Função para renderizar os botões de categoria
  const renderCategoryButtons = () => (
    <div className="series-buttons">
      {seriesCategories.map((category) => (
        <button
          key={category.id}
          className={`category-button ${activeCategory === category.id ? 'active' : ''}`}
          onClick={() => setActiveCategory(category.id)}
        >
          {category.name}
        </button>
      ))}
    </div>
  );

  // Função para renderizar a seção de séries ativa
  const renderActiveSeries = () => {
    const category = seriesCategories.find(cat => cat.id === activeCategory);
    if (!category) return null;

    return (
      <div className="series-section">
        <h2> Séries {category.name}</h2>
        <div className="movies-container">
          {activeSeries.map((i) => (
            <article key={`${activeCategory}-${i.id}`} className="movie-card">
              <strong>{i.name || i.title}</strong>
              <Link to={`/serie/${i.id}`}>
                <img
                  src={`https://image.tmdb.org/t/p/original/${i.poster_path}`}
                  alt={i.name || i.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    const fallback = e.currentTarget.parentElement.querySelector('.fallback-icon');
                    if (fallback) fallback.style.display = 'block';
                  }}
                />
                <HiOutlineBan className="fallback-icon" style={{ display: 'none' }} />
              </Link>
            </article>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="home-container">
      <div className="movies-section">
        <h1>Filmes em Cartaz</h1>
        <div className="movies-container">
          {filmes.map((filme) => (
            <article key={filme.id} className="movie-card">
              <strong>{filme.title}</strong>
              <Link to={`/filme/${filme.id}`}>
                <div className="movie-image-container">
                  <img
                    src={`https://image.tmdb.org/t/p/original/${filme.poster_path}`}
                    alt={filme.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      const fallback = e.currentTarget.parentElement.querySelector('.fallback-icon');
                      if (fallback) fallback.style.display = 'block';
                    }}
                  />
                  <HiOutlineBan className="fallback-icon" style={{ display: 'none' }} />
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
      <div className="search-container">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              placeholder="Buscar filmes e séries..."
              aria-label="Buscar filmes e séries"
            />
          </div>
          <button type="submit" className="search-button">Buscar</button>
        </form>
      </div>

      {renderCategoryButtons()}
      {renderActiveSeries()}
    </div>
  );
}

export default Home;