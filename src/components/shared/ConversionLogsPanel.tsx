
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Download,
  FileText
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { logStorage, LogEntry, clearLogs } from '@/lib/logger';
import { Progress } from '@/components/ui/progress';

interface ConversionLogsPanelProps {
  originalFile?: File | null;
  convertedFile?: File | null;
  conversionStatus: 'idle' | 'converting' | 'success' | 'error';
  conversionProgress: number;
  onDownload?: () => void;
  onTranscribe?: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const ConversionLogsPanel: React.FC<ConversionLogsPanelProps> = ({
  originalFile,
  convertedFile,
  conversionStatus,
  conversionProgress,
  onDownload,
  onTranscribe
}) => {
  const [expanded, setExpanded] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    // Update logs when logStorage changes
    const intervalId = setInterval(() => {
      setLogs([...logStorage]);
    }, 500);

    return () => clearInterval(intervalId);
  }, []);

  const compressionRate = originalFile && convertedFile
    ? Math.round((1 - (convertedFile.size / originalFile.size)) * 100)
    : 0;

  // Grupo os logs por categoria para a exibição separada
  const workerLogs = logs.filter(log => log.details === 'Worker' || log.message.includes('Worker'));
  const lameJSLogs = logs.filter(log => log.details === 'LameJS' || log.message.includes('LameJS'));
  const dataLogs = logs.filter(log => log.details === 'Data Processing');
  const formatLogs = logs.filter(log => log.details === 'Format');

  // Determinar ordem dos passos de processamento
  const steps = [
    { id: 'init', label: 'Inicialização do ambiente', 
      completed: logs.some(log => log.message.includes('Starting MP3 conversion')) },
    { id: 'lameJS', label: 'Carregamento da biblioteca LameJS', 
      completed: logs.some(log => log.message.includes('lamejs is available')) },
    { id: 'worker', label: 'Web Worker inicializado', 
      completed: logs.some(log => log.message.includes('Worker created')) },
    { id: 'decode', label: 'Decodificação do áudio do vídeo', 
      completed: logs.some(log => log.message.includes('Audio decoded successfully')) },
    { id: 'encode', label: 'Codificação MP3 finalizada', 
      completed: conversionStatus === 'success' },
  ];

  return (
    <div className="w-full border rounded-lg overflow-hidden mb-6">
      <div 
        className="bg-gray-100 p-4 cursor-pointer flex justify-between items-center"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 font-medium">
          {conversionStatus === 'converting' && <Clock className="h-5 w-5 text-blue-500 animate-pulse" />}
          {conversionStatus === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
          {conversionStatus === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
          <span>
            {conversionStatus === 'idle' && 'Logs do Processo de Conversão'}
            {conversionStatus === 'converting' && 'Processando Conversão...'}
            {conversionStatus === 'success' && 'Conversão MP3 Bem-sucedida'}
            {conversionStatus === 'error' && 'Erro na Conversão MP3'}
          </span>
        </div>
        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>

      {expanded && (
        <>
          {conversionStatus === 'success' && originalFile && convertedFile && (
            <div className="bg-green-50 p-6 border-b">
              <h3 className="text-green-600 font-medium mb-2">O áudio foi extraído com sucesso e comprimido no formato MP3.</h3>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium mb-1">Arquivo original:</p>
                  <p className="text-lg">{originalFile.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Tamanho original:</p>
                  <p className="text-lg">{formatFileSize(originalFile.size)}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-1">Formato de saída:</p>
                  <p className="text-lg text-green-600">MP3 (comprimido)</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Tamanho final:</p>
                  <p className="text-lg">{formatFileSize(convertedFile.size)}</p>
                </div>
                
                <div className="md:col-span-2">
                  <p className="text-sm font-medium mb-1">Taxa de compressão:</p>
                  <p className="text-lg text-green-600">{compressionRate}%</p>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium mb-2">Fluxo de processamento:</h4>
                <ol className="space-y-2">
                  {steps.map((step, i) => (
                    <li key={step.id} className="flex items-start gap-2">
                      <div className="mt-0.5">
                        {step.completed ? 
                          <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center text-white">
                            <CheckCircle2 className="h-3 w-3" />
                          </div> :
                          <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>
                        }
                      </div>
                      <span className={step.completed ? "text-green-700" : "text-gray-500"}>
                        {i+1}. {step.label}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex flex-wrap gap-3 mt-4">
                {onDownload && (
                  <Button 
                    variant="secondary" 
                    onClick={onDownload}
                    className="bg-gray-800 text-white hover:bg-gray-700"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download MP3
                  </Button>
                )}
                {onTranscribe && (
                  <Button onClick={onTranscribe}>
                    <FileText className="mr-2 h-4 w-4" />
                    Transcrever Áudio
                  </Button>
                )}
              </div>
            </div>
          )}

          {conversionStatus === 'converting' && (
            <div className="p-4 border-b">
              <div className="mb-2">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Progresso da conversão</span>
                  <span className="text-sm font-medium">{conversionProgress}%</span>
                </div>
                <Progress value={conversionProgress} className="h-2" />
              </div>
              
              <div className="text-sm text-muted-foreground">
                {conversionProgress < 20 && "Inicializando processo de conversão..."}
                {conversionProgress >= 20 && conversionProgress < 40 && "Decodificando áudio..."}
                {conversionProgress >= 40 && conversionProgress < 80 && "Codificando para MP3..."}
                {conversionProgress >= 80 && "Finalizando conversão..."}
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-4 pt-2">
              <TabsList className="grid grid-cols-3 mb-2">
                <TabsTrigger value="summary">Resumo</TabsTrigger>
                <TabsTrigger value="category">Por Categoria</TabsTrigger>
                <TabsTrigger value="all">Todos os Logs</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="summary" className="p-0">
              <Card className="border-0 shadow-none">
                <CardContent className="p-4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="lamejs">
                      <AccordionTrigger className="py-2 text-amber-600">
                        <div className="flex items-center gap-2">
                          <span className="bg-amber-100 p-1 rounded">
                            <FileText className="h-4 w-4" />
                          </span>
                          Status LameJS:
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ScrollArea className="h-28">
                          {lameJSLogs.length > 0 ? (
                            <div className="space-y-1 text-sm font-mono bg-gray-50 p-2 rounded">
                              {lameJSLogs.map(log => (
                                <div key={log.id} className="text-green-700">
                                  {log.timestamp} - {log.message}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-gray-500 italic">Nenhum log disponível</div>
                          )}
                        </ScrollArea>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="worker">
                      <AccordionTrigger className="py-2 text-blue-600">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-100 p-1 rounded">
                            <FileText className="h-4 w-4" />
                          </span>
                          Status do Worker:
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ScrollArea className="h-28">
                          {workerLogs.length > 0 ? (
                            <div className="space-y-1 text-sm font-mono bg-gray-50 p-2 rounded">
                              {workerLogs.map(log => (
                                <div key={log.id}>
                                  {log.timestamp} - {log.message}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-gray-500 italic">Nenhum log disponível</div>
                          )}
                        </ScrollArea>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="data">
                      <AccordionTrigger className="py-2 text-purple-600">
                        <div className="flex items-center gap-2">
                          <span className="bg-purple-100 p-1 rounded">
                            <FileText className="h-4 w-4" />
                          </span>
                          Processamento de Dados de Áudio:
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ScrollArea className="h-28">
                          {dataLogs.length > 0 ? (
                            <div className="space-y-1 text-sm font-mono bg-gray-50 p-2 rounded">
                              {dataLogs.map(log => (
                                <div key={log.id}>
                                  {log.timestamp} - {log.message}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-gray-500 italic">Nenhum log disponível</div>
                          )}
                        </ScrollArea>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="format">
                      <AccordionTrigger className="py-2 text-green-600">
                        <div className="flex items-center gap-2">
                          <span className="bg-green-100 p-1 rounded">
                            <FileText className="h-4 w-4" />
                          </span>
                          Validação de Formato:
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ScrollArea className="h-28">
                          {formatLogs.length > 0 ? (
                            <div className="space-y-1 text-sm font-mono bg-gray-50 p-2 rounded">
                              {formatLogs.map(log => (
                                <div key={log.id}>
                                  {log.timestamp} - {log.message}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-gray-500 italic">Nenhum log disponível</div>
                          )}
                        </ScrollArea>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="category" className="p-0">
              <Card className="border-0 shadow-none">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Resumo da Conversão</h3>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="mb-2">A conversão para MP3 foi {conversionStatus === 'success' ? 'realizada com sucesso.' : 'iniciada.'}</p>
                        
                        {conversionStatus === 'success' && convertedFile && (
                          <div className="flex gap-3 items-center mb-2">
                            <span className="bg-blue-800 text-white text-xs px-2 py-1 rounded">MP3</span>
                            <span>{formatFileSize(convertedFile.size)}</span>
                            <span>Compressão: {compressionRate}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">Verificação de Ambiente</h3>
                      <div className="bg-gray-50 p-3 rounded">
                        <ul className="space-y-2">
                          <li className="flex items-center gap-2">
                            {logs.some(log => log.message.includes('Successfully imported lamejs')) ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                            <span>Biblioteca LameJS: {logs.some(log => log.message.includes('Successfully imported lamejs')) ? 'Carregada' : 'Falha no carregamento'}</span>
                          </li>
                          <li className="flex items-center gap-2">
                            {logs.some(log => log.message.includes('Worker created')) ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                            <span>Web Worker: {logs.some(log => log.message.includes('Worker created')) ? 'Inicializado' : 'Não inicializado'}</span>
                          </li>
                          <li className="flex items-center gap-2">
                            {logs.some(log => log.message.includes('Audio decoded')) ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            )}
                            <span>Decodificação de áudio: {logs.some(log => log.message.includes('Audio decoded')) ? 'Realizada' : 'Pendente'}</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {conversionStatus === 'error' && (
                      <div>
                        <h3 className="text-sm font-medium mb-2 text-red-600">Instruções para Solução de Problemas</h3>
                        <div className="bg-red-50 p-3 rounded border border-red-200">
                          <ol className="list-decimal pl-5 space-y-1 text-sm">
                            <li>Verifique se o worker é um Worker clássico (<code>new Worker(url)</code>), não um Worker de módulo ES.</li>
                            <li>Verifique se não há declarações <code>return</code> ou <code>export</code> no nível superior do código do Worker.</li>
                            <li>Confirme se o caminho <code>importScripts('/libs/lamejs/lame.all.js')</code> está correto.</li>
                            <li>Verifique se o Worker realmente chama <code>lamejs.Mp3Encoder</code> para codificação.</li>
                            <li>Use uma taxa de bits mais baixa para um arquivo MP3 menor (64 kbps para máxima compressão).</li>
                            <li>Verifique erros no console do navegador, especialmente relacionados ao carregamento do LameJS.</li>
                          </ol>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="all" className="p-0">
              <Card className="border-0 shadow-none">
                <CardContent className="p-4">
                  <ScrollArea className="h-60">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-left">
                          <th className="p-2 border-b">#</th>
                          <th className="p-2 border-b">Hora</th>
                          <th className="p-2 border-b">Categoria</th>
                          <th className="p-2 border-b">Mensagem de Log</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log, index) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="p-2 border-b">{index + 1}</td>
                            <td className="p-2 border-b font-mono text-sm">{log.timestamp}</td>
                            <td className="p-2 border-b">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                log.category === 'ERROR' ? 'bg-red-100 text-red-800' :
                                log.category === 'WARN' ? 'bg-amber-100 text-amber-800' :
                                log.category === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {log.category}
                              </span>
                            </td>
                            <td className="p-2 border-b text-sm font-mono">{log.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end p-2 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => clearLogs()}
              className="text-xs"
            >
              Limpar Logs
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
