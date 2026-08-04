import { NavLink, useNavigate } from "react-router-dom";
import ThemeSwitcher from "./ThemeSwitcher";
import { useAuth } from "../hooks/useAuth";

function Navbar() {
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate("/login");
    }

    return (
        <nav className="navbar">
            <div className="nav-container">
                <div className="logo">🎸 RiffForge</div>
                <ul className="nav-links">
                    <li>
                        <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")} end>
                            Library
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/practice" className={({ isActive }) => (isActive ? "active" : "")}>
                            Practice Plan
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/tuner" className={({ isActive }) => (isActive ? "active" : "")}>
                            Tuner
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/search" className={({ isActive }) => (isActive ? "active" : "")}>
                            Search
                        </NavLink>
                    </li>
                </ul>
                <div className="navbar-right">
                    <ThemeSwitcher />

                    {loading ? null : user ? (
                        <div className="navbar-user-menu">
                            <NavLink
                                to="/profile"
                                className={({ isActive }) => `user-profile${isActive ? " active" : ""}`}
                                title={user.email}
                            >
                                👤
                            </NavLink>
                            <button type="button" className="navbar-logout-btn" onClick={handleLogout}>
                                Log Out
                            </button>
                        </div>
                    ) : (
                        <NavLink to="/login" className="navbar-login-link">
                            Log In
                        </NavLink>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;