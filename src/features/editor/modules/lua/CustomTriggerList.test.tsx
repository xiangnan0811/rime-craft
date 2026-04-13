import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CustomTriggerList } from './CustomTriggerList'
import { useConfigStore } from '@/stores/config-store'

vi.mock('./CustomTriggerForm', () => ({
  CustomTriggerForm: ({
    onSubmit,
  }: {
    onSubmit: (value: {
      name: string;
      triggerCode: string;
      description: string;
      scriptId: string;
    }) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        onSubmit({
          name: 'IP 查询',
          triggerCode: '/ip',
          description: '',
          scriptId: 'script-1',
        })
      }
    >
      mock-submit
    </button>
  ),
}))

describe('CustomTriggerList', () => {
  beforeEach(() => {
    useConfigStore.getState().reset()
    useConfigStore.getState().setSchemaList([{ schema: 'rime_ice' }])
  })

  it('shows the orphan warning when the linked script is missing', () => {
    useConfigStore.getState().addCustomTrigger('rime_ice', {
      name: 'IP 查询',
      triggerCode: '/ip',
      description: '',
      scriptId: 'missing-script',
    })

    render(<CustomTriggerList schemaId="rime_ice" />)

    expect(screen.getByText('⚠ 未关联脚本')).toBeInTheDocument()
  })
})
