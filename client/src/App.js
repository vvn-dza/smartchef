// src/App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RecipesProvider } from './context/RecipesContext';
import { ToastProvider } from './context/ToastContext';
import Login from './authentication/Login';
import SignUp from './authentication/SignUp';
import Dashboard from './pages/Dashboard';
import RecipeSearch from './pages/RecipeSearch';
import AISearch from './pages/AISearch';
import SavedRecipes from './pages/SavedRecipes';
import Navbar from './components/Navbar';
import RecipeDetail from './pages/RecipeDetail';
import Profile from './pages/Profile';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

const Layout = ({ children }) => (
  <div className="relative flex size-full min-h-screen flex-col bg-[#11221c] dark group/design-root overflow-x-hidden">
    <div className="layout-container flex h-full grow flex-col">
      <Navbar />
      <div className="px-4 sm:px-6 lg:px-8 flex flex-1 justify-center py-5">
        <div className="layout-content-container flex flex-col w-full max-w-7xl flex-1">
          {children}
        </div>
      </div>
    </div>
  </div>
);

export default function App() {
  return (
    <ToastProvider>
      <RecipesProvider>
        <Router>
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Main routes */}
            <Route path="/" element={<Layout><Dashboard /></Layout>} />
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/search" element={<Layout><RecipeSearch /></Layout>} />
            <Route path="/ai-search" element={<Layout><AISearch /></Layout>} />
            <Route path="/saved" element={<Layout><SavedRecipes /></Layout>} />
            <Route path="/profile" element={<Layout><Profile /></Layout>} />
            <Route path="/contact" element={<Layout><Contact /></Layout>} />
            <Route path="/terms" element={<Layout><Terms /></Layout>} />
            <Route path="/privacy" element={<Layout><Privacy /></Layout>} />

            {/* Recipe detail modal */}
            <Route path="/recipe/:id" element={<Layout><Dashboard /></Layout>} />
          </Routes>

          {/* Always available Recipe Detail Modal */}
          <RecipeDetail />
        </Router>
      </RecipesProvider>
    </ToastProvider>
  );
}