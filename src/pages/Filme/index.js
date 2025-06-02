import { useEffect, useState, } from 'react';
import { useParams, useNavigate } from 'react-router-dom'
import './filme.css'

import api from '../../services/api';

function Filme(){
  const { id } = useParams();
  const [filme, setFilme] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(()=>{
    async function loadFilme(){
      await api.get(`/movie/${id}`, {
        params:{
          api_key: "b1168e1ae671db3ae613ebbf2326bf7b",
          language: "pt-BR",
        }
      })
      .then((response)=>{
        setFilme(response.data);
        setLoading(false);
      })
      .catch(()=>{
        console.log("FILME NAO ENCONTRADO")
      })
    }

    loadFilme();


    return () => {
      navigate("/", {replace: true})
    }
  }, [])

  if(loading){
    return(
      <div className="filme-info">
        <h1>Carregando detalhes...</h1>
      </div>
    )
  }
  
  return(
    <div className="filme-info">
      <h1>{filme.title}</h1>
      <img src={`https://image.tmdb.org/t/p/original/${filme.backdrop_path}`} alt={filme.title} />

      <h2>Sinopse</h2>
      <span>{filme.overview}</span>

      <strong>{filme.vote_average.toFixed(1)}</strong>

    </div>
  )
}

export default Filme;