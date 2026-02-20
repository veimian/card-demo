import { useRef, useState, useEffect, ReactNode } from 'react';
import { Card } from '../types/app';

interface VirtualizedGridProps {
  items: Card[];
  itemHeight: number;
  renderItem: (item: Card, index: number) => ReactNode;
  className?: string;
  gridCols?: number;
}

export function VirtualizedCardGrid({ 
  items, 
  itemHeight, 
  renderItem,
  className = '',
  gridCols = 1
}: VirtualizedGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
  
  // Calculate visible range
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateVisibleRange = () => {
      const { scrollTop, clientHeight } = container;
      const totalRows = Math.ceil(items.length / gridCols);
      
      const startRow = Math.floor(scrollTop / itemHeight);
      const endRow = Math.min(
        startRow + Math.ceil(clientHeight / itemHeight) + 1,
        totalRows
      );
      
      const startIndex = startRow * gridCols;
      const endIndex = Math.min(endRow * gridCols, items.length);
      
      setVisibleRange({ start: startIndex, end: endIndex });
    };
    
    updateVisibleRange();
    container.addEventListener('scroll', updateVisibleRange);
    window.addEventListener('resize', updateVisibleRange);
    
    return () => {
      container.removeEventListener('scroll', updateVisibleRange);
      window.removeEventListener('resize', updateVisibleRange);
    };
  }, [items.length, itemHeight, gridCols]);
  
  const totalRows = Math.ceil(items.length / gridCols);
  const totalHeight = totalRows * itemHeight;
  
  const visibleItems = items.slice(visibleRange.start, visibleRange.end);
  const startRow = Math.floor(visibleRange.start / gridCols);
  const topOffset = startRow * itemHeight;

  return (
    <div 
      ref={containerRef} 
      className={`overflow-y-auto ${className}`}
      style={{ height: '100%' }}
    >
      <div style={{ 
        height: totalHeight,
        position: 'relative' 
      }}>
        <div 
          className="grid gap-4"
          style={{
            position: 'absolute',
            top: topOffset,
            left: 0,
            right: 0,
            gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`
          }}
        >
          {visibleItems.map((item, index) => 
            renderItem(item, visibleRange.start + index)
          )}
        </div>
      </div>
    </div>
  );
}
