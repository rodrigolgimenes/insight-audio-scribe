
-- Update the trigger function to call the edge function directly
CREATE OR REPLACE FUNCTION public.handle_project_embedding_update()
RETURNS TRIGGER AS $$
BEGIN
    -- We don't need to call the edge function directly here anymore
    -- The edge function will be called through the REST API from the frontend
    -- when a project is created or updated.
    -- This trigger will remain in place for future enhancements.
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
