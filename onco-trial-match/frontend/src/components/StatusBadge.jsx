const STATUS_LABELS = {
    pending: "Pending review",
    approved: "Approved",
    rejected: "Rejected",
    referred: "Referred",
    enrolled: "Enrolled",
};

export default function StatusBadge({ status }) {
    const label = STATUS_LABELS[status] || status;
    return <span className={`status-badge status-badge--${status}`}>{label}</span>;
}