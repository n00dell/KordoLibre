import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import LibraryPage from "./pages/LibraryPage";
import SearchPage from "./pages/SearchPage";
import PracticePlanPage from "./pages/PracticePlanPage";
import SongDetailPage from "./pages/SongDetailPage";
import SongVersionsPage from "./pages/SongVersionsPage";
import GuitarTuner from "./pages/GuitarTuner";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Login/Register stay outside ProtectedRoute — obviously, or nobody could
// ever reach them to log in. Everything else requires a session.
function App() {
    return (
        <AuthProvider>
            <Navbar />
            <div className="main-content">
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    <Route path="/" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
                    <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
                    <Route path="/practice" element={<ProtectedRoute><PracticePlanPage /></ProtectedRoute>} />
                    <Route path="/song/:id" element={<ProtectedRoute><SongDetailPage /></ProtectedRoute>} />
                    <Route path="/song/:id/version/:versionId" element={<ProtectedRoute><SongDetailPage /></ProtectedRoute>} />
                    <Route path="/song/:id/versions" element={<ProtectedRoute><SongVersionsPage /></ProtectedRoute>} />
                    <Route path="/tuner" element={<ProtectedRoute><GuitarTuner /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                </Routes>
            </div>
        </AuthProvider>
    );
}

export default App;