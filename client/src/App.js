// src/App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RecipesProvider } from './context/RecipesContext';
import { ToastProvider } from './context/ToastContext';
import Login from './authentication/Login';
import SignUp from './authentication/SignUp';
import Dashboard from './pages/Dashboard';
import SavedRecipes from './pages/SavedRecipes';
import RecipeBrowser from './pages/RecipeBrowser'; // Add this import
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RecipeDetail from './pages/RecipeDetail';
import Profile from './pages/Profile';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

const Layout = ({ children }) => (
  <>
    <Navbar />
    <main className="flex-grow">{children}</main>
    <Footer />
  </>
);

export default function App() {
  return (
    <ToastProvider>
      <RecipesProvider>
        <Router>
          <Routes>
            {/* Auth routes (no navbar/footer) */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Main routes (with navbar/footer) */}
            <Route path="/" element={<Layout><Dashboard /></Layout>} />
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/browse" element={<Layout><RecipeBrowser /></Layout>} /> {/* Add this route */}
            <Route path="/saved" element={<Layout><SavedRecipes /></Layout>} />
            <Route path="/profile" element={<Layout><Profile /></Layout>} />
            <Route path="/contact" element={<Layout><Contact /></Layout>} />
            <Route path="/terms" element={<Layout><Terms /></Layout>} />
            <Route path="/privacy" element={<Layout><Privacy /></Layout>} />

            {/* Recipe detail modal (available on all pages) */}
            <Route path="/recipe/:id" element={<Layout><Dashboard /></Layout>} />
          </Routes>

          {/* Always available Recipe Detail Modal */}
          <RecipeDetail />
        </Router>
      </RecipesProvider>
    </ToastProvider>
  );
}