"use client";
import Header from "@/app/components/header";
import Link from "next/link";
import axios from "redaxios";
import React, { useEffect, useState } from "react";
import { ChevronUpIcon, ChevronDownIcon } from "lucide-react";
import useAuth from "@/app/components/useAuth";
import CheckPermission from "@/app/components/CheckPermission";

export default function Page() {

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

  useAuth();

  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [sortConfig, setSortConfig] = useState({ column: null, direction: null });
  const [scrollOffsets, setScrollOffsets] = useState({}); 

  // Fetch table data (fetching all for client-side pagination)
  const fetchData = async (sort = sortConfig) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/organizations/read`, {
        params: {
          limit: 1000, // Fetch all for client-side pagination
          sortColumn: sort.column,
          sortDirection: sort.direction,
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset page when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);



  // column scroll
  const handleColumnScroll = async (columnKey, direction) => {
    const currentOffset = scrollOffsets[columnKey] || 0;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/organizations/get-column-scroll`,
        {
          params: {
            column: columnKey,
            direction,
            offset: currentOffset,
            limit: 5,
          },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data.success && res.data.data) {
        setScrollOffsets((prev) => ({
          ...prev,
          [columnKey]: res.data.newOffset,
        }));

        // update only that column’s values
        setData((prevData) => {
          const updated = [...prevData];
          res.data.data.forEach((row, index) => {
            if (updated[index]) updated[index][columnKey] = row[columnKey];
          });
          return updated;
        });
      }
    } catch (err) {
      console.error("Error fetching column scroll:", err);
    }
  };

  // Standardized Pagination Calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
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

  // 🔹 Column Scroll Arrows Component
  const ColumnScroll = ({ columnKey }) => (
    <span className="ml-1 inline-flex flex-col">
      <ChevronUpIcon
        size={16}
        className="cursor-pointer text-blue-400 hover:text-blue-600"
        title="Scroll Up"
        onClick={() => handleColumnScroll(columnKey, "up")}
      />
      <ChevronDownIcon
        size={16}
        className="cursor-pointer text-blue-400 hover:text-blue-600 -mt-1"
        title="Scroll Down"
        onClick={() => handleColumnScroll(columnKey, "down")}
      />
    </span>
  );


  return (
    <>
      <Header />
      <CheckPermission allowedRoles={["Super Admin"]}>
        <div className="bg-gray-100">
          <div className="bg-white w-full shadow-lg p-3 mt-1 mb-5 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
            <div className="hidden sm:flex items-center text-gray-700 w-full sm:w-auto">
              <p className="flex items-center flex-wrap">
                <Link href="/dashboard" className="mx-2 text-xl text-gray-400 hover:text-indigo-600"><i className="bi bi-house"></i></Link>
                <i className="bi bi-chevron-right text-[10px]"></i>
                <Link href="/setup" className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold">Set up</Link>
                <i className="bi bi-chevron-right text-[10px]"></i>
                <Link href="#" className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold">Organization</Link>
                <i className="bi bi-chevron-right text-[10px]"></i>
                <Link href="#" className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"> Organization Profile</Link>
              </p>
            </div>

            <div className="w-full sm:w-auto">
              <Link href="/setup/org-master/add-table" className="block text-center bg-blue-800 hover:bg-blue-900 text-white px-5 py-2 rounded-sm font-bold text-sm w-full sm:w-auto">
                + ADD ORGANIZATION
              </Link>
            </div>
          </div>

          {/* Table Section */}
          <form className="p-2 w-full">
            <div className="bg-white shadow rounded-2xl p-4 md:p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 text-sm text-left">
                  <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-center">#</th>
                      <th className="px-4 py-2">
                        Organization Name <ColumnScroll columnKey="organization_name" />
                      </th>
                      <th className="px-4 py-2">
                        Email <ColumnScroll columnKey="email" />
                      </th>
                      <th className="px-4 py-2">
                        Address Line 1 <ColumnScroll columnKey="address_1" />
                      </th>
                      <th className="px-4 py-2">
                        Country <ColumnScroll columnKey="country" />
                      </th>
                      <th className="px-4 py-2">
                        State <ColumnScroll columnKey="state" />
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition border-b border-gray-100">
                          <td className="text-center p-3 text-gray-600">
                            {indexOfFirstItem + i + 1}
                          </td>
                          <td className="p-3 font-medium text-gray-800">{item.organization_name}</td>
                          <td className="p-3 text-gray-600">{item.email}</td>
                          <td className="p-3 text-gray-600">{item.address_1}</td>
                          <td className="p-3 text-gray-600">{item.country}</td>
                          <td className="p-3 text-gray-600">{item.state}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center text-gray-400 py-10">
                          No records found
                        </td>
                      </tr>
                    )}

                  </tbody>
                </table>
              </div>

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

          {/* ===================== VIEW ORGANIZATION MODAL ===================== */}
          {viewOrg && (
            <div className="fixed inset-0 bg-gray-900/40 z-50 flex justify-center items-center overflow-y-auto">
              <div className="bg-white rounded-xl shadow-lg p-6 w-[800px] relative my-10 max-h-[85vh] overflow-y-auto">
                <button type="button" onClick={() => setViewOrg(null)} className="absolute top-5 right-4 text-xl text-gray-500 hover:text-gray-800">
                  ✕
                </button>

                <h3 className="text-lg mb-3 text-black">
                  View Organization
                  <hr className="mt-3 mb-5 text-gray-300" />
                </h3>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Organization Name</label>
                    <input type="text" value={viewOrg.organization_name || ""} disabled className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Industry</label>
                    <input type="text" value={viewOrg.industry || ""} disabled className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Email</label>
                    <input type="text" value={viewOrg.email || ""} disabled className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Address Line 1</label>
                    <input type="text" value={viewOrg.address_1 || ""} disabled className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Address Line 2</label>
                    <input type="text" value={viewOrg.address_2 || ""} disabled className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Country</label>
                    <input type="text" value={viewOrg.country || ""} disabled className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">State</label>
                    <input type="text" value={viewOrg.state || ""} disabled className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">City</label>
                    <input type="text" value={viewOrg.city || ""} disabled className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Pin Code</label>
                    <input type="text" value={viewOrg.pincode || ""} disabled className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Contact 1</label>
                    <input type="text" value={viewOrg.contact_1 || ""} disabled className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Contact 2</label>
                    <input type="text" value={viewOrg.contact_2 || ""} disabled className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Bank Name</label>
                    <input type="text" value={viewOrg.bank_name || ""} disabled className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Account No.</label>
                    <input type="text" value={viewOrg.account_no || ""} disabled className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">IFSC Code</label>
                    <input type="text" value={viewOrg.ifsc_code || ""} disabled className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button type="button" onClick={() => setViewOrg(null)} className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900">
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================== EDIT ORGANIZATION MODAL ===================== */}
          {editId && (
            <div className="fixed inset-0 bg-gray-900/40 z-50 flex justify-center items-center overflow-y-auto">
              <div className="bg-white rounded-xl shadow-lg p-6 w-[800px] relative my-10 max-h-[85vh] overflow-y-auto">
                <button type="button" onClick={() => setEditId(null)} className="absolute top-5 right-4 text-xl text-gray-500 hover:text-gray-800">
                  ✕
                </button>

                <h3 className="text-lg mb-3 text-black">
                  Edit Organization
                  <hr className="mt-3 mb-5 text-gray-300" />
                </h3>

                <form onSubmit={handleEditSubmit}>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Organization Name *</label>
                      <input type="text" name="organization_name" value={editFormData.organization_name} onChange={handleEditChange} className="w-full border rounded p-2" required />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Industry *</label>
                      <input type="text" name="industry" value={editFormData.industry} onChange={handleEditChange} className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Email *</label>
                      <input type="text" name="email" value={editFormData.email} onChange={handleEditChange} className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Address Line 1 *</label>
                      <input type="text" name="address_1" value={editFormData.address_1} onChange={handleEditChange} className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Address Line 2</label>
                      <input type="text" name="address_2" value={editFormData.address_2} onChange={handleEditChange} className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Country</label>
                      <input type="text" name="country" value={editFormData.country} onChange={handleEditChange} className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">State</label>
                      <input type="text" name="state" value={editFormData.state} onChange={handleEditChange} className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">City</label>
                      <input type="text" name="city" value={editFormData.city} onChange={handleEditChange} className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Pin Code</label>
                      <input type="text" name="pincode" value={editFormData.pincode} onChange={handleEditChange} className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Contact 1</label>
                      <input type="text" name="contact_1" value={editFormData.contact_1} onChange={handleEditChange} className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Contact 2</label>
                      <input type="text" name="contact_2" value={editFormData.contact_2} onChange={handleEditChange} className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Bank Name</label>
                      <input type="text" name="bank_name" value={editFormData.bank_name} onChange={handleEditChange} className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Account No.</label>
                      <input type="text" name="account_no" value={editFormData.account_no} onChange={handleEditChange} className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">IFSC Code</label>
                      <input type="text" name="ifsc_code" value={editFormData.ifsc_code} onChange={handleEditChange} className="w-full border rounded p-2" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-2">
                    <button type="button" onClick={() => setEditId(null)} className="px-4 py-2 bg-gray-200 rounded-lg">
                      Cancel
                    </button>
                    <button type="submit" className="bg-blue-800 text-white px-4 py-1.5 rounded-lg">
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ===================== DELETE CONFIRM MODAL ===================== */}
         {/* ===================== DELETE CONFIRM MODAL ===================== */}
          {deleteOrg && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30">
              <div className="bg-white rounded-sm shadow-xl w-full max-w-sm border border-gray-100 overflow-hidden">
                <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-blue-100 to-white">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-700 inline-block"></span>
                    <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Delete Organization
                    </span>
                  </div>
                  <button
                    onClick={() => setDeleteOrg(null)}
                    className="w-7 h-7 flex items-center justify-center text-blue-700 text-md"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                    </svg>
                  </div>
                  <p className="font-semibold text-gray-800 text-base mb-1">{deleteOrg.organization_name}</p>
                  <p className="text-sm text-gray-400">This action cannot be undone. Are you sure?</p>
                </div>
                <div className="flex gap-3 px-5 pb-5">
                  <button
                    onClick={() => setDeleteOrg(null)}
                    className="flex-1 px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                 <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-sm transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================== ✅ NEW: ADD ORGANIZATION MODAL ===================== */}
          {showAddModal && (
            <div className="fixed inset-0 bg-gray-900/40 z-50 flex justify-center items-center overflow-y-auto">
              <div className="bg-white rounded-xl shadow-lg w-[900px] relative my-10 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center px-6 pt-5">
                  <h3 className="text-lg text-black">Add Organization</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetAddForm();
                    }}
                    className="text-xl text-gray-500 hover:text-gray-800"
                  >
                    ✕
                  </button>
                </div>
                <hr className="mt-3 mb-4 text-gray-300 mx-6" />

                <form onSubmit={handleAddSubmit} className="px-6 pb-6">
                  {/* Tab Header */}
                  <div className="flex flex-wrap mb-4 border-b border-gray-200">
                    <button
                      type="button"
                      onClick={() => setAddActiveTab("organization")}
                      className={`px-4 py-2 font-medium ${addActiveTab === "organization" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600"}`}
                    >
                      Organization Setup
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddActiveTab("bank")}
                      className={`px-4 py-2 font-medium ${addActiveTab === "bank" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600"}`}
                    >
                      Bank Details
                    </button>
                  </div>

                  {/* Section 1 */}
                  {addActiveTab === "organization" && (
                    <div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        <div>
                          <label className="block text-sm font-medium mb-1">Organization Name *</label>
                          <input type="text" name="organization_name" value={addFormData.organization_name} onChange={handleAddChange} className="w-full border rounded p-2" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Industry *</label>
                          <input type="text" name="industry" value={addFormData.industry} onChange={handleAddChange} className="w-full border rounded p-2" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Email *</label>
                          <input type="text" name="email" value={addFormData.email} onChange={handleAddChange} className="w-full border rounded p-2" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Address Line 1 *</label>
                          <input type="text" name="address_1" value={addFormData.address_1} onChange={handleAddChange} className="w-full border rounded p-2" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Address Line 2 *</label>
                          <input type="text" name="address_2" value={addFormData.address_2} onChange={handleAddChange} className="w-full border rounded p-2" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Country Name *</label>
                          <input type="text" name="country" value={addFormData.country} onChange={handleAddChange} className="w-full border rounded p-2" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">State *</label>
                          <input type="text" name="state" value={addFormData.state} onChange={handleAddChange} className="w-full border rounded p-2" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">City *</label>
                          <input type="text" name="city" value={addFormData.city} onChange={handleAddChange} className="w-full border rounded p-2" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Pin Code *</label>
                          <input type="text" name="pincode" value={addFormData.pincode} onChange={handleAddChange} className="w-full border rounded p-2" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Contact 1 *</label>
                          <input type="text" name="contact_1" value={addFormData.contact_1} onChange={handleAddChange} className="w-full border rounded p-2" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Contact 2 *</label>
                          <input type="text" name="contact_2" value={addFormData.contact_2} onChange={handleAddChange} className="w-full border rounded p-2" required />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4 mt-6">
                        <button type="submit" disabled={addIsSubmitting} className="w-full sm:w-auto bg-blue-800 text-white px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed">
                          {addIsSubmitting ? "Saving..." : "Save"}
                        </button>
                       <button
  type="button"
  onClick={() => setAddActiveTab("bank")}
  className="w-full sm:w-auto bg-blue-800 hover:bg-blue-900 text-white px-6 py-2 rounded"
>
  Next
</button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddModal(false);
                            resetAddForm();
                          }}
                          className="w-full sm:w-auto border hover:bg-gray-200 px-4 py-2 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Section 2 */}
                  {addActiveTab === "bank" && (
                    <div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        <div>
                          <label className="block text-sm font-medium mb-1">Beneficiary Name</label>
                          <input type="text" name="benificiary_name" value={addFormData.benificiary_name} onChange={handleAddChange} className="w-full border rounded p-2" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Bank Name</label>
                          <input type="text" name="bank_name" value={addFormData.bank_name} onChange={handleAddChange} className="w-full border rounded p-2" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Account No.</label>
                          <input type="text" name="account_no" value={addFormData.account_no} onChange={handleAddChange} className="w-full border rounded p-2" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Account Type</label>
                          <input type="text" name="account_type" value={addFormData.account_type} onChange={handleAddChange} className="w-full border rounded p-2" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">IFSC Code</label>
                          <input type="text" name="ifsc_code" value={addFormData.ifsc_code} onChange={handleAddChange} className="w-full border rounded p-2" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">MICR Code</label>
                          <input type="text" name="micr_code" value={addFormData.micr_code} onChange={handleAddChange} className="w-full border rounded p-2" />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4 mt-6">
                        <button type="button" onClick={() => setAddActiveTab("organization")} className="w-full sm:w-auto border hover:bg-gray-200 px-4 py-2 rounded">
                          Previous
                        </button>
                        <button type="submit" disabled={addIsSubmitting} className="w-full sm:w-auto bg-blue-800 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed">
                          {addIsSubmitting ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddModal(false);
                            resetAddForm();
                          }}
                          className="w-full sm:w-auto border hover:bg-gray-200 px-4 py-2 rounded"
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
        </div>
      </CheckPermission>
    </>
  );
}
