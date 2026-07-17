function Navbar() {
    return (
        <nav className="navbar">
            <div className="nav-container">
                <div className="logo">🎸 RiffForge</div>
                <ul className="nav-links">
                    <li className="active">Library</li>
                    <li>Practice Plan</li>
                    <li>Search</li>
                </ul>
                <div className="user-profile">👤</div>
            </div>
        </nav>
    );
}

export default Navbar;