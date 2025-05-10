
-- Esta tabela armazena fragmentos de transcrição temporários enquanto são processados
CREATE TABLE IF NOT EXISTS public.transcription_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  index INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Índice para consultas rápidas por nota_id e index
  UNIQUE(note_id, index)
);

-- Adicionar permissões para a service_role
ALTER TABLE public.transcription_chunks ENABLE ROW LEVEL SECURITY;

-- Política que permite que o serviço gerencie todos os registros
CREATE POLICY "Service can manage all transcription chunks"
  ON public.transcription_chunks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS policy to allow service_role to update recordings
CREATE POLICY IF NOT EXISTS "Service role can update recordings"
  ON public.recordings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
