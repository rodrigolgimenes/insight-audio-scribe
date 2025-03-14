
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

/**
 * Classe responsável por processar arquivos de áudio e vídeo
 * Extrai áudio de vídeos e converte para MP3
 */
export class AudioProcessor {
  private ffmpeg: FFmpeg | null = null;
  private isInitialized = false;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;
  
  /**
   * Inicializa o FFmpeg para processamento de áudio
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.isInitializing) {
      return this.initPromise;
    }

    this.isInitializing = true;
    
    try {
      this.initPromise = this._initializeFFmpeg();
      await this.initPromise;
      this.isInitialized = true;
      this.isInitializing = false;
      console.log('[AudioProcessor] FFmpeg initialized successfully');
    } catch (error) {
      this.isInitializing = false;
      console.error('[AudioProcessor] FFmpeg initialization failed:', error);
      throw new Error('Failed to initialize audio processing capabilities');
    }
  }

  private async _initializeFFmpeg(): Promise<void> {
    try {
      this.ffmpeg = new FFmpeg();
      
      // Carregar FFmpeg
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd';
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
      });
      
      console.log('[AudioProcessor] FFmpeg loaded successfully');
    } catch (error) {
      console.error('[AudioProcessor] Error loading FFmpeg:', error);
      throw error;
    }
  }

  /**
   * Processa um arquivo, extraindo áudio se for vídeo e convertendo para MP3
   * @param file Arquivo para processar
   * @returns Arquivo de áudio MP3 processado
   */
  async processFile(file: File): Promise<File> {
    console.log(`[AudioProcessor] Processing file: ${file.name} (${file.type})`);
    
    // Se já for um arquivo de áudio MP3, não é necessário processamento
    if (file.type === 'audio/mpeg' || file.type === 'audio/mp3') {
      console.log('[AudioProcessor] File is already MP3, skipping processing');
      return file;
    }
    
    // Inicializar FFmpeg se ainda não estiver inicializado
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Verificar se FFmpeg está disponível
    if (!this.ffmpeg) {
      console.error('[AudioProcessor] FFmpeg not available');
      throw new Error('Audio processing capabilities not available');
    }
    
    try {
      // Ler o arquivo como array buffer
      const arrayBuffer = await file.arrayBuffer();
      const inputBuffer = new Uint8Array(arrayBuffer);
      
      // Definir nome do arquivo de entrada baseado no tipo
      const isVideo = file.type.startsWith('video/');
      const inputFileName = isVideo ? 'input.mp4' : 'input.webm';
      const outputFileName = 'output.mp3';
      
      // Escrever arquivo no sistema de arquivos virtual do FFmpeg
      await this.ffmpeg.writeFile(inputFileName, inputBuffer);
      
      console.log(`[AudioProcessor] Converting ${isVideo ? 'video' : 'audio'} to MP3...`);
      
      // Configurar comandos para extrair áudio e converter para MP3
      const ffmpegCmd = [
        '-i', inputFileName,
        '-vn', // Desabilitar vídeo
        '-acodec', 'libmp3lame',
        '-ac', '1', // Mono
        '-ar', '16000', // 16kHz
        '-b:a', '32k', // 32kbps
        outputFileName
      ];
      
      // Executar FFmpeg
      await this.ffmpeg.exec(ffmpegCmd);
      console.log('[AudioProcessor] Conversion completed');
      
      // Ler o arquivo de saída
      const outputData = await this.ffmpeg.readFile(outputFileName);
      
      // Limpar arquivos temporários
      await this.ffmpeg.deleteFile(inputFileName);
      await this.ffmpeg.deleteFile(outputFileName);
      
      // Criar novo arquivo com o conteúdo processado
      const processedFileName = file.name.replace(/\.[^/.]+$/, '') + '.mp3';
      const outputFile = new File(
        [outputData], 
        processedFileName, 
        { type: 'audio/mp3' }
      );
      
      console.log(`[AudioProcessor] File processed successfully: ${outputFile.name} (${outputFile.size} bytes)`);
      
      return outputFile;
    } catch (error) {
      console.error('[AudioProcessor] Error processing file:', error);
      throw new Error(`Failed to process audio: ${error.message}`);
    }
  }
  
  /**
   * Verifica se o arquivo precisa ser processado
   * @param file Arquivo a verificar
   * @returns True se o arquivo precisa ser processado
   */
  needsProcessing(file: File): boolean {
    // Processa se for vídeo ou áudio não-MP3
    return file.type.startsWith('video/') || 
           (file.type.startsWith('audio/') && file.type !== 'audio/mpeg' && file.type !== 'audio/mp3');
  }
}

// Singleton para uso em toda a aplicação
export const audioProcessor = new AudioProcessor();
