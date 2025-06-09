import '../MeusFilmes/index.css'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function MeusFilmes() {
    const [filmes, setFilmes] = useState([]);

    useEffect(() => {
        const myList = localStorage.getItem("@CineVerse");

        setFilmes(JSON.parse(myList) || [])
    }, [])

    function ExcluirFilme(id) {
        let FilterMovies = filmes.filter((item) => {
            return (item.id !== id)
        })

        setFilmes(FilterMovies);

        localStorage.setItem("@CineVerse", JSON.stringify(FilterMovies));

    }
    if (filmes.length === 0) {
        return (
            <span className='empty-list'>Sua Lista De Filmes Está Vazia... </span>
        )
    }

    return (
        <div className='my-movies'>
            <h1>Meus filmes</h1>
            <ul>
                {filmes.map((item) => {

                    return (
                        <li key={item.id}>
                            <span>{item.title}</span>
                            <div>
                                <Link to={`/filme/${item.id}`}>detalhes</Link>

                                <button onClick={() => ExcluirFilme(item.id)}>excluir</button>

                            </div>
                        </li>
                    )


                })}
            </ul>
        </div>
    )
}

export default MeusFilmes;