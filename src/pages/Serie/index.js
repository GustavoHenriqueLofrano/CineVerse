import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import './serie.css';
import { PiStarFill } from "react-icons/pi";
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

function Serie() {
  const { id } = useParams();
  const [serie, setSerie] = useState({});
  const [seasons, setSeasons] = useState([]);
  const [activeSeason, setActiveSeason] = useState(1);
  const [seasonDetails, setSeasonDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingSeason, setLoadingSeason] = useState(false);
  const [expandedSeasons, setExpandedSeasons] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setError('ID da série não encontrado na URL');
      setLoading(false);
      return;
    }

    const serieId = id.split('-')[0];
    console.log('Buscando série com ID:', serieId);

    async function fetchSerie() {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/tv/${serieId}`, {
          params: {
            append_to_response: 'credits,external_ids,images,videos,content_ratings'
          }
        });
        
        // Formatar os dados da série
        const serieData = {
          ...response.data,
          // Converter datas para formato brasileiro
          first_air_date: response.data.first_air_date ? 
            new Date(response.data.first_air_date).toLocaleDateString('pt-BR') : 
            'Data não disponível',
          // Formatar número de temporadas
          number_of_seasons: response.data.number_of_seasons || 0,
          // Formatar número de episódios
          number_of_episodes: response.data.number_of_episodes || 0
        };

        setSerie(serieData);
        
        // Criar array de temporadas
        const seasonsArray = Array.from(
          { length: response.data.number_of_seasons },
          (_, i) => ({
            season_number: i + 1,
            name: `Temporada ${i + 1}`,
            episode_count: response.data.seasons?.[i]?.episode_count || 0,
            air_date: response.data.seasons?.[i]?.air_date || '',
            poster_path: response.data.seasons?.[i]?.poster_path
          })
        );
        setSeasons(seasonsArray);
        
        // Carregar detalhes da primeira temporada
        if (seasonsArray.length > 0) {
          fetchSeasonDetails(serieId, 1);
        }
      } catch (err) {
        console.error('Erro:', err);
        if (err.response?.status === 401) {
          setError({
            message: 'API inválida. Por favor, configure uma chave de API válida.',
            code: 401,
            details: {
              status: 'invalid_api_key'
            }
          });
        } else {
          const errorMessage = err.response?.data?.status_message || 'Erro ao carregar a série';
          setError({
            message: errorMessage,
            code: err.response?.status || 500,
            details: err.response?.data || {}
          });
        }
      } finally {
        setLoading(false);
      }
    }

    fetchSerie();
  }, [id]);

  // Buscar detalhes de uma temporada específica
  const fetchSeasonDetails = async (showId, seasonNumber) => {
    try {
      setLoadingSeason(true);
      const response = await api.get(`/tv/${showId}/season/${seasonNumber}`);
      
      setSeasonDetails(prev => ({
        ...prev,
        [seasonNumber]: response.data
      }));
      
      // Marcar a temporada como expandida
      setExpandedSeasons(prev => ({
        ...prev,
        [seasonNumber]: true
      }));
      
    } catch (err) {
      console.error('Erro ao carregar temporada:', err);
    } finally {
      setLoadingSeason(false);
    }
  };
  
  // Alternar visibilidade dos episódios de uma temporada
  const toggleSeason = (seasonNumber) => {
    const serieId = id.split('-')[0];
    
    // Se a temporada já está expandida, apenas fecha
    if (expandedSeasons[seasonNumber]) {
      setExpandedSeasons(prev => ({
        ...prev,
        [seasonNumber]: false
      }));
    } else {
      // Se já temos os detalhes, apenas expande
      if (seasonDetails[seasonNumber]) {
        setExpandedSeasons(prev => ({
          ...prev,
          [seasonNumber]: true
        }));
      } else {
        // Se não tem os detalhes, busca e depois expande
        fetchSeasonDetails(serieId, seasonNumber);
      }
    }
    
    setActiveSeason(seasonNumber);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <h2>Carregando...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h2>{error.message}</h2>
        {error.details && error.details.status_message && (
          <p>{error.details.status_message}</p>
        )}
        <button onClick={() => window.location.reload()}>Tentar novamente</button>
      </div>
    );
  }

  if (!serie) {
    return (
      <div className="error">
        <h2>Conteúdo não encontrado</h2>
        <p>Não foi possível encontrar informações sobre este conteúdo.</p>
        <button onClick={() => window.history.back()}>Voltar para os resultados</button>
      </div>
    );
  }

  return (
    <div className="container-serie">
      <div className="serie-content">
        <div className="serie-image">
          <img
            src={serie.poster_path ? `https://image.tmdb.org/t/p/w500${serie.poster_path}` : '/default-poster.png'}
            alt={serie.name || 'Capa da série'}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/default-poster.png';
            }}
          />
        </div>
        <div className="serie-info">
          <h1>{serie.name}</h1>
          <p>{serie.overview || 'Sinopse não disponível'}</p>
          <div className="serie-details">
            <p><strong>Primeira exibição:</strong> {serie.first_air_date || 'Data não disponível'}</p>
            <p><strong>Temporadas:</strong> {serie.number_of_seasons || 0}</p>
            <p><strong>Episódios:</strong> {serie.number_of_episodes || 0}</p>
            <p><strong>Popularidade:</strong> {serie.popularity?.toFixed(1) || 'N/A'}</p>
            <p><PiStarFill className="star-icon"/> {serie.vote_average?.toFixed(1) || 'N/A'} /10</p>
          </div>
          
          {/* Seção de Temporadas */}
          <div className="seasons-section">
            <h2>Temporadas</h2>
            <div className="seasons-list">
              {seasons.map((season) => (
                <div key={season.season_number} className="season-item">
                  <div 
                    className={`season-header ${activeSeason === season.season_number ? 'active' : ''}`}
                    onClick={() => toggleSeason(season.season_number)}
                  >
                    <div className="season-title">
                      <h3>{season.name}</h3>
                      <span>{season.episode_count} episódios</span>
                    </div>
                    {expandedSeasons[season.season_number] ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                  
                  {expandedSeasons[season.season_number] && (
                    <div className="episodes-list">
                      {loadingSeason && season.season_number === activeSeason ? (
                        <div className="loading">Carregando episódios...</div>
                      ) : (
                        seasonDetails[season.season_number]?.episodes?.map((episode) => (
                          <div key={episode.id} className="episode-item">
                            <div className="episode-poster">
                              {episode.still_path ? (
                                <img 
                                  src={`https://image.tmdb.org/t/p/w200${episode.still_path}`} 
                                  alt={episode.name}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/default-poster.png';
                                  }}
                                />
                              ) : (
                                <div className="default-poster">Sem imagem</div>
                              )}
                            </div>
                            <div className="episode-info">
                              <h4>
                                {episode.episode_number}. {episode.name || 'Episódio sem título'}
                              </h4>
                              <p className="air-date">
                                {episode.air_date ? new Date(episode.air_date).toLocaleDateString('pt-BR') : 'Data não disponível'}
                              </p>
                              {episode.overview && (
                                <p className="episode-overview">
                                  {episode.overview.length > 200 
                                    ? `${episode.overview.substring(0, 200)}...` 
                                    : episode.overview}
                                </p>
                              )}
                              <div className="episode-rating">
                                <PiStarFill className="star-icon" />
                                <span>{episode.vote_average?.toFixed(1) || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {seasonDetails[season.season_number]?.episodes?.length === 0 && (
                        <div className="no-episodes">Nenhum episódio disponível</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Serie;
