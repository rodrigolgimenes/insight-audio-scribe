
-- Create a function to calculate cosine similarity between two vectors
CREATE OR REPLACE FUNCTION public.cosine_similarity(vector1 jsonb, vector2 jsonb)
RETURNS double precision
LANGUAGE plpgsql
AS $$
DECLARE
    dot_product float := 0;
    magnitude1 float := 0;
    magnitude2 float := 0;
    v1_elements jsonb;
    v2_elements jsonb;
    i int;
    v1_value float;
    v2_value float;
    array_length int;
BEGIN
    v1_elements := vector1;
    v2_elements := vector2;
    
    -- Get the array length from the first vector
    array_length := jsonb_array_length(v1_elements);
    
    -- Calculate dot product and magnitudes
    FOR i IN 0..(array_length - 1) LOOP
        v1_value := (v1_elements->i)::float;
        v2_value := (v2_elements->i)::float;
        
        dot_product := dot_product + (v1_value * v2_value);
        magnitude1 := magnitude1 + (v1_value * v1_value);
        magnitude2 := magnitude2 + (v2_value * v2_value);
    END LOOP;
    
    magnitude1 := sqrt(magnitude1);
    magnitude2 := sqrt(magnitude2);
    
    -- Handle division by zero
    IF magnitude1 = 0 OR magnitude2 = 0 THEN
        RETURN 0;
    END IF;
    
    -- Return cosine similarity
    RETURN dot_product / (magnitude1 * magnitude2);
END;
$$;

-- Create find_similar_projects function
CREATE OR REPLACE FUNCTION public.find_similar_projects(
    project_embedding jsonb,
    similarity_threshold double precision DEFAULT 0.7,
    max_results integer DEFAULT 5
)
RETURNS TABLE (
    project_id uuid,
    similarity double precision
) 
LANGUAGE plpgsql
AS $$
BEGIN
    -- Return the most similar projects using our cosine similarity function
    RETURN QUERY
    SELECT pe.project_id, public.cosine_similarity(pe.embedding, project_embedding) as similarity
    FROM project_embeddings pe
    WHERE public.cosine_similarity(pe.embedding, project_embedding) > similarity_threshold
    ORDER BY similarity DESC
    LIMIT max_results;
END;
$$;
