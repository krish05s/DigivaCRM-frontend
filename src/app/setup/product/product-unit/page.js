"use client";

import React from "react";
import CommonMasterPage from "@/app/components/CommonMasterPage";
import Header from "@/app/components/header";
import useAuth from "@/app/components/useAuth";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Page() {
    useAuth();
    return (
        <>
            <Header />
            <CommonMasterPage
                title="Product Unit"
                listApi={`${API_BASE}/api/product-unit/read`} // add your list API
                saveApi={`${API_BASE}/api/product-unit`}      // add your insert API without any endpoints
                breadcrumbs={["Product", "Product Unit"]}
                showRadio={false}
                showCheckboxColumn={false}
            />
        </>
    );
}
