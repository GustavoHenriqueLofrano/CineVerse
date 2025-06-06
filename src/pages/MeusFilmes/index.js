import '../MeusFilmes/index'
import {useEffect, useState} from 'react'
import { Link } from 'react-router-dom'

function MeusFilmes(){
    const [filmes, setFilmes] = useState([]);

        useEffect(() =>{
            const myList = localStorage.getItem("@CineVerse");

            setFilmes(JSON.parse(myList) || [])
        },[])

    return(
        <div>
            <h1 className='my-filmes'>Meus filmes</h1>
               <ul>
                {filmes.map((item) => {
                    return(
                        <li key={item.id}>
                        <span>{item.title}</span>
                            <div>
                                <Link to={`/filme/${item.id}`}>detalhes</Link>
                                
                                <button>excluir</button>
                            
                            </div>
                        </li>
                    )


                })}



               </ul>
                 

            

        </div>
    )
}

export default MeusFilmes;