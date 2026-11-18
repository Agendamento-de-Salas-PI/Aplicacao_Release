export default function IconButton({
  label,
  children,
  onClick,
  active = false,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`grid h-10 w-10 place-items-center border transition-colors ${active ? "border-[#b20000] bg-[#fff0f0] text-[#b20000]" : "border-[#dfe1e3] bg-white text-[#44484d] hover:bg-[#f5f5f3]"}`}
    >
      {children}
    </button>
  );
}