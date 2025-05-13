
-- Create a function to compute cosine similarity between two jsonb vectors
CREATE OR REPLACE FUNCTION public.cosine_similarity(vector1 jsonb, vector2 jsonb)
RETURNS float8
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
