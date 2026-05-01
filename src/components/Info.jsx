export default function Info({ label, value }) {
  return (
    <div className="info-item">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}
