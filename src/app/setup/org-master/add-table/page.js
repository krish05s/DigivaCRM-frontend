"use client";
import Header from '@/app/components/header';
import axios from "redaxios";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import useAuth from '@/app/components/useAuth';

export default function Page() {

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

  useAuth();

  const [activeTab, setActiveTab] = useState("organization");

  const [formData, setFormData] = useState({
    organization_name: "",
    industry: "",
    email: "",
    address_1: "",
    address_2: "",
    country: "",
    state: "",
    city: "",
    pincode: "",
    gst_number: "",
    contact_1: "",
    contact_2: "",
    benificiary_name: "",
    bank_name: "",
    account_no: "",
    account_type: "",
    ifsc_code: "",
    micr_code: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE}/api/organizations/add`, formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Organization added successfully!")
      console.log("Response", res.data)
      setFormData({
        organization_name: "",
        industry: "",
        email: "",
        address_1: "",
        address_2: "",
        country: "",
        state: "",
        city: "",
        pincode: "",
        gst_number: "",
        contact_1: "",
        contact_2: "",
        benificiary_name: "",
        bank_name: "",
        account_no: "",
        account_type: "",
        ifsc_code: "",
        micr_code: "",
      })
      setActiveTab("organization");
    } catch (error) {
      console.error("Error inserting data:", error);
      toast.error("Failed to add organization!");
    }
  }
  return (
    <>
      <Header />
      <div className="bg-gray-100">
        <div className="bg-white w-full rounded-2xl shadow-lg p-3 mt-1 mb-5">
          <div className="flex justify-between items-center">
            <p>
              <Link href="/dashboard" className="mx-3 text-xl text-gray-400 hover:text-indigo-600">
                <i className="bi bi-house"></i>
              </Link>
              <i className="bi bi-chevron-right"></i>
              <Link href="/setup" className="mx-3 text-md text-gray-700 hover:text-indigo-600">
                Set up
              </Link>
              <i className="bi bi-chevron-right"></i>
              <Link href="#" className="mx-3 text-md text-gray-700 hover:text-indigo-600">
                ORG-Master
              </Link>
              <i className="bi bi-chevron-right"></i>
              <Link href="/setup/org-master/read-table" className="mx-3 text-md text-gray-700 hover:text-indigo-600">
                Organization-Profile
              </Link>
              <i className="bi bi-chevron-right"></i>
              <Link href="#" className="mx-3 text-md text-gray-700 hover:text-indigo-600">
                Add Organization
              </Link>
            </p>

          </div>
        </div>

        <form className="p-2 w-7xl mx-auto" onSubmit={handleSubmit}>
          {/* Tab Header */}
          <div className="flex mb-4">
            <button type="button" onClick={() => setActiveTab("organization")} className={`px-4 py-2 font-medium ${activeTab === "organization" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600"}`}>
              Organization Setup
            </button>
            <button type="button" onClick={() => setActiveTab("bank")} className={`px-4 py-2 font-medium ${activeTab === "bank" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600"}`}>
              Bank Details
            </button>
          </div>

          {/* Section 1 */}
          {activeTab === "organization" && (
            <div className="bg-white shadow rounded-2xl p-6">

              {/* Form Fields */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Organization Name *
                  </label>
                  <input type="text" name='organization_name' value={formData.organization_name} onChange={handleChange} className="w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Industry *
                  </label>
                  <input type="text" name='industry' value={formData.industry} onChange={handleChange} className="w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email *
                  </label>
                  <input type="text" name="email" value={formData.email} onChange={handleChange} className="w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address Line 1 *</label>
                  <input type="text" name='address_1' value={formData.address_1} onChange={handleChange} className="w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address Line 2 *</label>
                  <input type="text" name='address_2' value={formData.address_2} onChange={handleChange} className="w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Country Name *</label>
                  <input type="text" name='country' value={formData.country} onChange={handleChange} className="w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State *</label>
                  <input type="text" name='state' value={formData.state} onChange={handleChange} className="w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City *</label>
                  <input type="text" name='city' value={formData.city} onChange={handleChange} className="w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pin Code *</label>
                  <input type="text" name='pincode' value={formData.pincode} onChange={handleChange} className="w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">GST Number *</label>
                  <input type="text" name='gst_number' value={formData.gst_number} onChange={handleChange} className="w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Number 1 *</label>
                  <input type="text" name='contact_1' value={formData.contact_1} onChange={handleChange} className="w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Number 2 *</label>
                  <input type="text" name='contact_2' value={formData.contact_2} onChange={handleChange} className="w-full border rounded p-2" />
                </div>

              </div>


              {/* Buttons */}
              <div className="flex justify-end gap-3">
                <button type="submit" className="bg-blue-800 text-white px-4 py-2 rounded">
                  Save
                </button>
                <button type="button" className="bg-gray-300 px-4 py-2 rounded" disabled>Previous</button>
                <button type="button" onClick={() => setActiveTab("bank")} className="bg-blue-800 text-white px-4 py-2 rounded">
                  Next
                </button>
                <button type="button" className="border hover:bg-gray-200 px-4 py-2 rounded">Cancel</button>
              </div>
            </div>
          )}

          {/* Section 2 */}
          {activeTab === "bank" && (
            <div className="bg-white shadow rounded-2xl p-6">
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Benificiary Name</label>
                  <input type="text" name='benificiary_name' value={formData.benificiary_name} onChange={handleChange} className="w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bank Name</label>
                  <input type="text" name='bank_name' value={formData.bank_name} onChange={handleChange} className="w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Account No.</label>
                  <input type="text" name='account_no' value={formData.account_no} onChange={handleChange} className="w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Account Type</label>
                  <input list="accountTypes" id="accountType" name="account_type" value={formData.account_type} onChange={handleChange} className="w-full border rounded p-2" />
                  <datalist id="accountTypes">
                    <option value="Saving Account" />
                    <option value="Current Account" />
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">IFSC Code</label>
                  <input type="text" name='ifsc_code' value={formData.ifsc_code} onChange={handleChange} className="w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">MICR Code</label>
                  <input type="text" name='micr_code' value={formData.micr_code} onChange={handleChange} className="w-full border rounded p-2" />
                </div>

              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3">
                <button type="submit" className="bg-blue-800 text-white px-4 py-2 rounded">
                  Save
                </button>
                <button type="button" onClick={() => setActiveTab("organization")} className="border hover:bg-gray-200 px-4 py-2 rounded">
                  Previous
                </button>
                <button type="button" onClick={() => setActiveTab("bank")} className="bg-blue-800 text-white px-4 py-2 rounded">
                  Next
                </button>
                <button type="button" className="border hover:bg-gray-200 px-4 py-2 rounded">Cancel</button>
              </div>
            </div>
          )}
        </form>
      </div >
    </>
  );
}
