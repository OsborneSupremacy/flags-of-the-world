interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  return (
    <div className="progress">
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Session progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
      >
        <div className="progress-fill" style={{ width: `${(current / total) * 100}%` }} />
      </div>
      <span className="progress-count">
        {current} / {total}
      </span>
    </div>
  );
}
