import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import SearchDrugs from './pages/SearchDrugs';
import DrugDetails from './pages/DrugDetails';
import DrugInteraction from './pages/DrugInteraction';
import CompareDrugs from './pages/CompareDrugs';
import Favorites from './pages/Favorites';
import SearchHistory from './pages/SearchHistory';
import About from './pages/About';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<SearchDrugs />} />
          <Route path="drug/:id" element={<DrugDetails />} />
          <Route path="interaction" element={<DrugInteraction />} />
          <Route path="compare" element={<CompareDrugs />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="history" element={<SearchHistory />} />
          <Route path="about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
