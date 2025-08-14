import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import './serie.css';
import { PiStarFill } from "react-icons/pi";
import { FaRegBookmark } from 'react-icons/fa';
import { FaBookmark } from 'react-icons/fa';

function Serie() {
  const { id } = useParams();
  const [serie, setSerie] = useState({});
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSeasons, setExpandedSeasons] = useState({});
  const [episodes, setEpisodes] = useState({});
  const [loadingEpisodes, setLoadingEpisodes] = useState({});
  const [errorEpisodes, setErrorEpisodes] = useState({});
  const [isSaved, setIsSaved] = useState(false);
  
  useEffect(() => {
    console.log('Episódios carregados:', episodes);
    console.log('Temporadas expandidas:', expandedSeasons);
  }, [episodes, expandedSeasons]);

  useEffect(() => {
    if (!serie.id) return;
    
    const myList = JSON.parse(localStorage.getItem('@CineVerse') || '[]');
    const isSaved = myList.some(item => item.id === serie.id && item.media_type === 'tv');
    setIsSaved(isSaved);
  }, [serie.id]);


  const saveSerie = () => {
    try {
      const myList = JSON.parse(localStorage.getItem('@CineVerse') || '[]');
      const serieData = {
        id: serie.id,
        title: serie.name,
        name: serie.name,
        poster_path: serie.poster_path,
        overview: serie.overview,
        vote_average: serie.vote_average,
        first_air_date: serie.first_air_date,
        media_type: 'tv'
      };

      let updatedList;
      if (isSaved) {
        updatedList = myList.filter(item => !(item.id === serie.id && item.media_type === 'tv'));
        setIsSaved(false);
      } else {
        updatedList = [...myList, serieData];
        setIsSaved(true);
      }

      localStorage.setItem('@CineVerse', JSON.stringify(updatedList));
    } catch (error) {
      console.error('Erro ao salvar/remover série:', error);
    }
  };
  
  useEffect(() => {
    if (!id) {
      setError('ID da série não encontrado na URL');
      setLoading(false);
      return;
    }

    const serieId = id.split('-')[0];

    async function fetchSerie() {
      try {
        setLoading(true);
        const response = await api.get(`/tv/${serieId}`);
        
        const serieData = {
          ...response.data,
          first_air_date: response.data.first_air_date ? 
            new Date(response.data.first_air_date).toLocaleDateString('pt-BR') : 
            'Data não disponível',
          number_of_seasons: response.data.number_of_seasons || 0,
          number_of_episodes: response.data.number_of_episodes || 0
        };

        setSerie(serieData);
        
        let seasonsData = [];
        
        if (response.data.seasons && response.data.seasons.length > 0) {
          seasonsData = response.data.seasons
            .filter(season => season.season_number > 0)
            .sort((a, b) => a.season_number - b.season_number) 
            .map(season => ({
              season_number: season.season_number,
              name: season.name || `Temporada ${season.season_number}`,
              episode_count: season.episode_count || 0,
              air_date: season.air_date || '',
              poster_path: season.poster_path,
              overview: season.overview
            }));
        } else {
          seasonsData = Array.from(
            { length: response.data.number_of_seasons },
            (_, i) => ({
              season_number: i + 1,
              name: `Temporada ${i + 1}`,
              episode_count: 0,
              air_date: '',
              poster_path: null
            })
          );
        }
        
        setSeasons(seasonsData);
        
      } catch (err) {
        console.error('Erro ao carregar a série:', err);
        setError({
          message: 'Erro ao carregar a série. Tente novamente mais tarde.',
          code: err.response?.status || 500
        });
      } finally {
        setLoading(false);
      }
    }

    fetchSerie();
  }, [id]);

  const fetchEpisodes = useCallback(async (serieId, seasonNumber) => {
    console.log(`Buscando episódios para a temporada ${seasonNumber} da série ${serieId}`);
    if (!serieId || !seasonNumber) {
      console.error('ID da série ou número da temporada não fornecidos');
      throw new Error('ID da série ou número da temporada não fornecidos');
    }
    
    const cacheKey = `${serieId}-${seasonNumber}`;
    
    try {
      if (loadingEpisodes[cacheKey]) return;
      
      setErrorEpisodes(prev => ({ ...prev, [cacheKey]: null }));
      setLoadingEpisodes(prev => ({ ...prev, [cacheKey]: true }));
      
      const response = await api.get(`/tv/${serieId}/season/${seasonNumber}`, {
        params: {
          language: 'pt-BR',
          append_to_response: 'videos,images,credits'
        }
      });
      
      
      const processedEpisodes = (response.data.episodes || []).map(episode => ({
        ...episode,
      
        episode_number: episode.episode_number || 0,
      
        air_date: episode.air_date 
          ? new Date(episode.air_date).toLocaleDateString('pt-BR') 
          : 'Data não disponível',
       
        still_path: episode.still_path 
          ? `https://image.tmdb.org/t/p/w300${episode.still_path}`
          : 'https://via.placeholder.com/300x169?text=Sem+imagem',
        guest_stars: episode.guest_stars || [],
        crew: episode.crew || []
      }));

      const sortedEpisodes = [...processedEpisodes].sort((a, b) => 
        (a.episode_number || 0) - (b.episode_number || 0)
      );

      setSeasons(prevSeasons => 
        prevSeasons.map(season => 
          season.season_number === seasonNumber 
            ? { 
                ...season, 
                episode_count: sortedEpisodes.length,
                air_date: season.air_date || response.data.air_date,
                overview: season.overview || response.data.overview,
                poster_path: season.poster_path || response.data.poster_path
              }
            : season
        )
      );
      
      setEpisodes(prev => ({
        ...prev,
        [cacheKey]: sortedEpisodes
      }));
      
      return sortedEpisodes;
      
    } catch (err) {
      console.error(`Erro ao carregar episódios da temporada ${seasonNumber}:`, err);
      setErrorEpisodes(prev => ({
        ...prev, 
        [cacheKey]: 'Não foi possível carregar os episódios. Tente novamente.'
      }));
      throw err;
    } finally {
      setLoadingEpisodes(prev => ({ ...prev, [cacheKey]: false }));
    }
  }, [episodes, loadingEpisodes]);

  const toggleSeason = useCallback(async (seasonNumber) => {
    console.log('Toggle temporada:', seasonNumber);
    const serieId = id?.split('-')[0];
    console.log('ID da série:', serieId);
    
    if (!serie || Object.keys(serie).length === 0) {
      console.error('ID da série não encontrado');
      return;
    }
    
    const cacheKey = `${serieId}-${seasonNumber}`;
    
    if (expandedSeasons[seasonNumber]) {
      setExpandedSeasons({});
      return;
    }
    
    setExpandedSeasons({ [seasonNumber]: true });
    
    if (episodes[cacheKey] && episodes[cacheKey].length > 0) {
      return;
    }
    
    try {
      await fetchEpisodes(serieId, seasonNumber);
    } catch (error) {
      console.error('Erro ao carregar episódios:', error);
      setErrorEpisodes(prev => ({
        ...prev,
        [cacheKey]: 'Não foi possível carregar os episódios. Tente novamente.'
      }));
    } finally {
      setLoadingEpisodes(prev => ({ ...prev, [cacheKey]: false }));
    }
  }, [id, serie, expandedSeasons, episodes, fetchEpisodes, setExpandedSeasons, setErrorEpisodes]);

  if (loading) {
    return (
      <div className="loading" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div className="loading-spinner" style={{
          width: '50px',
          height: '50px',
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <h2>Carregando série...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h2>{error.message}</h2>
        <button onClick={() => window.location.reload()}>Tentar novamente</button>
      </div>
    );
  }

  if (!serie || Object.keys(serie).length === 0) {
    return (
      <div className="error">
        <h2>Conteúdo não encontrado</h2>
        <p>Não foi possível encontrar informações sobre este conteúdo.</p>
        <button onClick={() => window.history.back()}>Voltar</button>
      </div>
    );
  }

  return (
    <div className="container-serie">
      {loading && <div className="loading">Carregando...</div>}
      {error && <div className="error">{error}</div>}
      
      {!loading && !error && Object.keys(serie).length > 0 && (
        <>
          <div className="serie-header">
            <div className="serie-poster">
              <img
                src={serie.poster_path 
                  ? `https://image.tmdb.org/t/p/w500${serie.poster_path}` 
                  : 'https://via.placeholder.com/300x450?text=Sem+imagem'}
                alt={serie.name || 'Capa da série'}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/300x450?text=Sem+imagem';
                }}
              />
            </div>
            <div className="serie-info">
              <div className="serie-title-container">
                <h1>{serie.name}</h1>
                <button 
                  onClick={saveSerie} 
                  className="save-button"
                  aria-label={isSaved ? 'Remover da lista' : 'Salvar na lista'}
                  title={isSaved ? 'Remover da lista' : 'Salvar na lista'}
                >
                  {isSaved ? <FaBookmark /> : <FaRegBookmark />}
                </button>
              </div>
              <div className="serie-meta">
                <span className="serie-rating"><PiStarFill /> {serie.vote_average?.toFixed(1) || 'N/A'}/10</span>
                <span>{serie.first_air_date || 'N/A'}</span>
                <span>{serie.number_of_seasons} temporada{serie.number_of_seasons !== 1 ? 's' : ''}</span>
                <span>{serie.number_of_episodes} episódio{serie.number_of_episodes !== 1 ? 's' : ''}</span>
              </div>
              <p className="serie-overview">{serie.overview || 'Sinopse não disponível.'}</p>
            </div>
          </div>

          <div className="seasons-section">
            <h2>Temporadas</h2>
            <div className="seasons-list">
              {seasons.map((season) => (
                <div key={season.season_number} className="season-item">
                  <div 
                    className={`season-header ${expandedSeasons[season.season_number] ? 'active' : ''}`}
                    onClick={() => toggleSeason(season.season_number)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && toggleSeason(season.season_number)}
                  >
                    <div className="season-title">
                      <h3>{season.name}</h3>
                      <span>
                        {season.episode_count > 0 
                          ? `${season.episode_count} episódio${season.episode_count !== 1 ? 's' : ''}` 
                          : 'Nenhum episódio'}
                      </span>
                    </div>
                    <span className="toggle-icon">
                      {expandedSeasons[season.season_number] ? '−' : '+'}
                    </span>
                  </div>
                  
                  {expandedSeasons[season.season_number] && (
                    <div className="season-content expanded">
                      {errorEpisodes[`${id?.split('-')[0]}-${season.season_number}`] ? (
                        <div className="error-message">
                          <p>{errorEpisodes[`${id?.split('-')[0]}-${season.season_number}`]}</p>
                          <button 
                            onClick={() => fetchEpisodes(id?.split('-')[0], season.season_number)}
                            className="retry-button"
                          >
                            Tentar novamente
                          </button>
                        </div>
                      ) : loadingEpisodes[`${id?.split('-')[0]}-${season.season_number}`] ? (
                        <div className="loading-episodes">
                          <div className="loading-spinner"></div>
                          <p>Carregando episódios...</p>
                        </div>
                      ) : (
                        <div className="episodes-list">
                          {episodes[`${id?.split('-')[0]}-${season.season_number}`]?.length > 0 ? (
                            episodes[`${id?.split('-')[0]}-${season.season_number}`].map(episode => (
                              <div key={`${episode.id}-${episode.episode_number}`} className="episode-card">
                                <div className="episode-poster">
                                  <img 
                                    src={episode.still_path}
                                    alt={`${episode.name || 'Episódio'} ${episode.episode_number}`}
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = 'https://via.placeholder.com/300x169?text=Sem+imagem';
                                    }}
                                  />
                                </div>
                                <div className="episode-details">
                                  <div>
                                    <h4>
                                      <span className="episode-number">Episódio {episode.episode_number}:</span>
                                      <span>{episode.name || 'Sem título'}</span>
                                    </h4>
                                    <p className="air-date">
                                      {episode.air_date || 'Data não disponível'}
                                    </p>
                                    <p className="episode-overview">
                                      {episode.overview || 'Sinopse não disponível.'}
                                    </p>
                                  </div>
                                  {episode.vote_average > 0 && (
                                    <div className="episode-rating">
                                      <PiStarFill className="star-icon" />
                                      {episode.vote_average.toFixed(1)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="no-episodes">
                              <p>Nenhum episódio disponível para esta temporada.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Serie;
