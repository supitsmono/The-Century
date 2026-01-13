import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Camera, X } from 'lucide-react';

interface PhotoGridProps {
  photos: string[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
  onSelect?: (photo: string) => void;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({ photos, onUpload, onRemove, onSelect }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header with progress and upload */}
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{
          fontSize: '8px',
          letterSpacing: '0.25em',
          fontWeight: '900',
          textTransform: 'uppercase',
          color: '#475569',
        }}>
          Photos ({photos.length}/10)
        </div>
        {photos.length < 10 && (
          <label 
            className="cursor-pointer"
            style={{
              border: '1px solid #D4C9BC',
              borderRadius: '2px',
              backgroundColor: '#F8F7F3',
              padding: '0.625rem 1.25rem',
              fontSize: '9px',
              letterSpacing: '0.25em',
              fontWeight: '900',
              textTransform: 'uppercase',
              color: '#64748B',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#B8A895';
              e.currentTarget.style.backgroundColor = '#F7F5F0';
              e.currentTarget.style.color = '#475569';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#D4C9BC';
              e.currentTarget.style.backgroundColor = '#F8F7F3';
              e.currentTarget.style.color = '#64748B';
            }}
          >
            <Camera size={14} strokeWidth={2} />
            Add Photos
            <input type="file" hidden multiple accept="image/*" onChange={onUpload} />
          </label>
        )}
      </div>

      {/* Photo Grid - Compact grid that fits 10 photos without scrolling */}
      {photos.length === 0 ? (
        <div style={{
          border: '2px dashed #D4C9BC',
          borderRadius: '2px',
          backgroundColor: '#F9F8F4',
          padding: '4rem 2rem',
          textAlign: 'center',
          transition: 'all 0.2s ease-out',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
        }}>
          <Camera 
            size={40} 
            strokeWidth={1.5} 
            style={{ 
              color: '#64748B', 
              marginBottom: '1rem',
            }} 
          />
          <div style={{ 
            fontSize: '9px', 
            letterSpacing: '0.3em', 
            fontWeight: '900', 
            textTransform: 'uppercase',
            color: '#64748B',
            marginBottom: '0.5rem',
          }}>
            Add Your First Photo
          </div>
          <label 
            className="cursor-pointer"
            style={{
              border: '1px solid #D4C9BC',
              borderRadius: '2px',
              backgroundColor: '#F8F7F3',
              padding: '0.625rem 1.25rem',
              fontSize: '9px',
              letterSpacing: '0.25em',
              fontWeight: '900',
              textTransform: 'uppercase',
              color: '#64748B',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '0.5rem',
              transition: 'all 0.2s ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#B8A895';
              e.currentTarget.style.backgroundColor = '#F7F5F0';
              e.currentTarget.style.color = '#475569';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#D4C9BC';
              e.currentTarget.style.backgroundColor = '#F8F7F3';
              e.currentTarget.style.color = '#64748B';
            }}
          >
            <Camera size={14} strokeWidth={2} />
            Choose Files
            <input type="file" hidden multiple accept="image/*" onChange={onUpload} />
          </label>
        </div>
      ) : (
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '0.625rem',
          }}
        >
          <AnimatePresence>
            {photos.map((src, i) => (
              <motion.div 
                key={i} 
                layoutId={`photo-${i}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  duration: 0.2,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                  position: 'relative',
                  aspectRatio: '3/4',
                  backgroundColor: '#F7F5F0',
                  border: '1px solid #D4C9BC',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  const img = e.currentTarget.querySelector('img');
                  if (img) img.style.filter = 'grayscale(0)';
                  const btn = e.currentTarget.querySelector('button');
                  if (btn) btn.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  const img = e.currentTarget.querySelector('img');
                  if (img) img.style.filter = 'grayscale(0.1)';
                  const btn = e.currentTarget.querySelector('button');
                  if (btn) btn.style.opacity = '0';
                }}
              >
                <img 
                  src={src} 
                  alt={`Photo ${i + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'grayscale(0.1)',
                    transition: 'filter 0.3s ease-out',
                  }}
                  onClick={() => onSelect?.(src)}
                />
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onRemove(i);
                  }}
                  type="button"
                  style={{
                    position: 'absolute',
                    top: '0.375rem',
                    right: '0.375rem',
                    padding: '0.375rem',
                    backgroundColor: 'rgba(180, 83, 9, 0.95)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s ease-out, background-color 0.2s ease-out',
                    zIndex: 20,
                    width: '28px',
                    height: '28px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(180, 83, 9, 1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(180, 83, 9, 0.95)';
                  }}
                >
                  <Trash2 size={12} strokeWidth={2} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

interface PhotoViewerProps {
  photo: string;
  onClose: () => void;
}

export const PhotoViewer: React.FC<PhotoViewerProps> = ({ photo, onClose }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      onClick={onClose} 
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center cursor-zoom-out backdrop-blur-md print:hidden"
      style={{ padding: '2rem' }}
    >
      <motion.img 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        src={photo} 
        alt="Full size photo view"
        className="max-w-full max-h-full object-contain shadow-2xl" 
      />
      <motion.button
        onClick={onClose}
        className="absolute top-8 right-8 z-[10001] w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-colors cursor-pointer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Close photo viewer"
      >
        <X size={20} className="text-white" />
      </motion.button>
    </motion.div>
  );
};

