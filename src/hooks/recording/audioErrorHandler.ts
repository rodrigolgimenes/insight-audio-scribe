
export const handleAudioError = (error: unknown, isSystemAudio: boolean): string => {
  let errorMessage = 'Erro desconhecido';
  
  if (error instanceof Error) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMessage = 'Permissão para uso do microfone negada';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      errorMessage = 'Nenhum microfone encontrado';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      errorMessage = 'O microfone pode estar sendo usado por outro aplicativo';
    } else if (error.name === 'NotSupportedError') {
      errorMessage = 'Configuração de áudio não suportada. Tente desconectar e reconectar seu dispositivo USB';
    } else if (error.message.includes('No audio tracks available') || error.message.includes('Nenhuma trilha')) {
      errorMessage = 'Selecione uma fonte com áudio ao compartilhar a tela';
    } else {
      errorMessage = error.message;
    }
  }

  return isSystemAudio 
    ? `Não foi possível capturar o áudio do sistema: ${errorMessage}`
    : `Não foi possível acessar o microfone: ${errorMessage}`;
};
