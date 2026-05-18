"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "redaxios";
import Header from "@/app/components/header";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import useAuth from "@/app/components/useAuth";

export default function UpdateUserForm() {

    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

    useAuth();

    const router = useRouter();
    const [userId, setUserId] = useState(null);

    const [organizations, setOrganizations] = useState([]);
    const [roles, setRoles] = useState([]);
    const [designations, setDesignations] = useState([]);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
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

    // Convert date -> yyyy-mm-dd
    const formatDate = (dateString) => {
        if (!dateString) return "";
        const d = new Date(dateString);
        const offset = d.getTimezoneOffset();
        const local = new Date(d.getTime() - offset * 60 * 1000);
        return local.toISOString().slice(0, 10);
    };

    // READ ID FROM localStorage

    useEffect(() => {
        const id = localStorage.getItem("edit_user_id");

        if (!id) {
            toast.error("No user selected!");
            router.push("/setup/manage-user");
            return;
        }

        setUserId(id);

    }, []);


    // FETCH USER DATA USING ID

    useEffect(() => {
        if (!userId) return;

        axios.get(`${API_BASE}/api/manage-user/read/${userId}`)
            .then((res) => {
                const d = res.data.data;

                const fullName = d?.name ? d.name.trim().split(" ") : [];
                let first = fullName[0] || "";
                let middle = fullName.length === 3 ? fullName[1] : "";
                let last = fullName.length === 3 ? fullName[2] : fullName[1] || "";

                setFormData({
                    first_name: first,
                    middle_name: middle,
                    last_name: last,
                    email: d.email || "",
                    mobile: d.mobile || "",
                    date_of_birth: formatDate(d.date_of_birth),
                    date_of_joining: formatDate(d.date_of_joining),
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
            })
            .catch(() => toast.error("Failed to load user data"));
    }, [userId]);


    // Handle Input Change

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };


    //  Submit Update API

    const handleSubmit = async (e) => {
        e.preventDefault();

        const fullName = `${formData.first_name} ${formData.middle_name} ${formData.last_name}`
            .replace(/\s+/g, " ")
            .trim();

        if (formData.password !== formData.confirm_password) {
            toast.error("Passwords do not match!");
            return;
        }

        const sendData = { ...formData, name: fullName };

        try {
            const res = await axios.put(
                `${API_BASE}/api/manage-user/update/${userId}`,
                sendData
            );

            if (res.status === 200) {
                toast.success("User updated successfully!");
                localStorage.removeItem("edit_user_id");
                router.push("/setup/manage-user");
            } else {
                toast.error("Update failed!");
            }
        } catch (err) {
            console.log("Something went wrong!", err);
        }
    };

    //   Load Dropdowns

    useEffect(() => {
        axios.get(`${API_BASE}/api/organizations/organization-name`, { params: { status: 1 } })
            .then((res) => setOrganizations(res.data.data));

        axios.get(`${API_BASE}/api/role-master/role-name`, { params: { status: 1 } })
            .then((res) => setRoles(res.data.data));

        axios.get(`${API_BASE}/api/contact/read`, { params: { status: 1 } })
            .then((res) => setDesignations(res.data.data || res.data));
    }, []);


    // Render Page

    return (
        <>
            <Header />

            <div className="bg-gray-100">

                <div className="bg-white w-full rounded-2xl shadow-lg p-2 mt-1 mb-5 flex justify-between items-center">
                    <div className="flex items-center text-gray-700">
                        <p>
                            <Link href="/dashboard" className="mx-3 text-xl text-gray-400 hover:text-indigo-600">
                                <i className="bi bi-house"></i>
                            </Link>
                            <i className="bi bi-chevron-right"></i>
                            <Link href="/setup" className="mx-3 text-md text-gray-700 hover:text-indigo-600">
                                <button onClick={() => { localStorage.removeItem("edit_user_id"); }}>
                                    Setup
                                </button>
                            </Link>
                            <i className="bi bi-chevron-right"></i>
                            <Link href="/setup/manage-user" className="mx-3 text-md text-gray-700 hover:text-indigo-600">
                                <button onClick={() => { localStorage.removeItem("edit_user_id"); }}>
                                    Manage User
                                </button>
                            </Link>
                            <i className="bi bi-chevron-right"></i>
                            <span className="mx-3 text-md text-black">Update User</span>
                        </p>
                    </div>
                </div>

                <div className="bg-white p-3 mt-1 rounded-2xl shadow-sm border text-gray-500 border-gray-200 mx-5">
                    <h2 className="text-xl text-black">Update User</h2>
                    <hr className="text-gray-300 mb-2 mt-2" />

                    {/* FORM */}
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

                            {/* SAME STRUCTURE AS YOU SENT */}
                            <div>
                                <label className="block text-sm mb-1">First Name *</label>
                                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange}
                                    className="w-full border rounded-sm px-3 py-2" />
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Middle Name</label>
                                <input type="text" name="middle_name" value={formData.middle_name} onChange={handleChange}
                                    className="w-full border rounded-sm px-3 py-2" />
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Last Name *</label>
                                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange}
                                    className="w-full border rounded-sm px-3 py-2" />
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Email *</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange}
                                    className="w-full border rounded-sm px-3 py-2" />
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Mobile *</label>
                                <input type="text" name="mobile" value={formData.mobile} onChange={handleChange}
                                    className="w-full border rounded-sm px-3 py-2" />
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Date of Birth *</label>
                                <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange}
                                    className="w-full border rounded-sm px-3 py-2" />
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Date of Joining *</label>
                                <input type="date" name="date_of_joining" value={formData.date_of_joining} onChange={handleChange}
                                    className="w-full border rounded-sm px-3 py-2" />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-500 mb-1">Role *</label>
                                <select name="role" value={formData.role} onChange={handleChange} className="w-full border rounded-sm px-3 py-2 bg-white">
                                    <option value="">Select Role</option>
                                    {roles.map((item) => (
                                        <option key={item.id} value={item.name}                                         >
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Organization</label>
                                <select name="organization" value={formData.organization} onChange={handleChange}
                                    className="w-full border rounded-sm px-3 py-2">
                                    <option value="">Select Organization</option>
                                    {organizations.map((item, index) => (
                                        <option key={index} value={item.organization_name}>
                                            {item.organization_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Designation *</label>
                                <select name="designation" value={formData.designation} onChange={handleChange}
                                    className="w-full border rounded-sm px-3 py-2">
                                    <option value="">Select Designation</option>
                                    {designations.map((item, index) => (
                                        <option key={index} value={item.name}>{item.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Country</label>
                                <input type="text" name="country" value={formData.country} onChange={handleChange}
                                    className="w-full border rounded-sm px-3 py-2" />
                            </div>

                            <div>
                                <label className="block text-sm mb-1">State</label>
                                <input type="text" name="state" value={formData.state} onChange={handleChange}
                                    className="w-full border rounded-sm px-3 py-2" />
                            </div>

                            <div>
                                <label className="block text-sm mb-1">City</label>
                                <input type="text" name="city" value={formData.city} onChange={handleChange}
                                    className="w-full border rounded-sm px-3 py-2" />
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Pin Code</label>
                                <input type="text" name="pincode" value={formData.pincode} onChange={handleChange}
                                    className="w-full border rounded-sm px-3 py-2" />
                            </div>

                            {/* Password */}
                            <div className="mb-3">
                                <label className="block text-sm mb-1">Password *</label>

                                <div className="relative">
                                    <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} className="w-full border rounded-sm px-3 py-2 pr-10" />

                                    {/* Eye Icon */}
                                    <span onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 cursor-pointer text-xl" >
                                        {showPassword ? (<AiOutlineEyeInvisible />) : (<AiOutlineEye />)}
                                    </span>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="mb-3">
                                <label className="block text-sm mb-1">Confirm Password *</label>

                                <div className="relative">
                                    <input type={showConfirmPassword ? "text" : "password"} name="confirm_password" value={formData.confirm_password} onChange={handleChange} className="w-full border rounded-sm px-3 py-2 pr-10" />

                                    {/* Eye Icon */}
                                    <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 cursor-pointer text-xl">
                                        {showConfirmPassword ? (<AiOutlineEyeInvisible />) : (<AiOutlineEye />)}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Address</label>
                                <textarea name="address" value={formData.address} onChange={handleChange}
                                    className="w-full border rounded-sm px-3 py-2" rows="2"></textarea>
                            </div>

                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-3 mt-4">
                            <button type="submit" className="px-5 py-2 bg-blue-800 text-white rounded-sm hover:bg-blue-900">
                                Update
                            </button>

                            <button type="button" onClick={() => {
                                localStorage.removeItem("edit_user_id");
                                router.push("/setup/manage-user");
                            }} className="px-5 py-2 bg-gray-100 rounded-sm text-gray-700 border hover:bg-gray-200">
                                Cancel
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </>
    );
}
