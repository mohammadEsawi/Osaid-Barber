interface Props { fullscreen?: boolean; size?: 'sm' | 'md' | 'lg'; }

const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };

export default function LoadingSpinner({ fullscreen, size = 'md' }: Props) {
  const spinner = (
    <div className={`${sizes[size]} border-2 border-zinc-700 border-t-amber-500 rounded-full animate-spin`} />
  );
  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-zinc-700 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">جاري التحميل...</p>
        </div>
      </div>
    );
  }
  return spinner;
}
