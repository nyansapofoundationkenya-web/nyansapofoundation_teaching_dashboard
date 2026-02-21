// hooks/general/useDragAndDrop.js
import { useState, useRef, useCallback } from 'react';

export function useDragAndDrop({ onDrop, accept, maxSize = null }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState(null);
  const dragCounter = useRef(0);

  const validateFile = useCallback((file) => {
    // Check file type
    if (accept) {
      const fileType = file.type;
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      const acceptTypes = Array.isArray(accept) ? accept : accept.split(',');
      
      const isValidType = acceptTypes.some(type => {
        type = type.trim().toLowerCase();
        // Check by extension
        if (type.startsWith('.')) {
          return fileExtension === type;
        }
        // Check by MIME type
        return fileType === type || fileType.startsWith(type.replace('*', ''));
      });

      if (!isValidType) {
        return {
          valid: false,
          error: `Invalid file type. Accepted types: ${acceptTypes.join(', ')}`
        };
      }
    }

    // Check file size
    if (maxSize && file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${maxSize / 1024 / 1024}MB limit`
      };
    }

    return { valid: true, error: null };
  }, [accept, maxSize]);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
      setDragError(null);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragError(null);
    dragCounter.current = 0;

    const files = Array.from(e.dataTransfer.files);
    
    if (files.length === 0) {
      return;
    }

    const file = files[0]; // Handle single file by default
    
    // Validate the file
    const validation = validateFile(file);
    
    if (!validation.valid) {
      setDragError(validation.error);
      return;
    }

    // Call the onDrop callback with the valid file
    onDrop?.(file);
  }, [onDrop, validateFile]);

  const resetDragState = useCallback(() => {
    setIsDragging(false);
    setDragError(null);
    dragCounter.current = 0;
  }, []);

  return {
    isDragging,
    dragError,
    dragEvents: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
    resetDragState,
  };
}