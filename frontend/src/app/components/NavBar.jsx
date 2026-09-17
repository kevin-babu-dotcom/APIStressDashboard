// frontend/app/components/NavBar.jsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', label: 'Overview' },
  { href: '/test', label: 'Stress Test' },
  { href: '/targets', label: 'Targets' },
];

const NavBar = () => {
  const pathname = usePathname();

  return (
    <nav className="flex space-x-2 border-b-2 border-white pb-4 mb-8">
      {TABS.map((tab) => {
        const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
              isActive ? 'bg-white text-black' : 'text-white hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default NavBar;
