"use client";

import { bracketHowItWorksIntro } from "@/lib/archeryTerms";

type Props = {
  className?: string;
};

export function BracketHowItWorks({ className = "" }: Props) {
  return (
    <aside
      className={`rounded-xl border border-accent/30 bg-accent/5 px-4 py-4 text-sm text-secondary ${className}`}
    >
      <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-accent">
        How elimination matches work
      </h2>
      <p className="mt-3 leading-relaxed text-primary/90">{bracketHowItWorksIntro()}</p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 leading-relaxed">
        <li>
          <strong className="text-primary">Qualification</strong> ranks everyone by total
          score. Elimination matches use the <strong className="text-primary">top eight</strong>{" "}
          in this category (division).
        </li>
        <li>
          <strong className="text-primary">Quarter-finals</strong> — four one-on-one
          matches. When a judge saves the winner on <strong className="text-primary">
            Match scoring</strong>, that archer is <strong className="text-primary">
            placed in the correct semi-final automatically</strong> — no separate step.
        </li>
        <li>
          <strong className="text-primary">Semi-finals</strong> — two matches. Saving
          a winner sends them to the <strong className="text-primary">gold final</strong>
          . After <strong className="text-primary">both</strong> semis are decided, the
          two losers are <strong className="text-primary">filled into the bronze match
          </strong> automatically.
        </li>
        <li>
          The two archers who <strong className="text-primary">lost</strong> in the
          semis shoot the <strong className="text-primary">bronze</strong> match for
          3rd place.
        </li>
        <li>
          A <strong className="text-primary">highlighted</strong> name on the display
          is the match winner. Strikethrough means they were eliminated in that match.
        </li>
      </ol>
      <p className="mt-4 text-xs text-secondary">
        Elimination matches are built automatically when qualification finishes, or from
        Admin → “Generate elimination matches”. Judges record winners under Judge → Match
        scoring.
      </p>
    </aside>
  );
}
