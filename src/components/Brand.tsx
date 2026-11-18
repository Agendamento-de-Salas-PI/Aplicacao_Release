export default function Brand() {
  return (
    <div className="brand">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo_fatec_pb.png"
        alt="Logo Fatec Jahu"
        className="brand-logo h-8 w-auto max-h-9 object-contain"
      />
      <div>
        <strong>Agendador de Salas</strong>
        <span>Jahu</span>
      </div>
    </div>
  );
}
