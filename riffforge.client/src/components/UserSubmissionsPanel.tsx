import type { UserSubmission } from "../types/submissions";

interface Props {
    submissions: UserSubmission[];
    loading: boolean;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function UserSubmissionsPanel({ submissions, loading }: Props) {
    if (loading) return <p className="empty-state" style={{ padding: "1rem 0" }}>Loading submissions…</p>;

    if (submissions.length === 0) {
        return <p className="empty-state" style={{ padding: "1rem 0" }}>No user submissions yet — be the first to add one.</p>;
    }

    return (
        <div className="user-submissions-list">
            {submissions.map((s) => (
                <div key={s.id} className="user-submission-card">
                    <div className="user-submission-top">
                        <span className={`difficulty-pill difficulty-${s.difficulty.toLowerCase()}`}>{s.difficulty}</span>
                        <span className="user-submission-rating">
                            {s.ratingCount > 0 ? `★ ${s.rating.toFixed(1)}` : "Not yet rated"}
                        </span>
                    </div>
                    <div className="user-submission-contributor">by {s.contributorName}</div>
                    <div className="user-submission-meta">
                        <span>{s.tuning}</span>
                        <span>·</span>
                        <span>{s.ratingCount} rating{s.ratingCount === 1 ? "" : "s"}</span>
                        <span>·</span>
                        <span>{formatDate(s.dateScraped)}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}