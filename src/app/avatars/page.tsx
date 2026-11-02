'use client';

import { Avatar } from '@/components/avatar';
import { EXPRESSIONS, COLORS } from '@/lib/avatar-shapes';

export default function AvatarsPage() {
  return (
    <div className="min-h-screen bg-[#111] p-8 text-white">
      <h1 className="text-2xl font-semibold mb-8">Avatar Variants</h1>

      <div className="overflow-x-auto">
        <table className="border-separate" style={{ borderSpacing: 16 }}>
          <thead>
            <tr>
              <th />
              {COLORS.map((c) => (
                <th key={c.key} className="text-xs font-medium text-[#9B9FA4] capitalize pb-2">
                  {c.key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EXPRESSIONS.map((expr, ei) => (
              <tr key={expr.key}>
                <td className="text-xs font-medium text-[#9B9FA4] pr-4 capitalize">
                  {expr.label}
                </td>
                {COLORS.map((_, ci) => (
                  <td key={ci}>
                    <Avatar expressionIndex={ei} colorIndex={ci} size={48} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-semibold mt-12 mb-4">Sizes</h2>
      <div className="flex items-end gap-6">
        {[24, 32, 40, 48, 64, 80].map((s) => (
          <div key={s} className="flex flex-col items-center gap-2">
            <Avatar expressionIndex={3} colorIndex={2} size={s} />
            <span className="text-xs text-[#9B9FA4]">{s}px</span>
          </div>
        ))}
      </div>
    </div>
  );
}
