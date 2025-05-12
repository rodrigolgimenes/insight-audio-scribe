
-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS pgvector;

-- Create project_embeddings table to store vector data
CREATE TABLE IF NOT EXISTS public.project_embeddings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    embedding vector(1536), -- Ada embeddings have 1536 dimensions
    content_hash text NOT NULL,
    content text, -- For debugging purposes
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT project_id_unique UNIQUE (project_id)
);

-- Add RLS policies
ALTER TABLE public.project_embeddings ENABLE ROW LEVEL SECURITY;

-- Allow users to select their own project embeddings
CREATE POLICY "Users can select their own project embeddings" ON public.project_embeddings
    FOR SELECT
    USING (project_id IN (
        SELECT id FROM public.projects WHERE user_id = auth.uid()
    ));

-- Create function to update the embedding when a project changes
CREATE OR REPLACE FUNCTION public.handle_project_embedding_update()
RETURNS TRIGGER AS $$
DECLARE
    webhook_url text;
    result int;
BEGIN
    -- Define the URL for our edge function
    webhook_url := current_setting('app.settings.webhook_url', true) 
                  || '/functions/v1/vectorize-project';
    
    -- Call the edge function using pg_net
    SELECT status INTO result FROM net.http_post(
        url := webhook_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
            'project_id', NEW.id
        )::text
    );

    -- Log result but continue regardless of success to prevent blocking transactions
    IF result >= 200 AND result < 300 THEN
        RAISE NOTICE 'Successfully triggered embedding generation for project %', NEW.id;
    ELSE
        RAISE WARNING 'Failed to trigger embedding generation for project %. Status: %', NEW.id, result;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the embedding update function on project changes
CREATE OR REPLACE TRIGGER trigger_project_embedding_update
    AFTER INSERT OR UPDATE OF name, description, scope, objective, user_role, business_area, key_terms, meeting_types
    ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_project_embedding_update();

-- Function to find related projects based on text similarity
CREATE OR REPLACE FUNCTION public.find_similar_projects(
    search_text text,
    similarity_threshold float DEFAULT 0.7,
    max_results int DEFAULT 5
)
RETURNS TABLE (
    project_id uuid,
    similarity float
) 
LANGUAGE plpgsql
AS $$
DECLARE
    embedding vector(1536);
BEGIN
    -- Generate embedding for the search text
    SELECT (openai.embeddings(search_text))[1] INTO embedding;
    
    -- Return the most similar projects
    RETURN QUERY
    SELECT pe.project_id, 1 - (pe.embedding <=> embedding) as similarity
    FROM project_embeddings pe
    WHERE 1 - (pe.embedding <=> embedding) > similarity_threshold
    ORDER BY similarity DESC
    LIMIT max_results;
END;
$$;
