import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-20 h-20 bg-red-50 text-[#E11A22] rounded-3xl flex items-center justify-center text-3xl font-black mb-4 shadow-sm">
        404
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-[#0A2540] tracking-tight">
        Page Not Found
      </h1>
      <p className="mt-2 text-sm text-gray-500 max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#E11A22] hover:bg-[#c8141b] text-white font-bold text-sm shadow-md transition-all"
      >
        Back to Home
      </Link>
    </div>
  );
}
