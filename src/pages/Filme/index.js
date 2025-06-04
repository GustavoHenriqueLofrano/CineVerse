import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './filme.css';
import api from '../../services/api';
import star from '../../services/images/star.png';

function Filme() {
  const { id } = useParams();
  const [filme, setFilme] = useState({});
  const [loading, setLoading] = useState(true);
  const [trailerKey, setTrailerKey] = useState(null);
  const [loadingTrailer, setLoadingTrailer] = useState(true);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadFilme() {
      try {
        const filmeResponse = await api.get(`/movie/${id}`, {
          params: {
            api_key: "b1168e1ae671db3ae613ebbf2326bf7b",
            language: "pt-BR",
          }
        });
        setFilme(filmeResponse.data);
        setLoading(false);

        const videosResponse = await api.get(`/movie/${id}/videos`, {
          params: {
            api_key: "b1168e1ae671db3ae613ebbf2326bf7b",
            language: "pt-BR",
          }
        });

        const trailer = videosResponse.data.results.find(
          video => video.type === "Trailer" && video.site === "YouTube"
        ) || videosResponse.data.results[0];

        if (trailer) {
          setTrailerKey(trailer.key);
        }
        setLoadingTrailer(false);
      } catch (error) {
        navigate("/", { replace: true });
      }
    }

    loadFilme();

    return () => {
      console.log("COMPONENTE FOI DESMONTADO");
    }
  }, [id, navigate]);

  const handleTrailerClick = () => {
    if (trailerKey) {
      setShowTrailerModal(true);
    }
  };

  const closeTrailerModal = () => {
    setShowTrailerModal(false);
  };

  if (loading) {
    return (
      <div className="filme-info">
        <h1>Carregando detalhes...</h1>
      </div>
    );
  }

  return (
    <div className='container'>
      <div className="filme-info">
        <h1>{filme.title}</h1>
        <img src={`https://image.tmdb.org/t/p/original/${filme.backdrop_path}`} alt={filme.title} />

        <h2>Sinopse</h2>
        <span>{filme.overview}</span>

        <div className="avaliacao">
          <img src={star} alt="star" id="star"></img>
          <strong>{filme.vote_average.toFixed(1)}/10</strong>
        </div>

        <div className='botoes'>
          <button>Salvar</button>
          {trailerKey && (
            <button onClick={handleTrailerClick}>
              Ver Trailer
            </button>
          )}
          {!trailerKey && !loadingTrailer && (
            <button disabled>Trailer Indisponível</button>
          )}
          {loadingTrailer && (
            <button disabled>Carregando Trailer...</button>
          )}
        </div>
      </div>

      {}
      {showTrailerModal && (
        <div className="trailer-modal">
          <div className="trailer-modal-content">
            <button className="close-modal" onClick={closeTrailerModal}>
              &times;
            </button>
            <iframe
              width="600"
              height="400"
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