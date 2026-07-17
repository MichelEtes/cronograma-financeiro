export function NavegadorMes({
  label,
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
}) {
  return (
    <div className="my-3 flex items-center justify-between">
      <button
        onClick={onPrev}
        disabled={prevDisabled}
        className="rounded-lg border border-slate-300 px-3 py-1 text-lg leading-none disabled:opacity-30"
        aria-label="Mês anterior"
      >
        ‹
      </button>
      <span className="font-semibold">{label}</span>
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="rounded-lg border border-slate-300 px-3 py-1 text-lg leading-none disabled:opacity-30"
        aria-label="Próximo mês"
      >
        ›
      </button>
    </div>
  );
}
