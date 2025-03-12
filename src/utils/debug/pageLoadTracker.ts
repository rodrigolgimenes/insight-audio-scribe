
type LoadingPhase = {
  phase: string;
  timestamp: number;
  success: boolean;
  error?: string;
  componentName?: string;
};

class PageLoadTracker {
  private static phases: LoadingPhase[] = [];
  private static initialized = false;
  private static startTime = 0;

  static init() {
    if (this.initialized) return;
    this.phases = [];
    this.startTime = Date.now();
    this.initialized = true;
    console.log('[PageLoadTracker] Initialized');
  }

  static trackPhase(phase: string, success: boolean, error?: string, componentName?: string) {
    if (!this.initialized) this.init();
    
    const timestamp = Date.now();
    const timeSinceStart = timestamp - this.startTime;
    
    const entry = {
      phase,
      timestamp,
      success,
      error,
      componentName
    };
    
    this.phases.push(entry);
    
    console.log(
      `[PageLoadTracker] ${componentName ? `[${componentName}] ` : ''}${phase} (${timeSinceStart}ms):`, 
      success ? 'Success' : 'Failed', 
      error || ''
    );
    
    return entry;
  }

  static getPhases() {
    return this.phases;
  }

  static getPhasesSummary() {
    return this.phases.map(phase => {
      const timeSinceStart = phase.timestamp - this.startTime;
      return {
        phase: phase.phase,
        timeSinceStart: `${timeSinceStart}ms`,
        success: phase.success,
        error: phase.error
      };
    });
  }

  static reset() {
    this.phases = [];
    this.startTime = Date.now();
    console.log('[PageLoadTracker] Reset');
  }

  static logSummary() {
    if (this.phases.length === 0) {
      console.log('[PageLoadTracker] No phases recorded');
      return;
    }
    
    const failedPhases = this.phases.filter(p => !p.success);
    const totalTime = this.phases[this.phases.length - 1].timestamp - this.startTime;
    
    console.log(`[PageLoadTracker] Summary: ${this.phases.length} phases, ${failedPhases.length} failures, total time: ${totalTime}ms`);
    
    if (failedPhases.length > 0) {
      console.log('[PageLoadTracker] Failed phases:', failedPhases);
    }
    
    // Log critical path timing
    console.table(this.getPhasesSummary());
  }
}

export { PageLoadTracker };
