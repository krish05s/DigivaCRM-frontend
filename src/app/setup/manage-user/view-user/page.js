"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "redaxios";
import Header from "@/app/components/header";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import useAuth from "@/app/components/useAuth";

export default function ViewUser() {
   
    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

    useAuth();

    const router = useRouter();
    const [userId, setUserId] = useState(null);

    const [users, setUsers] = useState({
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
        pin: "",
        password: "",
        confirm_password: "",
        address: "",
    });

    useEffect(() => {
        const id = localStorage.getItem("edit_user_id");

        if (!id) {
            toast.error("No user selected!");
            router.push("/setup/manage-user");
            return;
        }

        setUserId(id);

    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "";

        const d = new Date(dateString);

        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0"); // month starts from 0
        const year = d.getFullYear();

        return `${day}-${month}-${year}`;
    };


    useEffect(() => {
        if (!userId) return;

        axios.get(`${API_BASE}/api/manage-user/read/${userId}`)
            .then((res) => {
                const d = res.data.data;

                const fullName = d?.name ? d.name.trim().split(" ") : [];
                let first = fullName[0] || "";
                let middle = "";
                let last = "";

                if (fullName.length === 3) {
                    middle = fullName[1];
                    last = fullName[2];
                } else if (fullName.length === 2) {
                    last = fullName[1];
                }

                setUsers({
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
                    pin: d.pincode || "",
                    password: d.password || "",
                    confirm_password: d.password || "",
                    address: d.address || "",
                });
            })
            .catch(() => toast.error("Failed to load user data"));
    }, [userId]);

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
                            <Link href="#" className="mx-3 text-md text-gray-700 hover:text-indigo-600">
                                View User
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-md p-1 mx-4">
                    <div className="flex gap-6 border-b pb-3 mb-6">
                        <span className="text-blue-800 font-medium border-b-2 border-blue-800 pb-1 mx-4">View User</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mx-5 mb-5">
                        <div>
                            <p className="text-gray-500">First Name</p>
                            <p className="font-semibold">{users.first_name || "-"}</p>
                        </div>

                        <div>
                            <p className="text-gray-500">Middle Name</p>
                            <p className="font-semibold">{users.middle_name || "-"}</p>
                        </div>

                        <div>
                            <p className="text-gray-500">Last Name</p>
                            <p className="font-semibold">{users.last_name || "-"}</p>
                        </div>

                        <div>
                            <p className="text-gray-500">Email</p>
                            <p className="font-semibold">{users.email || "-"}</p>
                        </div>

                        <div>
                            <p className="text-gray-500">Mobile Number</p>
                            <p className="font-semibold">{users.mobile || "-"}</p>
                        </div>

                        <div>
                            <p className="text-gray-500">Date Of Birth</p>
                            <p className="font-semibold">{users.date_of_birth || "-"}</p>
                        </div>

                        <div>
                            <p className="text-gray-500">Date Of Joining</p>
                            <p className="font-semibold">{users.date_of_joining || "-"}</p>
                        </div>

                        <div>
                            <p className="text-gray-500">Role</p>
                            <p className="font-semibold">{users.role || "-"}</p>
                        </div>

                        <div>
                            <p className="text-gray-500">Designation</p>
                            <p className="font-semibold">{users.designation || "-"}</p>
                        </div>

                        <div>
                            <p className="text-gray-500">Country</p>
                            <p className="font-semibold">{users.country || "-"}</p>
                        </div>

                        <div>
                            <p className="text-gray-500">State</p>
                            <p className="font-semibold">{users.state || "-"}</p>
                        </div>

                        <div>
                            <p className="text-gray-500">City</p>
                            <p className="font-semibold">{users.city || "-"}</p>
                        </div>

                        <div>
                            <p className="text-gray-500">Pin Code</p>
                            <p className="font-semibold">{users.pin || "-"}</p>
                        </div>

                        <div>
                            <p className="text-gray-500">Address</p>
                            <p className="font-semibold">{users.address || "-"}</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-2 mx-4 bg-white p-3">
                    <button onClick={() => {
                        localStorage.removeItem("edit_user_id");
                        router.push("/setup/manage-user");
                    }} className="px-4 py-2 border border-blue-800 text-blue-800 rounded hover:bg-blue-900 hover:text-white transition">CANCEL</button>
                </div>
            </div>
        </>
    );
}