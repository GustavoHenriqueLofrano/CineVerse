import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import './serie.css';

// Configuração da API
const API_CONFIG = {
  key: "28fc232cc001c31e8a031f419d0a14ca",
  language: "pt-BR"
};

function Serie() {
  const { id } = useParams();
  const [serie, setSerie] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState({
    message: '',
    code: null
  });

  useEffect(() => {
    async function fetchMedia() {
      try {
        setLoading(true);
        setError({ message: '', code: null });
        
        // Buscar os detalhes completos da série
        try {
          const response = await api.get(`/tv/${id}`, {
            params: {
              ...API_CONFIG,
              language: 'pt-BR',
              append_to_response: 'credits,external_ids,images,videos,content_ratings'
            }
          });

          // Adicionar informações adicionais
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
          // Se falhar com /tv, tenta com /movie
          try {
            const response = await api.get(`/movie/${id}`, {
              params: {
                ...API_CONFIG,
                language: 'pt-BR',
                append_to_response: 'credits,external_ids,images,videos,content_ratings'
              }
            });

            // Adicionar informações adicionais
            const movieData = {
              ...response.data,
              // Converter datas para formato brasileiro
              release_date: response.data.release_date ? 
                new Date(response.data.release_date).toLocaleDateString('pt-BR') : 
                'Data não disponível'
            };

            setSerie(movieData);
          } catch (err2) {
            throw new Error('Conteúdo não encontrado');
          }
        }

        if (!media) {
          throw new Error('Conteúdo não encontrado');
        }

        // Busca os detalhes completos baseado no tipo de mídia
        const detailsResponse = await api.get(`/${media.media_type}/${id}`, {
          params: {
            ...API_CONFIG,
            append_to_response: 'credits,videos,images'
          }
        });

        setSerie(detailsResponse.data);
      } catch (err) {
        const errorMessage = err.response?.data?.status_message || 'Erro ao carregar o conteúdo';
        setError({
          message: errorMessage,
          code: err.response?.status || 500,
          details: err.response?.data || {}
        });
      } finally {
        setLoading(false);
      }
    }

    fetchMedia();
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
        <button onClick={() => navigate(-1)}>Voltar para os resultados</button>
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
            <p><strong>Popularidade:</strong> {serie.popularity.toFixed(1)}</p>
            <p><strong>Nota:</strong> {serie.vote_average.toFixed(1)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Serie;
