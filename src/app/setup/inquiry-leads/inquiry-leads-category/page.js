"use client";

import React from "react";
import CommonMasterPage from "@/app/components/CommonMasterPage";
import Header from "@/app/components/header";
import useAuth from "@/app/components/useAuth";

export default function Page() {

    useAuth();

    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
    return (
        <>
            <Header />
            <CommonMasterPage
                title="Inquiry / Lead Category"
                listApi={`${API_BASE}/api/inquiry-lead-category/read`} // add your list API
                saveApi={`${API_BASE}/api/inquiry-lead-category`}      // add your insert API without any endpoints
                breadcrumbs={["Inquiry / Lead", "Inquiry / Lead Category"]}
                showRadio={false}
                // radioField="is_parent"
                showCheckboxColumn={false}
                // extraColumn={{ label: "Access", key: "access" }}
            />
        </>
    );
}
