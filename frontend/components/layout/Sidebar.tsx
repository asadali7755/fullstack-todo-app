'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 min-h-screen border-r p-4">
      <nav>
        <ul className="space-y-2">
          <li>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </li>
          <li>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href="/profile">Profile</Link>
            </Button>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;