
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
      onProgress?.(10, "Preparando áudio...");
      
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Generate a unique file path
      const fileName = `${user.id}/${Date.now()}.mp3`;
      
      // Compress audio before uploading
      onProgress?.(15, "Compactando áudio...");
      
      console.log(`Processando áudio: Tamanho original: ${(audioBlob.size / 1024 / 1024).toFixed(2)}MB, Duração: ${durationInSeconds}s`);
      
      // Process audio (compress and chunk if needed)
      const processedAudio = await audioCompressor.processAudioForTranscription(
        audioBlob,
        durationInSeconds,
        (compressProgress) => {
          // Map compression progress to 15-25% of total progress
          const mappedProgress = 15 + (compressProgress * 0.1);
          onProgress?.(mappedProgress, `Compactando áudio... ${Math.round(compressProgress)}%`);
        }
      );
      
      console.log(`Áudio processado: ${processedAudio.chunks.length} chunks, Tamanho original: ${(processedAudio.originalSize / 1024 / 1024).toFixed(2)}MB, Tamanho após processamento: ${(processedAudio.processedSize / 1024 / 1024).toFixed(2)}MB`);
      
      // Check if we have multiple chunks
      const isMultiChunk = processedAudio.chunks.length > 1;
      
      // Upload the audio file
      onProgress?.(30, "Enviando áudio...");
      
      const { error: uploadError } = await supabase.storage
        .from('audio_recordings')
        .upload(fileName, isMultiChunk ? processedAudio.chunks[0] : processedAudio.chunks[0], {
          contentType: 'audio/mp3',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Falha ao enviar áudio: ${uploadError.message}`);
      }
      
      // Update the recording with the file path
      onProgress?.(35, "Atualizando gravação...");
      
      const { error: updateError } = await supabase
        .from('recordings')
        .update({ 
          file_path: fileName,
          status: 'uploaded',
          duration: Math.round(durationInSeconds * 1000)
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
      
      // For small files that don't need chunking
      if (!isMultiChunk) {
        onProgress?.(50, "Iniciando transcrição...");
        
        // Get presigned URL for the uploaded audio
        const { data: urlData } = await supabase.storage
          .from('audio_recordings')
          .createSignedUrl(fileName, 60 * 60); // 1 hour expiry
          
        if (!urlData?.signedUrl) {
          throw new Error('Não foi possível obter URL para o áudio');
        }
        
        // Process the single audio file
        const { error: processError } = await supabase.functions
          .invoke('transcribe-audio', {
            body: { 
              noteId: noteData.id,
              audioUrl: urlData.signedUrl
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
        // For larger files that need chunking
        onProgress?.(50, "Preparando processamento em blocos...");
        console.log(`Iniciando processamento em blocos: ${processedAudio.chunks.length} chunks`);
        
        // Process each chunk
        const totalChunks = processedAudio.chunks.length;
        const transcribedChunks: TranscribedChunk[] = [];
        
        // First, inform the server that we'll be processing in chunks
        const { data: processingResult, error: processingError } = await supabase.functions
          .invoke('transcribe-audio', {
            body: { 
              noteId: noteData.id,
              isChunkedTranscription: true,
              totalChunks
            },
          });
          
        if (processingError) {
          console.error('Erro ao iniciar processamento em blocos:', processingError);
          return {
            success: false,
            error: `Falha ao iniciar processamento em blocos: ${processingError.message}`,
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
            `Processando parte ${i+1} de ${processedAudio.chunks.length}...`
          );
          
          console.log(`Processando chunk ${i+1}/${totalChunks}: ${(chunk.size / 1024 / 1024).toFixed(2)}MB`);
          
          try {
            // Upload this chunk
            const { error: chunkUploadError } = await supabase.storage
              .from('audio_recordings')
              .upload(chunkFileName, chunk, {
                contentType: 'audio/mp3',
                upsert: false
              });
              
            if (chunkUploadError) {
              console.error(`Erro ao fazer upload do chunk ${i}:`, chunkUploadError);
              transcribedChunks.push({
                index: i,
                text: '',
                success: false,
                error: `Falha ao enviar chunk: ${chunkUploadError.message}`
              });
              continue;
            }
            
            // Get signed URL for this chunk
            const { data: chunkUrlData } = await supabase.storage
              .from('audio_recordings')
              .createSignedUrl(chunkFileName, 60 * 60); // 1 hour expiry
              
            if (!chunkUrlData?.signedUrl) {
              console.error(`Erro ao gerar URL para o chunk ${i}`);
              transcribedChunks.push({
                index: i,
                text: '',
                success: false,
                error: 'Não foi possível obter URL para o chunk'
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
                  totalChunks
                },
              });
              
            if (chunkError) {
              console.error(`Erro ao transcrever chunk ${i}:`, chunkError);
              transcribedChunks.push({
                index: i,
                text: '',
                success: false,
                error: `Falha na transcrição: ${chunkError.message}`
              });
            } else {
              console.log(`Chunk ${i} transcrito com sucesso`);
              transcribedChunks.push({
                index: i,
                text: chunkResult?.transcription || '',
                success: true
              });
            }
          } catch (chunkProcessError) {
            console.error(`Erro no processamento do chunk ${i}:`, chunkProcessError);
            transcribedChunks.push({
              index: i,
              text: '',
              success: false,
              error: `Erro no processamento: ${chunkProcessError instanceof Error ? chunkProcessError.message : 'Erro desconhecido'}`
            });
          }
        }
        
        console.log(`Processamento de chunks concluído: ${transcribedChunks.filter(c => c.success).length}/${totalChunks} com sucesso`);
        
        // At this point, all chunks have been sent for processing
        onProgress?.(80, "Aguardando conclusão da transcrição...");
      }
      
      // Poll for note status until processing completes or fails
      let attempts = 0;
      const maxAttempts = 60; // 30 minutes max (60 x 30 seconds)
      
      while (attempts < maxAttempts) {
        onProgress?.(80 + (attempts * 0.33), "Verificando status da transcrição...");
        
        const { data: noteStatus } = await supabase
          .from('notes')
          .select('status, processing_progress, original_transcript, error_message')
          .eq('id', noteData.id)
          .single();
          
        if (noteStatus) {
          console.log(`Status da nota: ${noteStatus.status}, Progresso: ${noteStatus.processing_progress}%`);
          
          if (noteStatus.status === 'completed' && noteStatus.original_transcript) {
            onProgress?.(100, "Transcrição concluída!");
            return {
              success: true,
              noteId: noteData.id
            };
          } else if (noteStatus.status === 'error') {
            return {
              success: false,
              error: noteStatus.error_message || "Serviço de transcrição encontrou um erro",
              noteId: noteData.id
            };
          } else if (noteStatus.processing_progress > 0) {
            // Update progress based on the note's processing progress
            onProgress?.(
              80 + (noteStatus.processing_progress * 0.2), 
              `Transcrevendo... ${noteStatus.processing_progress}%`
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
        error: "A transcrição está em andamento mas está demorando mais do que o esperado",
        noteId: noteData.id
      };
    } catch (error) {
      console.error('Erro de transcrição:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido durante a transcrição"
      };
    } finally {
      // Clean up FFmpeg instance
      audioCompressor.terminate();
    }
  }

  /**
   * Concatena uma matriz de fragmentos transcritos em um único texto coerente.
   * Cada fragmento deve ter um índice para indicar sua ordem.
   */
  private concatenateTranscriptions(chunks: TranscribedChunk[]): string {
    // Filtrar chunks bem-sucedidos e ordenar pelo índice
    const sortedChunks = chunks
      .filter(chunk => chunk.success)
      .sort((a, b) => a.index - b.index);
    
    if (sortedChunks.length === 0) {
      return "";
    }
    
    // Concatenar com lógica melhorada para garantir fluidez
    let result = sortedChunks[0].text || "";
    
    for (let i = 1; i < sortedChunks.length; i++) {
      const currentText = sortedChunks[i].text || "";
      if (!currentText) continue;
      
      // Verificar se o texto atual termina com pontuação
      const endsWithPunctuation = /[.!?]$/.test(result);
      
      // Verificar se o próximo chunk começa com maiúscula
      const startsWithCapital = /^[A-Z]/.test(currentText);
      
      if (endsWithPunctuation && startsWithCapital) {
        // Nova frase - adicionar espaço
        result += " " + currentText;
      } else if (endsWithPunctuation) {
        // Adicionar espaço após pontuação
        result += " " + currentText;
      } else if (startsWithCapital) {
        // Adicionar ponto e espaço antes de nova frase
        result += ". " + currentText;
      } else {
        // Adicionar espaço simples
        result += " " + currentText;
      }
    }
    
    // Limpeza final - remover espaços duplos
    return result.replace(/\s{2,}/g, ' ');
  }
}

export const chunkedTranscriptionService = new ChunkedTranscriptionService();
