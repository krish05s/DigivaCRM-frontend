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
                title="Ticket Support"
                listApi={`${API_BASE}/api/ticket-support/read`} // add your list API
                saveApi={`${API_BASE}/api/ticket-support`}
                breadcrumbs={["Ticket", "Ticket Support"]}
                showRadio={false}
                showCheckboxColumn={true}
            />
        </>
    );
}
