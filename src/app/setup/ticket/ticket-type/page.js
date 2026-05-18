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
                title="Ticket Type"
                listApi={`${API_BASE}/api/ticket-type/read`} // add your list API
                saveApi={`${API_BASE}/api/ticket-type`}
                breadcrumbs={["Ticket", "Ticket Type"]}
                showRadio={false}
                showCheckboxColumn={true}
            />
        </>
    );
}
