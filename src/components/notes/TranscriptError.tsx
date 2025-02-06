export const TranscriptError = () => {
  return (
    <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-md">
      <p className="text-yellow-700">
        Não foi possível encontrar a transcrição para este documento.
        A transcrição está vazia ou em formato inválido.
      </p>
    </div>
  );
};