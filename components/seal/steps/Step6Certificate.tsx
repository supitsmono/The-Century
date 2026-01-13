import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Star, BadgeCheck, Download, ArrowLeft } from 'lucide-react';
import { Capsule } from '../../../types';
import { containerVariants } from '../data/variants';

interface Step6CertificateProps {
  capsule: Capsule;
  onDownload: () => void;
  onShare: () => void;
  onClose: () => void;
}

export const Step6Certificate: React.FC<Step6CertificateProps> = ({
  capsule,
  onDownload,
  onShare,
  onClose,
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleBack = () => {
    const confirmed = window.confirm("Are you sure you want to leave? Your certificate will not be saved if you haven't downloaded it.");
    if (confirmed) {
      onClose();
    }
  };

  const handleDownload = () => {
    // Create a new window with only the certificate
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      // Fallback: use window.print if popup is blocked
      window.print();
      return;
    }

    // Create static HTML version of certificate
    const certificateHTML = `
      <div style="width: 100%; background: #F7F5F0; color: #1E293B; text-align: center; position: relative; padding: 3rem 2rem; border: 1px solid #D4C9BC;">
        <div style="margin-bottom: 1.5rem; display: flex; flex-direction: column; align-items: center; gap: 0.625rem;">
          <div style="width: 56px; height: 56px; border-radius: 50%; border: 1px solid #D4C9BC; display: flex; align-items: center; justify-content: center; background: #F7F5F0;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="1.5" style="opacity: 0.1;">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" fill-opacity="0.1"/>
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 0.375rem;">
            <span style="font-size: 8px; text-transform: uppercase; letter-spacing: 0.4em; font-weight: 900; color: #64748B;">Established Presence</span>
            <h3 style="font-family: 'Crimson Text', serif; font-size: 3rem; color: #1E293B; font-weight: 300; font-style: italic; letter-spacing: -0.02em; line-height: 1.2; margin: 0;">The Century</h3>
            <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.3em; font-weight: 900; color: #64748B; margin: 0;">Legacy Archive Certificate</p>
          </div>
        </div>
        <div style="gap: 0.625rem; margin-bottom: 1.5rem; display: flex; flex-direction: column; align-items: center; width: 100%;">
          <span style="font-size: 8px; text-transform: uppercase; letter-spacing: 0.3em; font-weight: 900; color: #94A3B8;">This record confirms that</span>
          <p style="font-family: 'Crimson Text', serif; font-size: 2rem; color: #1E293B; font-weight: 700; letter-spacing: -0.02em; line-height: 1.3; margin: 0;">
            ${capsule.name || 'A Silent Contributor'}
          </p>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 0.375rem; margin-top: 0.75rem;">
            <span style="font-size: 8px; text-transform: uppercase; letter-spacing: 0.3em; font-weight: 900; color: #64748B;">Has sealed a time capsule for the world of</span>
            <p style="font-family: 'Crimson Text', serif; font-size: 1.5rem; color: #1E293B; font-weight: 700; letter-spacing: -0.02em; line-height: 1.3; margin: 0;">
              2125
            </p>
          </div>
        </div>
        <div style="width: 100%; border-top: 1px solid #D4C9BC; border-bottom: 1px solid #D4C9BC; padding-top: 1.25rem; padding-bottom: 1.25rem; margin-bottom: 1.25rem;">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 0.875rem;">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 0.375rem;">
              <span style="font-size: 8px; text-transform: uppercase; letter-spacing: 0.4em; font-weight: 900; color: #64748B;">Registry Status</span>
              <p style="font-family: 'Crimson Text', serif; font-size: 1.25rem; color: #475569; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; font-style: italic; line-height: 1.4; margin: 0;">Eternal Storage</p>
            </div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 1.25rem; padding-top: 0.875rem; border-top: 1px solid #D4C9BC; width: 100%;">
              <div style="display: flex; flex-direction: column; align-items: center; gap: 0.25rem;">
                <span style="font-size: 8px; text-transform: uppercase; letter-spacing: 0.4em; font-weight: 900; color: #64748B;">Archived at</span>
                <p style="font-family: 'Crimson Text', serif; font-size: 0.875rem; color: #1E293B; font-weight: 500; margin: 0;">${capsule.town}</p>
              </div>
              <div style="width: 1px; height: 20px; background: #D4C9BC;"></div>
              <div style="display: flex; flex-direction: column; align-items: center; gap: 0.25rem;">
                <span style="font-size: 8px; text-transform: uppercase; letter-spacing: 0.4em; font-weight: 900; color: #64748B;">Year</span>
                <p style="font-family: 'Crimson Text', serif; font-size: 0.875rem; color: #1E293B; font-weight: 500; margin: 0;">${capsule.archivalTimestamp.year}</p>
              </div>
            </div>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.625rem;">
          <div style="display: flex; align-items: center; gap: 0.625rem;">
            <div style="width: 32px; height: 1px; background: #D4C9BC;"></div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="1.5">
              <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M22 4L12 14.01L9 11.01" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div style="width: 32px; height: 1px; background: #D4C9BC;"></div>
          </div>
          <p style="font-family: 'Crimson Text', serif; font-style: italic; font-size: 0.75rem; color: #64748B; max-width: 320px; line-height: 1.6; margin: 0; text-align: center;">
            "A beautiful reminder of a message cast into the currents of time."
          </p>
        </div>
      </div>
    `;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>The Century - Certificate</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: #f5f2ed;
              padding: 2rem;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            @media print {
              body {
                padding: 0;
                background: white;
              }
              @page {
                size: A4 landscape;
                margin: 1cm;
              }
            }
          </style>
        </head>
        <body>
          ${certificateHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full print:py-0" style={{ padding: '1.5rem 1rem', minHeight: 0 }}>
    <motion.div
      key="step6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center w-full max-w-2xl"
      style={{ gap: '1.5rem', display: 'flex', flexDirection: 'column' }}
    >
      {/* THE CENTURY CERTIFICATE */}
      <motion.div
        ref={certificateRef}
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.8,
          ease: [0.16, 1, 0.3, 1],
          delay: 0.2
        }}
        className="w-full bg-[#F7F5F0] text-[#1E293B] text-center relative overflow-hidden flex flex-col items-center rounded-sm border border-[#D4C9BC] print:shadow-none print:border-none"
        style={{
          padding: '2rem 1.5rem',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Paper Grain Texture */}
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-multiply"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.04 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
            backgroundRepeat: 'repeat'
          }}
        />

        {/* Texture & Light */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '60px 60px' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(212, 165, 116, 0.04), transparent 70%)' }} />

        {/* Decorative Double Frame */}
        <motion.div
          className="absolute inset-6 border border-[#1E293B]/5 pointer-events-none"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.div
          className="absolute inset-8 border border-[#1E293B]/10 pointer-events-none"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />

        <div className="relative z-10 w-full flex flex-col items-center">
          {/* Header */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.625rem' }}>
            <motion.div
              initial={{ rotate: -10, opacity: 0, scale: 0.9 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="w-14 h-14 rounded-full border border-[#D4C9BC] flex items-center justify-center bg-[#F7F5F0]"
              style={{
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.06)',
              }}
            >
              <Star className="text-[#475569]" size={24} strokeWidth={1.5} fill="currentColor" fillOpacity={0.1} />
            </motion.div>
            <div style={{ gap: '0.375rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span className="text-[8px] uppercase tracking-[0.40em] font-black text-[#64748B]" style={{ letterSpacing: '0.08em' }}>Established Presence</span>
              <h3 className="font-serif text-3xl md:text-4xl text-[#1E293B] font-light italic tracking-tight" style={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>The Century</h3>
              <p className="text-[9px] uppercase tracking-[0.30em] font-black text-[#64748B]" style={{ lineHeight: 1.5 }}>Legacy Archive Certificate</p>
            </div>
          </div>

          {/* Name Section */}
          <div style={{ gap: '0.625rem', marginBottom: '1.5rem', lineHeight: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <span className="text-[8px] uppercase tracking-[0.30em] font-black text-[#94A3B8]" style={{ lineHeight: 1.5 }}>This record confirms that</span>
            <motion.p 
              className="font-serif text-2xl md:text-3xl text-[#1E293B] font-bold tracking-tighter" 
              style={{ letterSpacing: '-0.02em', lineHeight: 1.3 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {capsule.name || 'A Silent Contributor'}
            </motion.p>
            <div className="flex flex-col items-center" style={{ gap: '0.375rem', marginTop: '0.75rem' }}>
              <span className="text-[8px] uppercase tracking-[0.30em] font-black text-[#64748B]" style={{ lineHeight: 1.5 }}>Has sealed a time capsule for the world of</span>
              <motion.p 
                className="font-serif text-xl md:text-2xl text-[#1E293B] font-bold" 
                style={{ letterSpacing: '-0.02em', lineHeight: 1.3 }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                2125
              </motion.p>
            </div>
          </div>

          {/* Registry Info */}
          <div className="w-full border-t border-b border-[#D4C9BC] relative" style={{ lineHeight: 1.5, paddingTop: '1.25rem', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
            <div className="flex flex-col items-center" style={{ gap: '0.875rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ gap: '0.375rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span className="text-[8px] uppercase tracking-[0.40em] font-black text-[#64748B]" style={{ lineHeight: 1.5 }}>Registry Status</span>
                <p className="font-serif text-xl text-[#475569] font-bold uppercase tracking-[0.15em] italic" style={{ letterSpacing: '-0.02em', lineHeight: 1.4 }}>Eternal Storage</p>
              </div>
              <div className="flex items-center justify-center" style={{ gap: '1.25rem', paddingTop: '0.875rem', borderTop: '1px solid #D4C9BC', width: '100%' }}>
                <div style={{ gap: '0.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span className="text-[8px] uppercase tracking-[0.40em] font-black text-[#64748B]" style={{ lineHeight: 1.5 }}>Archived at</span>
                  <p className="font-serif text-sm text-[#1E293B] font-medium" style={{ lineHeight: 1.5 }}>{capsule.town}</p>
                </div>
                <div className="w-px h-5 bg-[#D4C9BC]" />
                <div style={{ gap: '0.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span className="text-[8px] uppercase tracking-[0.40em] font-black text-[#64748B]" style={{ lineHeight: 1.5 }}>Year</span>
                  <p className="font-serif text-sm text-[#1E293B] font-medium" style={{ lineHeight: 1.5 }}>{capsule.archivalTimestamp.year}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Badge */}
          <motion.div 
            className="flex flex-col items-center" 
            style={{ gap: '0.625rem', display: 'flex', flexDirection: 'column' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center" style={{ gap: '0.625rem' }}>
              <div className="w-8 h-[1px] bg-[#D4C9BC]" />
              <BadgeCheck size={18} strokeWidth={1.5} className="text-[#475569]" />
              <div className="w-8 h-[1px] bg-[#D4C9BC]" />
            </div>
            <p className="font-serif italic text-xs text-[#64748B] max-w-xs leading-relaxed text-center" style={{ lineHeight: 1.6 }}>
              "A beautiful reminder of a message cast into the currents of time."
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Actions */}
      <div className="flex flex-col items-center w-full print:hidden" style={{ gap: '1.25rem', width: '100%' }}>
        <motion.button
          onClick={handleDownload}
          className="flex items-center justify-center bg-[#1E293B] text-white text-[10px] uppercase tracking-[0.30em] font-black hover:opacity-92 transition-all duration-200 ease-out rounded-sm cursor-pointer"
          style={{
            gap: '0.5rem',
            padding: '1rem 2rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.06)',
            lineHeight: 1.5,
          }}
          whileHover={{ scale: 1.02, opacity: 0.92 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Download size={16} /> Save Certificate
        </motion.button>

        <div className="flex flex-col items-center" style={{ gap: '0.75rem' }}>
          <motion.button
            onClick={handleBack}
            className="flex items-center text-[9px] uppercase tracking-[0.40em] font-black bg-transparent text-[#475569] hover:text-[#1E293B] transition-colors duration-200 border border-transparent rounded-sm cursor-pointer group"
            style={{ padding: '0.25rem 0.5rem', gap: '0.375rem' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.4 }}
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform duration-200 ease-out" />
            <span>Back to Vault</span>
          </motion.button>
          <p className="text-[8px] uppercase tracking-[0.25em] font-black text-[#64748B] text-center max-w-sm" style={{ lineHeight: 1.5 }}>
            Your certificate will not be saved if you leave without downloading
          </p>
        </div>
      </div>
    </motion.div>
    </div>
  );
};

