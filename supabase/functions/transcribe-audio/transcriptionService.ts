
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
    
    await progressTracker.markError(
      `Arquivo de áudio muito grande para processamento. Tamanho máximo é ${MAX_FILE_SIZE_MB}MB. Use uma gravação mais curta ou comprima seu áudio.`
    );
      
    throw new Error(`O arquivo de áudio excede o limite de tamanho para transcrição (máx: ${MAX_FILE_SIZE_MB}MB)`);
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
      
      throw new Error(`O arquivo de áudio excede o limite de tamanho para transcrição (máx: ${MAX_FILE_SIZE_MB}MB)`);
    }
    
    return audioData;
  } catch (error) {
    console.error('[transcribe-audio] Erro ao baixar áudio da URL:', error);
    throw error;
  }
}

/**
 * Concatena fragmentos de transcrição em um único texto coerente
 */
async function concatenateTranscriptionChunks(
  supabase: any,
  noteId: string,
  totalChunks: number
): Promise<string> {
  console.log(`[transcribe-audio] Concatenando ${totalChunks} fragmentos de transcrição`);
  
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
    }
    
    // Ordenar fragmentos pelo índice
    const sortedChunks = chunksData.sort((a: TranscriptionChunk, b: TranscriptionChunk) => a.index - b.index);
    
    // Concatenar em um único texto, adicionando espaços entre fragmentos se necessário
    let fullText = '';
    for (const chunk of sortedChunks) {
      // Se não for o primeiro fragmento e o último caractere do texto atual não for um espaço,
      // e o primeiro caractere do próximo fragmento não for um espaço, adicione um espaço
      if (fullText.length > 0 && 
          !fullText.endsWith(' ') && 
          chunk.text && 
          !chunk.text.startsWith(' ')) {
        fullText += ' ';
      }
      fullText += chunk.text || '';
    }
    
    console.log('[transcribe-audio] Concatenação concluída, tamanho do texto:', fullText.length);
    
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
    } else {
      console.log(`[transcribe-audio] Bloco ${chunkIndex} transcrito com sucesso`);
      
      // Salvar o fragmento na tabela temporária
      await supabase
        .from('transcription_chunks')
        .insert({
          note_id: note.id,
          index: chunkIndex || 0,
          text: transcription.text,
          created_at: new Date().toISOString()
        });
      
      console.log(`[transcribe-audio] Fragmento ${chunkIndex} salvo no banco de dados`);
      
      // Se este for o último fragmento OU se estamos processando fragmentos fora de ordem, 
      // mas todos os fragmentos já foram processados
      if ((chunkIndex === totalChunks - 1) || 
          (await checkAllChunksComplete(supabase, note.id, totalChunks))) {
        console.log('[transcribe-audio] Todos os fragmentos concluídos, concatenando...');
        
        // Concatenar todos os fragmentos
        const fullTranscription = await concatenateTranscriptionChunks(
          supabase, 
          note.id, 
          totalChunks || 1
        );
        
        // Atualizar a nota com a transcrição completa
        await supabase
          .from('notes')
          .update({
            original_transcript: fullTranscription,
            status: 'completed',
            processing_progress: 90
          })
          .eq('id', note.id);
          
        console.log('[transcribe-audio] Nota atualizada com transcrição completa');
        
        // Iniciar geração de atas de reunião
        await startMeetingMinutesGeneration(supabase, note.id, fullTranscription);
        await progressTracker.markCompleted();
        
        console.log('[transcribe-audio] Processo concluído com sucesso');
        
        // Limpar tabela temporária de fragmentos
        await supabase
          .from('transcription_chunks')
          .delete()
          .eq('note_id', note.id);
          
        console.log('[transcribe-audio] Fragmentos temporários removidos');
      }
    }
    
    console.log('[transcribe-audio] Transcrição concluída com sucesso, tamanho do texto:', 
      transcription.text ? transcription.text.length : 0);
  } catch (error) {
    console.error('[transcribe-audio] Erro de transcrição ou timeout:', error);
    
    // Apenas atualiza o status da nota principal se não for um fragmento em uma transcrição em blocos
    if (!isChunkedTranscription) {
      await progressTracker.markError(
        error instanceof Error ? 
          `Erro de transcrição: ${error.message}` : 
          'Transcrição falhou'
      );
    } else {
      console.error(`[transcribe-audio] Erro ao transcrever fragmento ${chunkIndex}:`, error);
    }
    
    throw error;
  }
  
  // Para transcrição em blocos, simplesmente retorne o texto sem atualizar a nota
  if (isChunkedTranscription) {
    return transcription.text;
  }
  
  // Atualizar gravação e nota com transcrição
  try {
    if (recording) {
      await updateRecordingAndNote(supabase, recording.id, note.id, transcription.text);
      console.log('[transcribe-audio] Banco de dados atualizado com transcrição');
    } else {
      // Atualização direta para nota sem gravação
      await supabase
        .from('notes')
        .update({
          original_transcript: transcription.text,
          status: 'completed',
          processing_progress: 90
        })
        .eq('id', note.id);
      console.log('[transcribe-audio] Nota atualizada com transcrição (sem gravação)');
    }
    
    // Atualiza progresso para estágio de geração de atas
    await progressTracker.markGeneratingMinutes();
  } catch (error) {
    console.error('[transcribe-audio] Erro ao atualizar banco de dados com transcrição:', error);
    throw error;
  }

  // Iniciar geração de atas de reunião
  try {
    await startMeetingMinutesGeneration(supabase, note.id, transcription.text);
    
    // Garantir que o status seja atualizado para concluído com 100% de progresso
    await progressTracker.markCompleted();
    console.log('[transcribe-audio] Status da nota atualizado para concluído após geração de atas');
  } catch (error) {
    console.error('[transcribe-audio] Erro na geração de atas de reunião:', error);
    // Mesmo se a geração de atas falhar, marque a transcrição como concluída, pois temos a transcrição
    await progressTracker.markCompleted();
    console.log('[transcribe-audio] Status da nota atualizado para concluído apesar do erro na geração de atas');
  }
  
  return transcription.text;
}

/**
 * Verifica se todos os fragmentos de uma nota foram processados
 */
async function checkAllChunksComplete(
  supabase: any,
  noteId: string,
  totalChunks: number
): Promise<boolean> {
  const { count, error } = await supabase
    .from('transcription_chunks')
    .select('*', { count: 'exact', head: true })
    .eq('note_id', noteId);
    
  if (error) {
    console.error('[transcribe-audio] Erro ao verificar fragmentos:', error);
    return false;
  }
  
  console.log(`[transcribe-audio] Verificação de fragmentos: ${count}/${totalChunks}`);
  return count === totalChunks;
}
