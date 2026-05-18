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
                title="Ticket Source"
                listApi={`${API_BASE}/api/ticket-source/read`} // add your list API
                saveApi={`${API_BASE}/api/ticket-source`}
                breadcrumbs={["Ticket", "Ticket Source"]}
                showRadio={false}
                showCheckboxColumn={true}
            />
        </>
    );
}
