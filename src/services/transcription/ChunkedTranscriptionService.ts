
import { supabase } from "@/integrations/supabase/client";

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
      onProgress?.(10, "Preparando áudio...");
      
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Generate a unique file path
      const fileName = `${user.id}/${Date.now()}.mp3`;
      
      // Upload the audio file
      onProgress?.(20, "Enviando áudio...");
      
      const { error: uploadError } = await supabase.storage
        .from('audio_recordings')
        .upload(fileName, audioBlob, {
          contentType: 'audio/mp3',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Falha ao enviar áudio: ${uploadError.message}`);
      }
      
      // Update the recording with the file path
      onProgress?.(30, "Atualizando gravação...");
      
      const { error: updateError } = await supabase
        .from('recordings')
        .update({ 
          file_path: fileName,
          status: 'uploaded'
        })
        .eq('id', recordingId);
        
      if (updateError) {
        throw new Error(`Falha ao atualizar gravação: ${updateError.message}`);
      }
      
      // Create a note for this recording
      onProgress?.(40, "Criando nota...");
      
      const { error: noteError, data: noteData } = await supabase
        .from('notes')
        .insert({
          title: `Gravação ${new Date().toLocaleString()}`,
          recording_id: recordingId,
          user_id: user.id,
          status: 'pending',
          processing_progress: 0,
          duration: Math.round(durationInSeconds * 1000)
        })
        .select()
        .single();
        
      if (noteError) {
        throw new Error(`Falha ao criar nota: ${noteError.message}`);
      }
      
      // Check if audio needs to be processed in chunks
      const isLargeFile = audioBlob.size > 20 * 1024 * 1024; // 20MB threshold
      
      if (!isLargeFile) {
        // For smaller files, process normally
        onProgress?.(50, "Iniciando transcrição...");
        
        const { error: processError } = await supabase.functions
          .invoke('process-recording', {
            body: { 
              recordingId,
              noteId: noteData.id
            },
          });
          
        if (processError) {
          console.error('Erro de processamento:', processError);
          return {
            success: false,
            error: `A transcrição falhou ao iniciar: ${processError.message}`,
            noteId: noteData.id
          };
        }
      } else {
        // For larger files, process in chunks
        onProgress?.(50, "Preparando processamento em blocos...");
        
        // Get presigned URL for the uploaded audio
        const { data: urlData } = await supabase.storage
          .from('audio_recordings')
          .createSignedUrl(fileName, 60 * 60); // 1 hour expiry
          
        if (!urlData?.signedUrl) {
          throw new Error('Não foi possível obter URL para o áudio');
        }
        
        // Estimate number of chunks based on file size (rough estimate)
        const totalChunks = Math.ceil(audioBlob.size / (20 * 1024 * 1024));
        const transcribedChunks: TranscribedChunk[] = [];
        
        onProgress?.(60, `Dividindo em ${totalChunks} partes...`);
        
        // Request server-side chunking and transcription via edge function
        const { data: processingResult, error: processingError } = await supabase.functions
          .invoke('transcribe-audio', {
            body: { 
              noteId: noteData.id,
              audioUrl: urlData.signedUrl,
              isChunkedTranscription: true,
              totalChunks
            },
          });
          
        if (processingError || !processingResult?.success) {
          console.error('Erro no processamento em blocos:', processingError || processingResult?.error);
          return {
            success: false,
            error: `Falha no processamento em blocos: ${processingError?.message || processingResult?.error || 'Erro desconhecido'}`,
            noteId: noteData.id
          };
        }
        
        // Poll for note status until processing completes or fails
        let attempts = 0;
        const maxAttempts = 30; // 15 minutes max (30 x 30 seconds)
        
        while (attempts < maxAttempts) {
          onProgress?.(70 + (attempts * 1.0), "Verificando status da transcrição...");
          
          const { data: noteStatus } = await supabase
            .from('notes')
            .select('status, processing_progress, original_transcript')
            .eq('id', noteData.id)
            .single();
            
          if (noteStatus) {
            if (noteStatus.status === 'completed' && noteStatus.original_transcript) {
              onProgress?.(100, "Transcrição concluída!");
              return {
                success: true,
                noteId: noteData.id
              };
            } else if (noteStatus.status === 'error') {
              return {
                success: false,
                error: "Serviço de transcrição encontrou um erro",
                noteId: noteData.id
              };
            }
          }
          
          // Wait 30 seconds before checking again
          await new Promise(resolve => setTimeout(resolve, 30000));
          attempts++;
        }
        
        // If we get here, the processing is taking too long
        return {
          success: true,
          error: "A transcrição está em andamento mas está demorando mais do que o esperado",
          noteId: noteData.id
        };
      }
      
      // Set up progress tracking for regular processing
      onProgress?.(60, "Transcrevendo áudio...");
      
      // Poll for updates
      let attempts = 0;
      const maxAttempts = 5;
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        
        const { data: noteStatus } = await supabase
          .from('notes')
          .select('status, processing_progress')
          .eq('id', noteData.id)
          .single();
          
        if (noteStatus) {
          if (noteStatus.status === 'completed') {
            onProgress?.(100, "Transcrição concluída!");
            return {
              success: true,
              noteId: noteData.id
            };
          } else if (noteStatus.status === 'error') {
            return {
              success: false,
              error: "Serviço de transcrição encontrou um erro",
              noteId: noteData.id
            };
          } else if (noteStatus.processing_progress > 0) {
            onProgress?.(60 + (noteStatus.processing_progress * 0.4), `Transcrevendo... ${noteStatus.processing_progress}%`);
          }
        }
        
        attempts++;
      }
      
      // If we get here, transcription is still in progress
      onProgress?.(80, "Transcrição em andamento...");
      
      return {
        success: true,
        noteId: noteData.id
      };
    } catch (error) {
      console.error('Erro de transcrição:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido durante a transcrição"
      };
    }
  }

  /**
   * Concatena uma matriz de fragmentos transcritos em um único texto coerente.
   * Cada fragmento deve ter um índice para indicar sua ordem.
   */
  private concatenateTranscriptions(chunks: TranscribedChunk[]): string {
    // Ordena os fragmentos pelo índice em ordem crescente
    const sortedChunks = chunks
      .filter(chunk => chunk.success)
      .sort((a, b) => a.index - b.index);
    
    // Concatena o texto de cada fragmento, inserindo um espaço conforme necessário
    return sortedChunks.map(chunk => chunk.text).join(" ");
  }
}

export const chunkedTranscriptionService = new ChunkedTranscriptionService();
