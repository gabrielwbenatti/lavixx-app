import { useToast } from '@/lib/toastContext'
import { Toaster } from '@/components/ui/Toast'

export function ToasterContainer() {
  const { toasts, removeToast } = useToast()
  return <Toaster toasts={toasts} onClose={removeToast} />
}
