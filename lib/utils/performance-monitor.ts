// lib/utils/performance-monitor.ts
export class PerformanceMonitor {
  private static measurements: Map<string, number> = new Map();

  static start(name: string): void {
    this.measurements.set(name, performance.now());
  }

  static end(name: string): number {
    const startTime = this.measurements.get(name);
    if (!startTime) return 0;

    const duration = performance.now() - startTime;
    this.measurements.delete(name);

    // 開発環境でのログ
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  static measure<T>(name: string, fn: () => T): T {
    this.start(name);
    const result = fn();
    this.end(name);
    return result;
  }
}