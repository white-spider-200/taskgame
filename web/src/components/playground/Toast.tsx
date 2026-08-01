type Props = { message: string };

export function Toast({ message }: Props) {
  if (!message) return null;
  return (
    <div
      className="no-print"
      style={{
        position: "fixed",
        top: 76,
        right: "50%",
        transform: "translateX(50%)",
        zIndex: 50,
        background: "#2B2118",
        color: "#F2C94C",
        fontWeight: 700,
        fontSize: 15,
        padding: "10px 24px",
        borderRadius: 999,
        boxShadow: "0 6px 20px rgba(43,33,24,0.3)",
        animation: "pop .3s ease",
      }}
    >
      {message}
    </div>
  );
}
