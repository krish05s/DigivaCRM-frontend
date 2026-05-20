"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import axios from "redaxios";
import { Bell, Activity, Clock } from "lucide-react";

export default function Header() {
  const [activities, setActivities] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Remove search
  const router = useRouter();
  const pathname = usePathname();
  const [salesOpen, setSalesOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [mobileSalesOpen, setMobileSalesOpen] = useState(false);
  const [mobileCustomerOpen, setMobileCustomerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close all menus when navigation occurs
  useEffect(() => {
    setMobileMenuOpen(false);
    setCustomerOpen(false);
    setSalesOpen(false);
    setMobileCustomerOpen(false);
    setMobileSalesOpen(false);
  }, [pathname]);

  const salesRef = useRef(null);
  const customerRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (salesRef.current && !salesRef.current.contains(event.target)) {
        setSalesOpen(false);
      }

      if (customerRef.current && !customerRef.current.contains(event.target)) {
        setCustomerOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlelogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/");
  };

  // Lead Notification

  const handleMarkAsRead = async (id) => {
    try {
      const currentToken = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${currentToken}` } };
      await axios.patch(
        `${API_BASE}/api/activities/mark-as-read/${id}`,
        {},
        config,
      );
      setActivities(
        activities.map((a) => (a.id === id ? { ...a, is_read: 1 } : a)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const currentToken = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${currentToken}` } };
      await axios.patch(`${API_BASE}/api/activities/mark-all-read`, {}, config);
      setActivities(activities.map((a) => ({ ...a, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  // useEffect(() => {
  //   fetchData();
  // }, [fetchData]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const currentToken = localStorage.getItem("token");

        if (!currentToken) return;

        const config = {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        };

        const res = await axios.get(`${API_BASE}/api/activities/read`, config);

        setActivities(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchActivities();
  }, []);

  return (
    <header className="sticky top-0 z-50 flex flex-col md:flex-row items-center justify-between px-4 sm:px-8 py-4 shadow-sm bg-white">
      <div className="flex w-full md:w-auto items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Image
            src="/DigivaLogo.png"
            alt="Company Logo"
            width={85}
            height={85}
            className="object-contain"
          />
        </div>

        {/* Hamburger Icon (Mobile) */}
        <div className="md:hidden flex items-center gap-2">
          {/* Mobile Notification */}
          <div className="mobile-notification-wrapper" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="mobile-notification-btn"
            >
              <Bell className="mobile-notification-icon" />

              {activities.some((a) => !a.is_read) && (
                <span className="mobile-notification-badge">
                  {activities.filter((a) => !a.is_read).length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="mobile-notification-popup">
                <div className="mobile-notification-header">
                  <h3 className="mobile-notification-title">
                    <Bell size={18} />
                    Notifications
                  </h3>

                  <button
                    onClick={handleMarkAllRead}
                    className="mobile-notification-markall"
                  >
                    Mark all
                  </button>
                </div>

                <div className="mobile-notification-body">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`p-3 rounded-xl mb-2 ${
                        activity.is_read
                          ? "mobile-notification-item-read"
                          : "mobile-notification-item-unread"
                      }`}
                    >
                      <p className="mobile-notification-text">
                        {activity.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-800 focus:outline-none p-2"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation Links (Desktop) */}
      <nav className="navbar-menu">
        <Link href="/dashboard" className="navbar-link">
          Dashboard
        </Link>

        <div className="relative" ref={customerRef}>
          <button
            onClick={() => setCustomerOpen(!customerOpen)}
            className="navbar-dropdown-btn"
          >
            Customer ▾
          </button>

          {customerOpen && (
            <div className="navbar-dropdown-menu">
              <Link href="/customer-list" className="navbar-dropdown-item">
                Customers
              </Link>
              <Link href="/contacts" className="navbar-dropdown-item">
                Contact Details
              </Link>
              <Link href="/contactDesignation" className="navbar-dropdown-item">
                Contact Designation
              </Link>
            </div>
          )}
        </div>

        <div className="relative" ref={salesRef}>
          <button
            onClick={() => setSalesOpen(!salesOpen)}
            className="navbar-dropdown-btn"
          >
            Sales ▾
          </button>

          {salesOpen && (
            <div className="navbar-dropdown-menu">
              <Link href="/sales/lead" className="navbar-dropdown-item">
                Lead
              </Link>
              <Link href="/sales/quotation" className="navbar-dropdown-item">
                Quotation
              </Link>
              <Link href="/sales/proforma" className="navbar-dropdown-item">
                Proforma Invoice
              </Link>
            </div>
          )}
        </div>
        <Link href="/contracts" className="navbar-link">
          Contracts
        </Link>
        <Link href="/tasks" className="navbar-link">
          Task List
        </Link>
        <Link href="/setup" className="navbar-link">
          Settings
        </Link>
      </nav>

      {/* Logout Button (Desktop) */}
      <div className="hidden md:flex items-center gap-6">
        {/* Notification Bell */}
        <div className="notification-wrapper " ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="notification-btn "
          >
            <Bell
              className={`w-5 h-5 ${
                activities.some((a) => !a.is_read)
                  ? "notification-icon-active"
                  : "notification-icon"
              }`}
            />

            {activities.some((a) => !a.is_read) && (
              <span className="notification-badge">
                {activities.filter((a) => !a.is_read).length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              {/* Arrow */}
              <div className="notification-arrow"></div>

              {/* Header */}
              <div className="notification-header">
                <h3 className="notification-title">
                  <Bell size={18} />
                  Notifications
                </h3>

                <button
                  onClick={handleMarkAllRead}
                  className="notification-readall"
                >
                  Mark all read
                </button>
              </div>

              {/* Notifications */}
              <div className="notification-body">
                {activities.length === 0 ? (
                  <div className="notification-empty">
                    No notifications found
                  </div>
                ) : (
                  activities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`p-3 rounded-xl mb-2 ${
                        activity.is_read
                          ? "notification-item-read"
                          : "notification-item-unread"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            activity.is_read
                              ? "notification-activity-active"
                              : "notification-activity"
                          }`}
                        >
                          <Activity size={14} />
                        </div>

                        <div className="flex-1">
                          <p className="notification-message">
                            {activity.message}
                          </p>

                          <div className="flex justify-between items-center mt-2">
                            <span className="notification-time ">
                              <Clock size={10} />
                              {new Date(activity.created_at).toLocaleString()}
                            </span>

                            {!activity.is_read && (
                              <button
                                onClick={() => handleMarkAsRead(activity.id)}
                                className="notification-read-btn "
                              >
                                Mark Read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button onClick={handlelogout} className="logout-btn">
          <i className="bi bi-box-arrow-right"></i>
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <nav className="mobile-menu ">
          <Link
            onClick={() => setMobileMenuOpen(false)}
            href="/dashboard"
            className="mobile-menu-link"
          >
            Dashboard
          </Link>

          <div className="mobile-dropdown">
            <button
              onClick={() => setMobileCustomerOpen(!mobileCustomerOpen)}
              className="mobile-dropdown-btn"
            >
              Customer{" "}
              <span className="mobile-dropdown-icon">
                {mobileCustomerOpen ? "▴" : "▾"}
              </span>
            </button>
            {mobileCustomerOpen && (
              <div className="mobile-submenu">
                <Link
                  href="/customer-list"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mobile-submenu-link"
                >
                  Customers
                </Link>
                <Link
                  href="/contacts"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mobile-submenu-link"
                >
                  Contact Details
                </Link>
                <Link
                  href="/contactDesignation"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mobile-submenu-link"
                >
                  Contact Designation
                </Link>
              </div>
            )}
          </div>

          <div className="w-full">
            <button
              onClick={() => setMobileSalesOpen(!mobileSalesOpen)}
              className="mobile-dropdown-btn "
            >
              Sales{" "}
              <span className="ml-1 text-gray-400">
                {mobileSalesOpen ? "▴" : "▾"}
              </span>
            </button>
            {mobileSalesOpen && (
              <div className="mobile-submenu">
                <Link
                  href="/sales/lead"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mobile-submenu-link"
                >
                  Lead
                </Link>
                <Link
                  href="/sales/quotation"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mobile-submenu-link"
                >
                  Quotation
                </Link>
                <Link
                  href="/sales/proforma"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mobile-submenu-link"
                >
                  Proforma Invoice
                </Link>
              </div>
            )}
          </div>
          <Link
            onClick={() => setMobileMenuOpen(false)}
            href="/contracts"
            className="mobile-menu-link"
          >
            Contracts
          </Link>
          <Link
            onClick={() => setMobileMenuOpen(false)}
            href="/tasks"
            className="mobile-menu-link"
          >
            Task List
          </Link>
          <Link
            onClick={() => setMobileMenuOpen(false)}
            href="/setup"
            className="mobile-menu-link"
          >
            Settings
          </Link>

          {/* Logout Option Inside Menu (Mobile Only) */}
          <div className="mobile-logout-wrapper">
            <button
              onClick={handlelogout}
              className="mobile-logout-btn"
            >
              <i className="bi bi-box-arrow-right mobile-logout-icon "></i>
              Logout
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}

// header in logo
