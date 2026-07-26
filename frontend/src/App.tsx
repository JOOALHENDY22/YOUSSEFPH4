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
import ControlledDrugs from './pages/ControlledDrugs';
import DrugAlternatives from './pages/DrugAlternatives';
import EmergencyConsultant from './pages/EmergencyConsultant';
import AdminDashboard from './pages/AdminDashboard';
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
          <Route path="scheduled" element={<ControlledDrugs />} />
          <Route path="alternatives" element={<DrugAlternatives />} />
          <Route path="emergency" element={<EmergencyConsultant />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin-dashboard" element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
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
