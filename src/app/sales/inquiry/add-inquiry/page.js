"use client";
import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import Header from "@/app/components/header";
import Link from "next/link";
import axios from "redaxios";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import useAuth from "@/app/components/useAuth";


export default function AddInquiry() {

    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

    useAuth();

    const [companyname, setCompanyname] = useState([]);
    const [customername, setCustomername] = useState([]);
    const [sourcename, setSourcename] = useState([]);
    const [sourcecategory, setSourcategory] = useState([]);
    const [asignee, setAsignee] = useState([]);
    const companyRef = useRef(null);

    const router = useRouter();


    const [formData, setFormData] = useState({
        company_name: "",
        customer_name: "",
        inquiry_title: "",
        source: "",
        category: "",
        priority: "",
        description: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            ...formData,
            assignees: assignees.map(a => a.value)
        };

        try {
            const res = await axios.post(`${API_BASE}/api/inquiry/insert`, payload);
            resetForm();
            toast.success("Saved Successfully!");
        } catch (err) {
            console.error("Save error:", err);
        }
    };



    const [assignees, setAssignees] = useState([{ id: Date.now(), value: "" }]);


    const addAssignee = () => {
        setAssignees(prev => [
            ...prev,
            { id: Date.now(), value: "" }
        ]);
    };


    const removeAssignee = (id) => {
        setAssignees(prev => prev.filter(item => item.id !== id));
    };


    const updateAssignee = (id, value) => {
        setAssignees(
            assignees.map((a) => (a.id === id ? { ...a, value } : a))
        );
    };

    useEffect(() => {
        const fetchCompanyName = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/organizations/organization-name`, {
                    params: { status: 1 },
                });

                // If your API wraps data like { data: [...] }
                setCompanyname(res.data.data || res.data);
            } catch (err) {
                console.error("Failed to fetch company names:", err);
                setCompanyname([]); // fallback
            }
        };

        fetchCompanyName();
    }, []);


    useEffect(() => {
        const dropdown = companyRef.current;
        if (!dropdown) return;

        const handleCompanyChange = async () => {
            const selected = dropdown.value;

            if (!selected) {
                setCustomername([]);
                return;
            }

            try {
                const res = await axios.get(`${API_BASE}/api/customers/customer-name`, {
                    params: { company_name: selected },
                });

                setCustomername(res.data.data || res.data);
            } catch (err) {
                console.error("Failed to fetch customer names", err);
                setCustomername([]);
            }
        };

        dropdown.addEventListener("change", handleCompanyChange);

        return () => {
            dropdown.removeEventListener("change", handleCompanyChange);
        };
    }, []);

    // Inquiry - source dropdown api calling
    useEffect(() => {
        const fetchSourceName = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/inquiry-lead-Source/lead-source`, {
                    params: { status: 1 },
                });

                // If your API wraps data like { data: [...] }
                setSourcename(res.data.data || res.data);
            } catch (err) {
                console.error("Failed to fetch company names:", err);
                setSourcename([]); // fallback
            }
        };

        fetchSourceName();
    }, []);


    // Inquiry - category dropdown api calling
    useEffect(() => {
        const fetchSourceCategory = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/inquiry-lead-category/lead-category`, {
                    params: { status: 1 },
                });

                // If your API wraps data like { data: [...] }
                setSourcategory(res.data.data || res.data);
            } catch (err) {
                console.error("Failed to fetch company names:", err);
                setSourcategory([]); // fallback
            }
        };

        fetchSourceCategory();
    }, []);


    // Asignee dropdown api calling
    useEffect(() => {
        const fetchAsignee = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/manage-user/asignee`, {
                    params: { status: 1 },
                });

                const cleanedData = (res.data.data || []).map(item => ({
                    ...item,
                    name: item.name.split(" ")[0] // Only first name
                }));

                setAsignee(cleanedData);

            } catch (err) {
                console.error("Failed to fetch names:", err);
                setAsignee([]); // fallback
            }
        };

        fetchAsignee();
    }, []);

    // For filtered Asignee
    const getAvailableAssignees = (currentId) => {
        const selectedValues = assignees
            .filter(a => a.id !== currentId) // exclude current dropdown
            .map(a => a.value);

        // return only those not selected anywhere
        return asignee.filter(item => !selectedValues.includes(item.name));
    };

    const resetForm = () => {
        setFormData({
            company_name: "",
            customer_name: "",
            inquiry_title: "",
            source: "",
            category: "",
            priority: "",
            description: "",
        });

        // Reset assignees to only one empty dropdown
        setAssignees([{ id: Date.now(), value: "" }]);
    };



    return (
        <>
            <Header />
            <div className="bg-gray-100">
                <div className="bg-white w-full rounded-2xl shadow-lg p-3 mt-1 mb-5 flex justify-between items-center">
                    <div className="flex items-center text-gray-700">
                        <p>
                            <Link href="/dashboard" className="mx-3 text-xl text-gray-400 hover:text-indigo-600">
                                <i className="bi bi-house"></i>
                            </Link>
                            <i className="bi bi-chevron-right"></i>
                            <Link href="#" className="mx-3 text-md text-gray-700 hover:text-indigo-600">
                                Sales
                            </Link>
                            <i className="bi bi-chevron-right"></i>
                            <Link href="/sales/inquiry" className="mx-3 text-md text-gray-700 hover:text-indigo-600">
                                Inquiry
                            </Link>
                            <i className="bi bi-chevron-right"></i>
                            <Link href="#" className="mx-3 text-md text-gray-700 hover:text-indigo-600">
                               Add Inquiry
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-8 max-w-7xl mx-auto">

                    <h2 className="text-xl font-semibold mb-1">Add Inquiry</h2>
                    <hr className="text-gray-200 mb-4" />

                    {/* GRID */}
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2 gap-3 text-gray-600">

                            {/* COMPANY NAME */}
                            <div>
                                <label className="block mb-2">
                                    Company Name *
                                </label>

                                <div className="relative">
                                    <select type="text" name="company_name" value={formData.company_name} onChange={handleChange} ref={companyRef} className="w-full border border-gray-300 rounded-md px-4 py-2" required>
                                        <option value="">Select Company Name</option>
                                        {companyname.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.organization_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* CUSTOMER NAME */}
                            <div>
                                <label className="block mb-2">
                                    Customer Name *
                                </label>

                                <div className="flex">
                                    <div className="relative w-full">
                                        <select type="text" name="customer_name" value={formData.customer_name} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-2" required>
                                            <option value="">Select Customer Name</option>
                                            {customername.map((item) => (
                                                <option key={item.id || item.customer_name} value={item.customer_name}>
                                                    {item.customer_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* INQUIRY TITLE */}
                            <div>
                                <label className="block mb-2">
                                    Inquiry Title *
                                </label>
                                <input type="text" name="inquiry_title" value={formData.inquiry_title} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-2" required/>
                            </div>

                            {/* SOURCE */}
                            <div>
                                <label className="block mb-2">
                                    Source *
                                </label>

                                <div className="flex">
                                    <div className="relative w-full">
                                        <select name="source" value={formData.source} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-2" required>
                                            <option value="">Select Source</option>
                                            {sourcename.map((item) => (
                                                <option key={item.id || item.name} value={item.name}>
                                                    {item.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                </div>
                            </div>

                            {/* CATEGORY */}
                            <div>
                                <label className="block mb-2">Category</label>

                                <div className="flex">
                                    <div className="relative w-full">
                                        <select name="category" value={formData.category} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-2" required>
                                            <option value="">Select Category</option>
                                            {sourcecategory.map((item) => (
                                                <option key={item.id || item.name} value={item.name}>
                                                    {item.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* PRIORITY */}
                            <div>
                                <label className="block mb-2">
                                    Priority *
                                </label>

                                <div className="relative">
                                    <select name="priority" value={formData.priority} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-2" required>
                                        <option value="">-- Select --</option>
                                        <option>High</option>
                                        <option>Medium</option>
                                        <option>Low</option>
                                    </select>

                                </div>
                            </div>

                            {/* DESCRIPTION */}
                            <div>
                                <label className="block mb-2">
                                    Description *
                                </label>
                                <textarea rows={2} className="w-full border border-gray-300 rounded-md px-4 py-2" required></textarea>
                            </div>

                            {/* ASSIGNEES */}
                            <div>
                                <label className="block mb-2">
                                    Assignee *
                                </label>

                                <div className="space-y-3">

                                    {/* MAIN DROPDOWN */}
                                    <div className="flex items-center gap-1">
                                        <select className="border p-2 rounded w-full" value={assignees[0].value} onChange={(e) => updateAssignee(assignees[0].id, e.target.value)}  required>
                                            <option value="">Select Assignee</option>

                                            {getAvailableAssignees(assignees[0].id).map(item => (
                                                <option key={item.id} value={item.name}>{item.name}</option>
                                            ))}
                                        </select>

                                        {/* PLUS BUTTON */}
                                        {assignees.length < 5 && (
                                            <button type="button" onClick={addAssignee} className="text-xl text-center border px-3 py-1.5 rounded">
                                                <i className="bi bi-plus-lg"></i>
                                            </button>
                                        )}
                                    </div>

                                    {/* SUB-DROPDOWNS */}
                                    {assignees.slice(1).map(asg => (
                                        <div key={asg.id} className="flex items-center gap-1">

                                            <select className="border p-2 rounded w-full" value={asg.value} onChange={(e) => updateAssignee(asg.id, e.target.value)}  required>
                                                <option value="">Select Assignee</option>

                                                {getAvailableAssignees(asg.id).map(item => (
                                                    <option key={item.id} value={item.name}>{item.name}</option>
                                                ))}
                                            </select>

                                            {/* delete button */}
                                            <button type="button" onClick={() => removeAssignee(asg.id)} className="text-xl border px-3 py-1.5 rounded">
                                                <i className="bi bi-x-lg text-red-600"></i>
                                            </button>

                                        </div>
                                    ))}
                                </div>

                            </div>
                        </div>

                        {/* BUTTONS */}
                        <div className="flex justify-end mt-5 gap-2">
                            <button type="button" onClick={()=> {resetForm(); router.push("/sales/inquiry");}} className="px-5 py-2 border border-gray-500 hover:bg-gray-200 rounded-sm">CANCEL</button>
                            <button type="submit" className="px-5 py-2 bg-blue-800 text-white rounded-sm">SAVE</button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
