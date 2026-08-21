// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import Icon, { type IconName } from '../Icons'

const NAMES: IconName[] = ['network','client','server','udp','plus','chevron','folder','play','pencil','trash','copy','check','x','send','split','merge','history','search','sliders','chevron-up','arrow-right','chevron-left']

describe('Icons', () => {
  it('每个图标名渲染一个带 ic 类的 svg', () => {
    for (const n of NAMES) {
      const { container } = render(React.createElement(Icon, { name: n }))
      const svg = container.querySelector('svg.ic')
      expect(svg, `name=${n}`).toBeTruthy()
      expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24')
    }
  })
  it('支持 size 与 className 覆盖', () => {
    const { container } = render(React.createElement(Icon, { name: 'plus', size: 19, className: 'conn-type-icon' }))
    const svg = container.querySelector('svg.conn-type-icon')
    expect(svg).toBeTruthy()
    expect(svg?.getAttribute('width')).toBe('19')
  })
})
