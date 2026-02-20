interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // time to live in milliseconds
  priority: number; // 0-10, higher means more important
}

export class SmartCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private maxSize: number;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  
  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
    this.startCleanupInterval();
  }
  
  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Update timestamp on access (LRU behavior)?
    // Or keep original timestamp?
    // Let's keep original timestamp for TTL check, but maybe mark as recently used for eviction?
    // For simplicity, we just check TTL here.
    
    return entry.data as T;
  }
  
  /**
   * Set item in cache
   */
  set<T>(key: string, data: T, ttl: number = 300000, priority: number = 5): void {
    // Eviction if full
    if (this.cache.size >= this.maxSize) {
      this.evict();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      priority
    });
  }
  
  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Start cleanup interval for expired items
   */
  private startCleanupInterval() {
    if (this.cleanupInterval) return;
    
    // Cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60000);
  }

  /**
   * Cleanup expired items
   */
  private cleanupExpired() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Evict items based on priority and age
   */
  private evict() {
    // Strategy:
    // 1. Remove expired items first (cleanupExpired handles this partially, but let's be sure)
    this.cleanupExpired();
    
    if (this.cache.size < this.maxSize) return;
    
    // 2. Remove lowest priority items
    // Sort entries by priority (asc) then by timestamp (asc - oldest first)
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => {
      if (a[1].priority !== b[1].priority) {
        return a[1].priority - b[1].priority; // Lower priority first
      }
      return a[1].timestamp - b[1].timestamp; // Older first
    });
    
    // Remove 10% of items or at least 1
    const removeCount = Math.max(1, Math.floor(this.maxSize * 0.1));
    for (let i = 0; i < removeCount && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  dispose() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

export const globalCache = new SmartCache();
