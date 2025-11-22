'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import NavHeader from '../NavHeader';
import NavLink from '../NavLink';

const Navbar = () => {
  const [state, setState] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const menuBtnEl = useRef();

  const navigation = [
    { name: 'Use Cases', href: '/#use-cases' },
    { name: 'AI Front Desk', href: '/#ai-front-desk' },
    { name: 'Savings Calculator', href: '/#savings-calculator' },
    { name: 'Why?', href: '/#why' },
    { name: 'Pricing', href: '/#pricing' },
    { name: 'Blog', href: '/blog' },
  ];

  useEffect(() => {
    document.onclick = (e) => {
      const target = e.target;
      if (!menuBtnEl.current.contains(target)) setState(false);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Change background after user scrolls 50px
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 ${scrolled ? 'bg-[#161032]/40 backdrop-blur-md' : 'bg-transparent'}`}
    >
      <div className="custom-screen md:hidden">
        <NavHeader menuBtnEl={menuBtnEl} state={state} onClick={() => setState(!state)} />
      </div>
      <nav
        className={`pb-5 md:text-md md:block ${state ? 'bg-gray-900 absolute z-20 top-0 inset-x-0 rounded-b-2xl shadow-xl md:bg-gray-900' : 'hidden'}`}
      >
        <div className="custom-screen items-center md:flex">
          <NavHeader state={state} onClick={() => setState(!state)} />
          <div
            className={`flex-1 items-center mt-8 text-gray-300 md:font-medium md:mt-0 md:flex ${state ? 'block' : 'hidden'} `}
          >
            <ul className="flex-1 justify-center items-center space-y-6 md:flex md:space-x-6 md:space-y-0">
              {navigation.map((item, idx) => {
                return (
                  <li key={idx} className="hover:text-gray-50">
                    <Link href={item.href} className="block">
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="gap-x-6 items-center justify-end mt-6 space-y-6 md:flex md:space-y-0 md:mt-0">
              <Link
                href="https://app.roommitra.com/login"
                className="block hover:text-gray-50"
                target="_blank"
              >
                Sign in
              </Link>
              <NavLink
                href="/contact-us"
                className="cta-btn flex items-center justify-center gap-x-1 text-sm text-white font-medium border border-gray-500 active:bg-gray-900 md:inline-flex"
              >
                Book a Demo
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </NavLink>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
