"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "redaxios";
import Link from "next/link";
import { toast } from "react-toastify";
import { ChevronUpIcon, ChevronDownIcon } from "lucide-react";
import Header from "@/app/components/header";
import { useRouter } from "next/navigation";
import useAuth from "@/app/components/useAuth";
import { hasRoleAccess } from "@/utils/roleAccess";
import CheckPermission from "@/app/components/CheckPermission";

export default function Page() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [users, setUsers] = useState([]);
  const [scrollOffsets, setScrollOffsets] = useState({});
  const [roles, setRoles] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    mobile: "",
    date_of_birth: "",
    role: "",
    designation: "",
    date_of_joining: "",
    status: "",
  });
  const [viewProduct, setViewProduct] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // ✅ NEW: View User Modal state
  const [showViewUserModal, setShowViewUserModal] = useState(false);
  const [viewUserData, setViewUserData] = useState(null);

  // ✅ NEW: Edit User Modal states
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editUserSubmitting, setEditUserSubmitting] = useState(false);
  const [editUserShowPassword, setEditUserShowPassword] = useState(false);
  const [editUserShowConfirmPassword, setEditUserShowConfirmPassword] = useState(false);
  const [editUserForm, setEditUserForm] = useState({
    id: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    mobile: "",
    date_of_birth: "",
    date_of_joining: "",
    role: "",
    organization: "",
    designation: "",
    country: "",
    state: "",
    city: "",
    pincode: "",
    password: "",
    confirm_password: "",
    address: "",
  });

  // ✅ NEW: Add User Modal states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [emailExists, setEmailExists] = useState(false);
  const [addUserSubmitting, setAddUserSubmitting] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    mobile: "",
    date_of_birth: "",
    date_of_joining: "",
    role: "",
    organization: "",
    designation: "",
    country: "",
    state: "",
    city: "",
    pincode: "",
    password: "",
    confirm_password: "",
    address: "",
  });

  const router = useRouter();

  useAuth();

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

  const APIBase = `${API_BASE}/api/manage-user`;

  // Standardized Micara IMS Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);


  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${APIBase}/read`, {
        params: {
          search1: filters.name,
          search2: filters.email,
          search3: filters.mobile,
          search4: filters.date_of_birth,
          search5: filters.role,
          search6: filters.designation,
          search7: filters.date_of_joining,
          search8: filters.status,
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to load Users");
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchData();
    }, 300); // 300ms debounce

    return () => clearTimeout(delay);
  }, [filters]);

  // Reset page when filters or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, itemsPerPage]);


  useEffect(() => {
    fetchData();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Standardized Pagination Calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = users.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(users.length / itemsPerPage);

  const getSlidingPages = () => {
    const visibleCount = 5;
    if (totalPages <= visibleCount) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let start = currentPage - Math.floor(visibleCount / 2);
    let end = currentPage + Math.floor(visibleCount / 2);
    if (start < 1) {
      start = 1;
      end = visibleCount;
    }
    if (end > totalPages) {
      end = totalPages;
      start = totalPages - visibleCount + 1;
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };


  // to fetch active roles name
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/api/role-master/role-name`, {
          params: { status: 1 },
          headers: { Authorization: `Bearer ${token}` }
        });
        setRoles(res.data.data);
      } catch (err) {
        console.error("Failed to fetch designations:", err);
      }
    };

    fetchRoles();
  }, []);

  // to fetch active contact designation
  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/api/contact/read`, {
          params: { status: 1 },
          headers: { Authorization: `Bearer ${token}` }
        });
        setDesignations(res.data || res.data.data);
      } catch (err) {
        console.error("Failed to fetch designations:", err);
      }
    };

    fetchDesignations();
  }, []);

  // ✅ NEW: fetch organizations for Add User modal
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/api/organizations/organization-name`, {
          params: { status: 1 },
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrganizations(res.data.data);
      } catch (err) {
        console.error("Failed to fetch organizations:", err);
      }
    };
    fetchOrganizations();
  }, []);

  // ✅ NEW: ADD USER (modal) handlers
  const checkEmailExists = async (email) => {
    if (!email) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/manage-user/read-email`, {
        params: { email },
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmailExists(!!res.data.exists);
    } catch (err) {
      console.error("Email check failed:", err);
      setEmailExists(false);
    }
  };

  const handleAddUserChange = (e) => {
    const { name, value } = e.target;
    setAddUserForm((prev) => ({ ...prev, [name]: value }));

    if (name === "email") {
      clearTimeout(window.emailCheckTimeout);
      window.emailCheckTimeout = setTimeout(() => checkEmailExists(value), 600);
    }
  };

  const resetAddUserForm = () => {
    setAddUserForm({
      first_name: "",
      middle_name: "",
      last_name: "",
      email: "",
      mobile: "",
      date_of_birth: "",
      date_of_joining: "",
      role: "",
      organization: "",
      designation: "",
      country: "",
      state: "",
      city: "",
      pincode: "",
      password: "",
      confirm_password: "",
      address: "",
    });
    setEmailExists(false);
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();

    if (emailExists) {
      toast.error("Email already exists. Please use a different one.");
      return;
    }
    if (addUserForm.password !== addUserForm.confirm_password) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      setAddUserSubmitting(true);
      const payload = {
        first_name: addUserForm.first_name,
        middle_name: addUserForm.middle_name,
        last_name: addUserForm.last_name,
        email: addUserForm.email,
        mobile: addUserForm.mobile,
        date_of_birth: addUserForm.date_of_birth,
        date_of_joining: addUserForm.date_of_joining,
        role: addUserForm.role,
        organization: addUserForm.organization,
        designation: addUserForm.designation,
        country: addUserForm.country,
        state: addUserForm.state,
        city: addUserForm.city,
        pincode: addUserForm.pincode,
        password: addUserForm.password,
        address: addUserForm.address,
      };

      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE}/api/manage-user/insert`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 201 || res.status === 200) {
        toast.success("User added successfully!");
        resetAddUserForm();
        setShowAddUserModal(false);
        fetchData();
      } else {
        toast.error("Something went wrong. Try again!");
      }
   } catch (err) {
      toast.error("Failed to add user. Something went wrong!");
    } finally {
      setAddUserSubmitting(false);
    }
  };

  // ✅ NEW: VIEW USER (modal) handler
  const formatDateForView = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleViewUser = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${APIBase}/read/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setViewUserData(res.data.data);
      setShowViewUserModal(true);
    } catch (err) {
      console.error("Failed to load user:", err);
      toast.error("Failed to load user details");
    }
  };

  // ✅ NEW: EDIT USER (modal) handlers
  const formatDateForEdit = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 10);
  };

  const handleEditUser = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${APIBase}/read/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = res.data.data;

      const fullName = d?.name ? d.name.trim().split(" ") : [];
      let first = fullName[0] || "";
      let middle = fullName.length === 3 ? fullName[1] : "";
      let last = fullName.length === 3 ? fullName[2] : fullName[1] || "";

      setEditUserForm({
        id: id,
        first_name: first,
        middle_name: middle,
        last_name: last,
        email: d.email || "",
        mobile: d.mobile || "",
        date_of_birth: formatDateForEdit(d.date_of_birth),
        date_of_joining: formatDateForEdit(d.date_of_joining),
        role: d.role || "",
        organization: d.organization || "",
        designation: d.designation || "",
        country: d.country || "",
        state: d.state || "",
        city: d.city || "",
        pincode: d.pincode || "",
        password: d.password || "",
        confirm_password: d.password || "",
        address: d.address || "",
      });
      setShowEditUserModal(true);
    } catch (err) {
      console.error("Failed to load user:", err);
      toast.error("Failed to load user data");
    }
  };

  const handleEditUserChange = (e) => {
    const { name, value } = e.target;
    setEditUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();

    const fullName = `${editUserForm.first_name} ${editUserForm.middle_name} ${editUserForm.last_name}`
      .replace(/\s+/g, " ")
      .trim();

    if (editUserForm.password !== editUserForm.confirm_password) {
      toast.error("Passwords do not match!");
      return;
    }

    const sendData = { ...editUserForm, name: fullName };

    try {
      setEditUserSubmitting(true);
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${APIBase}/update/${editUserForm.id}`,
        sendData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200) {
        toast.success("User updated successfully!");
        setShowEditUserModal(false);
        fetchData();
      } else {
        toast.error("Update failed!");
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Failed to update user");
    } finally {
      setEditUserSubmitting(false);
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${APIBase}/status/${id}`, {
        status: currentStatus === 1 ? 0 : 1,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers((prevData) =>
        prevData.map((item) =>
          item.id === id
            ? { ...item, status: currentStatus === 1 ? 0 : 1 }
            : item,
        ),
      );
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const resetFilter = () => {
    setFilters({
      name: "",
      email: "",
      mobile: "",
      date_of_birth: "",
      role: "",
      designation: "",
      date_of_joining: "",
      status: "",
    });
  };

  const isSuperAdmin = mounted ? hasRoleAccess(["Super Admin"]) : false;

  return (
    <>
      <Header />
      <CheckPermission allowedRoles={["Super Admin", "Admin"]}>
        <div className="bg-gray-100">
        {/* Header */}
        <div className="bg-white w-full shadow-lg p-3 mt-1 mb-5 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <div className="hidden sm:flex items-center text-gray-700 w-full sm:w-auto">
            <p className="flex items-center flex-wrap">
              <Link
                href="/dashboard"
                className="mx-2 text-xl text-gray-400 hover:text-indigo-600"
              >
                <i className="bi bi-house"></i>
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link
                href="/setup"
                className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
              >
                Settings
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link
                href="/setup/manage-user"
                className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
              >
                Manage User
              </Link>
            </p>
          </div>

         <div className="w-full sm:w-auto">
            {isSuperAdmin && (
              <button
                onClick={() => setShowAddUserModal(true)}
                className="block w-full text-center bg-blue-800 text-white px-5 py-2 rounded-sm shadow hover:bg-blue-900 font-bold text-sm"
              >
                + ADD USER
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mx-6 md:hidden mt-3 relative z-40">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full flex items-center justify-between text-orange-500 font-semibold bg-orange-50 px-4 py-2 rounded-sm border border-orange-200 shadow-sm transition-all"
          >
            <span className="flex items-center gap-2">
              <i className="bi bi-funnel"></i> Filters
            </span>
            <i
              className={`bi bi-chevron-down transition-transform ${showMobileFilters ? "rotate-180" : ""}`}
            ></i>
          </button>
        </div>

        <div
          className={`
                    ${showMobileFilters ? "absolute left-6 right-6 top-50 bg-white p-5 shadow-2xl border border-gray-100 z-50 rounded-lg grid grid-cols-2 gap-3 mt-1" : "hidden"} 
                    md:mx-6 md:flex md:flex-wrap md:items-center md:gap-x-5 md:gap-y-2 md:mt-3 md:mb-5 md:relative md:bg-transparent md:p-0 md:shadow-none md:border-none md:z-auto
                `}
        >
          <input
            type="text"
            name="name"
            placeholder="Name"
            className="p-2 w-full md:w-52 border border-orange-300 md:border text-gray-700 bg-white rounded-sm outline-none text-sm"
            value={filters.name}
            onChange={handleFilterChange}
          />

          <input
            type="text"
            name="email"
            placeholder="Email"
            className="p-2 w-full md:w-52 border border-orange-300 md:border text-gray-700 bg-white rounded-sm outline-none text-sm"
            value={filters.email}
            onChange={handleFilterChange}
          />

          <input
            type="text"
            name="mobile"
            placeholder="Mobile No."
            className="p-2 w-full md:w-52 border border-orange-300 md:border text-gray-700 bg-white rounded-sm outline-none text-sm"
            value={filters.mobile}
            onChange={handleFilterChange}
          />

          <div className="flex flex-col border border-orange-300 md:border bg-white rounded-sm px-2 w-full md:w-auto">
            <span className="text-[10px] text-gray-400 uppercase font-bold pt-1">
              DOB
            </span>
            <input
              type="date"
              name="date_of_birth"
              value={filters.date_of_birth}
              onChange={handleFilterChange}
              className="p-1 w-full md:w-35 outline-none text-sm"
            />
          </div>

          <select
            name="role"
            value={filters.role}
            onChange={handleFilterChange}
            className="p-2 w-full md:w-53 md:mx-2 border border-orange-300 md:border text-gray-500 bg-white rounded-sm outline-none text-sm"
          >
            <option value="">Role</option>
            {roles.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            name="designation"
            value={filters.designation}
            onChange={handleFilterChange}
            className="p-2 w-full md:w-53 md:mx-2 border border-orange-300 md:border text-gray-500 bg-white rounded-sm outline-none text-sm"
          >
            <option value="">Designation</option>
            {designations.map((item) => (
              <option key={item.id || item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>

          <div className="flex flex-col border border-orange-300 md:border bg-white rounded-sm px-2 w-full md:w-auto">
            <span className="text-[10px] text-gray-400 uppercase font-bold pt-1">
              DOJ
            </span>
            <input
              type="date"
              name="date_of_joining"
              value={filters.date_of_joining}
              onChange={handleFilterChange}
              className="p-1 w-full md:w-35 outline-none text-sm"
            />
          </div>

          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="p-2 w-full md:w-53 md:mx-2 border border-orange-300 md:border text-gray-500 bg-white rounded-sm outline-none text-sm"
          >
            <option value="">Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>

          <div className="flex gap-2 col-span-2">
            <button
              type="button"
              onClick={() => {
                resetFilter();
                setShowMobileFilters(false);
              }}
              className="border border-gray-300 w-full md:w-auto cursor-pointer rounded-sm p-2 bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm text-center font-semibold"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setShowMobileFilters(false)}
              className="md:hidden border border-orange-300 w-full cursor-pointer rounded-sm p-2 bg-orange-100 text-orange-700 hover:bg-orange-200 text-sm text-center font-semibold"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Table */}
        <form className="p-1 mx-4">
          <div className="bg-white shadow-md rounded-2xl p-1 border border-gray-200">
            <div className="overflow-x-auto overflow-y-auto max-h-[500px] custom-scroll">
              <table className=" w-full text-sm text-left text-gray-700 border-collapse mt-2 mb-2 whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-900  text-xs">
                  <tr>
                    <th className="py-3 px-5 w-10">#</th>
                    <th className="py-3 px-4">Name</th>

                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Mobile No.</th>
                    <th className="py-3 px-4">Date of Birth</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Date of Joining</th>
                    {mounted && hasRoleAccess(["Super Admin", "Admin"]) && (
                      <th className="py-3 px-4">Status</th>
                    )}
                    {mounted && hasRoleAccess(["Super Admin", "Admin"]) && (
                      <th className="py-3 px-4">Action</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((item, index) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-gray-50 transition`}
                      >
                        <td className="py-1 px-4 text-gray-600">{index + 1}</td>
                        <td className="py-2 px-4">{item.name}</td>
                        <td className="py-1 px-4 text-gray-800">
                          {item.email}
                          <button
                            type="button"
                            onClick={() => {
                              copyToClipboard(item.email);
                              toast.success("Copied!");
                            }}
                            className="p-1 mx-1 rounded hover:bg-gray-200"
                            title="Copy Email"
                          >
                            <i className="bi bi-copy"></i>
                          </button>
                        </td>
                        <td className="py-2 px-4">{item.mobile}</td>
                        <td className="py-2 px-4">
                          {formatDate(item.date_of_birth)}
                        </td>
                        <td className="py-2 px-4">{item.role}</td>
                        <td className="py-2 px-4">{item.designation}</td>
                        <td className="py-2 px-4">
                          {formatDate(item.date_of_joining)}
                        </td>
                        {mounted && hasRoleAccess(["Super Admin", "Admin"]) && (
                          <td className="py-2 px-4">
                            {isSuperAdmin ? (
                              <label className="inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={item.status === 1}
                                  onChange={() =>
                                    handleToggle(item.id, item.status)
                                  }
                                />
                                <div
                                  className={`relative w-12 h-6 rounded-full transition-all duration-300 ${item.status === 1 ? "bg-green-500" : "bg-gray-300"}`}
                                >
                                  <div
                                    className={`absolute top-1 left-1 w-4 h-3 bg-white rounded-full transition-all duration-300 ${item.status === 1 ? "translate-x-6" : "translate-x-1"}`}
                                  ></div>
                                </div>
                              </label>
                            ) : (
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${item.status === 1 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                                {item.status === 1 ? "Active" : "Inactive"}
                              </span>
                            )}
                          </td>
                        )}
                        {mounted && hasRoleAccess(["Super Admin", "Admin"]) && (
                          <td className="py-2 px-4 text-lg">
                            <button
                              type="button"
                              onClick={() => handleViewUser(item.id)}
                              className="text-gray-400 text-xl hover:text-green-700 mx-1"
                              title="View User"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            {isSuperAdmin && (
                              <button
                                type="button"
                                onClick={() => handleEditUser(item.id)}
                                className="text-gray-400 hover:text-blue-500 text-lg mx-1"
                                title="Edit User"
                              >
                                <i className="bi bi-pencil-square"></i>
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="10"
                        className="text-center text-gray-500 py-3"
                      >
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* ✅ STANDARDIZED MICARA IMS PAGINATION */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white rounded-b-lg">
              {/* Left side: Rows per page selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500 font-medium">
                  Rows per page:
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all cursor-pointer font-medium"
                >
                  {[10, 20, 100, 200].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>


              {/* Right side: Navigation buttons (only if totalPages > 1) */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
                  {/* Previous Button */}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <i className="bi bi-chevron-left text-sm"></i>
                  </button>

                  {/* Page Buttons */}
                  <div className="flex items-center gap-1.5">
                    {getSlidingPages().map((page) => (
                      <button
                        type="button"
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${
                          currentPage === page
                            ? "bg-[#212121] text-white shadow-md shadow-black/10"
                            : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  {/* Next Button */}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <i className="bi bi-chevron-right text-sm"></i>
                  </button>
                </div>
              )}
            </div>

        </div>
        </form>

        {/* ✅ NEW: ADD USER MODAL */}
        {showAddUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 p-4">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-xl text-black font-semibold">Add User</h2>
                <button
                  onClick={() => {
                    setShowAddUserModal(false);
                    resetAddUserForm();
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:text-blue-800 transition-all"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddUserSubmit} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">First Name *</label>
                    <input type="text" name="first_name" value={addUserForm.first_name} onChange={handleAddUserChange} className="w-full border rounded-sm px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Middle Name</label>
                    <input type="text" name="middle_name" value={addUserForm.middle_name} onChange={handleAddUserChange} className="w-full border rounded-sm px-3 py-2" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Last Name *</label>
                    <input type="text" name="last_name" value={addUserForm.last_name} onChange={handleAddUserChange} className="w-full border rounded-sm px-3 py-2" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={addUserForm.email}
                      onChange={handleAddUserChange}
                      className={`w-full border rounded-sm px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200 ${emailExists ? "border-red-500" : ""}`}
                      required
                    />
                    <p className={`text-red-500 text-xs transition-all duration-300 ease-in-out ${emailExists ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"}`}>
                      Email already exists
                    </p>
                  </div>

                  <div className="mb-2">
                    <label className="block text-sm text-gray-500 mb-1">Mobile Number *</label>
                    <input type="text" name="mobile" value={addUserForm.mobile} onChange={handleAddUserChange} className="w-full border rounded-sm px-3 py-2" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Date of Birth *</label>
                    <input type="date" name="date_of_birth" value={addUserForm.date_of_birth} onChange={handleAddUserChange} className="w-full border rounded-sm px-3 py-2" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Date of Joining *</label>
                    <input type="date" name="date_of_joining" value={addUserForm.date_of_joining} onChange={handleAddUserChange} className="w-full border rounded-sm px-3 py-2" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Role *</label>
                    <select name="role" value={addUserForm.role} onChange={handleAddUserChange} className="w-full border rounded-sm px-3 py-2 bg-white">
                      <option value="">Select Role</option>
                      {roles.map((item) => (
                        <option key={item.id} value={item.name}>{item.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-2">
                    <label className="block text-sm text-gray-500 mb-1">Organization</label>
                    <select name="organization" value={addUserForm.organization} onChange={handleAddUserChange} className="w-full border rounded-sm px-3 py-2 bg-white">
                      <option value="">Select Organization</option>
                      {organizations.map((item) => (
                        <option key={item.id || item.organization_name} value={item.organization_name}>{item.organization_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Designation *</label>
                    <select name="designation" value={addUserForm.designation} onChange={handleAddUserChange} className="w-full border rounded-sm px-3 py-2">
                      <option value="">Select Contact Designation</option>
                      {designations.map((item) => (
                        <option key={item.id || item.name} value={item.name}>{item.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Country</label>
                    <input type="text" name="country" value={addUserForm.country} onChange={handleAddUserChange} className="w-full border rounded-sm px-3 py-2" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 mb-1">State</label>
                    <input type="text" name="state" value={addUserForm.state} onChange={handleAddUserChange} className="w-full border rounded-sm px-3 py-2" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 mb-1">City</label>
                    <input type="text" name="city" value={addUserForm.city} onChange={handleAddUserChange} className="w-full border rounded-sm px-3 py-2" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Pin Code</label>
                    <input type="text" name="pincode" value={addUserForm.pincode} onChange={handleAddUserChange} className="w-full border rounded-sm px-3 py-2" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Password *</label>
                    <input type="password" name="password" value={addUserForm.password} onChange={handleAddUserChange} className="w-full border rounded-sm px-3 py-2" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Confirm Password *</label>
                    <input type="password" name="confirm_password" value={addUserForm.confirm_password} onChange={handleAddUserChange} className="w-full border rounded-sm px-3 py-2" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Address</label>
                    <textarea name="address" value={addUserForm.address} onChange={handleAddUserChange} rows="2" className="w-full border rounded-sm px-3 py-2"></textarea>
                  </div>
                </div>

              <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="submit"
                    disabled={addUserSubmitting}
                    className={`px-5 py-2 bg-blue-800 text-white rounded-sm hover:bg-blue-900 ${addUserSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                    {addUserSubmitting ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddUserModal(false);
                      resetAddUserForm();
                    }}
                    className="px-5 py-2 bg-gray-100 rounded-sm text-gray-700 border hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ✅ NEW: VIEW USER MODAL */}
        {showViewUserModal && viewUserData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 p-4">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-xl text-black font-semibold">View User</h2>
                <button
                  onClick={() => setShowViewUserModal(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:text-blue-800 transition-all"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  {(() => {
                    const fullName = viewUserData?.name ? viewUserData.name.trim().split(" ") : [];
                    const first = fullName[0] || "-";
                    const middle = fullName.length === 3 ? fullName[1] : "-";
                    const last = fullName.length === 3 ? fullName[2] : fullName[1] || "-";
                    const fields = [
                      { label: "First Name", value: first },
                      { label: "Middle Name", value: middle },
                      { label: "Last Name", value: last },
                      { label: "Email", value: viewUserData.email || "-" },
                      { label: "Mobile Number", value: viewUserData.mobile || "-" },
                      { label: "Date Of Birth", value: formatDateForView(viewUserData.date_of_birth) || "-" },
                      { label: "Date Of Joining", value: formatDateForView(viewUserData.date_of_joining) || "-" },
                      { label: "Role", value: viewUserData.role || "-" },
                      { label: "Designation", value: viewUserData.designation || "-" },
                      { label: "Country", value: viewUserData.country || "-" },
                      { label: "State", value: viewUserData.state || "-" },
                      { label: "City", value: viewUserData.city || "-" },
                      { label: "Pin Code", value: viewUserData.pincode || "-" },
                      { label: "Address", value: viewUserData.address || "-" },
                    ];
                    return fields.map((f) => (
                      <div key={f.label}>
                        <p className="text-sm text-gray-500">{f.label}</p>
                        <p className="font-semibold text-gray-800">{f.value}</p>
                      </div>
                    ));
                  })()}
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowViewUserModal(false)}
                    className="px-5 py-2 border rounded-sm text-blue-800 border-blue-800 hover:bg-blue-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ NEW: EDIT USER MODAL */}
        {showEditUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 p-4">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-xl text-black font-semibold">Update User</h2>
                <button
                  onClick={() => setShowEditUserModal(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:text-blue-800 transition-all"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleEditUserSubmit} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div>
                    <label className="block text-sm mb-1">First Name *</label>
                    <input type="text" name="first_name" value={editUserForm.first_name} onChange={handleEditUserChange} className="w-full border rounded-sm px-3 py-2" />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Middle Name</label>
                    <input type="text" name="middle_name" value={editUserForm.middle_name} onChange={handleEditUserChange} className="w-full border rounded-sm px-3 py-2" />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Last Name *</label>
                    <input type="text" name="last_name" value={editUserForm.last_name} onChange={handleEditUserChange} className="w-full border rounded-sm px-3 py-2" />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Email *</label>
                    <input type="email" name="email" value={editUserForm.email} onChange={handleEditUserChange} className="w-full border rounded-sm px-3 py-2" />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Mobile *</label>
                    <input type="text" name="mobile" value={editUserForm.mobile} onChange={handleEditUserChange} className="w-full border rounded-sm px-3 py-2" />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Date of Birth *</label>
                    <input type="date" name="date_of_birth" value={editUserForm.date_of_birth} onChange={handleEditUserChange} className="w-full border rounded-sm px-3 py-2" />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Date of Joining *</label>
                    <input type="date" name="date_of_joining" value={editUserForm.date_of_joining} onChange={handleEditUserChange} className="w-full border rounded-sm px-3 py-2" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Role *</label>
                    <select name="role" value={editUserForm.role} onChange={handleEditUserChange} className="w-full border rounded-sm px-3 py-2 bg-white">
                      <option value="">Select Role</option>
                      {roles.map((item) => (
                        <option key={item.id} value={item.name}>{item.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Organization</label>
                    <select name="organization" value={editUserForm.organization} onChange={handleEditUserChange} className="w-full border rounded-sm px-3 py-2">
                      <option value="">Select Organization</option>
                      {organizations.map((item) => (
                        <option key={item.id || item.organization_name} value={item.organization_name}>{item.organization_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Designation *</label>
                    <select name="designation" value={editUserForm.designation} onChange={handleEditUserChange} className="w-full border rounded-sm px-3 py-2">
                      <option value="">Select Designation</option>
                      {designations.map((item) => (
                        <option key={item.id || item.name} value={item.name}>{item.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Country</label>
                    <input type="text" name="country" value={editUserForm.country} onChange={handleEditUserChange} className="w-full border rounded-sm px-3 py-2" />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">State</label>
                    <input type="text" name="state" value={editUserForm.state} onChange={handleEditUserChange} className="w-full border rounded-sm px-3 py-2" />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">City</label>
                    <input type="text" name="city" value={editUserForm.city} onChange={handleEditUserChange} className="w-full border rounded-sm px-3 py-2" />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Pin Code</label>
                    <input type="text" name="pincode" value={editUserForm.pincode} onChange={handleEditUserChange} className="w-full border rounded-sm px-3 py-2" />
                  </div>

                  <div className="mb-3">
                    <label className="block text-sm mb-1">Password *</label>
                    <div className="relative">
                      <input
                        type={editUserShowPassword ? "text" : "password"}
                        name="password"
                        value={editUserForm.password}
                        onChange={handleEditUserChange}
                        className="w-full border rounded-sm px-3 py-2 pr-10"
                      />
                      <span
                        onClick={() => setEditUserShowPassword(!editUserShowPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 cursor-pointer"
                      >
                        <i className={`bi ${editUserShowPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="block text-sm mb-1">Confirm Password *</label>
                    <div className="relative">
                      <input
                        type={editUserShowConfirmPassword ? "text" : "password"}
                        name="confirm_password"
                        value={editUserForm.confirm_password}
                        onChange={handleEditUserChange}
                        className="w-full border rounded-sm px-3 py-2 pr-10"
                      />
                      <span
                        onClick={() => setEditUserShowConfirmPassword(!editUserShowConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 cursor-pointer"
                      >
                        <i className={`bi ${editUserShowConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Address</label>
                    <textarea name="address" value={editUserForm.address} onChange={handleEditUserChange} rows="2" className="w-full border rounded-sm px-3 py-2"></textarea>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="submit"
                    disabled={editUserSubmitting}
                    className={`px-5 py-2 bg-blue-800 text-white rounded-sm hover:bg-blue-900 ${editUserSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                    {editUserSubmitting ? "Updating..." : "Update"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditUserModal(false)}
                    className="px-5 py-2 bg-gray-100 rounded-sm text-gray-700 border hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      </CheckPermission>
    </>
  );
}