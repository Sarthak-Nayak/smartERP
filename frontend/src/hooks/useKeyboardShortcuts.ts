import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ShortcutOptions {
  onToggleSearch?: () => void;
  onCloseModal?: () => void;
}

export function useKeyboardShortcuts(options: ShortcutOptions = {}) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. ESC key: go back or close modal
      if (e.key === 'Escape') {
        if (options.onCloseModal) {
          options.onCloseModal();
        } else {
          // If we have open dialogs, standard behaviour handles it. Otherwise, go back
          const openDialogs = document.querySelectorAll('[role="dialog"]');
          if (openDialogs.length === 0) {
            router.back();
          }
        }
        return;
      }

      // Detect if cursor is in an input/textarea/editable field
      const activeEl = document.activeElement;
      const isInputFocused = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.getAttribute('contenteditable') === 'true'
      );

      // 2. Ctrl+K: Global search/command palette
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (options.onToggleSearch) {
          options.onToggleSearch();
        }
        return;
      }

      // 3. F8: Open new Sales Voucher
      if (e.key === 'F8') {
        e.preventDefault();
        router.push('/sales-vouchers/new');
        return;
      }

      // 4. F9: Open new Purchase Voucher
      if (e.key === 'F9') {
        e.preventDefault();
        router.push('/purchase-vouchers/new');
        return;
      }

      // 5. Ctrl+C: Open new Customer form (bypass if focused in text input for standard copy command)
      if (e.ctrlKey && e.key.toLowerCase() === 'c') {
        if (!isInputFocused) {
          e.preventDefault();
          router.push('/customers/new');
        }
        return;
      }

      // 6. Ctrl+S or Alt+S: Open new Supplier form (avoid clashing with save inside input, and prevent browser save)
      if ((e.ctrlKey || e.altKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        router.push('/suppliers/new');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router, options]);
}
