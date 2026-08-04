import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await register(email, password);
            navigate("/", { replace: true });
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="auth-page">
            <h1>Create Account</h1>

            <form className="auth-form" onSubmit={handleSubmit}>
                <label className="auth-field">
                    <span>Email</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                    />
                </label>

                <label className="auth-field">
                    <span>Password</span>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        minLength={8}
                    />
                </label>

                {error && <p className="auth-error">{error}</p>}

                <button type="submit" className="auth-submit-btn" disabled={submitting}>
                    {submitting ? "Creating account…" : "Create Account"}
                </button>
            </form>

            <p className="auth-switch">
                Already have an account? <Link to="/login">Log in</Link>
            </p>
        </div>
    );
}

export default RegisterPage;