import '../MeusFilmes/index.css'
import { useState, useEffect } from 'react';
import { FaTrashAlt, FaFilm, FaTv } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './index.css';

export default function MeusFilmes() {
    const [itens, setItens] = useState([]);

    useEffect(() => {
        const minhaLista = localStorage.getItem("@CineVerse");
        setItens(JSON.parse(minhaLista) || []);
    }, []);

    function excluirItem(id, mediaType) {
        const itensAtualizados = itens.filter(item => 
            !(item.id === id && item.media_type === mediaType)
        );
        setItens(itensAtualizados);
        localStorage.setItem("@CineVerse", JSON.stringify(itensAtualizados));
    }

    if (itens.length === 0) {
        return (
            <div className='empty-list'>
                <h1>Minha Lista</h1>
                <p>Sua lista está vazia...</p>
            </div>
        );
    }

    return (
        <div className='my-list'>
            <h1>Minha Lista</h1>
            <div className='items-grid'>
                {itens.map((item) => {
                    const isSerie = item.media_type === 'tv';
                    const detalhesUrl = isSerie ? `/serie/${item.id}` : `/filme/${item.id}`;
                    
                    return (
                        <div key={`${item.id}-${item.media_type}`} className='item-card'>
                            <div className='item-poster'>
                                {item.poster_path ? (
                                    <img 
                                        src={`https://image.tmdb.org/t/p/w200${item.poster_path}`} 
                                        alt={item.title} 
                                    />
                                ) : (
                                    <div className='no-poster'>
                                        {isSerie ? <FaTv size={40} /> : <FaFilm size={40} />}
                                    </div>
                                )}
                                <div className='item-actions'>
                                    <Link to={detalhesUrl} className='details-btn'>
                                        Detalhes
                                    </Link>
                                    <button 
                                        onClick={() => excluirItem(item.id, item.media_type)}
                                        className='delete-btn'
                                        title='Remover da lista'
                                    >
                                        <FaTrashAlt />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}