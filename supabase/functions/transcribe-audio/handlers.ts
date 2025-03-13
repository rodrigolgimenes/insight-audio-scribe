
import { 
  createSupabaseClient, 
  getRecordingData, 
  getNoteData 
} from './supabaseClient.ts';
import { downloadAndValidateAudio, processTranscription, downloadAudioFromUrl } from './transcriptionService.ts';
import { ProgressTracker } from './progressTracker.ts';
import { MAX_AUDIO_DURATION_MS, corsHeaders } from './constants.ts';

export { corsHeaders } from './constants.ts';

export async function handleTranscription(requestBody: {
  recordingId?: string;
  noteId?: string;
  duration?: number;
  isLargeFile?: boolean;
  isRetry?: boolean;
  isExtremelyLargeFile?: boolean;
  audioUrl?: string;
  isChunkedTranscription?: boolean;
  chunkIndex?: number;
  totalChunks?: number;
}) {
  const { 
    recordingId, 
    noteId, 
    duration, 
    isLargeFile, 
    isRetry, 
    isExtremelyLargeFile,
    audioUrl,
    isChunkedTranscription,
    chunkIndex,
    totalChunks
  } = requestBody;
  
  console.log('[transcribe-audio] Iniciando processo de transcrição com parâmetros:', { 
    recordingId, 
    noteId, 
    duration: duration ? `${Math.round(duration/1000/60)} minutos` : 'desconhecido',
    isLargeFile, 
    isExtremelyLargeFile,
    isRetry,
    audioUrl: audioUrl ? 'fornecido' : 'não fornecido',
    isChunkedTranscription,
    chunkIndex,
    totalChunks
  });
  
  if ((!recordingId && !noteId) && !audioUrl) {
    throw new Error('ID da Gravação, ID da Nota ou URL do Áudio é obrigatório');
  }

  // Verifica restrições de tamanho do arquivo - agora apenas registrando um aviso
  if (duration && duration > MAX_AUDIO_DURATION_MS) {
    console.warn('[transcribe-audio] Arquivo de áudio excede a duração máxima recomendada:', 
      `${Math.round(duration/1000/60)} minutos. Máximo: ${MAX_AUDIO_DURATION_MS/1000/60} minutos`);
  }

  const supabase = createSupabaseClient();

  // Obter dados da gravação e da nota
  let recording;
  let note;
  let progressTracker;
  let audioData;
  
  try {
    if (audioUrl && noteId && isChunkedTranscription) {
      // Tratamento especial para transcrição em blocos - baixar áudio diretamente da URL
      console.log(`[transcribe-audio] Processando bloco ${chunkIndex || 0} de ${totalChunks || 1}`);
      
      note = await getNoteData(supabase, noteId, true);
      
      // Para transcrições em blocos, não atualize o progresso da nota principal para evitar conflitos
      progressTracker = new ProgressTracker(
        supabase, 
        noteId, 
        isChunkedTranscription, 
        chunkIndex, 
        totalChunks
      );
      
      // Baixar áudio diretamente da URL
      console.log('[transcribe-audio] Baixando bloco de áudio da URL');
      audioData = await downloadAudioFromUrl(audioUrl);
      
      console.log('[transcribe-audio] Bloco de áudio baixado com sucesso:', 
        `Tamanho: ${Math.round(audioData.size/1024/1024*100)/100}MB`);
    } else if (noteId && isRetry) {
      // Para operações de repetição, obtenha primeiro a nota e depois a gravação
      note = await getNoteData(supabase, noteId, true);
      recording = await getRecordingData(supabase, note.recording_id);
      
      // Inicializar rastreador de progresso
      progressTracker = new ProgressTracker(supabase, note.id);
      
      // Atualização inicial de progresso - iniciado
      await progressTracker.markStarted();
      
      // Baixar e validar o arquivo de áudio
      audioData = await downloadAndValidateAudio(
        supabase, 
        recording.file_path, 
        progressTracker
      );
    } else if (recordingId) {
      // Fluxo normal - obter gravação primeiro
      recording = await getRecordingData(supabase, recordingId);
      note = noteId ? 
        await getNoteData(supabase, noteId, true) : 
        await getNoteData(supabase, recordingId);
      
      // Inicializar rastreador de progresso
      progressTracker = new ProgressTracker(supabase, note.id);
      
      // Atualização inicial de progresso - iniciado
      await progressTracker.markStarted();
      
      // Baixar e validar o arquivo de áudio
      audioData = await downloadAndValidateAudio(
        supabase, 
        recording.file_path, 
        progressTracker
      );
    } else if (audioUrl && noteId) {
      // Transcrição direta de URL (não dividida em blocos)
      note = await getNoteData(supabase, noteId, true);
      
      // Inicializar rastreador de progresso
      progressTracker = new ProgressTracker(supabase, note.id);
      
      // Atualização inicial de progresso - iniciado
      await progressTracker.markStarted();
      
      // Baixar áudio diretamente da URL
      console.log('[transcribe-audio] Baixando áudio da URL');
      audioData = await downloadAudioFromUrl(audioUrl);
      progressTracker.markDownloaded();
    } else {
      throw new Error('Parâmetros inválidos para transcrição');
    }
    
    console.log('[transcribe-audio] Dados e áudio recuperados:', {
      noteId: note.id,
      audioSize: audioData ? `${Math.round(audioData.size/1024/1024*100)/100}MB` : 'null'
    });
  } catch (error) {
    console.error('[transcribe-audio] Erro ao recuperar dados ou áudio:', error);
    throw error;
  }

  // Processar a transcrição
  return await processTranscription(
    supabase, 
    note, 
    recording, // Pode ser indefinido para transcrição direta de URL
    audioData, 
    progressTracker,
    isExtremelyLargeFile,
    isChunkedTranscription,
    chunkIndex,
    totalChunks
  );
}
