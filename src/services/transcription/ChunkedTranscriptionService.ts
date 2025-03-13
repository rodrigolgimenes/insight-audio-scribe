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
      
      // Upload the audio file - first chunk for now
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
          duration: durationInMs, // Now correctly using milliseconds
          updated_at: new Date().toISOString() // Force timestamp update to trigger any watchers
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
          processing_progress: 10, // Start with some progress to show activity
          duration: durationInMs // Now correctly using milliseconds
        })
        .select()
        .single();
        
      if (noteError) {
        throw new Error(`Failed to create note: ${noteError.message}`);
      }
      
      // Immediately start transcription with higher priority
      onProgress?.(45, "Starting transcription...");
      
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
        
        // Implement retry logic for process invocation
        let processSuccess = false;
        let processAttempts = 0;
        const maxProcessAttempts = 3;
        let processError = null;
        
        while (processAttempts < maxProcessAttempts && !processSuccess) {
          try {
            // Process the single audio file
            const { error } = await supabase.functions
              .invoke('transcribe-audio', {
                body: { 
                  noteId: noteData.id,
                  audioUrl: urlData.signedUrl,
                  durationMs: durationInMs, // Pass duration to the function
                  priority: 'high' // Indicate high priority
                },
              });
              
            if (!error) {
              processSuccess = true;
              console.log('Successfully started transcription on attempt', processAttempts + 1);
              break;
            } else {
              processError = error;
              console.error(`Transcription start attempt ${processAttempts + 1} failed:`, error);
            }
          } catch (attemptError) {
            processError = attemptError;
            console.error(`Transcription start exception on attempt ${processAttempts + 1}:`, attemptError);
          }
          
          processAttempts++;
          if (processAttempts < maxProcessAttempts) {
            // Wait with exponential backoff before retry
            const waitTime = Math.min(1000 * Math.pow(2, processAttempts), 5000);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
          
        if (!processSuccess) {
          console.error('Processing error after all attempts:', processError);
          return {
            success: false,
            error: `Transcription failed to start: ${processError?.message || 'Maximum retry attempts exceeded'}`,
            noteId: noteData.id
          };
        }
      } else {
        // For larger files that need chunking
        onProgress?.(50, "Preparing chunked processing...");
        console.log(`Starting chunked processing: ${processedAudio.chunks.length} chunks`);
        
        // Process each chunk
        const totalChunks = processedAudio.chunks.length;
        
        // First, inform the server that we'll be processing in chunks
        let chunkedSuccess = false;
        let chunkedAttempts = 0;
        const maxChunkedAttempts = 3;
        let chunkedError = null;
        
        while (chunkedAttempts < maxChunkedAttempts && !chunkedSuccess) {
          try {
            const { error: processingError } = await supabase.functions
              .invoke('transcribe-audio', {
                body: { 
                  noteId: noteData.id,
                  isChunkedTranscription: true,
                  totalChunks,
                  durationMs: durationInMs, // Pass duration to the function
                  priority: 'high' // Indicate high priority
                },
              });
              
            if (!processingError) {
              chunkedSuccess = true;
              console.log('Successfully started chunked processing on attempt', chunkedAttempts + 1);
              break;
            } else {
              chunkedError = processingError;
              console.error(`Chunked processing start attempt ${chunkedAttempts + 1} failed:`, processingError);
            }
          } catch (attemptError) {
            chunkedError = attemptError;
            console.error(`Chunked processing exception on attempt ${chunkedAttempts + 1}:`, attemptError);
          }
          
          chunkedAttempts++;
          if (chunkedAttempts < maxChunkedAttempts) {
            // Wait with exponential backoff before retry
            const waitTime = Math.min(1000 * Math.pow(2, chunkedAttempts), 5000);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
          
        if (!chunkedSuccess) {
          console.error('Chunked processing error after all attempts:', chunkedError);
          return {
            success: false,
            error: `Failed to start chunked processing: ${chunkedError?.message || 'Maximum retry attempts exceeded'}`,
            noteId: noteData.id
          };
        }
        
        // Upload and process each chunk in parallel instead of sequentially
        const chunkUploadPromises = processedAudio.chunks.map(async (chunk, i) => {
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
              return {
                index: i,
                success: false,
                error: `Failed to upload chunk: ${chunkUploadError.message}`
              };
            }
            
            // Get signed URL for this chunk
            const { data: chunkUrlData } = await supabase.storage
              .from('audio_recordings')
              .createSignedUrl(chunkFileName, 60 * 60); // 1 hour expiry
              
            if (!chunkUrlData?.signedUrl) {
              console.error(`Error generating URL for chunk ${i}`);
              return {
                index: i,
                success: false,
                error: 'Could not get URL for chunk'
              };
            }
            
            // Implement retry logic for chunk transcription
            let chunkSuccess = false;
            let chunkAttempts = 0;
            const maxChunkAttempts = 3;
            let chunkError = null;
            
            while (chunkAttempts < maxChunkAttempts && !chunkSuccess) {
              try {
                // Send this chunk for transcription
                const { error: chunkError } = await supabase.functions
                  .invoke('transcribe-audio', {
                    body: { 
                      noteId: noteData.id,
                      audioUrl: chunkUrlData.signedUrl,
                      isChunkedTranscription: true,
                      chunkIndex: i,
                      totalChunks,
                      durationMs: durationInMs, // Pass duration to the function
                      priority: 'high' // Indicate high priority
                    },
                  });
                  
                if (!chunkError) {
                  chunkSuccess = true;
                  console.log(`Chunk ${i} transcription started successfully on attempt ${chunkAttempts + 1}`);
                  break;
                } else {
                  console.error(`Chunk ${i} transcription error on attempt ${chunkAttempts + 1}:`, chunkError);
                  chunkError = chunkError;
                }
              } catch (error) {
                console.error(`Chunk ${i} transcription exception on attempt ${chunkAttempts + 1}:`, error);
                chunkError = error;
              }
              
              chunkAttempts++;
              if (chunkAttempts < maxChunkAttempts) {
                // Wait with exponential backoff before retry
                const waitTime = Math.min(1000 * Math.pow(2, chunkAttempts), 5000);
                await new Promise(resolve => setTimeout(resolve, waitTime));
              }
            }
            
            if (!chunkSuccess) {
              return {
                index: i,
                success: false,
                error: `Transcription failed: ${chunkError?.message || 'Maximum retry attempts exceeded'}`
              };
            }
            
            return {
              index: i,
              success: true,
              text: '' // We don't have text yet as it's being processed
            };
          } catch (error) {
            console.error(`Error processing chunk ${i}:`, error);
            return {
              index: i,
              success: false,
              error: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
          }
        });
        
        // Start the chunk uploads in parallel
        await Promise.allSettled(chunkUploadPromises);
        
        console.log('All chunks have been submitted for processing');
      }
      
      // Ensure we update the DB record to reflect processing has started
      await supabase
        .from('notes')
        .update({ 
          status: 'processing',
          processing_progress: 20
        })
        .eq('id', noteData.id);
      
      onProgress?.(80, "Transcription started successfully!");
      
      // Return immediately with success and note ID
      // The transcription will continue in the background
      return {
        success: true,
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
