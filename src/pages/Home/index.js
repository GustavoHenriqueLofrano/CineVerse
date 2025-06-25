import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineBan } from 'react-icons/hi';
import './home.css';

const API_KEY = process.env.REACT_APP_TMDB_API_KEY;


function Home() {
  const [filmes, setFilmes] = useState([]);
  const [trailers, setTrailers] = useState([]);
  const [airingToday, setAiringToday] = useState([]);
  const [popularSeries, setPopularSeries] = useState([]);
  const [topRatedSeries, setTopRatedSeries] = useState([]);
  const [activeCategory, setActiveCategory] = useState('airing');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const loadLatestTrailers = useCallback(async () => {
    try {
      // Busca os filmes mais recentes
      const [moviesResponse, seriesResponse] = await Promise.all([
        api.get("movie/upcoming", {
          params: {
            api_key: API_KEY,
            language: "pt-BR",
            page: 1,
            region: "BR"
          }
        }),
        api.get("tv/on_the_air", {
          params: {
            api_key: API_KEY,
            language: "pt-BR",
            page: 1
          }
        })
      ]);

      // Pega os filmes e séries mais recentes
      const latestMovies = moviesResponse.data.results.slice(0, 10);
      const latestSeries = seriesResponse.data.results.slice(0, 10);
      
      // Função para buscar trailers
      const fetchMediaTrailers = async (media, isMovie = true) => {
        try {
          const mediaType = isMovie ? 'movie' : 'tv';
          const videosResponse = await api.get(`${mediaType}/${media.id}/videos`, {
            params: {
              api_key: API_KEY,
              language: "pt-BR"
            }
          });
          
          // Pega o primeiro trailer
          const trailer = videosResponse.data.results.find(
            (video) => video.type === "Trailer" && video.site === "YouTube"
          );
          
          return trailer ? {
            id: media.id,
            title: isMovie ? media.title : media.name,
            key: trailer.key,
            backdrop_path: media.backdrop_path,
            media_type: mediaType
          } : null;
        } catch (error) {
          console.error(`Erro ao buscar vídeos do ${isMovie ? 'filme' : 'série'} ${media.id}:`, error);
          return null;
        }
      };

      // Busca trailers para filmes e séries
      const moviePromises = latestMovies.map(movie => fetchMediaTrailers(movie, true));
      const seriesPromises = latestSeries.map(serie => fetchMediaTrailers(serie, false));
      
      const [movieTrailers, seriesTrailers] = await Promise.all([
        Promise.all(moviePromises),
        Promise.all(seriesPromises)
      ]);

      setTrailers(movieTrailers, seriesTrailers);
    } catch (error) {
      console.error('Erro ao carregar trailers:', error);
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
          return response.data.results.slice(0, 15);
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
            return response.data.results.slice(0, 10);
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
        console.log('Dados recebidos:', data);
        if (data && data.length > 0) {
          console.log('Primeiro item:', data[0]);
          console.log('Caminho do poster:', data[0].poster_path);
        }
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
        await Promise.all([
          loadFilmes(),
          loadSeries(),
          loadLatestTrailers()
        ]);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setError('Erro ao carregar os dados. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [loadFilmes, loadSeries, loadLatestTrailers]);




  // Renderiza a seção de trailers
  const renderTrailers = () => (
    <div className="trailers-section">
      <h2>Últimos Trailers</h2>
      <div className="trailers-container">
        {trailers.map((trailer) => (
          trailer?.key && (
            <Link 
              key={`${trailer.media_type}-${trailer.id}`} 
              to={`/${trailer.media_type}/${trailer.id}`}
              className="trailer-link"
            >
              <div className="trailer-item">
                <h3>{trailer.title} <span className="media-type-badge">{trailer.media_type === 'movie' ? 'Filme' : 'Série'}</span></h3>
                <div className="trailer-video">
                  <iframe
                    width="300"
                    height="169"
                    src={`https://www.youtube.com/embed/${trailer.key}`}
                    title={`Trailer de ${trailer.title}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </Link>
          )
        ))}
      </div>
    </div>
  );

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

  // Função para renderizar as séries ativas
  const renderActiveSeries = () => {
    const activeCategoryData = seriesCategories.find(cat => cat.id === activeCategory);
    if (!activeCategoryData) return null;

    return (
      <div className="series-section">
        <h2>Séries {activeCategoryData.name}</h2>
        <div className="movies-container">
          {activeCategoryData.data.map((item) => (
            <article key={`${activeCategory}-${item.id}`} className="movie-card">
              <strong>{item.name || item.title}</strong>
              <Link to={`/serie/${item.id}-${(item.name || item.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`} className="movie-link">
                {item.poster_path ? (
                  <div className="poster-container">
                    <img
                      src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                      alt={item.name || item.title}
                      onError={(e) => {
                        console.error('Erro ao carregar a imagem:', e.target.src);
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/300x450?text=Imagem+não+disponível';
                      }}
                      className="movie-poster"
                      onLoad={() => console.log('Imagem carregada:', item.poster_path)}
                    />
                  </div>
                ) : (
                  <div className="no-poster">
                    <HiOutlineBan className="no-poster-icon" />
                    <span>Sem imagem</span>
                  </div>
                )}
              </Link>
            </article>
          ))}
        </div>
      </div>
    );
  };

  console.log('Renderizando Home com activeSeries:', activeSeries);
  console.log('Primeira série:', activeSeries[0]);

  return (
    <div className="home-container">
      {trailers.length > 0 && renderTrailers()}
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
      {renderCategoryButtons()}
      {renderActiveSeries()}
    </div>
  );
}

export default Home;