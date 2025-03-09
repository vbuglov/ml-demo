import { Outlet, Link } from 'react-router';
import cn from 'classnames';
import React, { useState, useMemo } from 'react';
import routes from './router.jsx';

const defoultMenuClass =
  'fixed top-0 left-0 z-40 h-screen p-4 overflow-y-auto transition-transform bg-gray-100 w-80 dark:bg-gray-800 transform-none';

const Layout = () => {
  const [isOpen, setIsOpen] = useState(false);

  const menuClass = useMemo(() => {
    return cn(defoultMenuClass, isOpen ? '' : '-translate-x-full');
  });

  const handleChangeOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="min-h-screen">
      <div className="text-center fixed mb-20 left-0 right-0 flex justify-center pt-4">
        <div className="flex max-w-[500px] w-full px-4 justify-between items-center border-b border-gray-200 pb-4">
          <span className="text-2xl">ML DEMO</span>
          <button onClick={handleChangeOpen} className="text-gray-800 text-xl focus:outline-none">
            &#9776;
          </button>
        </div>
      </div>

      <div
        id="drawer-navigation"
        className={menuClass}
        tabIndex="-1"
        aria-labelledby="drawer-navigation-label"
        role="dialog"
        aria-modal="true">
        <div className="flex items-center w-full justify-between">
          <h5
            id="drawer-navigation-label"
            className="text-base font-semibold text-gray-500 uppercase dark:text-gray-400">
            Menu
          </h5>
          <button
            type="button"
            data-drawer-hide="drawer-navigation"
            onClick={handleChangeOpen}
            className="bg-gray-100"
            aria-controls="drawer-navigation">
            <svg
              className="w-3 h-3"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              width="30px"
              viewBox="0 0 14 14">
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
              />
            </svg>
          </button>
        </div>
        <div className="py-4 overflow-y-auto">
          <ul className="space-y-2 font-medium">
            {routes.map(({ title, icon, path }) => {
              return (
                <li key={path}>
                  <Link
                    to={path}
                    href="#"
                    className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                    <i className={`ri-${icon} text-slate-500 text-xl`}></i>
                    <span className="flex-1 ms-3 whitespace-nowrap">{title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div
        className="w-screen pt-40 w-full flex overflow-x-hidden justify-center "
        style={{
          paddingLeft: 0,
          paddingRight: 0
        }}>
        <div className="max-w-[600px] px-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
