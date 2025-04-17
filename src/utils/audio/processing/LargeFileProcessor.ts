
import { supabase } from '@/integrations/supabase/client';

interface ChunkInfo {
  index: number;
  totalChunks: number;
  startTime: number;
  endTime: number;
}

export class LargeFileProcessor {
  private static readonly MAX_FILE_SIZE = 24 * 1024 * 1024; // 24MB in bytes
  private static readonly OPTIMAL_CHUNK_DURATION = 15 * 60 * 1000; // 15 minutes in ms

  /**
   * Processes a large audio file by initiating the server-side chunking and transcription
   * @param recordingId The recording ID
   * @param noteId The note ID
   * @param fileSize The file size in bytes
   * @param durationMs The duration in milliseconds
   * @returns Promise with success status
   */
  static async processLargeFile(
    recordingId: string,
    noteId: string,
    fileSize: number,
    durationMs: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Processing large file: ${fileSize / (1024 * 1024)} MB, duration: ${durationMs / 1000}s`);
      
      // Determine if this is an extremely large file (helps with server-side chunking strategy)
      const isExtremelyLargeFile = fileSize > 100 * 1024 * 1024 || durationMs > 60 * 60 * 1000;
      
      // Update note to indicate processing has started
      await supabase
        .from('notes')
        .update({ 
          processing_progress: 5,
          status: 'processing',
          error_message: null
        })
        .eq('id', noteId);
      
      // Call the Edge Function to handle large file processing
      const { data, error } = await supabase.functions.invoke('process-large-recording', {
        body: {
          recordingId,
          noteId,
          isExtremelyLargeFile
        }
      });
      
      if (error) {
        console.error('Error invoking process-large-recording function:', error);
        throw error;
      }
      
      console.log('Large file processing initiated:', data);
      return { success: true };
    } catch (error) {
      console.error('Failed to process large file:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error processing large file'
      };
    }
  }

  /**
   * Determines if a file needs to be processed as a large file
   * @param fileSize File size in bytes
   * @param durationMs Duration in milliseconds (if available)
   * @returns Boolean indicating if large file processing is needed
   */
  static isLargeFile(fileSize: number, durationMs?: number): boolean {
    // If the file is larger than our max size, it's definitely a large file
    if (fileSize > this.MAX_FILE_SIZE) return true;
    
    // If we have duration info and it's over 20 minutes, process as large file for better reliability
    if (durationMs && durationMs > 20 * 60 * 1000) return true;
    
    return false;
  }

  /**
   * Estimates the number of chunks needed for a large file
   * @param fileSize File size in bytes
   * @param durationMs Duration in milliseconds
   * @returns Estimated number of chunks
   */
  static estimateChunkCount(fileSize: number, durationMs?: number): number {
    if (!durationMs || durationMs <= 0) {
      // Estimate based on file size if no duration available
      return Math.ceil(fileSize / this.MAX_FILE_SIZE);
    }
    
    // Calculate based on optimal chunk duration
    return Math.ceil(durationMs / this.OPTIMAL_CHUNK_DURATION);
  }
}
