export default function StatCard({ label, value, detail, tone = "default" }) {
  return (
    <div className={`stat-card stat-${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      {detail ? <span>{detail}</span> : null}
    </div>
  );
}
