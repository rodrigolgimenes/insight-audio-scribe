
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

-- Function to update task_id in recording table with service role privileges
CREATE OR REPLACE FUNCTION public.update_recording_task_id(
  p_recording_id UUID, 
  p_task_id TEXT,
  p_status TEXT DEFAULT 'transcribing'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.recordings
  SET 
    task_id = p_task_id,
    status = p_status,
    updated_at = NOW()
  WHERE id = p_recording_id;
  
  RETURN FOUND;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_recording_task_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_recording_task_id TO service_role;

