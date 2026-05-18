"use client";

import React from "react";
import CommonMasterPage from "@/app/components/CommonMasterPage";
import Header from "@/app/components/header";
import useAuth from "../components/useAuth";

export default function Page() {

    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
    
        useAuth();
    
    return (
        <>
            <Header />
            <CommonMasterPage
                title="Contact Designation"
                listApi={`${API_BASE}/api/contact/read`} // add your list API
                saveApi={`${API_BASE}/api/contact`}      // add your insert API without any endpoints
                breadcrumbs={["Customer", "Contact Designation List"]}
                showRadio={false}
                radioField="is_parent"
                showCheckboxColumn={false}
                // extraColumn={{ label: "Access", key: "access" }}
            />
        </>
    );
}
