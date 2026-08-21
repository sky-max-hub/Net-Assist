import { useUiStore } from '../../store/ui-store'
import './Toast.css'

/** Toast 宿主：toast 非空时渲染 `.toast.show`（样式见 design/base.css） */
export default function ToastHost(): JSX.Element {
  const toast = useUiStore((s) => s.toast)
  return <>{toast && <div className="toast show" data-testid="toast">{toast}</div>}</>
}
