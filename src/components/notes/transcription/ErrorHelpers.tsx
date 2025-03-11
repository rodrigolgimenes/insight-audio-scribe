
import React from "react";
import { AlertCircle, Info } from "lucide-react";

interface ErrorHelpersProps {
  error?: string;
}

export const ErrorHelpers: React.FC<ErrorHelpersProps> = ({ error }) => {
  if (!error) return null;
  
  // Determine specific error type for more targeted help
  const isAudioFormatError = error.toLowerCase().includes('format') || 
                           error.toLowerCase().includes('formato');
  const isFileNotFoundError = error.toLowerCase().includes('not found') || 
                            error.toLowerCase().includes('não encontrado');
  const isFileSizeError = error.toLowerCase().includes('too large') || 
                        error.toLowerCase().includes('size limit') ||
                        error.toLowerCase().includes('muito grande');
  const isTimeoutError = error.toLowerCase().includes('timeout') || 
                      error.toLowerCase().includes('timed out');
  const isDurationError = error.toLowerCase().includes('duration') ||
                        error.toLowerCase().includes('duração');

  if (!isAudioFormatError && !isFileNotFoundError && !isFileSizeError && !isTimeoutError && !isDurationError) {
    return <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>;
  }

  return (
    <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 text-red-600" />
        <div>
          <p className="font-medium">{error}</p>
          
          {isFileNotFoundError && (
            <div className="mt-3">
              <p className="font-medium flex items-center"><Info className="h-4 w-4 mr-1 text-blue-600" /> Dicas para resolver:</p>
              <ul className="list-disc ml-6 mt-1 space-y-1">
                <li>O arquivo pode ter sido excluído ou não foi carregado corretamente</li>
                <li>Tente fazer o upload de um novo arquivo</li>
                <li>Verifique se você tem uma conexão estável com a internet</li>
              </ul>
            </div>
          )}
          
          {isAudioFormatError && (
            <div className="mt-3">
              <p className="font-medium flex items-center"><Info className="h-4 w-4 mr-1 text-blue-600" /> Dicas para resolver:</p>
              <ul className="list-disc ml-6 mt-1 space-y-1">
                <li>Tente converter o arquivo para MP3 antes de fazer o upload</li>
                <li>Verifique se o arquivo de áudio não está corrompido</li>
                <li>Tente usar um navegador diferente (Chrome, Firefox ou Edge)</li>
              </ul>
            </div>
          )}
          
          {isFileSizeError && (
            <div className="mt-3">
              <p className="font-medium flex items-center"><Info className="h-4 w-4 mr-1 text-blue-600" /> Dicas para resolver:</p>
              <ul className="list-disc ml-6 mt-1 space-y-1">
                <li>Seu arquivo é muito grande (o limite é 25MB)</li>
                <li>Tente dividir a gravação em partes menores</li>
                <li>Comprima o arquivo para reduzir seu tamanho</li>
              </ul>
            </div>
          )}
          
          {isTimeoutError && (
            <div className="mt-3">
              <p className="font-medium flex items-center"><Info className="h-4 w-4 mr-1 text-blue-600" /> Dicas para resolver:</p>
              <ul className="list-disc ml-6 mt-1 space-y-1">
                <li>O processamento levou muito tempo e atingiu o limite</li>
                <li>Para gravações mais longas (acima de 30 minutos), o processo pode demorar mais</li>
                <li>Verifique se você tem uma conexão estável com a internet</li>
                <li>Tente novamente em um horário diferente quando os servidores estiverem menos ocupados</li>
              </ul>
            </div>
          )}
          
          {isDurationError && (
            <div className="mt-3">
              <p className="font-medium flex items-center"><Info className="h-4 w-4 mr-1 text-blue-600" /> Dicas para resolver:</p>
              <ul className="list-disc ml-6 mt-1 space-y-1">
                <li>A gravação excede a duração máxima suportada (60 minutos)</li>
                <li>Divida suas gravações em sessões mais curtas para melhores resultados</li>
                <li>Gravações mais curtas também tendem a gerar transcrições mais precisas</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
