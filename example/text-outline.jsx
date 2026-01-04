import React, { useEffect, useRef, useState } from 'react';

const TextOutline = ({ children, className = '', outlineColor = '#3b82f6', outlineWidth = 3 }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const drawOutline = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;
      
      const ctx = canvas.getContext('2d');
      const containerRect = container.getBoundingClientRect();
      
      // Set canvas size to match container
      canvas.width = containerRect.width;
      canvas.height = containerRect.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Automatically find all text nodes in the container
      const allRects = [];
      
      // Use TreeWalker to find all text nodes
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            // Skip empty text nodes (whitespace only)
            if (!node.textContent.trim()) {
              return NodeFilter.FILTER_REJECT;
            }
            // Skip text in canvas element
            if (node.parentElement === canvas) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );
      
      // Collect rectangles from each text node
      let node;
      while (node = walker.nextNode()) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const rects = Array.from(range.getClientRects());
        
        // Convert to coordinates relative to container
        rects.forEach(rect => {
          allRects.push({
            left: rect.left - containerRect.left,
            right: rect.right - containerRect.left,
            top: rect.top - containerRect.top,
            bottom: rect.bottom - containerRect.top,
            width: rect.width,
            height: rect.height
          });
        });
      }
      
      if (allRects.length === 0) return;
      
      // Sort rectangles by vertical position
      allRects.sort((a, b) => a.top - b.top);
      
      // Group rectangles by approximate vertical position (same line)
      const lineGroups = [];
      let currentGroup = [allRects[0]];
      
      for (let i = 1; i < allRects.length; i++) {
        const rect = allRects[i];
        const prevRect = allRects[i - 1];
        
        // If rects are on approximately the same line (within 5px)
        if (Math.abs(rect.top - prevRect.top) < 5) {
          currentGroup.push(rect);
        } else {
          lineGroups.push(currentGroup);
          currentGroup = [rect];
        }
      }
      lineGroups.push(currentGroup);
      
      // Merge overlapping or adjacent rects on the same line
      const mergedLines = lineGroups.map(group => {
        if (group.length === 1) return group[0];
        
        group.sort((a, b) => a.left - b.left);
        return {
          left: Math.min(...group.map(r => r.left)),
          right: Math.max(...group.map(r => r.right)),
          top: Math.min(...group.map(r => r.top)),
          bottom: Math.max(...group.map(r => r.bottom))
        };
      });
      
      // Draw the outline path
      ctx.beginPath();
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = outlineWidth;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      
      // Start from top-left of first line
      ctx.moveTo(mergedLines[0].left, mergedLines[0].top);
      
      // Trace top edge (right direction)
      for (let i = 0; i < mergedLines.length; i++) {
        const line = mergedLines[i];
        const prevLine = i > 0 ? mergedLines[i - 1] : null;
        
        if (prevLine) {
          // Connect from previous line's top-right to current line's top
          if (line.left > prevLine.right) {
            // Step out and down
            ctx.lineTo(prevLine.right, prevLine.top);
            ctx.lineTo(prevLine.right, line.top);
            ctx.lineTo(line.left, line.top);
          } else {
            // Smooth transition
            ctx.lineTo(line.left, line.top);
          }
        }
        
        ctx.lineTo(line.right, line.top);
      }
      
      // Trace right edge (down)
      const lastLine = mergedLines[mergedLines.length - 1];
      ctx.lineTo(lastLine.right, lastLine.bottom);
      
      // Trace bottom edge (left direction)
      for (let i = mergedLines.length - 1; i >= 0; i--) {
        const line = mergedLines[i];
        const nextLine = i < mergedLines.length - 1 ? mergedLines[i + 1] : null;
        
        if (nextLine) {
          if (line.right < nextLine.left) {
            ctx.lineTo(nextLine.left, nextLine.bottom);
            ctx.lineTo(nextLine.left, line.bottom);
            ctx.lineTo(line.right, line.bottom);
          } else {
            ctx.lineTo(line.right, line.bottom);
          }
        }
        
        ctx.lineTo(line.left, line.bottom);
      }
      
      // Trace left edge (up) back to start
      const firstLine = mergedLines[0];
      ctx.lineTo(firstLine.left, firstLine.top);
      
      ctx.stroke();
    };
    
    // Initial draw
    drawOutline();
    
    // Redraw on window resize
    const handleResize = () => drawOutline();
    window.addEventListener('resize', handleResize);
    
    // Observe size changes in container
    const resizeObserver = new ResizeObserver(drawOutline);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [outlineColor, outlineWidth, children]);
  
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 pointer-events-none"
        style={{ zIndex: 0 }}
      />
      <div className="relative" style={{ zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
};

// Example usage
export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-12">
        <TextOutline outlineColor="#3b82f6" outlineWidth={3}>
          <h3 className="text-2xl font-bold mb-4">This is a heading</h3>
          <p className="text-lg">
            This paragraph has a custom outline that follows the exact shape of the text. 
            Notice how it traces around the ragged edge of the paragraph, creating a dynamic 
            shape that adapts to the text flow. No class needed!
          </p>
        </TextOutline>
        
        <TextOutline outlineColor="#ef4444" outlineWidth={2}>
          <h3 className="text-2xl font-bold mb-4">Another Example</h3>
          <p className="text-lg mb-4">
            You can have multiple text blocks within the same outline. This heading and 
            these paragraphs all share one continuous outline.
          </p>
          <p className="text-lg">
            The outline automatically detects all text and wraps around it seamlessly, 
            creating a unified visual boundary. Try resizing your window to see it adapt!
          </p>
        </TextOutline>
        
        <TextOutline outlineColor="#10b981" outlineWidth={4}>
          <p className="text-3xl font-light leading-relaxed">
            It works with different font sizes and line heights too. The algorithm calculates 
            the bounding rectangles for each line and traces a path around them all.
          </p>
        </TextOutline>
      </div>
    </div>
  );
}
