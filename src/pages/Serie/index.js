import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './serie.css';
import { PiStarFill } from "react-icons/pi";
import { FaChevronDown, FaChevronUp, FaBookmark, FaRegBookmark, FaTv, FaAngleDoubleDown, FaAngleDoubleUp } from 'react-icons/fa';

function Serie() {
  // Estados
  const { id } = useParams();
  const [serie, setSerie] = useState({});
  const [seasons, setSeasons] = useState([]);
  const [activeSeason, setActiveSeason] = useState(1);
  const [seasonDetails, setSeasonDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingSeason, setLoadingSeason] = useState(false);
  const [expandedSeasons, setExpandedSeasons] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const navigate = useNavigate();
  
  // Efeito para verificar se a série já está salva
  useEffect(() => {
    const checkIfSerieIsSaved = () => {
      if (!id || !serie || !serie.id) return;
      
      const myList = localStorage.getItem("@CineVerse");
      if (!myList) {
        setIsSaved(false);
        return;
      }
      
      try {
        const savedItems = JSON.parse(myList);
        if (!Array.isArray(savedItems)) {
          setIsSaved(false);
          return;
        }
        
        const serieId = id.split('-')[0];
        const hasItem = savedItems.some(
          (item) => item && item.id && item.id.toString() === serieId && item.media_type === 'tv'
        );
        setIsSaved(hasItem);
      } catch (e) {
        console.error('Erro ao verificar série salva:', e);
        setIsSaved(false);
      }
    };
    
    checkIfSerieIsSaved();
  }, [id, serie]);

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
      
    } catch (err) {
      console.error('Erro ao carregar temporada:', err);
    } finally {
      setLoadingSeason(false);
    }
  };
  
  // Alternar visibilidade dos episódios de uma temporada
  const toggleSeason = async (seasonNumber) => {
    const serieId = id.split('-')[0];
    
    // Se a temporada já está expandida, apenas fecha
    if (expandedSeasons[seasonNumber]) {
      setExpandedSeasons(prev => ({
        ...prev,
        [seasonNumber]: false
      }));
      setAllExpanded(false);
    } else {
      // Se já temos os detalhes, apenas expande
      if (seasonDetails[seasonNumber]) {
        setExpandedSeasons(prev => ({
          ...prev,
          [seasonNumber]: true
        }));
      } else {
        // Se não tem os detalhes, busca e depois expande
        try {
          await fetchSeasonDetails(serieId, seasonNumber);
          // Atualiza o estado para expandir a temporada após carregar os detalhes
          setExpandedSeasons(prev => ({
            ...prev,
            [seasonNumber]: true
          }));
          // Rola a tela até a seção de episódios após carregar
          setTimeout(() => {
            const element = document.querySelector(`.season-${seasonNumber}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        } catch (error) {
          console.error('Erro ao carregar episódios:', error);
        }
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

  // Função para salvar/remover série da lista
  const toggleSaveSerie = () => {
    if (!id || !serie) {
      console.error('ID da série ou dados da série não disponíveis');
      return;
    }
    
    try {
      const myList = localStorage.getItem("@CineVerse");
      let savedItems = [];
      
      if (myList) {
        try {
          savedItems = JSON.parse(myList);
          if (!Array.isArray(savedItems)) {
            savedItems = [];
          }
        } catch (e) {
          console.error('Erro ao ler a lista de itens salvos:', e);
          savedItems = [];
        }
      }

      const serieId = id.split('-')[0];
      const hasItem = savedItems.some((item) => item && item.id && item.id.toString() === serieId && item.media_type === 'tv');

      if (hasItem) {
        // Remover da lista
        savedItems = savedItems.filter(item => !(item && item.id && item.id.toString() === serieId && item.media_type === 'tv'));
        try {
          localStorage.setItem("@CineVerse", JSON.stringify(savedItems));
          setIsSaved(false);
          alert("Série removida da sua lista!");
        } catch (e) {
          console.error('Erro ao salvar alterações no localStorage:', e);
          alert('Erro ao remover a série. Por favor, tente novamente.');
        }
      } else {
        // Adicionar à lista
        if (!serie.name) {
          console.error('Dados da série incompletos:', serie);
          alert('Não foi possível salvar a série. Dados incompletos.');
          return;
        }
        
        const serieToSave = {
          id: serieId,
          title: serie.name,
          poster_path: serie.poster_path || '',
          overview: serie.overview || '',
          vote_average: serie.vote_average || 0,
          first_air_date: serie.first_air_date || '',
          media_type: 'tv'
        };
        
        savedItems.push(serieToSave);
        try {
          localStorage.setItem("@CineVerse", JSON.stringify(savedItems));
          setIsSaved(true);
          alert("Série salva com sucesso!");
        } catch (e) {
          console.error('Erro ao salvar no localStorage:', e);
          alert('Erro ao salvar a série. O armazenamento pode estar cheio.');
        }
      }
    } catch (error) {
      console.error('Erro ao processar a solicitação:', error);
      alert('Ocorreu um erro inesperado. Por favor, tente novamente.');
    }
  };



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
          <div className="serie-header">
            <h1>{serie.name}</h1>
            <button 
              className={`save-button ${isSaved ? 'saved' : ''}`} 
              onClick={toggleSaveSerie}
              aria-label={isSaved ? 'Remover da lista' : 'Salvar na lista'}
              title={isSaved ? 'Remover da lista' : 'Salvar na lista'}
            >
              {isSaved ? <FaBookmark /> : <FaRegBookmark />}
              <span>{isSaved ? 'Salvo' : 'Salvar'}</span>
            </button>
          </div>
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
            <div className="seasons-header">
              <h2>Temporadas</h2>
              {seasons.length > 0 && (
                <span className="seasons-count">{seasons.length} temporada{seasons.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            <div className="seasons-list">
              {seasons.map((season) => (
                <div 
                  key={season.season_number} 
                  className={`season-item ${expandedSeasons[season.season_number] ? 'expanded' : ''}`}
                  id={`season-${season.season_number}`}
                >
                  <div 
                    className={`season-header ${activeSeason === season.season_number ? 'active' : ''}`}
                    onClick={() => toggleSeason(season.season_number)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && toggleSeason(season.season_number)}
                    aria-expanded={expandedSeasons[season.season_number] ? 'true' : 'false'}
                    aria-controls={`season-${season.season_number}-content`}
                  >
                    <div className="season-title">
                      <h3>{season.name}</h3>
                      <span>{season.episode_count} episódio{season.episode_count !== 1 ? 's' : ''}</span>
                    </div>
                    {expandedSeasons[season.season_number] ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                  
                  <div 
                    id={`season-${season.season_number}-content`}
                    className={`season-content ${expandedSeasons[season.season_number] ? 'expanded' : ''}`}
                    aria-hidden={!expandedSeasons[season.season_number]}
                  >
                    {expandedSeasons[season.season_number] && (
                      <div className="episodes-list">
                        {loadingSeason && season.season_number === activeSeason ? (
                          <div className="loading-episodes">
                            <div className="loading-spinner"></div>
                            <p>Carregando episódios...</p>
                          </div>
                        ) : (
                          <>
                            {seasonDetails[season.season_number]?.episodes?.length > 0 ? (
                              seasonDetails[season.season_number].episodes.map((episode, index) => (
                                <div 
                                  key={episode.id} 
                                  className="episode-item"
                                  style={{ '--i': index + 1 }}
                                >
                                  <div className="episode-poster">
                                    {episode.still_path ? (
                                      <img 
                                        src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                                        alt={`${episode.name || 'Episódio'} ${episode.episode_number}`}
                                        loading="lazy"
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = '/default-poster.png';
                                        }}
                                      />
                                    ) : (
                                      <div className="default-poster">
                                        <FaTv size={32} />
                                        <span>Sem imagem</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="episode-info">
                                    <div className="episode-header">
                                      <h4>
                                        <span className="episode-number">Episódio {episode.episode_number}:</span>
                                        <span className="episode-title">{episode.name || 'Sem título'}</span>
                                      </h4>
                                      {episode.vote_average > 0 && (
                                        <div className="episode-rating">
                                          <PiStarFill className="star-icon" />
                                          <span>{episode.vote_average.toFixed(1)}</span>
                                        </div>
                                      )}
                                    </div>
                                    {episode.air_date && (
                                      <p className="air-date">
                                        Exibido em: {new Date(episode.air_date).toLocaleDateString('pt-BR')}
                                      </p>
                                    )}
                                    {episode.runtime && (
                                      <p className="runtime">
                                        Duração: {episode.runtime} min
                                      </p>
                                    )}
                                    {episode.overview ? (
                                      <div className="episode-overview">
                                        <p>
                                          {episode.overview.length > 200 
                                            ? `${episode.overview.substring(0, 200)}...` 
                                            : episode.overview}
                                        </p>
                                      </div>
                                    ) : (
                                      <p className="no-overview">Sinopse não disponível</p>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="no-episodes">
                                Nenhum episódio disponível para esta temporada.
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
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
