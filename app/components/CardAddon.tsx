"use client";

import { useState } from "react";

export default function CardAddon({
  checkboxLabel,
  recipientLabel,
  recipientHint,
  messageLabel,
}: {
  checkboxLabel: string;
  recipientLabel?: string;
  recipientHint?: string;
  messageLabel: string;
}) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex flex-col gap-3 p-5 bg-foreground/5">
      <label className="flex items-center gap-3 cursor-pointer font-sans text-sm font-semibold">
        <input
          type="checkbox"
          name="add_card"
          value="yes"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="accent-purple w-4 h-4"
        />
        {checkboxLabel}
      </label>

      {checked && (
        <div className="flex flex-col gap-3 mt-1">
          {recipientLabel && (
            <div className="flex flex-col gap-1">
              <label htmlFor="card_to" className="font-sans text-xs uppercase tracking-widest font-semibold">
                {recipientLabel}
              </label>
              {recipientHint && <p className="font-sans text-xs text-foreground/50 -mt-0.5">{recipientHint}</p>}
              <input
                id="card_to"
                name="card_to"
                type="text"
                className="border-2 border-foreground bg-transparent font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple"
              />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label htmlFor="card_message" className="font-sans text-xs uppercase tracking-widest font-semibold">
              {messageLabel}
            </label>
            <textarea
              id="card_message"
              name="card_message"
              rows={3}
              className="border-2 border-foreground bg-transparent font-sans text-sm px-4 py-3 focus:outline-none focus:border-purple resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
