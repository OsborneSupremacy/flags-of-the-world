interface FeedbackProps {
  correct: boolean;
  children: React.ReactNode;
}

/** The visible result line. Screen readers get the same news from the mode's live region. */
export function Feedback({ correct, children }: FeedbackProps) {
  return (
    <p className={`feedback ${correct ? "feedback-good" : "feedback-bad"}`} aria-hidden="true">
      <span className="feedback-icon">{correct ? "✓" : "✗"}</span> {children}
    </p>
  );
}
