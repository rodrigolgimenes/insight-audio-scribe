
import { supabase } from "@/integrations/supabase/client";
import { audioCompressor } from "@/utils/audio/processing/AudioCompressor";

interface TranscriptionResult {
  success: boolean;
  error?: string;
  noteId?: string;
}

interface TranscribedChunk {
  index: number;
  text: string;
  success: boolean;
  error?: string;
}

type ProgressCallback = (progress: number, stage: string) => void;

class ChunkedTranscriptionService {
  async transcribeAudio(
    recordingId: string,
    audioBlob: Blob,
    durationInSeconds: number,
    onProgress?: ProgressCallback
  ): Promise<TranscriptionResult> {
    try {
      // Report initial progress
      onProgress?.(10, "Preparing audio...");
      
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Generate a unique file path
      const fileName = `${user.id}/${Date.now()}.mp3`;
      
      // Compress audio before uploading
      onProgress?.(15, "Compressing audio...");
      
      console.log(`Processing audio: Original size: ${(audioBlob.size / 1024 / 1024).toFixed(2)}MB, Duration: ${durationInSeconds}s`);
      
      // Ensure duration is a valid number
      const validDuration = isNaN(durationInSeconds) || durationInSeconds <= 0 ? 0 : durationInSeconds;
      const durationInMs = Math.round(validDuration * 1000);
      
      console.log(`Audio duration: ${validDuration}s (${durationInMs}ms)`);
      
      // Process audio (compress and chunk if needed)
      const processedAudio = await audioCompressor.processAudioForTranscription(
        audioBlob,
        durationInSeconds,
        (compressProgress) => {
          // Map compression progress to 15-25% of total progress
          const mappedProgress = 15 + (compressProgress * 0.1);
          onProgress?.(mappedProgress, `Compressing audio... ${Math.round(compressProgress)}%`);
        }
      );
      
      console.log(`Audio processed: ${processedAudio.chunks.length} chunks, Original size: ${(processedAudio.originalSize / 1024 / 1024).toFixed(2)}MB, Processed size: ${(processedAudio.processedSize / 1024 / 1024).toFixed(2)}MB`);
      
      // Check if we have multiple chunks
      const isMultiChunk = processedAudio.chunks.length > 1;
      
      // Upload the audio file
      onProgress?.(30, "Uploading audio...");
      
      const { error: uploadError } = await supabase.storage
        .from('audio_recordings')
        .upload(fileName, isMultiChunk ? processedAudio.chunks[0] : processedAudio.chunks[0], {
          contentType: 'audio/mp3',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Failed to upload audio: ${uploadError.message}`);
      }
      
      // Update the recording with the file path
      onProgress?.(35, "Updating recording...");
      
      const { error: updateError } = await supabase
        .from('recordings')
        .update({ 
          file_path: fileName,
          status: 'uploaded',
          duration: durationInMs // Now correctly using milliseconds
        })
        .eq('id', recordingId);
        
      if (updateError) {
        throw new Error(`Failed to update recording: ${updateError.message}`);
      }
      
      // Create a note for this recording
      onProgress?.(40, "Creating note...");
      
      const { error: noteError, data: noteData } = await supabase
        .from('notes')
        .insert({
          title: `Recording ${new Date().toLocaleString()}`,
          recording_id: recordingId,
          user_id: user.id,
          status: 'pending',
          processing_progress: 0,
          duration: durationInMs // Now correctly using milliseconds
        })
        .select()
        .single();
        
      if (noteError) {
        throw new Error(`Failed to create note: ${noteError.message}`);
      }
      
      // For small files that don't need chunking
      if (!isMultiChunk) {
        onProgress?.(50, "Starting transcription...");
        
        // Get presigned URL for the uploaded audio
        const { data: urlData } = await supabase.storage
          .from('audio_recordings')
          .createSignedUrl(fileName, 60 * 60); // 1 hour expiry
          
        if (!urlData?.signedUrl) {
          throw new Error('Could not get URL for audio');
        }
        
        // Process the single audio file
        const { error: processError } = await supabase.functions
          .invoke('transcribe-audio', {
            body: { 
              noteId: noteData.id,
              audioUrl: urlData.signedUrl,
              durationMs: durationInMs // Pass duration to the function
            },
          });
          
        if (processError) {
          console.error('Processing error:', processError);
          return {
            success: false,
            error: `Transcription failed to start: ${processError.message}`,
            noteId: noteData.id
          };
        }
      } else {
        // For larger files that need chunking
        onProgress?.(50, "Preparing chunked processing...");
        console.log(`Starting chunked processing: ${processedAudio.chunks.length} chunks`);
        
        // Process each chunk
        const totalChunks = processedAudio.chunks.length;
        const transcribedChunks: TranscribedChunk[] = [];
        
        // First, inform the server that we'll be processing in chunks
        const { data: processingResult, error: processingError } = await supabase.functions
          .invoke('transcribe-audio', {
            body: { 
              noteId: noteData.id,
              isChunkedTranscription: true,
              totalChunks,
              durationMs: durationInMs // Pass duration to the function
            },
          });
          
        if (processingError) {
          console.error('Error starting chunked processing:', processingError);
          return {
            success: false,
            error: `Failed to start chunked processing: ${processingError.message}`,
            noteId: noteData.id
          };
        }
        
        // Upload and process each chunk
        for (let i = 0; i < processedAudio.chunks.length; i++) {
          const chunk = processedAudio.chunks[i];
          const chunkFileName = `${user.id}/${Date.now()}_chunk_${i}.mp3`;
          
          // Update progress
          onProgress?.(
            50 + Math.floor((i / processedAudio.chunks.length) * 30), 
            `Processing part ${i+1} of ${processedAudio.chunks.length}...`
          );
          
          console.log(`Processing chunk ${i+1}/${totalChunks}: ${(chunk.size / 1024 / 1024).toFixed(2)}MB`);
          
          try {
            // Upload this chunk
            const { error: chunkUploadError } = await supabase.storage
              .from('audio_recordings')
              .upload(chunkFileName, chunk, {
                contentType: 'audio/mp3',
                upsert: false
              });
              
            if (chunkUploadError) {
              console.error(`Error uploading chunk ${i}:`, chunkUploadError);
              transcribedChunks.push({
                index: i,
                text: '',
                success: false,
                error: `Failed to upload chunk: ${chunkUploadError.message}`
              });
              continue;
            }
            
            // Get signed URL for this chunk
            const { data: chunkUrlData } = await supabase.storage
              .from('audio_recordings')
              .createSignedUrl(chunkFileName, 60 * 60); // 1 hour expiry
              
            if (!chunkUrlData?.signedUrl) {
              console.error(`Error generating URL for chunk ${i}`);
              transcribedChunks.push({
                index: i,
                text: '',
                success: false,
                error: 'Could not get URL for chunk'
              });
              continue;
            }
            
            // Send this chunk for transcription
            const { data: chunkResult, error: chunkError } = await supabase.functions
              .invoke('transcribe-audio', {
                body: { 
                  noteId: noteData.id,
                  audioUrl: chunkUrlData.signedUrl,
                  isChunkedTranscription: true,
                  chunkIndex: i,
                  totalChunks,
                  durationMs: durationInMs // Pass duration to the function
                },
              });
              
            if (chunkError) {
              console.error(`Error transcribing chunk ${i}:`, chunkError);
              transcribedChunks.push({
                index: i,
                text: '',
                success: false,
                error: `Transcription failed: ${chunkError.message}`
              });
            } else {
              console.log(`Chunk ${i} transcribed successfully`);
              transcribedChunks.push({
                index: i,
                text: chunkResult?.transcription || '',
                success: true
              });
            }
          } catch (chunkProcessError) {
            console.error(`Error processing chunk ${i}:`, chunkProcessError);
            transcribedChunks.push({
              index: i,
              text: '',
              success: false,
              error: `Processing error: ${chunkProcessError instanceof Error ? chunkProcessError.message : 'Unknown error'}`
            });
          }
        }
        
        console.log(`Chunk processing completed: ${transcribedChunks.filter(c => c.success).length}/${totalChunks} successful`);
        
        // At this point, all chunks have been sent for processing
        onProgress?.(80, "Waiting for transcription to complete...");
      }
      
      // Poll for note status until processing completes or fails
      let attempts = 0;
      const maxAttempts = 60; // 30 minutes max (60 x 30 seconds)
      
      while (attempts < maxAttempts) {
        onProgress?.(80 + (attempts * 0.33), "Checking transcription status...");
        
        const { data: noteStatus } = await supabase
          .from('notes')
          .select('status, processing_progress, original_transcript, error_message')
          .eq('id', noteData.id)
          .single();
          
        if (noteStatus) {
          console.log(`Note status: ${noteStatus.status}, Progress: ${noteStatus.processing_progress}%`);
          
          if (noteStatus.status === 'completed' && noteStatus.original_transcript) {
            onProgress?.(100, "Transcription completed!");
            return {
              success: true,
              noteId: noteData.id
            };
          } else if (noteStatus.status === 'error') {
            return {
              success: false,
              error: noteStatus.error_message || "Transcription service encountered an error",
              noteId: noteData.id
            };
          } else if (noteStatus.processing_progress > 0) {
            // Update progress based on the note's processing progress
            onProgress?.(
              80 + (noteStatus.processing_progress * 0.2), 
              `Transcribing... ${noteStatus.processing_progress}%`
            );
          }
        }
        
        // Wait 30 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 30000));
        attempts++;
      }
      
      // If we get here, the processing is taking too long
      return {
        success: true,
        error: "Transcription is in progress but is taking longer than expected",
        noteId: noteData.id
      };
    } catch (error) {
      console.error('Transcription error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error during transcription"
      };
    } finally {
      // Clean up FFmpeg instance
      audioCompressor.terminate();
    }
  }

  /**
   * Concatenates an array of transcribed chunks into a single coherent text.
   * Each chunk should have an index to indicate its order.
   */
  private concatenateTranscriptions(chunks: TranscribedChunk[]): string {
    // Filter successful chunks and sort by index
    const sortedChunks = chunks
      .filter(chunk => chunk.success)
      .sort((a, b) => a.index - b.index);
    
    if (sortedChunks.length === 0) {
      return "";
    }
    
    // Concatenate with improved logic for fluidity
    let result = sortedChunks[0].text || "";
    
    for (let i = 1; i < sortedChunks.length; i++) {
      const currentText = sortedChunks[i].text || "";
      if (!currentText) continue;
      
      // Check if current text ends with punctuation
      const endsWithPunctuation = /[.!?]$/.test(result);
      
      // Check if next chunk starts with capital letter
      const startsWithCapital = /^[A-Z]/.test(currentText);
      
      if (endsWithPunctuation && startsWithCapital) {
        // New sentence - add space
        result += " " + currentText;
      } else if (endsWithPunctuation) {
        // Add space after punctuation
        result += " " + currentText;
      } else if (startsWithCapital) {
        // Add period and space before new sentence
        result += ". " + currentText;
      } else {
        // Add simple space
        result += " " + currentText;
      }
    }
    
    // Final cleanup - remove double spaces
    return result.replace(/\s{2,}/g, ' ');
  }
}

export const chunkedTranscriptionService = new ChunkedTranscriptionService();
