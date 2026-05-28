import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

const AdminKeyGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [verified, setVerified] = useState<boolean>(false);

  useEffect(() => {
    const already = sessionStorage.getItem('supabase_key_verified');
    if (already === 'true') {
      setVerified(true);
      return;
    }

    const expected = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').toString().trim();

    (async () => {
      try {
        const { value, isConfirmed } = await Swal.fire({
          title: 'Admin access',
          text: 'Enter Supabase anon key to access admin features',
          input: 'password',
          inputAttributes: {
            autocomplete: 'new-password',
            name: 'admin_key',
            autocapitalize: 'off',
            spellcheck: 'false',
          },
          inputPlaceholder: 'Supabase anon key',
          showCancelButton: true,
          allowOutsideClick: false,
          allowEscapeKey: false,
          confirmButtonText: 'Verify',
          preConfirm: (v: string) => {
            const trimmed = typeof v === 'string' ? v.trim() : '';
            if (!trimmed) {
              Swal.showValidationMessage('Key is required');
              return undefined;
            }
            return trimmed;
          },
        });

        if (!isConfirmed) {
          // go back instead of redirecting to root which may trigger logout
          if (window.history.length > 1) window.history.back();
          return;
        }

        const entered = (value as string | undefined)?.toString().trim() ?? '';

        if (!expected) {
          await Swal.fire({ icon: 'error', title: 'Configuration error', text: 'Admin key is not configured in the app.' });
          // avoid redirect to root; allow developer to fix env without logging out the user
          return;
        }

        if (entered === expected) {
          sessionStorage.setItem('supabase_key_verified', 'true');
          setVerified(true);
          Swal.fire({ icon: 'success', title: 'Access granted', timer: 1200, showConfirmButton: false });
        } else {
          await Swal.fire({ icon: 'error', title: 'Access denied', text: 'Invalid key' });
          if (window.history.length > 1) window.history.back();
        }
      } catch (err) {
        console.error('AdminKeyGate error:', err);
      }
    })();
  }, []);

  if (!verified) return null;
  return <>{children}</>;
};

export default AdminKeyGate;
