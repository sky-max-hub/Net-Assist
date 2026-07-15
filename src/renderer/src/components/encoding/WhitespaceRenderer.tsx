interface Props {
  text: string
}

export default function WhitespaceRenderer({ text }: Props): JSX.Element {
  const rendered = text
    .replace(/\r/g, '⏎')
    .replace(/\n/g, '¶')
    .replace(/\t/g, '→')
    .replace(/ /g, '·')
    .replace(/[\x00-\x1F]/g, (c) => {
      return String.fromCodePoint(0x2400 + c.charCodeAt(0))
    })

  return <span className="whitespace-renderer">{rendered}</span>
}
