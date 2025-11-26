type BadgeProps = {
  label: string;
};

export function Badge({ label }: BadgeProps) {
  return (
    <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 border border-white/10 shadow-inner shadow-white/5">
      {label}
    </span>
  );
}

export default Badge;
