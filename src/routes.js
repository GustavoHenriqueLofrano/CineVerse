import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import Filme from './pages/Filme';
import SearchResults from './pages/SearchResults';

import Erro from './pages/Erro';

import Header from './components/Header';
import MeusFilmes from './pages/MeusFilmes';

function RoutesApp(){
  return(
    <BrowserRouter>
      <Header/>
      <Routes>
        <Route path="/" element={ <Home/> } />
        <Route path="/filme/:id" element={ <Filme/> } />
        <Route path="/MeusFilmes" element={ <MeusFilmes/> } />
        <Route path="/search/:term" element={ <SearchResults/> } />

        <Route path="*" element={ <Erro/> } />
      </Routes>
    </BrowserRouter>
  )
}

export default RoutesApp;