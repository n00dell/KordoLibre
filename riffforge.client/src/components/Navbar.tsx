import { NavLink } from "react-router-dom";
import ThemeSwitcher from "./ThemeSwitcher";

// `NavLink` is React Router's version of an <a> tag. Two key differences
// from a plain <a href="...">:
//   1. It doesn't reload the page — React swaps the page content in place,
//      which is what makes single-page apps feel instant.
//   2. It automatically knows when it's "active" (i.e. its `to` matches the
//      current URL) and lets you style that state.
function Navbar() {
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
                        <NavLink to="/search" className={({ isActive }) => (isActive ? "active" : "")}>
                            Search
                        </NavLink>
                    </li>
                </ul>
                <div className="navbar-right">
                    <ThemeSwitcher />
                    <div className="user-profile">👤</div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;