
-- Drop the existing unique constraint
ALTER TABLE public.project_embeddings DROP CONSTRAINT IF EXISTS project_id_unique;

-- Create a new composite unique constraint on project_id and field_type
ALTER TABLE public.project_embeddings 
  ADD CONSTRAINT project_id_field_type_unique UNIQUE (project_id, field_type);

-- Add an index to improve lookup performance
CREATE INDEX IF NOT EXISTS idx_project_embeddings_field_type ON public.project_embeddings(field_type);

-- Comment to explain the constraint
COMMENT ON CONSTRAINT project_id_field_type_unique ON public.project_embeddings 
  IS 'Ensures each project can have multiple embeddings but only one per field_type';
