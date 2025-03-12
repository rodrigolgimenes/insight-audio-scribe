
type LoadingPhase = {
  phase: string;
  timestamp: number;
  success: boolean;
  error?: string;
};

class PageLoadTracker {
  private static phases: LoadingPhase[] = [];
  private static initialized = false;

  static init() {
    if (this.initialized) return;
    this.phases = [];
    this.initialized = true;
    console.log('[PageLoadTracker] Initialized');
  }

  static trackPhase(phase: string, success: boolean, error?: string) {
    const entry = {
      phase,
      timestamp: Date.now(),
      success,
      error
    };
    this.phases.push(entry);
    console.log(`[PageLoadTracker] ${phase}:`, success ? 'Success' : 'Failed', error || '');
    return entry;
  }

  static getPhases() {
    return this.phases;
  }

  static reset() {
    this.phases = [];
    console.log('[PageLoadTracker] Reset');
  }
}

export { PageLoadTracker };
