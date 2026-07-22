"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "../components/header";
import AddCustomer from "../customer/page";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import axios from "redaxios";
import useAuth from "../components/useAuth";

export default function CustomerList() {
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();

  useAuth(["Admin", "Super Admin"]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [search, setSearch] = useState("");
  // BUG FIX #1: was "setDesignations" (undefined variable), changed to setIndustries
  const [industries, setIndustries] = useState([]);

 const [viewModal, setViewModal] = useState({ open: false, data: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: "" });
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  // ✅ NEW: Edit Customer Modal states
  const [showEditCustomer, setShowEditCustomer] = useState(false);
  const [editCustomerSubmitting, setEditCustomerSubmitting] = useState(false);
  const [editActiveTab, setEditActiveTab] = useState("customer");
  const [editDesignations, setEditDesignations] = useState([]);
  const [editContactId, setEditContactId] = useState(null); // ✅ NEW: tracks contacts table row id
  const [editFormData, setEditFormData] = useState({
    id: "",
    customer_type: "",
    company_name: "",
    customer_name: "",
    email: "",
    mobile: "",
    industry: "",
    address_type: "",
    address: "",
    gst_type: "",
    gst_number: "",
    gst_state: "",
    website: "",
    remarks: "",
    contact_person: "",
    contact_number: "",
    contact_email: "",
    contact_designation: "",
  });

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState({
    customer_name: "",
    // BUG FIX #4: renamed contact_number to mobile to match backend param
    mobile: "",
    email: "",
    industry: "",
  });

  const [data, setData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "ASC" });


  // Store offset for each scrollable column
  const [columnOffsets, setColumnOffsets] = useState({
    company_name: 0,
    customer_name: 0,
    email: 0,
    website: 0,
    industry: 0,
  });

  // Fetch table data
  const fetchCustomers = async () => {
    try {
      const query = new URLSearchParams({
        // Remove server-side pagination to allow client-side slicing
        // page,
        // limit: 10,
        search,
        sortBy: sortConfig.key,
        order: sortConfig.direction,
        ...filters,
      }).toString();

      const res = await axios.get(`${API_BASE}/api/customers/get-customers?${query}`);
      const result = res.data;

      if (result.success) {
        setData(result.data);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };


  // Fetching Active Industries
  useEffect(() => {
    const fetchIndustry = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/Industries/industries`, {
          params: { status: 1 },
        });
        // BUG FIX #1: was calling setDesignations (undefined), now correctly calls setIndustries
        setIndustries(res.data.data || res.data);
      } catch (err) {
        console.error("Failed to fetch industries:", err);
        setIndustries([]);
      }
    };
    fetchIndustry();
  }, []);

  // ✅ NEW: Fetch designations for Edit Customer modal (Contact tab)
  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/contact/read`, {
          params: { status: 1 },
        });
        setEditDesignations(res.data.data || res.data);
      } catch (err) {
        console.error("Failed to fetch designations:", err);
        setEditDesignations([]);
      }
    };
    fetchDesignations();
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [sortConfig]);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(delay);
  }, [search, filters]);

  // Reset page when filters, search, or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, search, itemsPerPage]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Standardized Pagination Calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = data.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(data.length / itemsPerPage);

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


  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.delete(`${API_BASE}/api/customers/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("DELETE SUCCESS:", res.data);

      toast.success("Customer deleted successfully");
      fetchCustomers();
    } catch (error) {
      console.error("FULL DELETE ERROR:", error);

      if (error.response) {
        console.error("Server Response:", error.response.data);
      }

      toast.error("Failed to delete customer");
    }
  };

  

  // ✅ NEW: EDIT CUSTOMER (modal) handlers
  const handleEditCustomerChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openEditCustomer = async (row) => {
    setEditFormData({
      id: row.id,
      customer_type: row.customer_type || "",
      company_name: row.company_name || "",
      customer_name: row.customer_name || "",
      email: row.email || "",
      mobile: row.mobile || "",
      industry: row.industry || row.industry_id || "",
      address_type: row.address_type || "",
      address: row.address || "",
      gst_type: row.gst_type || "",
      gst_number: row.gst_number || "",
      gst_state: row.gst_state || "",
      website: row.website || "",
      remarks: row.remarks || "",
      contact_person: "",
      contact_number: "",
      contact_email: "",
      contact_designation: "",
    });
    setEditContactId(null);
    setEditActiveTab("customer");
    setShowEditCustomer(true);

    // ✅ NEW: fetch existing contact record (if any) for this customer
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/customers/customer-contacts/${row.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const contactRow = res.data?.data?.[0];
      if (contactRow) {
        setEditContactId(contactRow.id);
        setEditFormData((prev) => ({
          ...prev,
          contact_person: contactRow.contact_person || "",
          contact_number: contactRow.contact_number || "",
          contact_email: contactRow.email || "",
          contact_designation: contactRow.contact_designation || "",
        }));
      }
    } catch (err) {
      console.error("Failed to fetch contact details:", err);
    }
  };

 const handleEditCustomerSubmit = async (e) => {
    e.preventDefault();
    try {
      setEditCustomerSubmitting(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Update main customer info (customer_data table)
      await axios.put(
        `${API_BASE}/api/customers/customer-data/${editFormData.id}`,
        {
          company_name: editFormData.company_name,
          customer_type: editFormData.customer_type,
          customer_name: editFormData.customer_name,
          email: editFormData.email,
          mobile: editFormData.mobile,
          industry: editFormData.industry,
          website: editFormData.website,
          remarks: editFormData.remarks,
        },
        { headers }
      );

      // 2. Update or insert contact details (contacts table)
      const hasContactData =
        editFormData.contact_person ||
        editFormData.contact_number ||
        editFormData.contact_email ||
        editFormData.contact_designation;

      if (hasContactData) {
        if (editContactId) {
          await axios.put(
            `${API_BASE}/api/customers/customer-contacts/${editContactId}`,
            {
              company_name: editFormData.company_name,
              customer_name: editFormData.customer_name,
              contact_person: editFormData.contact_person,
              contact_number: editFormData.contact_number,
              email: editFormData.contact_email,
              contact_designation: editFormData.contact_designation,
            },
            { headers }
          );
        } else {
          await axios.post(
            `${API_BASE}/api/customers/customer-contacts`,
            {
              customer_id: editFormData.id,
              company_name: editFormData.company_name,
              customer_name: editFormData.customer_name,
              contact_person: editFormData.contact_person,
              contact_number: editFormData.contact_number,
              email: editFormData.contact_email,
              contact_designation: editFormData.contact_designation,
            },
            { headers }
          );
        }
      }

      toast.success("Customer updated successfully");
      setShowEditCustomer(false);
      fetchCustomers();
    } catch (err) {
      console.error("Error updating customer:", err);
      console.error("Server response:", err?.response?.data || err?.data);
      const backendMessage =
        err?.data?.message ||
        err?.response?.data?.message ||
        err?.message;
      toast.error(backendMessage || "Failed to update customer");
    } finally {
      setEditCustomerSubmitting(false);
    }
  };

  

  return (
    <>
      <Header />
      <div className="bg-gray-100">
        {/* Header bar */}
        <div className="bg-white w-full rounded-sm shadow-lg p-3 mt-1 mb-5">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
            <p className="flex items-center flex-wrap">
              <Link href="/dashboard" className="mx-3 text-xl text-gray-400 hover:text-indigo-600">
                <i className="bi bi-house"></i>
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link href="/customer-list" className="mx-3 text-md text-gray-700 hover:text-orange-500 font-semibold">
                Customer List
              </Link>
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <input
                type="text"
                placeholder="🔍 Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border w-full sm:w-64 border-gray-300 text-gray-700 placeholder-gray-400 p-2 sm:p-1 px-3 rounded-sm focus:ring-1 outline-none focus:ring-orange-200 transition-all text-sm"
              />
            <button
                type="button"
                onClick={() => setShowAddCustomer(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-sm w-full sm:w-auto text-center font-bold text-sm"
              >
                + ADD CUSTOMER
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mx-4 mb-2 md:hidden mt-3 relative z-40">
          <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="w-full flex items-center justify-between text-orange-500 font-semibold bg-orange-50 px-4 py-2 rounded-sm border border-orange-200 shadow-sm transition-all">
             <span className="flex items-center gap-2"><i className="bi bi-funnel"></i> Filters</span>
             <i className={`bi bi-chevron-down transition-transform ${showMobileFilters ? "rotate-180" : ""}`}></i>
          </button>
        </div>

        <div
          className={`
            ${showMobileFilters ? "mx-4 mb-3 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-gray-100 bg-white p-4 shadow-xl" : "hidden"}
            md:mx-4 md:mb-2 md:flex md:flex-wrap md:gap-2 md:bg-transparent md:p-0 md:shadow-none md:border-none
          `}
        >
          <input
            type="text"
            name="customer_name"
            value={filters.customer_name}
            onChange={handleChange}
            placeholder="Enter Name"
            className="border bg-white border-orange-300 rounded-sm px-3 py-2 w-full md:w-56 md:mx-2 text-sm outline-none"
          />

          <input
            type="text"
            name="mobile"
            placeholder="Contact No."
            className="border bg-white border-orange-300 rounded-sm px-3 py-2 w-full md:w-56 md:mx-2 text-sm outline-none"
            value={filters.mobile || ""}
            onChange={(e) => {
              const val = e.target.value;
              if (!/^\d*$/.test(val)) return;
              if (val.length === 1 && !["6", "7", "8", "9"].includes(val)) return;
              if (val.length > 10) return;
              setFilters((p) => ({ ...p, mobile: val }));
            }}
            maxLength={10}
          />

          <input
            type="text"
            name="email"
            value={filters.email}
            onChange={handleChange}
            placeholder="Enter Email"
            className="border bg-white border-orange-300 rounded-sm px-3 py-2 w-full md:w-56 md:mx-2 text-sm outline-none"
          />

          <select
            name="industry"
            value={filters.industry}
            onChange={handleChange}
            className="border bg-white border-orange-300 rounded-sm px-3 py-2 w-full md:w-56 md:mx-2 text-gray-500 text-sm outline-none"
          >
            <option value="">Industry</option>
            {industries.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2 sm:col-span-2 md:col-span-auto">
            <button
              type="button"
              onClick={() => {
                setFilters({
                  customer_name: "",
                  mobile: "",
                  email: "",
                  industry: "",
                });
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
        <form className="p-2 w-8xl mx-3">
          <div className="bg-white shadow rounded-sm p-6">
            <div className="overflow-x-auto overflow-y-scroll max-h-[380px] custom-scroll" style={{ overflowX: "scroll" }}>
              <table className="w-full text-sm border border-gray-200 text-left whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2 text-center">#</th>
                    <th className="px-4 py-2">Company Name</th>
                    <th className="px-4 py-2">Customer Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Mobile No.</th>
                    <th className="px-4 py-2">Customer Type</th>
                    <th className="px-4 py-2">Website</th>
                    <th className="px-4 py-2">Industry</th>
                    <th className="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((row, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2">{indexOfFirstItem + index + 1}</td>
                        <td className="px-4 py-2">{row.company_name}</td>
                        <td className="px-4 py-2 text-orange-500">{row.customer_name}</td>
                        <td className="px-4 py-2">{row.email}</td>
                        <td className="px-4 py-2">{row.mobile}</td>
                        <td className="px-4 py-2">{row.customer_type}</td>
                        <td className="px-4 py-2">{row.website}</td>
                        <td className="px-4 py-2">{row.industry_name}</td>
                        <td className="py-2 px-4 text-lg">
                          <button
                            type="button"
                            onClick={() => setViewModal({ open: true, data: row })}
                            className="text-gray-400 hover:text-green-600 cursor-pointer"
                          >
                            <i className="bi bi-eye text-xl"></i>
                          </button>
                       <button
                            type="button"
                            onClick={() => openEditCustomer(row)}
                            className="text-gray-400 hover:text-blue-700 mx-2 cursor-pointer"
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteModal({ open: true, id: row.id, name: row.customer_name })}
                            className="text-gray-400 hover:text-red-600 cursor-pointer"
                          >
                            <i className="bi bi-trash3"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center py-4 text-gray-500">
                        No data found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {/* ✅ STANDARDIZED MICARA IMS PAGINATION */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white rounded-b-lg mt-4">
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
      </div>

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30">
          <div className="bg-white rounded-sm shadow-xl w-full max-w-sm border border-gray-100 overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-orange-100 to-white">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Delete Customer
                </span>
              </div>
              <button
                onClick={() => setDeleteModal({ open: false, id: null, name: "" })}
                className="w-7 h-7 flex items-center justify-center text-orange-500 text-md"
              >
                ✕
              </button>
            </div>
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                </svg>
              </div>
              <p className="font-semibold text-gray-800 text-base mb-1">{deleteModal.name}</p>
              <p className="text-sm text-gray-400">This action cannot be undone. Are you sure?</p>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button
                onClick={() => setDeleteModal({ open: false, id: null, name: "" })}
                className="flex-1 px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDelete(deleteModal.id);
                  setDeleteModal({ open: false, id: null, name: "" });
                }}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Customer Modal */}
      {viewModal.open && viewModal.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30">
          <div className="bg-white rounded-sm shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100">
            <div className="flex items-center justify-between px-6 py-3 from-orange-100 to-white bg-gradient-to-r">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 flex items-center justify-center">
                  <i className="bi bi-person text-orange-500 text-md"></i>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {viewModal.data.customer_name}
                  </p>
                  <p className="text-gray-400 text-md">{viewModal.data.customer_type}</p>
                </div>
              </div>
              <button
                onClick={() => setViewModal({ open: false, data: null })}
                className="w-7 h-7 flex items-center justify-center text-orange-500 text-md"
              >
                ✕
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-center gap-3">
                <i className="bi bi-building text-orange-400 text-lg"></i>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Company</p>
                  <p className="text-sm font-semibold text-gray-700">{viewModal.data.company_name || "—"}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-center gap-3">
                <i className="bi bi-person-circle text-orange-400 text-lg"></i>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Customer Name</p>
                  <p className="text-sm font-semibold text-gray-700">{viewModal.data.customer_name || "—"}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-center gap-3">
                <i className="bi bi-envelope text-orange-400 text-lg"></i>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Email</p>
                  <p className="text-sm font-semibold text-gray-700 break-all">{viewModal.data.email || "—"}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-center gap-3">
                <i className="bi bi-telephone text-orange-400 text-lg"></i>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Mobile</p>
                  <p className="text-sm font-semibold text-gray-700">{viewModal.data.mobile || "—"}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-center gap-3">
                <i className="bi bi-tag text-orange-400 text-lg"></i>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Customer Type</p>
                  <p className="text-sm font-semibold text-gray-700">{viewModal.data.customer_type || "—"}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-center gap-3">
                <i className="bi bi-globe text-orange-400 text-lg"></i>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Website</p>
                  <p className="text-sm font-semibold text-gray-700">{viewModal.data.website || "—"}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-center gap-3">
                <i className="bi bi-briefcase text-orange-400 text-lg"></i>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Industry</p>
                  <p className="text-sm font-semibold text-gray-700">{viewModal.data.industry_name || "—"}</p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-5 flex justify-end gap-3">
              <button
                onClick={() => setViewModal({ open: false, data: null })}
                className="px-5 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
     )}

     {showAddCustomer && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center">
          <div className="bg-white w-[95%] max-w-3xl max-h-[90vh] rounded-lg overflow-auto">
            <AddCustomer
              onClose={() => {
                setShowAddCustomer(false);
                fetchCustomers();
              }}
            />
          </div>
        </div>
      )}

      {/* ✅ NEW: EDIT CUSTOMER MODAL */}
      {showEditCustomer && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center">
          <div className="bg-white w-[95%] max-w-3xl max-h-[90vh] rounded-lg overflow-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-2xl font-semibold text-orange-500">Edit Customer</h2>
              <button
                type="button"
                onClick={() => setShowEditCustomer(false)}
                className="text-3xl text-orange-500 hover:text-red-500 leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditCustomerSubmit} className="w-full max-w-6xl mx-auto px-3 sm:px-5 lg:px-6">
              <div className="flex mb-4 overflow-x-auto border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditActiveTab("customer")}
                  className={`min-w-max flex-1 sm:flex-none px-3 sm:px-5 py-2.5 text-sm font-semibold transition-all ${
                    editActiveTab === "customer"
                      ? "text-orange-500 border-b-2 border-orange-500 -mb-px"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Personal Information
                </button>
                <button
                  type="button"
                  onClick={() => setEditActiveTab("contact")}
                  className={`min-w-max flex-1 sm:flex-none px-3 sm:px-5 py-2.5 text-sm font-semibold transition-all ${
                    editActiveTab === "contact"
                      ? "text-orange-500 border-b-2 border-orange-500 -mb-px"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Contact Details
                </button>
              </div>

              {editActiveTab === "customer" && (
                <div className="w-full max-w-[900px] mx-auto bg-white rounded-sm border border-gray-200 shadow-sm p-4 sm:p-6 space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Customer Type
                    </label>
                    <div className="grid grid-cols-1 sm:flex gap-3 sm:gap-4">
                      {["Individual", "Business"].map((type) => (
                        <label
                          key={type}
                          className={`flex items-center justify-center sm:justify-start gap-2.5 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                            editFormData.customer_type === type
                              ? "border-orange-400 bg-orange-50 text-orange-500"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="customer_type"
                            value={type}
                            checked={editFormData.customer_type === type}
                            onChange={handleEditCustomerChange}
                            className="hidden"
                          />
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              editFormData.customer_type === type ? "border-orange-500" : "border-gray-300"
                            }`}
                          >
                            {editFormData.customer_type === type && (
                              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            )}
                          </div>
                          <span className="text-sm font-medium">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Company Name
                      </label>
                      <input
                        name="company_name"
                        value={editFormData.company_name}
                        onChange={handleEditCustomerChange}
                        placeholder="Enter Company name"
                        className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        name="customer_name"
                        value={editFormData.customer_name}
                        onChange={handleEditCustomerChange}
                        placeholder="Enter customer name"
                        className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={editFormData.email}
                        onChange={handleEditCustomerChange}
                        placeholder="Enter email address"
                        className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Mobile No.
                      </label>
                      <input
                        type="text"
                        name="mobile"
                        value={editFormData.mobile}
                        onChange={handleEditCustomerChange}
                        placeholder="Enter mobile number"
                        className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Industry
                      </label>
                      <select
                        name="industry"
                        value={editFormData.industry}
                        onChange={handleEditCustomerChange}
                        className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none"
                      >
                        <option value="">Select Industry</option>
                        {industries.map((item) => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Address Details
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          Address Type
                        </label>
                        <select
                          name="address_type"
                          value={editFormData.address_type}
                          onChange={handleEditCustomerChange}
                          className="w-full bg-white border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none"
                        >
                          <option value="">Select Address Type</option>
                          <option>Billing</option>
                          <option>Shipping</option>
                          <option>Corporate</option>
                          <option>Warehouse</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          Address
                        </label>
                        <textarea
                          name="address"
                          value={editFormData.address}
                          onChange={handleEditCustomerChange}
                          placeholder="Enter address"
                          rows="2"
                          className="w-full bg-white border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none resize-none"
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      GST Details
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          GST Type
                        </label>
                        <select
                          name="gst_type"
                          value={editFormData.gst_type}
                          onChange={handleEditCustomerChange}
                          className="w-full bg-white border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none"
                        >
                          <option value="">Select GST Type</option>
                          <option>Registered Regular</option>
                          <option>Registered Composite</option>
                          <option>Unregistered / Consumer</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          GST Number
                        </label>
                        <input
                          type="text"
                          name="gst_number"
                          value={editFormData.gst_number}
                          onChange={handleEditCustomerChange}
                          placeholder="Enter GST number"
                          className="w-full bg-white border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          State
                        </label>
                        <input
                          type="text"
                          name="gst_state"
                          value={editFormData.gst_state}
                          onChange={handleEditCustomerChange}
                          placeholder="Enter State"
                          className="w-full bg-white border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      More Details
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          Website
                        </label>
                        <input
                          type="text"
                          name="website"
                          value={editFormData.website}
                          onChange={handleEditCustomerChange}
                          className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          Remarks
                        </label>
                        <textarea
                          name="remarks"
                          value={editFormData.remarks}
                          onChange={handleEditCustomerChange}
                          placeholder="Enter remarks"
                          rows="3"
                          className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none resize-none"
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditActiveTab("contact")}
                      className="w-full sm:w-auto px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-all shadow-sm"
                    >
                      Next
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEditCustomer(false)}
                      className="w-full sm:w-auto px-6 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-sm hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {editActiveTab === "contact" && (
                <div className="w-full max-w-[900px] mx-auto bg-white rounded-sm border border-gray-200 shadow-sm p-4 sm:p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        name="contact_person"
                        value={editFormData.contact_person}
                        onChange={handleEditCustomerChange}
                        placeholder="Enter contact person name"
                        className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Contact Number
                      </label>
                      <input
                        type="text"
                        name="contact_number"
                        value={editFormData.contact_number}
                        onChange={handleEditCustomerChange}
                        placeholder="Enter contact number"
                        className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        name="contact_email"
                        value={editFormData.contact_email}
                        onChange={handleEditCustomerChange}
                        placeholder="Enter email"
                        className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Contact Designation
                      </label>
                      <select
                        name="contact_designation"
                        value={editFormData.contact_designation}
                        onChange={handleEditCustomerChange}
                        className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none"
                      >
                        <option value="">Select Contact Designation</option>
                        {editDesignations.map((item) => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditActiveTab("customer")}
                      className="w-full sm:w-auto px-6 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-sm hover:bg-gray-50 transition-all"
                    >
                      Previous
                    </button>
                    <button
                      type="submit"
                      disabled={editCustomerSubmitting}
                      className={`w-full sm:w-auto px-6 py-2.5 text-white text-sm font-semibold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2
                        ${editCustomerSubmitting ? "bg-orange-400 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600"}`}
                    >
                      {editCustomerSubmitting ? "Saving..." : (<><i className="bi bi-check2"></i> Save</>)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEditCustomer(false)}
                      className="w-full sm:w-auto px-6 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-sm hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}

