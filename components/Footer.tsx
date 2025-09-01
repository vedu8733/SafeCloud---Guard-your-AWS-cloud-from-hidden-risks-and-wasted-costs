"use client";
export function Footer() {
  return (
    <footer className="w-full flex items-center justify-center py-6 mt-8 glass-card shadow-glass text-sm text-gray-300">
      <span className="bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent font-semibold">
        © {new Date().getFullYear()} SafeCloud. All rights reserved.
      </span>
    </footer>
  );
}
