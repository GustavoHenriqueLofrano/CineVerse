import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import './serie.css';

function Serie() {
  const { id } = useParams();
  const [serie, setSerie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSerie() {
      try {
        const response = await api.get(`/tv/${id}`, {
          params: {
            api_key: "28fc232cc001c31e8a031f419d0a14ca",
            language: "pt-BR",
          }
        });
        setSerie(response.data);
        setLoading(false);
      } catch (err) {
        setError('Erro ao carregar a série');
        setLoading(false);
      }
    }

    fetchSerie();
  }, [id]);

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
        <h2>{error}</h2>
      </div>
    );
  }

  if (!serie) {
    return (
      <div className="error">
        <h2>Série não encontrada</h2>
      </div>
    );
  }

  return (
    <div className="container-serie">
      <div className="serie-content">
        <div className="serie-image">
          <img
            src={`https://image.tmdb.org/t/p/w500${serie.poster_path}`}
            alt={serie.name}
          />
        </div>
        <div className="serie-info">
          <h1>{serie.name}</h1>
          <p>{serie.overview}</p>
          <div className="serie-details">
            <p><strong>Primeira exibição:</strong> {serie.first_air_date}</p>
            <p><strong>Popularidade:</strong> {serie.popularity.toFixed(1)}</p>
            <p><strong>Nota:</strong> {serie.vote_average.toFixed(1)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Serie;
