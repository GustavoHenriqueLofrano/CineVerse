import { useEffect, useState, useNavigate } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import './serie.css';
import { PiStarFill } from "react-icons/pi";

function Serie() {
  const { id } = useParams();
  const [serie, setSerie] = useState({});
  const [loading, setLoading] = useState(true);
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
            <p><strong></strong><PiStarFill/>{serie.vote_average?.toFixed(1) || 'N/A'} /10</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Serie;
