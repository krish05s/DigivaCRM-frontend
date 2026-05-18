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
                title="Product Category"
                listApi={`${API_BASE}/api/product-category/read`} // add your list API
                saveApi={`${API_BASE}/api/product-category`}      // add your insert API without any endpoints
                breadcrumbs={["Product", "Product Category"]}
                showRadio={false}
                showCheckboxColumn={false}
            />
        </>
    );
}
