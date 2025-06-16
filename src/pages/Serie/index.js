import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import './serie.css';
import { PiStarFill } from "react-icons/pi";

function Serie() {
  const { id } = useParams();
  const [serie, setSerie] = useState({});
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSeasons, setExpandedSeasons] = useState({});
  
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

  const toggleSeason = (seasonNumber) => {
    setExpandedSeasons(prev => ({
      ...prev,
      [seasonNumber]: !prev[seasonNumber]
    }));
  };

  if (loading) {
    return (
      <div className="loading">
        <h2>Carregando...</h2>
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

  if (!serie) {
    return (
      <div className="error">
        <h2>Conteúdo não encontrado</h2>
        <p>Não foi possível encontrar informações sobre este conteúdo.</p>
        <button onClick={() => window.history.back()}>Voltar</button>
      </div>
    );
  }


  return (
    <div className="serie-container">
      <div className="serie-header">
        <img
          src={serie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${serie.poster_path}` 
            : 'https://via.placeholder.com/300x450?text=Sem+imagem'}
          alt={serie.name || 'Capa da série'}
          className="serie-poster"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/300x450?text=Sem+imagem';
          }}
        />
        <div className="serie-info">
          <h1>{serie.name}</h1>
          <div className="serie-meta">
            <span><PiStarFill /> {serie.vote_average?.toFixed(1) || 'N/A'}/10</span>
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
                className="season-header"
                onClick={() => toggleSeason(season.season_number)}
              >
                <h3>{season.name}</h3>
                <span>{season.episode_count} episódio{season.episode_count !== 1 ? 's' : ''}</span>
                <span className="toggle-icon">
                  {expandedSeasons[season.season_number] ? '−' : '+'}
                </span>
              </div>
              
              {expandedSeasons[season.season_number] && (
                <div className="season-content">
                  <p>Detalhes da temporada serão carregados aqui.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Serie;
