// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import PersonalInfoForm from '@/components/profile/PersonalInfoForm';
import type { PersonalInfo } from '@/types/profile';

afterEach(cleanup);

function ControlledPersonalInfoForm() {
  const [personal, setPersonal] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    email: 'user@example.com',
    phone: '',
  });

  return (
    <>
      <PersonalInfoForm
        personal={personal}
        onChange={(event) => {
          const { name, value } = event.target;
          setPersonal((current) => ({ ...current, [name]: value }));
        }}
        onFullNameChange={(value) => {
          const parts = value.trimStart().split(/\s+/).filter(Boolean);
          setPersonal((current) => ({
            ...current,
            firstName: parts[0] || '',
            lastName: parts.slice(1).join(' '),
          }));
        }}
        onSave={() => Promise.resolve({ success: true })}
      />
      <output data-testid="normalized-name">{personal.firstName}|{personal.lastName}</output>
    </>
  );
}

describe('PersonalInfoForm', () => {
  it('giữ dấu cách khi nhập họ tên nhiều từ trong controlled form', async () => {
    const user = userEvent.setup();
    render(<ControlledPersonalInfoForm />);

    const fullNameInput = screen.getByLabelText('Họ và tên') as HTMLInputElement;
    await user.type(fullNameInput, 'Nguyễn Văn An');

    expect(fullNameInput.value).toBe('Nguyễn Văn An');
    expect(screen.getByTestId('normalized-name').textContent).toBe('Nguyễn|Văn An');
  });

  it('không lặp tiêu đề trang và cho phép mở chọn avatar bằng nút', () => {
    render(<ControlledPersonalInfoForm />);

    expect(screen.queryByRole('heading', { name: 'Thông tin của bạn' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Thay đổi ảnh đại diện' }).getAttribute('type')).toBe('button');
  });
});
