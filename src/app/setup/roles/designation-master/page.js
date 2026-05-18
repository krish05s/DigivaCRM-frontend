"use client";

import React from "react";
import CommonMasterPage from "@/app/components/CommonMasterPage";
import Header from "@/app/components/header";
import useAuth from "@/app/components/useAuth";

export default function Page() {
    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

    useAuth();

    return (
        <>
            <Header />
            <CommonMasterPage
                title="Designation"
                listApi={`${API_BASE}/api/designation-master/read`} // add your list API
                saveApi={`${API_BASE}/api/designation-master`}
                parentListApi={`${API_BASE}/api/role-master/read`}   
                breadcrumbs={["Roles", "Role-Master"]}
                // showRadio={true}
                radioField="is_parent"
                showCheckboxColumn={true}
                extraColumn={{ label: "Parent Designation Name", key: "parent_designation" }}
            />
        </>
    );
}
