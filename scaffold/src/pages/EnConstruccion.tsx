export default function EnConstruccion({ titulo }: { titulo: string }) {
  return (
    <div>
      <h2>{titulo}</h2>
      <div className="panel">
        <p style={{ color: '#5B6558' }}>
          La ruta y el modelo de datos de este módulo ya existen en el esquema de Supabase.
          Esta pantalla se conecta en la siguiente etapa de desarrollo (ver "Segunda etapa" en la Fase 2).
        </p>
      </div>
    </div>
  );
}
