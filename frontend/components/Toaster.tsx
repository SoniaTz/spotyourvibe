import { Toaster as SonnerToaster } from 'sonner';

export default function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'white',
          color: '#1f2937',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '14px'
        },
        className: 'shadow-xl'
      }}
    />
  );
}
