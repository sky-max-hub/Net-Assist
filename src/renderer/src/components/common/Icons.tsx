import React from 'react'

export type IconName =
  | 'network' | 'client' | 'server' | 'udp' | 'plus' | 'chevron' | 'folder'
  | 'play' | 'pencil' | 'trash' | 'copy' | 'check' | 'x' | 'send' | 'split'
  | 'merge' | 'history' | 'search' | 'sliders' | 'chevron-up' | 'arrow-right' | 'chevron-left'

const PATHS: Record<IconName, React.ReactNode> = {
  network: (<><circle cx="6" cy="6" r="2.2" /><circle cx="18" cy="6" r="2.2" /><circle cx="12" cy="18" r="2.2" /><path d="M6 6h12M6 6l6 12M18 6l-6 12" /></>),
  client: (<><rect x="2.5" y="8" width="8" height="8" rx="2" /><rect x="13.5" y="8" width="8" height="8" rx="2" /><path d="M10.5 12h3" /></>),
  server: (<><rect x="4" y="4" width="16" height="6" rx="2" /><rect x="4" y="14" width="16" height="6" rx="2" /><path d="M8 7h.01M8 17h.01" /></>),
  udp: (<><circle cx="12" cy="12" r="3" /><path d="M7.5 7.5a7 7 0 0 0 0 9M16.5 7.5a7 7 0 0 1 0 9M4.5 4.5a11 11 0 0 0 0 15M19.5 4.5a11 11 0 0 1 0 15" /></>),
  plus: (<path d="M12 5v14M5 12h14" />),
  chevron: (<path d="M6 9l6 6 6-6" />),
  folder: (<path d="M3 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />),
  play: (<path d="M7 5l11 7-11 7z" />),
  pencil: (<><path d="M4 20l4-1L19 7l-3-3L5 16z" /><path d="M13 6l3 3" /></>),
  trash: (<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13" />),
  copy: (<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a1 1 0 0 1 1-1h10" /></>),
  check: (<path d="M5 12l5 5 9-10" />),
  x: (<path d="M6 6l12 12M18 6L6 18" />),
  send: (<path d="M21 3L11 13M21 3l-7 20-4-9-9-4z" />),
  split: (<><rect x="3" y="4" width="18" height="16" rx="2.5" /><path d="M12 4v16" /></>),
  merge: (<><rect x="3" y="4" width="18" height="16" rx="2.5" /></>),
  history: (<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>),
  search: (<><circle cx="11" cy="11" r="6.5" /><path d="M16 16l5 5" /></>),
  sliders: (<><path d="M4 8h10M18 8h2M4 16h4M12 16h8" /><circle cx="16" cy="8" r="2" /><circle cx="10" cy="16" r="2" /></>),
  'chevron-up': (<path d="M6 15l6-6 6 6" />),
  'arrow-right': (<path d="M5 12h14M13 6l6 6-6 6" />),
  'chevron-left': (<path d="M15 6l-6 6 6 6" />)
}

interface IconProps { name: IconName; size?: number; className?: string; style?: React.CSSProperties; onClick?: React.MouseEventHandler<SVGSVGElement> }

export default function Icon({ name, size = 16, className, style, onClick }: IconProps): JSX.Element {
  return (
    <svg className={className ?? 'ic'} width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round"
      strokeLinejoin="round" style={style} onClick={onClick} aria-hidden="true">
      {PATHS[name]}
    </svg>
  )
}
