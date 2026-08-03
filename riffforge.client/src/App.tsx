import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import LibraryPage from "./pages/LibraryPage";
import SearchPage from "./pages/SearchPage";
import PracticePlanPage from "./pages/PracticePlanPage";
import SongDetailPage from "./pages/SongDetailPage";
import SongVersionsPage from "./pages/SongVersionsPage";
import GuitarTuner from "./pages/GuitarTuner";

// <Routes> looks at the current URL and renders whichever <Route>'s `path`
// matches. Navbar sits outside <Routes> so it's always visible, no matter
// which page you're on — only the ".main-content" area below it swaps out.
//
// Note that /song/:id and /song/:id/version/:versionId both point at
// SongDetailPage — same component, just with an extra URL param available
// on the second route. useParams() inside SongDetailPage picks up whichever
// params are present.
function App() {
    return (
        <>
            <Navbar />
            <div className="main-content">
                <Routes>
                    <Route path="/" element={<LibraryPage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/practice" element={<PracticePlanPage />} />
                    <Route path="/song/:id" element={<SongDetailPage />} />
                    <Route path="/song/:id/version/:versionId" element={<SongDetailPage />} />
                    <Route path="/song/:id/versions" element={<SongVersionsPage />} />
                    <Route path="/tuner" element={<GuitarTuner />} />
                </Routes>
            </div>
        </>
    );
}

export default App;