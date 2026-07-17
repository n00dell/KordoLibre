import Navbar from './components/Navbar';
import LibraryPage from './pages/LibraryPage';
import './App.css';

function App() {
    return (
        <div className="app">
            <Navbar />
            <main className="main-content">
                <LibraryPage />
            </main>
        </div>
    );
}

export default App;