
import { transcribeAudio } from './openaiClient.ts';
import { downloadAudioFile } from './storageClient.ts';
import { updateRecordingAndNote } from './utils/dataOperations.ts';
import { startMeetingMinutesGeneration } from './utils/dataOperations.ts';
import { ProgressTracker } from './progressTracker.ts';
import { MAX_FILE_SIZE_MB, VALID_NOTE_STATUSES } from './constants.ts';

// Interface para armazenar fragmentos de transcrição
interface TranscriptionChunk {
  index: number;
  text: string;
}

/**
 * Baixa e valida o arquivo de áudio do armazenamento Supabase
 */
export async function downloadAndValidateAudio(
  supabase: any, 
  filePath: string, 
  progressTracker: ProgressTracker
): Promise<Blob> {
  console.log('[transcribe-audio] Iniciando download do arquivo de áudio:', filePath);
  let audioData;
  
  try {
    await progressTracker.markDownloading();
    
    audioData = await downloadAudioFile(supabase, filePath);
    
    // Verificação adicional de validade do arquivo
    if (!audioData || audioData.size === 0) {
      throw new Error('O arquivo de áudio baixado está vazio ou inválido');
    }
    
    console.log('[transcribe-audio] Arquivo baixado com sucesso:', 
      `Tamanho: ${Math.round(audioData.size/1024/1024*100)/100}MB`);
      
    await progressTracker.markDownloaded();
  } catch (error) {
    console.error('[transcribe-audio] Erro ao baixar arquivo de áudio:', error);
    await progressTracker.markError(`Erro ao baixar arquivo de áudio: ${error.message}`);
    throw error;
  }

  // Verifica se o arquivo é muito grande para transcrição direta
  if (audioData.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    console.warn('[transcribe-audio] Arquivo de áudio é muito grande:', 
      `${Math.round(audioData.size/1024/1024*100)/100}MB. Máximo é ${MAX_FILE_SIZE_MB}MB`);
    
    // Em vez de gerar erro, vamos processar como chunked transcription
    console.log('[transcribe-audio] Arquivo grande será processado em pedaços');
  }

  return audioData;
}

/**
 * Baixa o arquivo de áudio de uma URL direta
 */
export async function downloadAudioFromUrl(url: string): Promise<Blob> {
  console.log('[transcribe-audio] Baixando áudio da URL');
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Falha ao buscar áudio da URL: ${response.status} ${response.statusText}`);
    }
    
    const audioData = await response.blob();
    
    // Verifica validade do arquivo
    if (!audioData || audioData.size === 0) {
      throw new Error('O arquivo de áudio baixado está vazio ou inválido');
    }
    
    console.log('[transcribe-audio] Arquivo baixado da URL com sucesso:', 
      `Tamanho: ${Math.round(audioData.size/1024/1024*100)/100}MB`);
    
    // Verifica se o arquivo é muito grande para transcrição direta
    if (audioData.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      console.warn('[transcribe-audio] Arquivo de áudio da URL é muito grande:', 
        `${Math.round(audioData.size/1024/1024*100)/100}MB. Máximo é ${MAX_FILE_SIZE_MB}MB`);
    }
    
    return audioData;
  } catch (error) {
    console.error('[transcribe-audio] Erro ao baixar áudio da URL:', error);
    throw error;
  }
}

/**
 * Concatena fragmentos de transcrição em um único texto coerente
 * Melhorada para garantir melhor fluidez entre os fragmentos
 */
export async function concatenateTranscriptionChunks(
  supabase: any,
  noteId: string,
  totalChunks: number
): Promise<string> {
  console.log(`[transcribe-audio] Concatenando ${totalChunks} fragmentos de transcrição para a nota ${noteId}`);
  
  try {
    // Buscar chunks armazenados na tabela temporária
    const { data: chunksData, error: chunksError } = await supabase
      .from('transcription_chunks')
      .select('index, text')
      .eq('note_id', noteId)
      .order('index', { ascending: true });
      
    if (chunksError) {
      throw new Error(`Erro ao buscar fragmentos de transcrição: ${chunksError.message}`);
    }
    
    if (!chunksData || chunksData.length === 0) {
      throw new Error('Nenhum fragmento de transcrição encontrado para concatenar');
    }
    
    console.log(`[transcribe-audio] Encontrados ${chunksData.length} de ${totalChunks} fragmentos esperados`);
    
    // Verificar se todos os fragmentos estão presentes
    if (chunksData.length < totalChunks) {
      console.warn(`[transcribe-audio] Faltando fragmentos: ${chunksData.length}/${totalChunks}`);
      
      // Log detalhado de quais índices estão presentes
      const presentIndices = chunksData.map(chunk => chunk.index).sort((a, b) => a - b);
      const missingIndices = [];
      
      for (let i = 0; i < totalChunks; i++) {
        if (!presentIndices.includes(i)) {
          missingIndices.push(i);
        }
      }
      
      if (missingIndices.length > 0) {
        console.warn(`[transcribe-audio] Índices ausentes: ${missingIndices.join(', ')}`);
      }
    }
    
    // Ordenar fragmentos pelo índice
    const sortedChunks = chunksData.sort((a: TranscriptionChunk, b: TranscriptionChunk) => a.index - b.index);
    
    // Análise preliminar dos fragmentos
    const chunkSizes = sortedChunks.map(chunk => chunk.text ? chunk.text.length : 0);
    console.log('[transcribe-audio] Tamanho dos fragmentos (caracteres):', chunkSizes);
    
    // Concatenar em um único texto com processamento inteligente
    let fullText = '';
    for (let i = 0; i < sortedChunks.length; i++) {
      const chunk = sortedChunks[i];
      const chunkText = chunk.text?.trim() || '';
      
      if (chunkText.length === 0) {
        console.warn(`[transcribe-audio] Fragmento ${chunk.index} vazio, ignorando`);
        continue;
      }
      
      if (fullText.length === 0) {
        // Primeiro fragmento
        fullText = chunkText;
      } else {
        // Determinar como anexar este fragmento ao texto existente
        
        // Verificar se o texto atual termina com pontuação final
        const endsWithFinalPunctuation = /[.!?]$/.test(fullText);
        
        // Verificar se o próximo fragmento começa com letra maiúscula
        const startsWithCapital = /^[A-Z]/.test(chunkText);
        
        if (endsWithFinalPunctuation && startsWithCapital) {
          // Se o texto atual termina com pontuação e o novo começa com maiúscula,
          // é provavelmente uma nova frase - adicionar espaço
          fullText += ' ' + chunkText;
        } else if (endsWithFinalPunctuation) {
          // Se só o texto atual termina com pontuação, adicionar espaço
          fullText += ' ' + chunkText;
        } else if (startsWithCapital) {
          // Se só o novo fragmento começa com maiúscula, adicionar ponto e espaço
          fullText += '. ' + chunkText;
        } else {
          // Nenhum indicador claro - usar heurística simples
          const lastChar = fullText.charAt(fullText.length - 1);
          if (lastChar === ' ') {
            fullText += chunkText;
          } else {
            fullText += ' ' + chunkText;
          }
        }
      }
      
      console.log(`[transcribe-audio] Fragmento ${chunk.index} concatenado com sucesso`);
    }
    
    console.log('[transcribe-audio] Concatenação concluída, tamanho do texto final:', fullText.length);
    
    // Otimização final do texto
    // Remover espaços duplos
    fullText = fullText.replace(/\s{2,}/g, ' ');
    // Garantir que frases tenham espaço após pontuação
    fullText = fullText.replace(/([.!?])([A-Z])/g, '$1 $2');
    
    console.log('[transcribe-audio] Otimização de texto concluída');
    
    return fullText;
  } catch (error) {
    console.error('[transcribe-audio] Erro ao concatenar fragmentos:', error);
    throw error;
  }
}

/**
 * Processa transcrição com tratamento de erros e acompanhamento de progresso
 */
export async function processTranscription(
  supabase: any, 
  note: any, 
  recording: any | undefined, 
  audioData: Blob, 
  progressTracker: ProgressTracker,
  isExtremelyLargeFile?: boolean,
  isChunkedTranscription?: boolean,
  chunkIndex?: number,
  totalChunks?: number
): Promise<string> {
  // Atualiza status para processamento com progresso consistente
  if (!isChunkedTranscription) {
    await progressTracker.markProcessing();
  }
  
  // Define um timeout para transcrição - estendido para gravações mais longas
  const timeoutDuration = isExtremelyLargeFile ? 240 * 60 * 1000 : 120 * 60 * 1000; // 4 horas para arquivos muito grandes, 2 horas caso contrário
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Transcrição expirou após ${timeoutDuration / 60 / 1000} minutos`)), timeoutDuration);
  });
  
  let transcription;
  try {
    console.log('[transcribe-audio] Iniciando transcrição...');
    const transcriptionPromise = transcribeAudio(audioData);
    
    // Atualiza progresso durante transcrição
    if (!isChunkedTranscription) {
      await progressTracker.markTranscribing();
    } else {
      console.log(`[transcribe-audio] Transcrevendo bloco ${chunkIndex} de ${totalChunks}`);
    }
    
    transcription = await Promise.race([transcriptionPromise, timeoutPromise]);
    
    // Atualiza progresso após transcrição bem-sucedida - usando um status definitivamente válido
    if (!isChunkedTranscription) {
      await progressTracker.markTranscribed();
      
      // Adicionar um log para garantir que este ponto do código está sendo executado
      console.log('[transcribe-audio] Transcription completed, updating database records...');
      
      // Atualizar a gravação e a nota com o texto transcrito
      if (recording && note) {
        await updateRecordingAndNote(supabase, recording.id || note.recording_id, note.id, transcription.text || '');
        
        // Iniciar a geração de atas se tudo estiver OK
        try {
          console.log('[transcribe-audio] Starting meeting minutes generation...');
          await startMeetingMinutesGeneration(supabase, note.id, transcription.text || '');
          
          // Adicionar uma verificação explícita para garantir que o status foi atualizado para concluído
          // após um tempo razoável para o processamento das atas
          setTimeout(async () => {
            const { data: currentNote } = await supabase
              .from('notes')
              .select('status, processing_progress')
              .eq('id', note.id)
              .single();
              
            if (currentNote && 
                (currentNote.status === 'processing' || 
                 currentNote.status === 'transcribing' || 
                 currentNote.status === 'generating_minutes')) {
              console.log('[transcribe-audio] Forcing note status to completed as it may be stalled');
              
              // Forçar atualização para completed
              await supabase
                .from('notes')
                .update({ 
                  status: 'completed',
                  processing_progress: 100,
                  updated_at: new Date().toISOString()
                })
                .eq('id', note.id);
                
              // Também garantir que a gravação está marcada como completa
              await supabase
                .from('recordings')
                .update({ 
                  status: 'completed',
                  updated_at: new Date().toISOString()
                })
                .eq('id', recording.id || note.recording_id);
            }
          }, 15000); // Verificar após 15 segundos
        } catch (minutesError) {
          console.error('[transcribe-audio] Error starting meeting minutes generation:', minutesError);
          
          // Se houver erro na geração de atas, ainda devemos marcar a transcrição como concluída
          await progressTracker.markCompleted();
        }
      } else {
        console.error('[transcribe-audio] Missing recording or note information, cannot update records properly');
        // Ainda assim, marcar a transcrição como concluída no note tracker
        await progressTracker.markCompleted();
      }
    } else {
      console.log(`[transcribe-audio] Bloco ${chunkIndex} transcrito com sucesso`);
      console.log(`[transcribe-audio] Tamanho do texto do bloco ${chunkIndex}: ${transcription.text ? transcription.text.length : 0} caracteres`);
      
      // Análise rápida do conteúdo para debug
      if (transcription.text) {
        const preview = transcription.text.substring(0, 50) + (transcription.text.length > 50 ? "..." : "");
        console.log(`[transcribe-audio] Amostra do bloco ${chunkIndex}: "${preview}"`);
      }
      
      // Salvar o fragmento na tabela temporária
      const { error: insertError } = await supabase
        .from('transcription_chunks')
        .insert({
          note_id: note.id,
          index: chunkIndex,
          text: transcription.text || '',
          created_at: new Date().toISOString()
        });
        
      if (insertError) {
        console.error(`[transcribe-audio] Erro ao salvar fragmento de transcrição ${chunkIndex}:`, insertError);
      } else {
        console.log(`[transcribe-audio] Fragmento ${chunkIndex} salvo no banco de dados`);
      }
      
      // Verificar se este é o último fragmento
      if (chunkIndex !== undefined && totalChunks !== undefined && chunkIndex === totalChunks - 1) {
        console.log('[transcribe-audio] Todos os fragmentos foram transcritos, concatenando...');
        
        // Atualizar o progresso da nota
        await supabase
          .from('notes')
          .update({ 
            processing_progress: 90,
            status: VALID_NOTE_STATUSES.includes('transcribing') ? 'transcribing' : 'processing' 
          })
          .eq('id', note.id);
          
        // Concatenar todos os fragmentos
        const completeTranscription = await concatenateTranscriptionChunks(supabase, note.id, totalChunks);
        
        // Atualizar a nota com a transcrição completa
        const { error: updateError } = await supabase
          .from('notes')
          .update({
            original_transcript: completeTranscription,
            processing_progress: 95, 
            status: VALID_NOTE_STATUSES.includes('generating_minutes') ? 'generating_minutes' : 'processing'
          })
          .eq('id', note.id);
          
        if (updateError) {
          console.error('[transcribe-audio] Erro ao atualizar nota com transcrição completa:', updateError);
        } else {
          console.log('[transcribe-audio] Nota atualizada com transcrição completa');
        }
        
        // Atualizar o gravador com a transcrição
        const { error: recordingError } = await supabase
          .from('recordings')
          .update({
            transcription: completeTranscription,
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', recording?.id || note.recording_id);
          
        if (recordingError) {
          console.error('[transcribe-audio] Erro ao atualizar gravação com transcrição completa:', recordingError);
        } else {
          console.log('[transcribe-audio] Gravação atualizada com transcrição completa');
        }
        
        // Iniciar geração de atas de reunião, se aplicável
        try {
          await startMeetingMinutesGeneration(supabase, note.id, completeTranscription);
          
          // Adicionar verificação explícita após um tempo para garantir que o status foi atualizado
          setTimeout(async () => {
            const { data: currentNote } = await supabase
              .from('notes')
              .select('status, processing_progress')
              .eq('id', note.id)
              .single();
              
            if (currentNote && 
                (currentNote.status === 'processing' || 
                 currentNote.status === 'transcribing' || 
                 currentNote.status === 'generating_minutes')) {
              console.log('[transcribe-audio] Forcing chunked note status to completed as it may be stalled');
              
              await supabase
                .from('notes')
                .update({ 
                  status: 'completed',
                  processing_progress: 100,
                  updated_at: new Date().toISOString()
                })
                .eq('id', note.id);
            }
          }, 15000); // Verificar após 15 segundos
        } catch (minutesError) {
          console.error('[transcribe-audio] Erro ao iniciar geração de atas:', minutesError);
          
          // Mesmo com erro, marcar como concluído
          await supabase
            .from('notes')
            .update({ 
              status: 'completed',
              processing_progress: 100,
              updated_at: new Date().toISOString()
            })
            .eq('id', note.id);
        }
        
        // Retornar a transcrição completa
        return completeTranscription;
      }
    }
    
    return transcription.text || '';
  } catch (error) {
    console.error('[transcribe-audio] Erro durante a transcrição:', error);
    
    // Atualiza status para erro
    await progressTracker.markError(`Erro na transcrição: ${error instanceof Error ? error.message : String(error)}`);
    
    // Se for transcription em pedaços, registrar erro no banco
    if (isChunkedTranscription && chunkIndex !== undefined) {
      const { error: logError } = await supabase
        .from('transcription_errors')
        .insert({
          note_id: note.id,
          chunk_index: chunkIndex,
          error_message: error instanceof Error ? error.message : String(error),
          created_at: new Date().toISOString()
        });
        
      if (logError) {
        console.error('[transcribe-audio] Erro ao registrar falha de transcrição do fragmento:', logError);
      }
    }
    
    throw error;
  }
}
