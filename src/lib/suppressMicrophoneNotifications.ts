
// Função para interceptar e suprimir notificações de microfone
export function setupMicrophoneNotificationSuppression() {
  // Interceptar console.error para suprimir mensagens de erro relacionadas a microfones
  const originalConsoleError = console.error;
  console.error = function(...args: any[]) {
    // Verifique se a mensagem está relacionada a microfones
    const message = args.join(' ').toLowerCase();
    if (
      message.includes('microphone') || 
      message.includes('microfone') || 
      message.includes('mic ') || 
      message.includes('audio device') || 
      message.includes('permission')
    ) {
      // Registre de forma silenciosa, sem mostrar no console
      console.log('[Suppressed Error]', ...args);
      return;
    }
    
    // Caso contrário, continue normalmente
    originalConsoleError.apply(console, args);
  };
  
  // Se o navegador suportar a API de notificações, podemos suprimir essas também
  if (typeof window !== 'undefined' && window.Notification) {
    const originalNotification = window.Notification;
    
    // @ts-ignore - Sobreescrevendo objeto global
    window.Notification = function(title: string, options?: NotificationOptions) {
      // Verifique se a notificação está relacionada a microfones
      if (
        title.toLowerCase().includes('microphone') || 
        title.toLowerCase().includes('microfone') || 
        title.toLowerCase().includes('mic ') || 
        (options?.body && options.body.toLowerCase().includes('microphone'))
      ) {
        console.log('[Suppressed Notification]', title, options);
        return {} as Notification;
      }
      
      // Caso contrário, continue normalmente
      return new originalNotification(title, options);
    };
    
    // Copie propriedades estáticas
    Object.assign(window.Notification, originalNotification);
  }
}

// Chame esta função logo no início da aplicação
if (typeof window !== 'undefined') {
  setupMicrophoneNotificationSuppression();
}
