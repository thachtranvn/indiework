'use client';

import { Popover } from './popover';

export const EMOJI_SET = [
  '🧹', '🪴', '🚀', '📦', '🛠️', '🎯', '📚', '🧪', '🔭', '🗂️', '⚙️', '🌱', '🧊', '🔥', '💡', '🪄',
  '✉️', '📒', '✨', '🛢️', '📡', '🔁', '🧱', '🔍', '📖', '⏱️', '🌿', '🐢', '🧭', '🎨', '🔐', '📈',
];

export function EmojiPicker({
  value,
  onPick,
  triggerClass = 'emoji-trigger',
  title = 'Change icon',
  width = 244,
}: {
  value: string;
  onPick: (emoji: string) => void;
  triggerClass?: string;
  title?: string;
  width?: number;
}) {
  return (
    <Popover
      width={width}
      align="left"
      trigger={
        <button className={triggerClass} title={title} type="button">
          {value}
        </button>
      }
    >
      {(close) => (
        <div className="emoji-grid pop">
          {EMOJI_SET.map((e) => (
            <button
              key={e}
              type="button"
              className="emoji-pick"
              data-on={e === value ? '' : undefined}
              onClick={() => {
                onPick(e);
                close();
              }}
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}
