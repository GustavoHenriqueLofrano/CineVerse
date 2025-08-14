import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './filme.css';
import api from '../../services/api';
import { PiStarFill } from "react-icons/pi";
import { FaBookmark, FaRegBookmark } from 'react-icons/fa';

function Filme() {
  const { id } = useParams();
  const [filme, setFilme] = useState({});
  const [loading, setLoading] = useState(true);
  const [trailerKey, setTrailerKey] = useState('');
  const [loadingTrailer, setLoadingTrailer] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadFilme() {
      if (!id) {
        setError({
          message: 'ID do filme não fornecido',
          code: 400
        });
        setLoading(false);
        return;
      }


      try {
        setLoading(true);
        setError(null);

        const [filmeResponse, videosResponse] = await Promise.all([
          api.get(`/movie/${id}`, {
            params: {
              language: 'pt-BR',
              append_to_response: 'credits,external_ids,images,release_dates,similar'
            }
          }).catch(async () => {
            return api.get(`/movie/${id}`, {
              params: {
                language: 'en-US',
                append_to_response: 'credits,external_ids,images,release_dates,similar'
              }
            });
          }),
          api.get(`/movie/${id}/videos`, {
            params: { language: 'pt-BR' }
          })
        ]);

        const filmeData = {
          ...filmeResponse.data,
          release_date: filmeResponse.data.release_date ?
            new Date(filmeResponse.data.release_date).toLocaleDateString('pt-BR') :
            'Data não disponível',
          runtime: filmeResponse.data.runtime ?
            `${Math.floor(filmeResponse.data.runtime / 60)}h ${filmeResponse.data.runtime % 60}min` :
            'Duração não disponível'
        };

        setFilme(filmeData);

        const trailer = videosResponse.data.results?.find(
          video => video.type === "Trailer" && video.site === "YouTube"
        ) || videosResponse.data.results?.[0];

        if (trailer) {
          setTrailerKey(trailer.key);
        }
      } catch (err) {
        console.error('Erro ao carregar filme:', err);
        if (err.response?.status === 401) {
          setError({
            message: 'API inválida. Por favor, configure uma chave de API válida.',
            code: 401,
            details: {
              status: 'invalid_api_key'
            }
          });
        } else {
          const errorMessage = err.response?.data?.status_message || 'Erro ao carregar o filme';
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

    loadFilme();
  }, [id, navigate]);

  useEffect(() => {
    const checkIfMovieIsSaved = () => {
      if (!filme || !filme.id) return;
      
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
        
        const hasItem = savedItems.some(
          (item) => item && item.id === filme.id && item.media_type === 'movie'
        );
        setIsSaved(hasItem);
      } catch (e) {
        console.error('Erro ao verificar filme salvo:', e);
        setIsSaved(false);
      }
    };
    
    checkIfMovieIsSaved();
  }, [filme]);

  const handleTrailerClick = () => {
    if (trailerKey) {
      setShowTrailerModal(true);
    }
  };

  const closeTrailerModal = () => {
    setShowTrailerModal(false);
  };

  const saveMovie = () => {
    try {
      const myList = localStorage.getItem("@CineVerse");
      let savedItems = [];

      if (myList) {
        try {
          savedItems = JSON.parse(myList);
          if (!Array.isArray(savedItems)) savedItems = [];
        } catch (e) {
          console.error('Erro ao ler a lista de itens salvos:', e);
          savedItems = [];
        }
      }

      const hasItem = savedItems.some(item => item.id === filme.id && item.media_type === 'movie');
      
      if (hasItem) {
        // Remover da lista
        savedItems = savedItems.filter(item => !(item.id === filme.id && item.media_type === 'movie'));
        localStorage.setItem("@CineVerse", JSON.stringify(savedItems));
        setIsSaved(false);
        alert("Filme removido da sua lista!");
      } else {
        // Adicionar à lista
        const itemToSave = {
          id: filme.id,
          title: filme.title,
          poster_path: filme.poster_path || '',
          overview: filme.overview || '',
          vote_average: filme.vote_average || 0,
          release_date: filme.release_date || '',
          media_type: 'movie'
        };
        
        savedItems.push(itemToSave);
        localStorage.setItem("@CineVerse", JSON.stringify(savedItems));
        setIsSaved(true);
        alert("Filme salvo com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao salvar/remover filme:", error);
      alert("Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.");
    }
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

  if (!filme) {
    return (
      <div className="error">
        <h2>Filme não encontrado</h2>
        <p>Não foi possível encontrar informações sobre este filme.</p>
        <button onClick={() => window.history.back()}>Voltar</button>
      </div>
    );
  }

  return (
    <div className="container-filme">
      <div className="filme-content">
        <div className="filme-poster">
          <img
            src={filme.poster_path ? `https://image.tmdb.org/t/p/w500${filme.poster_path}` : '/default-poster.png'}
            alt={filme.title || 'Capa do filme'}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/default-poster.png';
            }}
          />
        </div>
        <div className="filme-info">
          <h1>{filme.title}</h1>
          <p className="filme-overview">{filme.overview || 'Sinopse não disponível'}</p>

          <div className="filme-details">
            <p><strong>Data de lançamento:</strong> {filme.release_date || 'Não disponível'}</p>
            <p><strong>Duração:</strong> {filme.runtime}</p>
            <p><strong>Gêneros:</strong> {filme.genres?.map(g => g.name).join(', ') || 'Não disponível'}</p>
            <p><strong>Diretor:</strong> {filme.credits?.crew?.find(person => person.job === 'Director')?.name || 'Não disponível'}</p>
            <p><strong>Elenco principal:</strong> {filme.credits?.cast?.slice(0, 3).map(actor => actor.name).join(', ') || 'Não disponível'}</p>
            <p><strong>Status:</strong> {filme.status === 'Released' ? 'Lançado' : filme.status || 'Não disponível'}</p>
            <p><strong>Idioma original:</strong> {filme.original_language?.toUpperCase() || 'N/A'}</p>
            <p><strong>Orçamento:</strong> {filme.budget ? `$${filme.budget.toLocaleString()}` : 'Não disponível'}</p>
            <p><strong>Receita:</strong> {filme.revenue ? `$${filme.revenue.toLocaleString()}` : 'Não disponível'}</p>
          </div>

          <div className="rating">
            <PiStarFill className="star" />
            <strong>{filme.vote_average?.toFixed(1) || 'N/A'}/10</strong>
            <span>({filme.vote_count || 0} votos)</span>
          </div>

          <div className="buttons">
            <button
              className={`saveMovie ${isSaved ? 'saved' : ''}`}
              onClick={saveMovie}
              aria-label={isSaved ? 'Remover da lista' : 'Salvar na lista'}
              title={isSaved ? 'Remover da lista' : 'Salvar na lista'}
            >
              {isSaved ? <FaBookmark /> : <FaRegBookmark />}
              <span>{isSaved ? 'Salvo' : 'Salvar'}</span>
            </button>
            {trailerKey ? (
              <button onClick={handleTrailerClick}>
                Assistir Trailer
              </button>
            ) : loadingTrailer ? (
              <button disabled>Carregando trailer...</button>
            ) : (
              <button disabled>Trailer não disponível</button>
            )}
          </div>
        </div>
      </div>

      {/* Modal do trailer */}
      {showTrailerModal && trailerKey && (
        <div className="trailer-modal">
          <div className="trailer-modal-content">
            <button className="close-modal" onClick={closeTrailerModal}>
              &times;
            </button>
            <iframe
              width="560"
              height="315"
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              title={`${filme.title} Trailer`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen>
            </iframe>
          </div>
        </div>
      )}
    </div>
  );
}

export default Filme;