/**
 * パフォーマンス最適化とメモリリーク防止のユーティリティ
 */

/**
 * デバウンス関数の実装
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * スロットリング関数の実装
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * メモ化関数の実装
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * リソースのクリーンアップを管理
 */
export class ResourceManager {
  private resources: Array<() => void> = [];
  
  /**
   * リソースを追加
   */
  add(resource: () => void): void {
    this.resources.push(resource);
  }
  
  /**
   * リソースをクリーンアップ
   */
  cleanup(): void {
    this.resources.forEach(resource => {
      try {
        resource();
      } catch (error) {
        console.error('Resource cleanup error:', error);
      }
    });
    this.resources = [];
  }
  
  /**
   * 特定のリソースを削除
   */
  remove(resource: () => void): void {
    const index = this.resources.indexOf(resource);
    if (index > -1) {
      this.resources.splice(index, 1);
    }
  }
}

/**
 * 画像の遅延読み込み
 */
export function createImageObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  });
}

/**
 * パフォーマンス測定
 */
export function measurePerformance<T>(
  name: string,
  operation: () => T
): T {
  const start = performance.now();
  const result = operation();
  const end = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[PERFORMANCE] ${name}: ${(end - start).toFixed(2)}ms`);
  }
  
  return result;
}

/**
 * 非同期処理のパフォーマンス測定
 */
export async function measureAsyncPerformance<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  const result = await operation();
  const end = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[PERFORMANCE] ${name}: ${(end - start).toFixed(2)}ms`);
  }
  
  return result;
}

/**
 * メモリ使用量の監視
 */
export function monitorMemoryUsage(): void {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    console.log('[MEMORY]', {
      used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
    });
  }
}

/**
 * 定期的なメモリ監視
 */
export function startMemoryMonitoring(interval: number = 30000): () => void {
  const timer = setInterval(monitorMemoryUsage, interval);
  
  return () => {
    clearInterval(timer);
  };
}
