
import { supabase } from "@/integrations/supabase/client";
import { audioCompressor } from "@/utils/audio/processing/AudioCompressor";

type TranscriptionProgressCallback = (progress: number, stage: string) => void;

interface TranscriptionResult {
  text: string;
  success: boolean;
  noteId?: string;
  error?: string;
}

export class ChunkedTranscriptionService {
  /**
   * Process and transcribe audio in chunks if needed
   */
  public async transcribeAudio(
    recordingId: string,
    audioBlob: Blob,
    durationSeconds: number,
    onProgress?: TranscriptionProgressCallback
  ): Promise<TranscriptionResult> {
    try {
      // Step 1: Update recording status to processing
      await this.updateRecordingStatus(recordingId, 'processing');
      onProgress?.(5, 'Starting audio processing');
      
      // Step 2: Process audio (compress + chunk if needed)
      const processedAudio = await audioCompressor.processAudioForTranscription(
        audioBlob,
        durationSeconds,
        (progress) => onProgress?.(5 + progress * 0.2, 'Processing audio')
      );
      
      console.log(`[ChunkedTranscriptionService] Audio processed: 
        Original: ${(processedAudio.originalSize / 1024 / 1024).toFixed(2)}MB, 
        Processed: ${(processedAudio.processedSize / 1024 / 1024).toFixed(2)}MB, 
        Chunks: ${processedAudio.chunks.length}`);
      
      // Step 3: Get or create note for this recording
      const note = await this.getOrCreateNote(recordingId);
      if (!note) throw new Error('Failed to create or retrieve note');
      
      // Update note with processing status
      await this.updateNoteStatus(note.id, 'processing', 30);
      onProgress?.(30, 'Uploading processed audio');
      
      // Step 4: Upload processed audio chunks and get URLs
      const uploadResults = await this.uploadAudioChunks(
        recordingId, 
        processedAudio.chunks,
        (progress) => onProgress?.(30 + progress * 0.2, 'Uploading audio chunks')
      );
      
      // Step 5: Transcribe each chunk
      const transcriptionResults = await this.transcribeChunks(
        note.id,
        uploadResults,
        processedAudio.chunks.length,
        (progress) => onProgress?.(50 + progress * 0.45, 'Transcribing audio')
      );
      
      // Step 6: Combine transcriptions
      if (transcriptionResults.every(r => r.success)) {
        // All chunks successfully transcribed
        const combinedTranscription = transcriptionResults
          .map(r => r.text)
          .join(' ');
        
        // Update note and recording with full transcription
        await this.saveTranscriptionResult(recordingId, note.id, combinedTranscription);
        onProgress?.(100, 'Transcription complete');
        
        return {
          text: combinedTranscription,
          success: true,
          noteId: note.id
        };
      } else {
        // Some chunks failed
        const failedChunks = transcriptionResults.filter(r => !r.success).length;
        const errorMessage = `Failed to transcribe ${failedChunks} of ${transcriptionResults.length} audio chunks`;
        
        await this.updateNoteStatus(note.id, 'error', 0, errorMessage);
        
        return {
          text: '',
          success: false,
          error: errorMessage,
          noteId: note.id
        };
      }
    } catch (error) {
      console.error('[ChunkedTranscriptionService] Transcription error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Update recording/note status on error
      if (recordingId) {
        await this.updateRecordingStatus(recordingId, 'error', errorMessage);
      }
      
      return {
        text: '',
        success: false,
        error: errorMessage
      };
    } finally {
      // Clean up FFmpeg resources
      audioCompressor.terminate();
    }
  }
  
  /**
   * Update recording status in database
   */
  private async updateRecordingStatus(
    recordingId: string, 
    status: string, 
    errorMessage?: string
  ): Promise<void> {
    const updateData: any = { status };
    if (errorMessage) updateData.error_message = errorMessage;
    
    await supabase
      .from('recordings')
      .update(updateData)
      .eq('id', recordingId);
  }
  
  /**
   * Update note status in database
   */
  private async updateNoteStatus(
    noteId: string, 
    status: string, 
    progress: number = 0,
    errorMessage?: string
  ): Promise<void> {
    const updateData: any = { 
      status, 
      processing_progress: progress 
    };
    if (errorMessage) updateData.error_message = errorMessage;
    
    await supabase
      .from('notes')
      .update(updateData)
      .eq('id', noteId);
  }
  
  /**
   * Get existing note or create new one
   */
  private async getOrCreateNote(recordingId: string) {
    // First check if note already exists
    const { data: existingNotes } = await supabase
      .from('notes')
      .select('*')
      .eq('recording_id', recordingId)
      .limit(1);
    
    if (existingNotes && existingNotes.length > 0) {
      return existingNotes[0];
    }
    
    // Create new note
    const { data: recording } = await supabase
      .from('recordings')
      .select('user_id, title, duration')
      .eq('id', recordingId)
      .single();
    
    if (!recording) throw new Error('Recording not found');
    
    const { data: note, error } = await supabase
      .from('notes')
      .insert({
        recording_id: recordingId,
        user_id: recording.user_id,
        title: recording.title || 'New Recording',
        status: 'pending',
        processing_progress: 0,
        duration: recording.duration
      })
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create note: ${error.message}`);
    return note;
  }
  
  /**
   * Upload audio chunks to storage
   */
  private async uploadAudioChunks(
    recordingId: string,
    chunks: Blob[],
    onProgress?: (progress: number) => void
  ) {
    const results = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkFileName = `${recordingId}/chunk_${i.toString().padStart(3, '0')}.mp3`;
      
      const { data, error } = await supabase.storage
        .from('audio_recordings')
        .upload(chunkFileName, chunks[i], {
          contentType: 'audio/mp3',
          upsert: true
        });
      
      if (error) throw new Error(`Failed to upload audio chunk ${i}: ${error.message}`);
      
      const { data: { publicUrl } } = supabase.storage
        .from('audio_recordings')
        .getPublicUrl(chunkFileName);
      
      results.push({
        path: chunkFileName,
        url: publicUrl,
        size: chunks[i].size,
        index: i
      });
      
      onProgress?.((i + 1) / chunks.length * 100);
    }
    
    return results;
  }
  
  /**
   * Transcribe each audio chunk and combine results
   */
  private async transcribeChunks(
    noteId: string,
    chunks: { path: string; url: string; size: number; index: number }[],
    totalChunks: number,
    onProgress?: (progress: number) => void
  ) {
    const results = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        // Update note status with chunk progress
        await this.updateNoteStatus(
          noteId,
          'transcribing',
          Math.round(50 + ((i / totalChunks) * 50))
        );
        
        // Call transcribe-audio function on each chunk
        const { data, error } = await supabase.functions
          .invoke('transcribe-audio', {
            body: { 
              noteId,
              audioUrl: chunk.url,
              isChunkedTranscription: true,
              chunkIndex: chunk.index,
              totalChunks
            }
          });
        
        if (error) throw new Error(`Chunk ${i} transcription error: ${error.message}`);
        
        results.push({
          index: chunk.index,
          text: data.transcription || '',
          success: true
        });
      } catch (err) {
        console.error(`[ChunkedTranscriptionService] Error transcribing chunk ${i}:`, err);
        results.push({
          index: chunk.index,
          text: '',
          success: false,
          error: err instanceof Error ? err.message : String(err)
        });
      }
      
      onProgress?.((i + 1) / chunks.length * 100);
    }
    
    // Sort results by index to ensure correct order
    return results.sort((a, b) => a.index - b.index);
  }
  
  /**
   * Save final transcription result to database
   */
  private async saveTranscriptionResult(
    recordingId: string,
    noteId: string,
    transcription: string
  ) {
    // Update recording with transcription
    await supabase
      .from('recordings')
      .update({
        transcription: transcription,
        status: 'completed'
      })
      .eq('id', recordingId);
    
    // Update note with transcription
    await supabase
      .from('notes')
      .update({
        original_transcript: transcription,
        status: 'completed',
        processing_progress: 100
      })
      .eq('id', noteId);
  }
}

export const chunkedTranscriptionService = new ChunkedTranscriptionService();
