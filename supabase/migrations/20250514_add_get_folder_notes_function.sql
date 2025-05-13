
-- Create a function to get notes in a folder
CREATE OR REPLACE FUNCTION public.get_folder_notes(p_folder_id uuid)
RETURNS SETOF uuid
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT note_id
    FROM notes_folders
    WHERE folder_id = p_folder_id;
END;
$function$;

-- Comment on function
COMMENT ON FUNCTION public.get_folder_notes IS 'Returns note IDs that belong to a specified folder';
