import { describe, expect, it } from 'vitest';

import { escapeHtml } from '@/lib/html';

describe('escapeHtml', () => {
  it('mã hóa ký tự HTML và giữ nguyên tiếng Việt', () => {
    expect(escapeHtml(`Nguyễn <script>alert("x")</script> & O'Reilly`)).toBe(
      'Nguyễn &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; O&#39;Reilly',
    );
  });
});
