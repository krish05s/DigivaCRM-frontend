"use client";
import React, { useEffect, useRef, useState } from "react";
import axios from "redaxios";
import Link from "next/link";
import Header from "@/app/components/header";
import { toast } from "react-toastify";
import Select from "react-select";
import { checkRole } from "@/utils/checkRole";
import useAuth from "@/app/components/useAuth";

export default function QuotationPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusChangeData, setStatusChangeData] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Pending");
  const [selectedLead, setSelectedLead] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [followUpHistory, setFollowUpHistory] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  // BUG FIX #1: Default tab changed from "sales" to "quotation"
  const [followUpTab, setFollowUpTab] = useState("quotation");

  const [previewFollowUp, setPreviewFollowUp] = useState(null);
  const [quotationData, setQuotationData] = useState(null);

  const [productsList, setProductsList] = useState([]);
  // UPDATE (Quantity Input): Default qty changed to empty string to allow manual typing
  const [quoteItems, setQuoteItems] = useState([
    { product_id: "", product_name: "", unit: "", price: 0, qty: "", amount: 0 }
  ]);
  const [rightModalTab, setRightModalTab] = useState("preview"); // "preview" or "history"

  const fetchProductsList = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/product-master/read`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setProductsList(res.data || []);
    } catch (err) {
      console.error("Error fetching products list:", err);
    }
  };

  useEffect(() => {
    fetchProductsList();
  }, []);



  const parseDescriptionForItems = (desc) => {
    try {
      if (desc && desc.trim().startsWith("{") && desc.trim().endsWith("}")) {
        const parsed = JSON.parse(desc);
        if (parsed && Array.isArray(parsed.items)) {
          return {
            items: parsed.items,
            note: parsed.note || ""
          };
        }
      }
    } catch (e) {
      console.error("Error parsing items from description JSON:", e);
    }
    return {
      items: [{ product_id: "", product_name: "", unit: "", price: 0, qty: "", amount: 0 }],
      note: desc || ""
    };
  };

  //view
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewQuotation, setViewQuotation] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // follow-up
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    follow_up_date: new Date().toISOString().split("T")[0],
    activity_type: "",
    follow_up_by: "",
    contact_person: "",
    // BUG FIX #2: Added quotation_no field to updateForm
    quotation_no: "",
    description: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // PI Modal States
  const [showPIModal, setShowPIModal] = useState(false);
  const [selectedPIQuotation, setSelectedPIQuotation] = useState(null);
  const [piPercentage, setPiPercentage] = useState("");
  const [piRupees, setPiRupees] = useState("");
  const [isCreatingPI, setIsCreatingPI] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignQuotation, setSelectedAssignQuotation] = useState(null);
  const [assignForm, setAssignForm] = useState({
    assigned_to: "",
    task_datetime: "",
    work_description: "",
  });

  // Assignee Popover States
  const [showAssigneeModal, setShowAssigneeModal] = useState(false);
  const [selectedAssigneeRow, setSelectedAssigneeRow] = useState(null);
  const [newAssigneeValue, setNewAssigneeValue] = useState(null);
  const [isUpdatingAssignee, setIsUpdatingAssignee] = useState(false);
  const [assigneePopoverPos, setAssigneePopoverPos] = useState({
    top: 0,
    left: 0,
  });
  const [assigneeDescription, setAssigneeDescription] = useState("");
  const [assigneeFiles, setAssigneeFiles] = useState([]);

  // Assignee History States
  const [assigneeLog, setAssigneeLog] = useState([]);
  const [loadingLog, setLoadingLog] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // PI Assignee Selection Modal States
  const [showPiUserSelectModal, setShowPiUserSelectModal] = useState(false);
  const [availablePiUsers, setAvailablePiUsers] = useState([]);
  const [selectedPiUserForApproval, setSelectedPiUserForApproval] =
    useState("");
  const [approveTargetHistId, setApproveTargetHistId] = useState(null);

  const [form, setForm] = useState({
    quotation_no: "",
    quotation_date: new Date().toISOString().split("T")[0],
    activity_type: "",
    quotation_status: "Pending",
    assignee: "",
    amount: "",
    discount: "",
    discount_rs: "",
    tax: "0",
    grand_total: "",
    description: "",
    quotation_start_date: "",
    quotation_expiry_date: "",
  });

  useEffect(() => {
    const totalAmount = parseFloat(form.amount) || 0;
    const discountPercent = parseFloat(form.discount) || 0;
    const taxPercent = parseFloat(form.tax) || 0;

    const discount_rs = (totalAmount * discountPercent) / 100;
    const subTotal = totalAmount - discount_rs;
    const tax_rs = (subTotal * taxPercent) / 100;
    const grandTotal = subTotal + tax_rs;

    setForm((prev) => ({
      ...prev,
      discount_rs: discount_rs > 0 ? discount_rs.toFixed(2) : "",
      grand_total: grandTotal > 0 ? grandTotal.toFixed(2) : "",
    }));
  }, [form.amount, form.discount, form.tax]);

  useEffect(() => {
    const total = quoteItems
      .filter((item) => item.product_id !== "")
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    setForm((prev) => ({
      ...prev,
      amount: total > 0 ? total.toFixed(2) : "",
    }));
  }, [quoteItems]);

  useAuth(["Admin", "Super Admin", "Sales", "Estimation"]);

  const isApprovedLocked = followUpHistory.some(
    (h) => h.quotation_status === "Approved",
  );
  const isWonOrLostLocked =
    selectedLead?.displayStatus === "Won" ||
    selectedLead?.displayStatus === "Lost";
  const isLatestExpired = (() => {
    if (followUpHistory && followUpHistory.length > 0) {
      const latest = followUpHistory[0];
      if (latest.quotation_expiry_date) {
        const status = latest.quotation_status;
        if (status !== "Approved" && status !== "Won") {
          const expiryDate = new Date(latest.quotation_expiry_date);
          expiryDate.setHours(23, 59, 59, 999);
          return new Date() > expiryDate;
        }
      }
    }
    if (selectedLead && selectedLead.quotation_expiry_date) {
      const status = selectedLead.quotation_status;
      if (status !== "Approved" && status !== "Won") {
        const expiryDate = new Date(selectedLead.quotation_expiry_date);
        expiryDate.setHours(23, 59, 59, 999);
        return new Date() > expiryDate;
      }
    }
    return false;
  })();
  const isModalLocked = isApprovedLocked || isWonOrLostLocked || isLatestExpired;

  const isQuotationNoLocked = (() => {
    const hasHistoryNo =
      followUpHistory &&
      followUpHistory.some(
        (item) => item.quotation_no && String(item.quotation_no).trim() !== "",
      );
    if (hasHistoryNo) return true;
    if (
      selectedLead?.quotation_no &&
      String(selectedLead.quotation_no).trim() !== ""
    ) {
      return true;
    }
    if (
      selectedQuotation?.quotation_no &&
      String(selectedQuotation.quotation_no).trim() !== ""
    ) {
      return true;
    }
    return false;
  })();

  const fetchHistoryData = async (quotationId) => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/quotation-revision/${quotationId}/full-details`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const quotationHistory =
        res.data?.data?.revisions?.map((item) => ({
          ...item,
          module_type: "quotation",
        })) || [];

      const salesHistory =
        res.data?.data?.follow_ups?.map((item) => ({
          ...item,
          module_type: "sales",
        })) || [];

      const mergedHistory = [...quotationHistory, ...salesHistory].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );

      setFollowUpHistory(mergedHistory);
    } catch (err) {
      console.log("HISTORY ERROR =", err);
      toast.error("Failed to load history");
    }
  };

  const handleUpdate = async () => {
    try {
      setUpdateLoading(true);

      const payload = {
        quotation_id: selectedQuotation?.id,
        quotation_no: updateForm.quotation_no || selectedQuotation?.quotation_no || "",
        follow_up_date: updateForm.follow_up_date,
        activity_type: updateForm.activity_type,
        follow_up_by: updateForm.follow_up_by,
        contact_person: updateForm.contact_person,
        description: updateForm.description,
      };

      const res = await axios.post(
        `${API_BASE}/api/quotation-revision/insert`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      toast.success("Follow-up added successfully!");

      if (selectedQuotation?.id) {
        await fetchHistoryData(selectedQuotation.id);
      }

      setUpdateForm({
        follow_up_date: new Date().toISOString().split("T")[0],
        activity_type: "",
        follow_up_by: "",
        contact_person: "",
        quotation_no:
          updateForm.quotation_no || selectedQuotation?.quotation_no || "",
        description: "",
      });
      setSelectedFiles([]);
      setPreviewFollowUp(null);
    } catch (error) {
      console.log("ERROR =", error);
      toast.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setUpdateLoading(false);
    }
  };

  //view
  const handleViewQuotation = async (quotationId) => {
    try {
      setViewLoading(true);

      const res = await axios.get(
        `${API_BASE}/api/quotation/full-details/${quotationId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setViewQuotation(res.data.data);
      setShowViewModal(true);
    } catch (err) {
      console.log(err);
      toast.error("Failed to load quotation details");
    } finally {
      setViewLoading(false);
    }
  };

  const handlePrintQuotation = (q) => {
    const printPortal = document.getElementById("quotation-print-portal-wrapper");
    if (printPortal) {
      document.body.classList.add("printing-mode");
      window.print();
      setTimeout(() => {
        document.body.classList.remove("printing-mode");
      }, 1000);
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup blocked! Please allow popups to print.");
      return;
    }

    const subTotal = Number(q.amount || 0);
    const discountPercent = Number(q.discount || 0);
    const discountRs = q.discount_rs ? Number(q.discount_rs) : ((subTotal * discountPercent) / 100);
    const taxPercent = Number(q.tax || 0);
    const taxRs = ((subTotal - discountRs) * taxPercent) / 100;
    const grandTotal = Number(q.grand_total || 0);

    const { items, note } = parseDescriptionForItems(q.description);
    const validItems = items.filter(item => item.product_id !== "");
    const itemsHtml = validItems.length > 0 
      ? validItems.map((item, idx) => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 12px 16px; text-align: left; color: #94a3b8; font-weight: 500;">${idx + 1}</td>
          <td style="padding: 12px 8px; text-align: left; font-weight: 600; color: #1e293b; white-space: pre-wrap;">${item.product_name || "—"}</td>
          <td style="padding: 12px 8px; text-align: center; color: #475569;">${item.unit || "—"}</td>
          <td style="padding: 12px 8px; text-align: right; color: #475569;">₹ ${Number(item.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td style="padding: 12px 8px; text-align: center; color: #475569; font-weight: bold;">${item.qty || 1}</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: bold; color: #1e293b;">₹ ${Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      `).join("")
      : `
        <tr>
          <td colspan="6" style="padding: 20px; text-align: center; color: #94a3b8; font-style: italic;">No items found</td>
        </tr>
      `;

    const dateStr = q.quotation_date
      ? new Date(q.quotation_date).toLocaleDateString()
      : q.created_at
        ? new Date(q.created_at).toLocaleDateString()
        : "—";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quotation - ${q.quotation_no || "Details"}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }

            @media print {
              body { margin: 0; padding: 10px; background-color: #ffffff !important; }
              .no-print { display: none !important; }
              .container { border: 1px solid #e2e8f0 !important; border-radius: 12px !important; box-shadow: none !important; }
              /* Force page breaks to be avoided inside container elements */
              .header, .grid-details, .table-container, .breakdown, .footer-grid { page-break-inside: avoid; }
            }
            
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; margin: 0; padding: 40px; background-color: #f8fafc; }
            .container { max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); overflow: hidden; display: flex; flex-direction: column; }
            
            .header { background: linear-gradient(to right, #eef2f7, #ffffff); padding: 24px; color: #1e293b; display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid #334d77; }
            .brand { display: flex; align-items: center; gap: 10px; }
            .logo-v { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #334d77, #1e2e4c); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.1); }
            .brand-name { font-size: 20px; font-weight: 900; color: #334d77; letter-spacing: 0.05em; margin: 0; line-height: 1; }
            .brand-subtitle { font-size: 8px; color: #475569; text-transform: uppercase; letter-spacing: 0.25em; font-weight: 800; margin: 4px 0 0 0; }
            
            .quote-title { font-size: 22px; font-weight: 900; color: #334d77; letter-spacing: 0.05em; margin: 0; text-align: right; }
            .quote-meta { margin-top: 16px; display: inline-grid; grid-template-cols: auto auto; gap: 8px 16px; font-size: 11px; color: #475569; background: rgba(51, 77, 119, 0.05); border-radius: 10px; padding: 12px; border: 1px solid rgba(51, 77, 119, 0.15); text-align: left; }
            .meta-label { font-weight: 600; color: #64748b; }
            .meta-val { font-weight: 700; color: #334d77; text-align: right; }
            
            .content-body { padding: 24px; background: #ffffff; }
            
            .grid-details { display: flex; flex-direction: row; flex-wrap: nowrap; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
            .details-card-client { width: 48%; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
            .details-card-ref { width: 48%; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; text-align: right; }
            .card-title { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; margin: 0 0 10px 0; display: flex; align-items: center; gap: 6px; }
            .details-card-ref .card-title { justify-content: flex-end; }
            .card-name { font-size: 14px; font-weight: 800; color: #1e293b; margin: 0; }
            .card-val { color: #475569; margin: 6px 0 0 0; font-weight: 500; font-size: 12px; }
            
            .table-container { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #ffffff; margin-top: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { padding: 12px 10px; font-weight: bold; color: #ffffff; background: #334d77; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; border-bottom: 2px solid #1e2e4c; }
            td { padding: 12px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }
            
            .breakdown { display: flex; justify-content: flex-end; margin-top: 24px; font-size: 12px; }
            .breakdown-box { width: 300px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
            .breakdown-row { display: flex; justify-content: space-between; color: #475569; font-weight: 600; margin-bottom: 10px; }
            .breakdown-row.discount { color: #059669; }
            .breakdown-row.total { color: #1e293b; font-weight: 900; margin-top: 12px; border-top: 1px dashed #cbd5e1; padding-top: 12px; align-items: center; }
            .total-val { font-size: 18px; color: #334d77; }
            
            .footer-grid { display: flex; flex-direction: row; flex-wrap: nowrap; justify-content: space-between; gap: 24px; border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 24px; }
            .terms-container { width: 60%; }
            .terms-title { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 800; margin: 0 0 8px 0; display: flex; align-items: center; gap: 6px; }
            .terms-content { font-size: 10px; color: #475569; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; min-height: 60px; font-weight: 500; white-space: pre-wrap; line-height: 1.5; text-align: left; }
            
            .signature-box { width: 35%; display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-end; text-align: right; }
            .sig-line { width: 100%; border-bottom: 1px solid #cbd5e1; height: 50px; margin-bottom: 8px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 8px; font-size: 10px; font-style: italic; color: #94a3b8; opacity: 0.6; }
            .sig-label { font-size: 10px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
            .sig-sub { font-size: 9px; color: #64748b; margin: 2px 0 0 0; font-weight: 600; }
            
            .print-btn-container { text-align: center; margin-bottom: 20px; }
            .print-btn { background: #334d77; color: white; border: none; padding: 12px 24px; font-size: 14px; font-weight: bold; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(51, 77, 119, 0.2); transition: all 0.2s; }
            .print-btn:hover { background: #1e2e4c; transform: translateY(-1px); }
          </style>
        </head>
        <body>
          <div class="print-btn-container no-print">
            <button class="print-btn" onclick="window.print()">Print / Download PDF</button>
          </div>
          <div class="container">
            <div class="header">
              <div>
                <div class="brand">
                  <div class="logo-v">G</div>
                  <div>
                    <h1 class="brand-name">GURU Tech</h1>
                    <p class="brand-subtitle">Packaging Solution</p>
                  </div>
                </div>
                <div style="font-size: 10px; color: #475569; margin-top: 16px; line-height: 1.5; font-weight: 500;">
                  <span style="color: #334d77; font-weight: bold;">📍</span> 149, RK Industrial Estate, Bhuvaladi 100 feet Road, Kathwada GIDC, Ahmedabad - 382430, Gujarat, India<br>
                  <span style="color: #334d77; font-weight: bold;">📞</span> Phone: +91 96620 74346 / +91 95376 74346  |  <span style="color: #334d77; font-weight: bold;">✉</span> Email: sales@gurutechpackaging.com
                </div>
              </div>
              <div style="text-align: right;">
                <h2 class="quote-title">QUOTATION</h2>
                <div class="quote-meta">
                  <span class="meta-label">Quote No:</span>
                  <span class="meta-val">${q.quotation_no || "—"}</span>
                  <span class="meta-label">Date:</span>
                  <span class="meta-val">${dateStr}</span>
                </div>
              </div>
            </div>

            <div class="content-body">
              <div class="grid-details">
                <div class="details-card-client">
                  <p class="card-title"><span style="color: #334d77;">🏢</span> Client Details</p>
                  <p class="card-name">${q.company_name || "—"}</p>
                  ${q.customer_name ? `<p class="card-val"><span style="color: #94a3b8; font-weight: normal;">Attn:</span> ${q.customer_name}</p>` : ""}
                </div>
                <div class="details-card-ref">
                  <p class="card-title"><span style="color: #312e81;">ℹ</span> Reference Details</p>
                  <p class="card-name" style="font-style: italic; font-weight: bold; color: #334155;">${q.reference || "—"}</p>
                </div>
              </div>

              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th style="width: 30px; text-align: left; padding-left: 16px;">#</th>
                      <th style="text-align: left;">Product Description</th>
                      <th style="text-align: center; width: 60px;">Unit</th>
                      <th style="text-align: right; width: 100px;">Price (₹)</th>
                      <th style="text-align: center; width: 60px;">Qty</th>
                      <th style="text-align: right; width: 100px; padding-right: 16px;">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml || `<tr><td colspan="6" style="padding: 20px; text-align: center; color: #94a3b8; font-style: italic;">No items found</td></tr>`}
                  </tbody>
                </table>
              </div>

              <div class="breakdown">
                <div class="breakdown-box">
                  <div class="breakdown-row">
                    <span>Subtotal:</span>
                    <span style="color: #1e293b; font-weight: 700;">₹ ${subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  ${discountPercent > 0 ? `
                    <div class="breakdown-row discount">
                      <span>Discount (${discountPercent}%):</span>
                      <span>-₹ ${discountRs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  ` : ""}
                  ${taxPercent > 0 ? `
                    <div class="breakdown-row">
                      <span>Tax (${taxPercent}%):</span>
                      <span style="color: #1e293b; font-weight: 700;">₹ ${taxRs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  ` : ""}
                  <div class="breakdown-row total">
                    <span style="font-size: 11px; text-transform: uppercase; tracking-wider; font-weight: 700;">Grand Total:</span>
                    <span class="total-val">₹ ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div class="footer-grid">
                <div class="terms-container">
                  ${note ? `
                    <p class="terms-title">
                      <span style="color: #334d77;">●</span> Terms & Conditions
                    </p>
                    <div class="terms-content">${note}</div>
                  ` : ""}
                </div>
                <div class="signature-box">
                  <div class="sig-line">Signature / Stamp</div>
                  <p class="sig-label">Authorized Signatory</p>
                  <p class="sig-sub">Guru Tech Packaging Solution</p>
                </div>
              </div>
            </div>
          </div>
          <script>
            // Automatically open print dialog
            window.onload = function() {
              setTimeout(function() { window.print(); }, 300);
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleDownloadQuotation = async (quotationId) => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/quotation/full-details/${quotationId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      const q = res.data?.data;
      if (q) {
        handlePrintQuotation(q);
      } else {
        toast.error("Failed to load quotation details");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load quotation details for printing");
    }
  };

  // ========================
  // FETCH
  // ========================
  const fetchQuotations = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/quotation/read`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const data = (res.data?.result || []).map((item) => {
        const isExpired = item.quotation_expiry_date && 
          item.quotation_status !== "Approved" && 
          item.quotation_status !== "Won" && 
          new Date(item.quotation_expiry_date).setHours(23, 59, 59, 999) < new Date();
        const finalStatus = isExpired
          ? "Expired"
          : item.quotation_status === "Approved" || item.quotation_status === "Won"
            ? "Won"
            : item.quotation_status === "Lost"
              ? "Lost"
              : "Pending";
        return {
          ...item,
          displayStatus: finalStatus,
          wasApprovedOnce:
            item.has_approved ||
            item.quotation_status === "Won" ||
            item.quotation_status === "Lost",
          pi_exists:
            item.proforma_percentage && Number(item.proforma_percentage) > 0,
        };
      });

      const userRole = localStorage.getItem("role") || "";
      const userFirstName = (localStorage.getItem("username") || "")
        .split(" ")[0]
        .toLowerCase();
      let filteredData = data;
      if (userRole.toLowerCase() === "sales") {
        filteredData = data.filter((q) => {
          const qAssignees = q.assignee
            ? q.assignee.split(",").map((name) => name.trim().toLowerCase())
            : [];
          const lAssignees = q.lead_assignee
            ? q.lead_assignee
                .split(",")
                .map((name) => name.trim().toLowerCase())
            : [];
          const hasBeenAssigned =
            qAssignees.some((name) => name.includes(userFirstName)) ||
            lAssignees.some((name) => name.includes(userFirstName));

          let inLog = false;
          if (q.assignee_log) {
            try {
              const logs = JSON.parse(q.assignee_log);
              inLog = logs.some(
                (log) =>
                  (log.previous_assignee &&
                    log.previous_assignee
                      .toLowerCase()
                      .includes(userFirstName)) ||
                  (log.new_assignee &&
                    log.new_assignee.toLowerCase().includes(userFirstName)),
              );
            } catch {}
          }
          return hasBeenAssigned || inLog;
        });
      } else if (userRole.toLowerCase() === "estimation") {
        filteredData = data.filter((q) => {
          const qAssignees = q.assignee
            ? q.assignee.split(",").map((name) => name.trim().toLowerCase())
            : [];
          const lAssignees = q.lead_assignee
            ? q.lead_assignee
                .split(",")
                .map((name) => name.trim().toLowerCase())
            : [];

          const matchesQuotation = qAssignees.some((name) =>
            name.includes(userFirstName),
          );
          const matchesLead = lAssignees.some((name) =>
            name.includes(userFirstName),
          );

          if (qAssignees.length === 0) {
            return matchesLead;
          }
          return matchesQuotation;
        });
      }
      setQuotations(filteredData);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ========================
  // FETCH ASSIGNEE LOG
  // ========================
  const fetchAssigneeLog = async (lead_id) => {
    try {
      setLoadingLog(true);
      const res = await axios.get(
        `${API_BASE}/api/quotation/assignee-log/${lead_id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setAssigneeLog(res.data?.log || []);
    } catch (err) {
      console.log("Assignee log fetch error:", err);
      setAssigneeLog([]);
    } finally {
      setLoadingLog(false);
    }
  };

  // ========================
  // EXPORT TO EXCEL
  // ========================
  const exportToExcel = async () => {
    try {
      if (filteredQuotations.length === 0) {
        toast.error("No data available to export");
        return;
      }
      const XLSX = await import("xlsx");
      const exportData = filteredQuotations.map((q, index) => ({
        "#": index + 1,
        "Company Name": q.company_name || "",
        "Customer Name": q.customer_name || "",
        Reference: q.reference || "",
        "Quotation No": q.quotation_no || "",
        "Created Date": q.first_quotation_date
          ? new Date(q.first_quotation_date).toLocaleDateString()
          : "",
        "Last Activity": q.quotation_date
          ? new Date(q.quotation_date).toLocaleDateString()
          : q.quotation_created_at
            ? new Date(q.quotation_created_at).toLocaleDateString()
            : "",
        "Grand Total (₹)": q.grand_total
          ? Number(q.grand_total).toLocaleString()
          : "",
        Status: q.displayStatus || "",
        "Proforma %": q.proforma_percentage
          ? `${Number(q.proforma_percentage).toFixed(0)}%`
          : "-",
        "Updated By": q.updated_by || "",
        "Updated At": q.updated_at
          ? new Date(q.updated_at).toLocaleString("en-IN")
          : "",
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Quotations");
      const colWidths = Object.keys(exportData[0]).map((key) => ({
        wch: Math.max(key.length, 18),
      }));
      worksheet["!cols"] = colWidths;
      const now = new Date();
      const date = now.toISOString().split("T")[0];
      const time = now.toTimeString().slice(0, 5).replace(":", "-");
      const fileName = `Quotation_${activeTab}_(${date})_${time}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success("Excel exported successfully");
      setShowExportMenu(false);
    } catch (err) {
      console.log("Excel Export Error:", err);
      toast.error("Excel export failed");
    }
  };

  // ========================
  // EXPORT TO PDF
  // ========================
  const exportToPDF = async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text(`Quotations Report - ${activeTab}`, 14, 15);
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Exported on: ${new Date().toLocaleDateString("en-GB")}   |   Total Records: ${filteredQuotations.length}`,
        14,
        22,
      );
      const tableData = filteredQuotations.map((q, index) => [
        index + 1,
        q.company_name || "",
        q.customer_name || "",
        q.reference || "",
        q.quotation_no || "",
        q.first_quotation_date
          ? new Date(q.first_quotation_date).toLocaleDateString()
          : "",
        q.quotation_date
          ? new Date(q.quotation_date).toLocaleDateString()
          : q.quotation_created_at
            ? new Date(q.quotation_created_at).toLocaleDateString()
            : "",
        q.grand_total ? `Rs.${Number(q.grand_total).toLocaleString()}` : "",
        q.displayStatus || "",
        q.proforma_percentage
          ? `${Number(q.proforma_percentage).toFixed(0)}%`
          : "-",
      ]);
      autoTable(doc, {
        startY: 27,
        head: [
          [
            "#",
            "Company",
            "Customer",
            "Reference",
            "Quot. No",
            "Created",
            "Last Activity",
            "Grand Total",
            "Status",
            "PI %",
          ],
        ],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 3, textColor: [40, 40, 40] },
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
        },
        alternateRowStyles: { fillColor: [239, 246, 255] },
        columnStyles: {
          0: { cellWidth: 8 },
          3: { cellWidth: 32 },
          9: { cellWidth: 20 },
        },
      });
      const now = new Date();
      const date = now.toISOString().split("T")[0];
      const time = now.toTimeString().slice(0, 5).replace(":", "-");
      doc.save(`Quotation_${activeTab}_(${date})_${time}.pdf`);
      toast.success("PDF exported successfully");
      setShowExportMenu(false);
    } catch (err) {
      console.log(err);
      toast.error("PDF export failed");
    }
  };

  // ========================
  // FILTER
  // ========================
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const debounceRef = useRef(null);
  const [filters, setFilters] = useState({
    company_name: "",
    customer_name: "",
    reference: "",
    assignee: "",
    quotation_status: "",
    from_date: "",
    to_date: "",
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const searchQuotations = async () => {
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== ""),
      );
      const res = await axios.get(`${API_BASE}/api/quotation/filter`, {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = (res.data?.data || []).map((item) => {
        const isExpired = item.quotation_expiry_date && 
          item.quotation_status !== "Approved" && 
          item.quotation_status !== "Won" && 
          new Date(item.quotation_expiry_date).setHours(23, 59, 59, 999) < new Date();
        const finalStatus = isExpired
          ? "Expired"
          : item.quotation_status === "Approved" || item.quotation_status === "Won"
            ? "Won"
            : item.quotation_status === "Lost"
              ? "Lost"
              : "Pending";
        return {
          ...item,
          displayStatus: finalStatus,
          wasApprovedOnce:
            item.has_approved ||
            item.quotation_status === "Won" ||
            item.quotation_status === "Lost",
          pi_exists:
            item.proforma_percentage && Number(item.proforma_percentage) > 0,
        };
      });

      const userRole = localStorage.getItem("role") || "";
      const userFirstName = (localStorage.getItem("username") || "")
        .split(" ")[0]
        .toLowerCase();
      let filteredData = data;
      if (userRole.toLowerCase() === "sales") {
        filteredData = data.filter((q) => {
          const qAssignees = q.assignee
            ? q.assignee.split(",").map((name) => name.trim().toLowerCase())
            : [];
          const lAssignees = q.lead_assignee
            ? q.lead_assignee
                .split(",")
                .map((name) => name.trim().toLowerCase())
            : [];
          const hasBeenAssigned =
            qAssignees.some((name) => name.includes(userFirstName)) ||
            lAssignees.some((name) => name.includes(userFirstName));

          let inLog = false;
          if (q.assignee_log) {
            try {
              const logs = JSON.parse(q.assignee_log);
              inLog = logs.some(
                (log) =>
                  (log.previous_assignee &&
                    log.previous_assignee
                      .toLowerCase()
                      .includes(userFirstName)) ||
                  (log.new_assignee &&
                    log.new_assignee.toLowerCase().includes(userFirstName)),
              );
            } catch {}
          }
          return hasBeenAssigned || inLog;
        });
      } else if (userRole.toLowerCase() === "estimation") {
        filteredData = data.filter((q) => {
          const qAssignees = q.assignee
            ? q.assignee.split(",").map((name) => name.trim().toLowerCase())
            : [];
          const lAssignees = q.lead_assignee
            ? q.lead_assignee
                .split(",")
                .map((name) => name.trim().toLowerCase())
            : [];

          const matchesQuotation = qAssignees.some((name) =>
            name.includes(userFirstName),
          );
          const matchesLead = lAssignees.some((name) =>
            name.includes(userFirstName),
          );

          if (qAssignees.length === 0) {
            return matchesLead;
          }
          return matchesQuotation;
        });
      }
      setQuotations(filteredData);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    const hasFilter = Object.values(filters).some((v) => v !== "");
    if (!hasFilter) {
      fetchQuotations();
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchQuotations();
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [filters]);

  const resetFilters = () => {
    setFilters({
      company_name: "",
      customer_name: "",
      reference: "",
      assignee: "",
      quotation_status: "",
      from_date: "",
      to_date: "",
    });
    fetchQuotations();
  };

  const handleTableStatusChange = async (id, newStatus) => {
    try {
      await axios.put(
        `${API_BASE}/api/quotation/update-status/${id}`,
        { quotation_status: newStatus },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      toast.success("Status updated");
      setQuotations((prev) =>
        prev.map((q) => {
          if (q.latest_quotation_id !== id) return q;
          const finalStatus =
            newStatus === "Approved" || newStatus === "Won"
              ? "Won"
              : newStatus === "Lost"
                ? "Lost"
                : "Pending";
          return {
            ...q,
            quotation_status: newStatus,
            displayStatus: finalStatus,
            wasApprovedOnce:
              q.wasApprovedOnce || finalStatus === "Won" || finalStatus === "Lost",
          };
        }),
      );
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // ========================
  // ========================
  // QUOTATION HISTORY MODAL
  // ========================
  const openQuotationModal = async (lead) => {
    setSelectedLead(lead);
    setShowQuotationModal(true);
    setFollowUpHistory([]);
    setEditingId(null);

    // Auto-generate 8 digit sequential / random number
    const numericNos = quotations
      .map(q => {
        const val = q.quotation_no ? String(q.quotation_no).trim() : "";
        const match = val.match(/^\d+$/);
        return match ? parseInt(val, 10) : null;
      })
      .filter(val => val !== null && val >= 10000000 && val <= 99999999);

    const nextNo = numericNos.length > 0
      ? (Math.max(...numericNos) + 1).toString()
      : Math.floor(10000000 + Math.random() * 90000000).toString();

    setForm({
      quotation_no: nextNo,
      quotation_date: new Date().toISOString().split("T")[0],
      activity_type: "",
      quotation_status: "Pending",
      assignee: lead.assignee || "",
      discount: "",
      tax: "0",
      amount: "",
      grand_total: "",
      description: "",
      quotation_start_date: "",
      quotation_expiry_date: "",
    });
    setQuoteItems([{ product_id: "", product_name: "", unit: "", price: 0, qty: 1, amount: 0 }]);
    try {
      const res = await axios.get(
        `${API_BASE}/api/quotation/history/${lead.lead_id}`,
      );
      const historyData = res.data?.result || [];
      if (historyData.length > 0) {
        setSelectedLead((prev) => ({
          ...prev,
          latest_quotation_id: historyData[0].id,
        }));
      }

      if (historyData.length > 0 && !lead.latest_quotation_id) {
        setSelectedLead((prev) => ({
          ...prev,
          latest_quotation_id: historyData[0].id,
        }));
      }

      const historyWithFiles = await Promise.all(
        historyData.map(async (hist) => {
          const hf = await axios.get(
            `${API_BASE}/api/quotation/files/${hist.id}`,
          );
          return { ...hist, files: hf.data?.files || [] };
        }),
      );
      setFollowUpHistory(historyWithFiles);
      if (historyData.length > 0) {
        const latestHist = historyData[0];
        const { items, note } = parseDescriptionForItems(latestHist.description);
        setQuoteItems(items);
        setForm((prev) => ({
          ...prev,
          quotation_no: latestHist.quotation_no || prev.quotation_no,
          assignee: latestHist.assignee || prev.assignee,
          amount: latestHist.amount || prev.amount,
          discount: latestHist.discount || prev.discount,
          tax: latestHist.tax || prev.tax,
          description: note,
          quotation_start_date: latestHist.quotation_start_date ? latestHist.quotation_start_date.split("T")[0] : "",
          quotation_expiry_date: latestHist.quotation_expiry_date ? latestHist.quotation_expiry_date.split("T")[0] : "",
        }));
      }
    } catch (err) {
      console.log(err);
    }
  };

  const openAssignModal = (quotation) => {
    setSelectedAssignQuotation(quotation);
    setAssignForm({
      assigned_to: "",
      task_datetime: "",
      work_description: "",
    });
    setShowAssignModal(true);
  };

  const handleEditClick = (item) => {
    if (isModalLocked) {
      toast.error("Quotation is locked. No changes allowed.");
      return;
    }
    setEditingId(item.id);
    const { items, note } = parseDescriptionForItems(item.description);
    setQuoteItems(items);
    setForm({
      quotation_no: item.quotation_no || "",
      quotation_date: item.quotation_date
        ? new Date(item.quotation_date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      activity_type: item.activity_type || "",
      quotation_status: item.quotation_status || "Pending",
      assignee: item.assignee || "",
      amount: item.amount || "",
      discount: item.discount || "",
      tax: item.tax || "0",
      grand_total: item.grand_total || "",
      description: note,
      quotation_start_date: item.quotation_start_date
        ? new Date(item.quotation_start_date).toISOString().split("T")[0]
        : "",
      quotation_expiry_date: item.quotation_expiry_date
        ? new Date(item.quotation_expiry_date).toISOString().split("T")[0]
        : "",
    });
  };

  const handleItemChange = (index, field, val) => {
    const updated = [...quoteItems];
    const row = { ...updated[index], [field]: val };
    
    if (field === "product_id") {
      const prod = productsList.find((p) => String(p.id) === String(val));
      if (prod) {
        row.product_name = prod.product_name;
        row.unit = prod.unit || "Unit";
        row.price = prod.sales_price || 0;
        
        // UPDATE (Stock Validation): Check stock limit for the new product
        const stock = parseFloat(prod.current_stocks) || 0;
        if (parseFloat(row.qty || 0) > stock) {
          toast.error(`Quantity cannot exceed available stock (${stock}) for ${prod.product_name}`);
          row.qty = stock;
        }
      } else {
        row.product_name = "";
        row.unit = "";
        row.price = 0;
      }
    }

    if (field === "qty") {
      const prod = productsList.find((p) => String(p.id) === String(row.product_id));
      if (prod) {
        // UPDATE (Stock Validation): Enforce stock limit and prevent negative quantities
        const stock = parseFloat(prod.current_stocks) || 0;
        if (val !== "" && parseFloat(val) > stock) {
          toast.error(`Quantity cannot exceed available stock (${stock}) for ${prod.product_name}`);
          row.qty = stock;
        } else if (val !== "" && parseFloat(val) < 0) {
          row.qty = 0;
        } else {
          row.qty = val;
        }
      } else {
        if (val !== "" && parseFloat(val) < 0) {
          row.qty = 0;
        } else {
          row.qty = val;
        }
      }
    }
    
    row.amount = (parseFloat(row.price) || 0) * (parseFloat(row.qty) || 0);
    updated[index] = row;
    setQuoteItems(updated);
  };

  const addQuoteItemRow = () => {
    setQuoteItems((prev) => [
      ...prev,
      { product_id: "", product_name: "", unit: "", price: 0, qty: "", amount: 0 }
    ]);
  };

  const removeQuoteItemRow = (index) => {
    if (quoteItems.length === 1) return;
    setQuoteItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "activity_type" ? { quotation_status: "Pending" } : {})
    }));
  };

  const proceedStatusUpdate = async (histId, status, assignedPiUser = null) => {
    try {
      const payload = { quotation_status: status };
      if (assignedPiUser) {
        payload.assigned_pi_user = assignedPiUser;
      }

      await axios.put(
        `${API_BASE}/api/quotation/update-status/${histId}`,
        payload,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );

      if (status === "Approved") {
        await axios.put(
          `${API_BASE}/api/quotation/update-main-status/${selectedLead.latest_quotation_id}`,
          { quotation_status: "Won" },
        );
      }

      toast.success(`Quotation marked as ${status}`);

      setQuotations((prev) =>
        prev.map((q) => {
          if (q.lead_id !== selectedLead.lead_id) return q;
          return {
            ...q,
            quotation_status:
              status === "Approved" ? q.quotation_status : "Pending",
            displayStatus: status === "Approved" ? "Won" : "Pending",
            wasApprovedOnce: status === "Approved",
          };
        }),
      );

      const res = await axios.get(
        `${API_BASE}/api/quotation/history/${selectedLead.lead_id}`,
      );
      const historyData = res.data?.result || [];
      const historyWithFiles = await Promise.all(
        historyData.map(async (hist) => {
          const hf = await axios.get(
            `${API_BASE}/api/quotation/files/${hist.id}`,
          );
          return { ...hist, files: hf.data?.files || [] };
        }),
      );
      setFollowUpHistory(historyWithFiles);

      if (status === "Approved") {
        setActiveTab("Won");
      } else if (status === "Declined") {
        setActiveTab("Pending");
      }

      await fetchQuotations();
    } catch (err) {
      console.log(err);
      const errMsg =
        err.response?.data?.message || err.message || "Status update failed";
      toast.error(errMsg);
    }
  };

  const handleApproveDecline = async (histId, newStatus) => {
    try {
      if (newStatus === "Approved") {
        const usersRes = await axios.get(`${API_BASE}/api/manage-user/read`, {
          params: { search5: "Proforma invoices", search8: "1" },
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const piUsersList = usersRes.data || [];
        if (piUsersList.length > 1) {
          setApproveTargetHistId(histId);
          setAvailablePiUsers(piUsersList);
          setSelectedPiUserForApproval("");
          setShowPiUserSelectModal(true);
          return;
        } else if (piUsersList.length === 1) {
          await proceedStatusUpdate(histId, "Approved", piUsersList[0].name);
          return;
        }
      }
      await proceedStatusUpdate(histId, newStatus);
    } catch (err) {
      console.log(err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to initiate status update";
      toast.error(errMsg);
    }
  };

  const openDeleteModal = (id, name = "Quotation") => {
    setDeleteId(id);
    setDeleteName(name);
    setShowDeleteModal(true);
  };

  const handleDeleteQuotation = async () => {
    try {
      setIsDeleting(true);
      await axios.delete(`${API_BASE}/api/quotation/${deleteId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("Quotation deleted successfully");
      setShowDeleteModal(false);
      setDeleteId(null);
      if (selectedLead) {
        const res = await axios.get(
          `${API_BASE}/api/quotation/history/${selectedLead.lead_id}`,
        );
        setFollowUpHistory(res.data?.result || []);
        fetchQuotations();
      }
    } catch (err) {
      toast.error("Failed to delete quotation");
    } finally {
      setIsDeleting(false);
    }
  };

  // ========================
  // PI MODAL
  // ========================
  const handlePiPercentageChange = (val) => {
    setPiPercentage(val);
    if (val === "" || val === null) {
      setPiRupees("");
      return;
    }
    const num = Number(val);
    if (!isNaN(num) && selectedPIQuotation) {
      const gt = Number(selectedPIQuotation.grand_total) || 0;
      setPiRupees(((gt * num) / 100).toFixed(2));
    }
  };

  const handlePiRupeesChange = (val) => {
    setPiRupees(val);
    if (val === "" || val === null) {
      setPiPercentage("");
      return;
    }
    const num = Number(val);
    if (!isNaN(num) && selectedPIQuotation) {
      const gt = Number(selectedPIQuotation.grand_total) || 0;
      if (gt > 0) {
        const pct = (num / gt) * 100;
        setPiPercentage(parseFloat(pct.toFixed(4)));
      }
    }
  };

  const handleCreatePI = async () => {
    if (
      !piPercentage ||
      Number(piPercentage) <= 0 ||
      Number(piPercentage) > 100
    ) {
      toast.error("Please enter a valid percentage (1-100)");
      return;
    }
    try {
      setIsCreatingPI(true);
      await axios.post(
        `${API_BASE}/api/pi/create-from-quotation/${selectedPIQuotation.latest_quotation_id}`,
        { percentage: Number(piPercentage) },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      toast.success("Proforma Invoice created successfully!");
      setShowPIModal(false);
      setSelectedPIQuotation(null);
      setPiPercentage("");
      setPiRupees("");
      fetchQuotations();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create PI");
    } finally {
      setIsCreatingPI(false);
    }
  };

  // ========================
  // HANDLE ASSIGNEE UPDATE
  // ========================
  const handleAssigneeFileChange = (e) => {
    const files = Array.from(e.target.files);
    let updatedFiles = [...assigneeFiles];
    let remainingSlots = MAX_FILES - updatedFiles.length;
    if (remainingSlots <= 0) {
      toast.error("You can upload only 5 files");
      e.target.value = "";
      return;
    }
    for (let file of files) {
      if (remainingSlots <= 0) break;
      const ext = file.name.split(".").pop().toLowerCase();
      const isDuplicate = updatedFiles.some(
        (f) => f.name === file.name && f.size === file.size,
      );
      if (isDuplicate) continue;
      if (![...IMAGE_EXT_FE, ...EXCEL_EXT_FE, ...CAD_EXT_FE, ...DOC_EXT_FE].includes(ext)) {
        toast.error("Only JPG, PNG, PDF, Excel, and CAD files allowed");
        continue;
      }
      if (EXCEL_EXT_FE.includes(ext) && file.size > 2 * 1024 * 1024) {
        toast.error("Excel files must be under 2MB");
        continue;
      }
      if (CAD_EXT_FE.includes(ext) && file.size > 5 * 1024 * 1024) {
        toast.error("CAD files must be under 5MB");
        continue;
      }
      if (IMAGE_EXT_FE.includes(ext) && file.size > 5 * 1024 * 1024) {
        toast.error("Images must be under 5MB");
        continue;
      }
      if (DOC_EXT_FE.includes(ext) && file.size > 5 * 1024 * 1024) {
        toast.error("PDF files must be under 5MB");
        continue;
      }
      updatedFiles.push(file);
      remainingSlots--;
    }
    setAssigneeFiles(updatedFiles);
    e.target.value = "";
  };

  const removeAssigneeFile = (index) => {
    setAssigneeFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAssigneeUpdate = async () => {
    if (!selectedAssigneeRow) {
      toast.error("No row selected");
      return;
    }
    if (!newAssigneeValue) {
      toast.error("Please select an assignee");
      return;
    }
    try {
      setIsUpdatingAssignee(true);
      const assigneeStr = newAssigneeValue.value;

      const formData = new FormData();
      formData.append("assignee", assigneeStr);
      formData.append("description", assigneeDescription.trim());

      if (assigneeFiles.length > 0) {
        assigneeFiles.forEach((file) => {
          formData.append("files", file);
        });
      }

      await axios.put(
        `${API_BASE}/api/quotation/update-assignee/${selectedAssigneeRow.lead_id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      toast.success("Assignee updated successfully!");
      setShowAssigneeModal(false);
      setSelectedAssigneeRow(null);
      setNewAssigneeValue(null);
      setAssigneeLog([]);
      setAssigneeDescription("");
      setAssigneeFiles([]);
      setShowAllHistory(false);
      fetchQuotations();
    } catch (err) {
      console.log(err);
      toast.error(err?.response?.data?.message || "Failed to update assignee");
    } finally {
      setIsUpdatingAssignee(false);
    }
  };

  // Multer Constants
  const MAX_FILES = 5;
  const IMAGE_EXT_FE = ["jpg", "jpeg", "png"];
  const EXCEL_EXT_FE = ["xlsx", "xls", "csv", "excel"];
  const CAD_EXT_FE = ["dwg", "dxf"];
  const DOC_EXT_FE = ["pdf"];

  const handleSelect = (e) => {
    const files = Array.from(e.target.files);
    let updatedFiles = [...selectedFiles];
    let remainingSlots = MAX_FILES - updatedFiles.length;
    if (remainingSlots <= 0) {
      toast.error("You can upload only 5 files");
      e.target.value = "";
      return;
    }
    for (let file of files) {
      if (remainingSlots <= 0) break;
      const ext = file.name.split(".").pop().toLowerCase();
      const isDuplicate = updatedFiles.some(
        (f) => f.name === file.name && f.size === file.size,
      );
      if (isDuplicate) continue;
      if (![...IMAGE_EXT_FE, ...EXCEL_EXT_FE, ...CAD_EXT_FE, ...DOC_EXT_FE].includes(ext)) {
        toast.error("Only JPG, PNG, PDF, Excel, and CAD files allowed");
        continue;
      }
      if (EXCEL_EXT_FE.includes(ext) && file.size > 2 * 1024 * 1024) {
        toast.error("Excel files must be under 2MB");
        continue;
      }
      if (CAD_EXT_FE.includes(ext) && file.size > 5 * 1024 * 1024) {
        toast.error("CAD files must be under 5MB");
        continue;
      }
      if (IMAGE_EXT_FE.includes(ext) && file.size > 5 * 1024 * 1024) {
        toast.error("Images must be under 5MB");
        continue;
      }
      if (DOC_EXT_FE.includes(ext) && file.size > 5 * 1024 * 1024) {
        toast.error("PDF files must be under 5MB");
        continue;
      }
      updatedFiles.push(file);
      remainingSlots--;
    }
    setSelectedFiles(updatedFiles);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleSelect({ target: { files: e.dataTransfer.files, value: "" } });
  };

  const handleFileDownload = async (e, filePath, originalName) => {
    e.preventDefault();
    if (!filePath) return;
    
    // Ensure all Cloudinary URLs are accessed securely via HTTPS
    let secureFilePath = filePath;
    if (filePath.startsWith("http://")) {
      secureFilePath = filePath.replace("http://", "https://");
    }

    const ext = originalName.split(".").pop().toLowerCase();
    
    const isNativePreview = ["pdf", "jpg", "jpeg", "png"].includes(ext);
    if (isNativePreview) {
      window.open(secureFilePath, "_blank");
      return;
    }

    const isExcel = ["xlsx", "xls", "csv", "excel"].includes(ext);
    if (isExcel) {
      const separator = secureFilePath.includes("?") ? "&" : "?";
      const fileWithExt = secureFilePath + separator + "file=" + encodeURIComponent(originalName);
      const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileWithExt)}`;
      window.open(officeUrl, "_blank");
      return;
    }

    try {
      const response = await fetch(secureFilePath);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      window.open(secureFilePath, "_blank");
    }
  };

  // ========================
  // QUOTATION SUBMIT
  // ========================
  const handleQuotationSubmit = async () => {
    if (isModalLocked) {
      toast.error("Quotation is locked. You cannot add or edit quotations.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (!form.activity_type || !form.quotation_no) {
        toast.error("Activity Type and Quotation No are required!");
        setIsSubmitting(false);
        return;
      }

      // Enforce product quantity checks
      for (const item of quoteItems) {
        if (item.product_id) {
          const prod = productsList.find((p) => String(p.id) === String(item.product_id));
          if (prod) {
            const stock = parseFloat(prod.current_stocks) || 0;
            if (parseFloat(item.qty || 0) > stock) {
              toast.error(`Quantity for ${prod.product_name} exceeds available stock (${stock})`);
              setIsSubmitting(false);
              return;
            }
            if (parseFloat(item.qty || 0) <= 0) {
              toast.error(`Quantity for ${prod.product_name} must be greater than 0`);
              setIsSubmitting(false);
              return;
            }
          }
        }
      }

      const descriptionJson = JSON.stringify({
        items: quoteItems,
        note: form.description || ""
      });

      const payload = {
        ...form,
        description: descriptionJson,
      };

      if (editingId) {
        await axios.put(
          `${API_BASE}/api/quotation/update/${editingId}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        toast.success("Quotation updated");
      } else {
        payload.lead_id = selectedLead.lead_id;
        payload.company_name = selectedLead.company_name;
        payload.customer_name = selectedLead.customer_name;
        payload.reference = selectedLead.reference;

        await axios.post(`${API_BASE}/api/quotation/insert`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        toast.success("Quotation activity recorded");
      }
      const res = await axios.get(
        `${API_BASE}/api/quotation/history/${selectedLead.lead_id}`,
      );
      const historyData = res.data?.result || [];
      const historyWithFiles = await Promise.all(
        historyData.map(async (hist) => {
          const hf = await axios.get(
              `${API_BASE}/api/quotation/files/${hist.id}`,
          );
          return { ...hist, files: hf.data?.files || [] };
        }),
      );
      setFollowUpHistory(historyWithFiles);
      setForm({
        quotation_no: "",
        quotation_date: new Date().toISOString().split("T")[0],
        activity_type: "",
        quotation_status:
          selectedLead.displayStatus === "Revision" ? "Revision" : "Pending",
        assignee: "",
        amount: "",
        discount: "",
        discount_rs: "",
        tax: "0",
        grand_total: "",
        description: "",
      });
      setQuoteItems([{ product_id: "", product_name: "", unit: "", price: 0, qty: 1, amount: 0 }]);
      setSelectedFiles([]);
      setEditingId(null);
      fetchQuotations();
    } catch (err) {
      const errMsg =
        err?.response?.data?.sqlMessage ||
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong";
      toast.error(errMsg);
      console.log(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignQuotation = async () => {
    if (!assignForm.assigned_to) {
      toast.error("Please select a user to assign");
      return;
    }
    if (!selectedAssignQuotation?.latest_quotation_id) {
      toast.error("No quotation selected for assignment");
      return;
    }
    try {
      // Use the backend assign route to update assignee and set status to Pending
      await axios.put(
        `${API_BASE}/api/quotation/assign/${selectedAssignQuotation.latest_quotation_id}`,
        { assignee: assignForm.assigned_to },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      toast.success("Quotation assigned successfully");
      setShowAssignModal(false);
      // Refresh data to reflect changes in both Estimation and Sales views
      await fetchQuotations();
    } catch (err) {
      console.log(err);
      toast.error("Assignment failed");
    }
  };

  // ========================
  // TAB + FILTER LOGIC
  // ========================
  const hasActiveFilters = Object.values(filters).some((v) => v !== "");
  const filteredQuotations = hasActiveFilters
    ? quotations
    : quotations.filter((q) => {
        return q.displayStatus === activeTab;
      });

  const pendingCount = quotations.filter(
    (q) => q.displayStatus === "Pending",
  ).length;
  const wonCount = quotations.filter((q) => q.displayStatus === "Won").length;
  const lostCount = quotations.filter((q) => q.displayStatus === "Lost").length;

  // ========================
  // PAGINATION
  // ========================
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, activeTab, itemsPerPage]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedQuotations = filteredQuotations.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage);

  const getSlidingPages = () => {
    const visibleCount = 5;
    if (totalPages <= visibleCount) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let start = currentPage - Math.floor(visibleCount / 2);
    let end = currentPage + Math.floor(visibleCount / 2);
    if (start < 1) {
      start = 1;
      end = visibleCount;
    }
    if (end > totalPages) {
      end = totalPages;
      start = totalPages - visibleCount + 1;
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const [asignee, setAsignee] = useState([]);
  const [followUpUsers, setFollowUpUsers] = useState([]);
  useEffect(() => {
    const fetchAssignee = async () => {
      try {
        let data = [];
        const userRole = localStorage.getItem("role") || "";
        if (userRole.toLowerCase() === "estimation") {
          const res = await axios.get(`${API_BASE}/api/manage-user/read`, {
            params: { search5: "Sales", search8: "1" },
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          data = res.data || [];
        } else if (userRole.toLowerCase() === "sales") {
          const res = await axios.get(`${API_BASE}/api/manage-user/read`, {
            params: { search5: "Estimation", search8: "1" },
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          data = res.data || [];
        } else {
          const token = localStorage.getItem("token");
          const res = await axios.get(`${API_BASE}/api/manage-user/asignee`, {
            params: { status: 1 },
            headers: { Authorization: `Bearer ${token}` },
          });
          data = res.data.data || res.data || [];
        }
        const formatted = data.map((item) => {
          const firstName = item.name.split(" ")[0];
          return { value: firstName, label: firstName };
        });
        setAsignee(formatted);

        // Fetch all role users (exclude super admin) for follow up dropdown
        const token = localStorage.getItem("token");
        const resFollowUp = await axios.get(
          `${API_BASE}/api/manage-user/asignee`,
          {
            params: { status: 1 },
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const followUpData = resFollowUp.data.data || resFollowUp.data || [];
        const formattedFollowUp = followUpData.map((item) => {
          const firstName = item.name.split(" ")[0];
          return { value: firstName, label: firstName };
        });
        setFollowUpUsers(formattedFollowUp);
      } catch (error) {
        console.log(error);
        setAsignee([]);
        setFollowUpUsers([]);
      }
    };
    fetchAssignee();
  }, []);

  const isAdmin = mounted ? checkRole(["Admin", "Super Admin"]) : false;
  const isSales = mounted ? checkRole(["Sales"]) : false;
  const isEstimation = mounted ? checkRole(["Estimation"]) : false;
  const isKhushaliEstimation =
    isEstimation &&
    (localStorage.getItem("username") || "").split(" ")[0].toLowerCase() ===
      "khushali";

  const piGrandTotal = selectedPIQuotation
    ? Number(selectedPIQuotation.grand_total) || 0
    : 0;
  const piEnteredPct = Number(piPercentage) || 0;
  const piEnteredAmt = Number(piRupees) || 0;
  const piRemainingPct = 100 - piEnteredPct;
  const piRemainingAmt = piGrandTotal - piEnteredAmt;
  const piIsOver = piEnteredPct > 100;

  const formatDateTime = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return null;
    }
  };

  // ========================
  // OPEN ASSIGNEE POPOVER
  // ========================
  const openAssigneePopover = (e, q) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const popoverWidth = 340;
    const viewportWidth = window.innerWidth;

    let left = rect.left + window.scrollX;
    if (left + popoverWidth > viewportWidth - 10) {
      left = viewportWidth - popoverWidth - 10;
    }

    setAssigneePopoverPos({
      top: rect.bottom + window.scrollY + 6,
      left,
    });
    setSelectedAssigneeRow(q);
    setNewAssigneeValue(
      q.assignee
        ? {
            value: q.assignee.split(",")[0].trim(),
            label: q.assignee.split(",")[0].trim(),
          }
        : null,
    );
    setAssigneeLog([]);
    setAssigneeDescription("");
    fetchAssigneeLog(q.lead_id);
    setShowAssigneeModal(true);
  };

  const closeAssigneePopover = () => {
    setShowAssigneeModal(false);
    setSelectedAssigneeRow(null);
    setNewAssigneeValue(null);
    setAssigneeLog([]);
    setAssigneeDescription("");
    setAssigneeFiles([]);
    setShowAllHistory(false);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body.printing-mode {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body.printing-mode * {
            visibility: hidden !important;
          }
          body.printing-mode .no-print,
          body.printing-mode .no-print * {
            display: none !important;
            visibility: hidden !important;
          }
          /* Completely remove background layout elements from document flow to prevent extra blank page generation */
          body.printing-mode .bg-gray-100.min-h-screen,
          body.printing-mode header,
          body.printing-mode nav {
            display: none !important;
          }
          body.printing-mode #quotation-print-portal-wrapper,
          body.printing-mode #quotation-print-portal-wrapper * {
            visibility: visible !important;
          }
          body.printing-mode #quotation-print-portal-wrapper {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: transparent !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            z-index: auto !important;
          }
          body.printing-mode #quotation-print-portal-wrapper > div {
            max-width: 100% !important;
            max-height: none !important;
            height: auto !important;
            overflow: visible !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          body.printing-mode #quotation-print-portal-wrapper .overflow-y-auto {
            max-height: none !important;
            height: auto !important;
            overflow: visible !important;
            background: transparent !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          body.printing-mode #quotation-print-area {
            position: relative !important;
            width: 100% !important;
            height: auto !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
      <Header />
      <div className="bg-gray-100 min-h-screen">
        {/* Breadcrumb */}
        <div className="bg-white w-full border-gray-100 p-3 mt-1 mb-5 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <div className="hidden sm:flex items-center text-gray-700 w-full sm:w-auto">
            <p className="flex items-center flex-wrap">
              <Link
                href="/dashboard"
                className="mx-2 text-xl text-gray-400 hover:text-indigo-600"
              >
                <i className="bi bi-house"></i>
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link
                href="#"
                className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
              >
                Sales
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link
                href="/sales/quotation"
                className="mx-2 text-md text-gray-700 hover:text-[#334d77] font-semibold"
              >
                Quotation
              </Link>
            </p>
          </div>
 
          {/* Export Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="relative w-full sm:w-auto" ref={exportRef}>
              <button
                onClick={() => setShowExportMenu((prev) => !prev)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-sm bg-[#eef2f7] text-[#334d77] text-sm font-bold tracking-wide transition-all shadow-sm border border-slate-200 hover:bg-[#e2e8f0]"
              >
                <i className="bi bi-download text-base"></i>
                Export
                <i
                  className={`bi bi-chevron-down text-xs transition-transform duration-200 ${showExportMenu ? "rotate-180" : ""}`}
                ></i>
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-sm shadow-lg border border-gray-100 overflow-hidden z-50">
                  <button
                    onClick={exportToExcel}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all text-left"
                  >
                    <i className="bi bi-file-earmark-excel text-green-600 text-base"></i>
                    Export Excel
                  </button>
                  <div className="h-px bg-gray-100 mx-3"></div>
                  <button
                    onClick={exportToPDF}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all text-left"
                  >
                    <i className="bi bi-file-earmark-pdf text-red-600 text-base"></i>
                    Export PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
 
        {/* Filter Section - Mobile Toggle */}
        <div className="mx-6 md:hidden mt-3 relative z-40">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full flex items-center justify-between text-[#334d77] font-semibold bg-[#eef2f7] px-4 py-2 rounded-sm border border-slate-200 shadow-sm transition-all hover:bg-[#e2e8f0]"
          >
            <span className="flex items-center gap-2">
              <i className="bi bi-funnel"></i> Filters
            </span>
            <i
              className={`bi bi-chevron-down text-xs transition-transform duration-200 ${showMobileFilters ? "rotate-180" : ""}`}
            ></i>
          </button>
        </div>
 
        <div
          className={`
          ${showMobileFilters ? "absolute left-6 right-6 top-50 bg-white p-5 shadow-2xl border border-gray-100 z-50 rounded-lg grid grid-cols-2 gap-3 mt-1" : "hidden"} 
          md:mx-6 md:mb-3 md:items-center md:gap-2 md:flex-wrap md:flex md:relative md:bg-transparent md:p-0 md:shadow-none md:border-none md:z-auto
        `}
        >
          <input
            name="company_name"
            value={filters.company_name}
            onChange={handleFilterChange}
            placeholder="Company"
            className="p-2 w-full md:w-48 bg-white border border-slate-300 md:border rounded-sm focus:outline-none focus:border-[#334d77] focus:ring-1 focus:ring-[#334d77]/20 text-gray-600 text-sm transition-all"
          />
          <input
            name="customer_name"
            value={filters.customer_name}
            onChange={handleFilterChange}
            placeholder="Customer"
            className="p-2 w-full md:w-48 bg-white border border-slate-300 md:border rounded-sm focus:outline-none focus:border-[#334d77] focus:ring-1 focus:ring-[#334d77]/20 text-gray-600 text-sm transition-all"
          />
          <input
            name="reference"
            value={filters.reference}
            onChange={handleFilterChange}
            placeholder="Reference"
            className="p-2 w-full md:w-48 bg-white border border-slate-300 md:border rounded-sm focus:outline-none focus:border-[#334d77] focus:ring-1 focus:ring-[#334d77]/20 text-gray-600 text-sm transition-all"
          />
 
          <select
            name="quotation_status"
            value={filters.quotation_status}
            onChange={handleFilterChange}
            className="p-2 w-full md:w-45 bg-white border border-slate-300 md:border rounded-sm focus:outline-none focus:border-[#334d77] focus:ring-1 focus:ring-[#334d77]/20 text-gray-400 text-sm transition-all"
          >
            <option value="">Status</option>
            <option value="Pending">Pending</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>
 
          <div className="flex p-1 items-center px-2 border bg-white border-slate-300 rounded-sm w-full md:w-58 outline-none text-gray-400 text-sm col-span-2 md:col-span-1 focus-within:border-[#334d77] focus-within:ring-1 focus-within:ring-[#334d77]/20 transition-all">
            <span className="mx-1 p-1 text-gray-400 whitespace-nowrap">
              From Date
            </span>
            <input
              type="date"
              name="from_date"
              value={filters.from_date}
              onChange={handleFilterChange}
              className="p-1 w-full md:w-35 outline-none bg-transparent"
            />
          </div>
 
          <div className="flex p-1 items-center px-2 border bg-white border-slate-300 rounded-sm w-full md:w-53 outline-none text-gray-400 text-sm col-span-2 md:col-span-1 focus-within:border-[#334d77] focus-within:ring-1 focus-within:ring-[#334d77]/20 transition-all">
            <span className="mx-1 p-1 text-gray-400 whitespace-nowrap">
              To Date
            </span>
            <input
              type="date"
              name="to_date"
              value={filters.to_date}
              onChange={handleFilterChange}
              className="p-1 w-full md:w-35 outline-none bg-transparent"
            />
          </div>
 
          <div className="flex gap-2 col-span-2">
            <button
              onClick={() => {
                resetFilters();
                setShowMobileFilters(false);
              }}
              className="border border-gray-300 w-full md:w-auto cursor-pointer rounded-sm p-2 bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm text-center font-semibold"
            >
              Clear
            </button>
            <button
              onClick={() => setShowMobileFilters(false)}
              className="md:hidden border border-orange-300 w-full cursor-pointer rounded-sm p-2 bg-orange-100 text-orange-700 hover:bg-orange-200 text-sm text-center font-semibold"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Tabs + Table */}
        <div className="bg-white rounded-sm border border-gray-100 py-2 mx-7">
          <div className="flex items-center gap-2 sm:gap-6 px-2 sm:px-6 pt-4 border-b border-gray-100">
            <button
              onClick={() => setActiveTab("Pending")}
              className={`pb-3 px-1 sm:px-0 text-sm font-medium relative transition-all whitespace-nowrap ${activeTab === "Pending" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
            >
              <span className="inline-flex items-center gap-1">
                
                <span className="text-xs sm:text-sm">Pending </span>
                <span className="ml-0 sm:ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              </span>
              {activeTab === "Pending" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("Won")}
              className={`pb-3 px-1 sm:px-0 text-sm font-medium relative transition-all whitespace-nowrap ${activeTab === "Won" ? "text-green-600" : "text-gray-500"}`}
            >
              <span className="inline-flex items-center gap-1">
                <span className="text-xs sm:text-sm">Won </span>
                <span className="ml-0 sm:ml-2 bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">
                  {wonCount}
                </span>
              </span>
              {activeTab === "Won" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("Lost")}
              className={`pb-3 px-1 sm:px-0 text-sm font-medium relative transition-all whitespace-nowrap ${activeTab === "Lost" ? "text-red-600" : "text-gray-500"}`}
            >
              <span className="inline-flex items-center gap-1">
                <span className="text-xs sm:text-sm">Lost </span>
                <span className="ml-0 sm:ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                  {lostCount}
                </span>
              </span>
              {activeTab === "Lost" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600"></div>
              )}
            </button>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-center py-10 text-gray-400">Loading...</div>
            ) : (
              <div
                className="overflow-x-auto overflow-y-scroll max-h-[500px] custom-scroll"
                style={{ overflowX: "scroll" }}
              >
                <table className="w-full text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        #
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Company Name
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Customer Name
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Create Quotation
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Quotation No
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Last Activity
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Grand Total
                      </th>

                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Follow-up
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Updated By
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Created By
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Latest Quotation
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuotations.length > 0 ? (
                      paginatedQuotations.map((q, index) => {
                        let rowBgClass =
                          "border-b border-gray-50 hover:bg-indigo-50/30 transition-colors";
                        let customLabelBadge = null;

                        if (q.displayStatus === "Revision") {
                          const assignees = q.assignee
                            ? q.assignee
                                .split(",")
                                .map((name) => name.trim().toLowerCase())
                            : [];
                          const hasKhushali = assignees.includes("khushali");
                          const hasDarshil = assignees.includes("darshil");

                          if (hasKhushali) {
                            if (isSales) {
                              rowBgClass =
                                "border-b border-blue-100 bg-blue-50/50 hover:bg-blue-100/80 transition-colors";
                              customLabelBadge = (
                                <span className="text-blue-600 text-[11px] font-bold whitespace-nowrap animate-pulse">
                                  Sent for Revision
                                </span>
                              );
                            } else if (isKhushaliEstimation) {
                              rowBgClass =
                                "border-b border-red-100 bg-red-50/50 hover:bg-red-100/80 transition-colors";
                              customLabelBadge = (
                                <span className="text-red-600 text-[11px] font-bold whitespace-nowrap animate-pulse">
                                  Revision (Assigned to Khushali)
                                </span>
                              );
                            }
                          } else if (hasDarshil) {
                            if (isSales) {
                              rowBgClass =
                                "border-b border-green-100 bg-green-50/50 hover:bg-green-100/80 transition-colors";
                              customLabelBadge = (
                                <span className="text-green-600 text-[11px] font-bold whitespace-nowrap animate-pulse">
                                  Revision (Updated/Assigned to Darshil)
                                </span>
                              );
                            }
                          }
                        }

                        return (
                          <tr key={q.lead_id} className={rowBgClass}>
                            <td className="py-3 px-3">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </td>
                            <td className="font-medium px-3">
                              <div className="flex items-center gap-2">
                                <span>{q.company_name || "-"}</span>
                                {customLabelBadge}
                              </div>
                            </td>
                            <td className="text-orange-500 px-3">
                              {q.customer_name || "-"}
                            </td>
                            <td className="px-3">{q.reference || "-"}</td>

                            <td className="text-lg px-3 text-center">
                              {q.latest_quotation_id ? (
                                <button
                                  onClick={() => openQuotationModal(q)}
                                  className="w-9 h-9 tracking-widest rounded-full border inline-flex items-center justify-center transition-all hover:bg-blue-50 border-blue-400 text-blue-600 cursor-pointer shadow-sm mx-auto"
                                  title="Edit / View Quotation"
                                >
                                  <i className="bi bi-pencil-square text-sm"></i>
                                </button>
                              ) : (
                                <button
                                  onClick={() => openQuotationModal(q)}
                                  className="w-9 h-9 tracking-widest rounded-full border inline-flex items-center justify-center transition-all hover:bg-green-50 border-green-400 text-green-600 cursor-pointer shadow-sm mx-auto"
                                  title="Add New Quotation"
                                >
                                  <i className="bi bi-file-earmark-plus text-sm"></i>
                                </button>
                              )}
                            </td>

                            <td className="px-3 text-gray-600">
                              {q.quotation_no || "-"}
                            </td>
                            <td className="px-3 text-gray-500">
                              {q.quotation_date
                                ? new Date(
                                    q.quotation_date,
                                  ).toLocaleDateString()
                                : q.quotation_created_at
                                  ? new Date(
                                      q.quotation_created_at,
                                    ).toLocaleDateString()
                                  : "-"}
                            </td>
                            <td className="px-3 font-semibold text-gray-700">
                              {q.grand_total
                                ? `₹ ${Number(q.grand_total).toLocaleString()}`
                                : "-"}
                            </td>



                            {/* follow-up */}
                            <td className="text-center">
                              <button
                                onClick={async () => {
                                  try {
                                    setSelectedLead(q);
                                    setSelectedQuotation({
                                      id: q.latest_quotation_id,
                                      quotation_no: q.quotation_no,
                                    });

                                    // BUG FIX #1: Default to "quotation" tab
                                    setFollowUpTab("quotation");

                                    setUpdateForm({
                                      follow_up_date: new Date()
                                        .toISOString()
                                        .split("T")[0],
                                      activity_type: "",
                                      follow_up_by: "",
                                      contact_person: "",
                                      // BUG FIX #2: Pre-fill quotation_no from row data
                                      quotation_no: q.quotation_no || "",
                                      description: "",
                                    });

                                    setSelectedFiles([]);
                                    setPreviewFollowUp(null);

                                    // Fetch history
                                    const res = await axios.get(
                                      `${API_BASE}/api/quotation-revision/${q.latest_quotation_id}/full-details`,
                                      {
                                        headers: {
                                          Authorization: `Bearer ${localStorage.getItem("token")}`,
                                        },
                                      },
                                    );

                                    const quotationHistory =
                                      res.data?.data?.revisions?.map(
                                        (item) => ({
                                          ...item,
                                          module_type: "quotation",
                                        }),
                                      ) || [];

                                    const salesHistory =
                                      res.data?.data?.follow_ups?.map(
                                        (item) => ({
                                          ...item,
                                          module_type: "sales",
                                        }),
                                      ) || [];

                                    const mergedHistory = [
                                      ...quotationHistory,
                                      ...salesHistory,
                                    ].sort(
                                      (a, b) =>
                                        new Date(b.created_at) -
                                        new Date(a.created_at),
                                    );

                                    setFollowUpHistory(mergedHistory);
                                    setShowUpdateModal(true);
                                  } catch (err) {
                                    console.log(err);
                                    toast.error("Failed to load history");
                                  }
                                }}
                                className="w-10 h-10 rounded-full border border-black bg-white flex items-center justify-center mx-auto hover:bg-gray-100 transition-all duration-200"
                              >
                                <i className="bi bi-plus text-xl"></i>
                              </button>
                            </td>

                            <td className="px-3">
                              {q.updated_by ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md w-fit">
                                    <i className="bi bi-person-fill text-indigo-400 text-[10px]"></i>
                                    {q.updated_by}
                                  </span>
                                  {q.updated_at && (
                                    <span className="text-[10px] text-gray-400 font-medium">
                                      {formatDateTime(q.updated_at)}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-300 text-sm">—</span>
                              )}
                            </td>

                            <td className="px-3">
                              {q.created_by ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-md w-fit">
                                  <i className="bi bi-person-fill text-green-400 text-[10px]"></i>
                                  {q.created_by}
                                </span>
                              ) : (
                                <span className="text-gray-300 text-sm">—</span>
                              )}
                            </td>

                            <td className="px-3">
                              {q.displayStatus === "Expired" ? (
                                <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-xs font-bold">
                                  Expired
                                </span>
                              ) : q.displayStatus === "Pending" ? (
                                isKhushaliEstimation ? (
                                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">
                                    Pending
                                  </span>
                                ) : (
                                  <select
                                    value="Pending"
                                    onChange={(e) =>
                                      handleTableStatusChange(
                                        q.latest_quotation_id,
                                        e.target.value,
                                      )
                                    }
                                    className="border rounded-md px-2 py-1 text-xs font-semibold outline-none bg-blue-50 text-blue-700 border-blue-300 cursor-pointer"
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="Lost">Lost</option>
                                  </select>
                                )
                              ) : q.displayStatus === "Won" ? (
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold">
                                  Won
                                </span>
                              ) : q.displayStatus === "Lost" ? (
                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-xs font-bold">
                                  Lost
                                </span>
                              ) : null}
                            </td>

                            {/* Latest Quotation cell */}
                            <td className="px-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {q.latest_quotation_id ? (
                                  <button
                                    onClick={() =>
                                      handleViewQuotation(q.latest_quotation_id)
                                    }
                                    className="text-slate-500 hover:text-blue-600 transition-all"
                                    title="View Quotation"
                                  >
                                    <i className="bi bi-eye text-lg"></i>
                                  </button>
                                ) : (
                                  <span className="text-gray-300 text-xs">—</span>
                                )}
                              </div>
                            </td>

                            {/* Action cell */}
                            <td className="px-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {q.latest_quotation_id ? (
                                  <button
                                    onClick={() =>
                                      openDeleteModal(q.latest_quotation_id)
                                    }
                                    className="text-gray-400 hover:text-red-600 cursor-pointer"
                                    title="Delete Quotation"
                                  >
                                    <i className="bi bi-trash3 text-lg"></i>
                                  </button>
                                ) : (
                                  <span className="text-gray-300 text-xs">—</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="15"
                          className="text-center py-10 text-gray-400"
                        >
                          No Quotations Found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* PAGINATION */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white rounded-b-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500 font-medium">
                      Rows per page:
                    </span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all cursor-pointer font-medium"
                    >
                      {[10, 20, 100, 200].map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <i className="bi bi-chevron-left text-sm"></i>
                      </button>
                      <div className="flex items-center gap-1.5">
                        {getSlidingPages().map((page) => (
                          <button
                            type="button"
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${currentPage === page ? "bg-[#212121] text-white shadow-md shadow-black/10" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages),
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <i className="bi bi-chevron-right text-sm"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================== FOLLOW-UP MODAL ================== */}
      {showUpdateModal && (
        // BUG FIX #6: Full modal is scrollable with overflow-y-auto on inner container
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 p-4">
<div className="bg-white w-full max-w-[820px] rounded-sm shadow-xl border border-gray-100 overflow-hidden flex flex-col max-h-[70vh]">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-orange-100 to-white flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Update Lead Activities
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedFiles([]);
                  setPreviewFollowUp(null);
                  // BUG FIX #1: Reset to "quotation" tab on close too
                  setFollowUpTab("quotation");
                }}
                className="w-7 h-7 flex items-center justify-center text-orange-500 text-md"
              >
                ✕
              </button>
            </div>
            

            {/* Tabs */}
            <div className="flex border-b border-gray-200 flex-shrink-0">
              <button
                onClick={() => {
                  setFollowUpTab("lead");
                  setPreviewFollowUp(null);
                }}
                className={`px-6 py-3 text-sm font-semibold transition-all ${
                  followUpTab === "lead"
                    ? "text-orange-500 border-b-2 border-orange-500 bg-orange-50"
                    : "text-gray-500"
                }`}
              >
                Lead
              </button>

              <button
                onClick={() => {
                  setFollowUpTab("quotation");
                  setPreviewFollowUp(null);
                }}
                className={`px-6 py-3 text-sm font-semibold transition-all ${
                  followUpTab === "quotation"
                    ? "text-orange-500 border-b-2 border-orange-500 bg-orange-50"
                    : "text-gray-500"
                }`}
              >
                Quotation
              </button>
            </div>

            {/* Body — scrollable */}
            {/* BUG FIX #6: overflow-y-auto on this body div makes modal content scroll */}
<div className="flex flex-row flex-1 overflow-hidden">
                {/* LEFT: Form */}
<div className="w-1/2 px-3 sm:px-6 py-3 sm:py-5 border-r border-gray-100 overflow-y-auto">
                {followUpTab === "lead" && (
<p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2 sm:mb-4">
                    Lead Follow-Up
                  </p>
                )}

                {followUpTab === "quotation" && (
<p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2 sm:mb-4">
                    Quotation Follow-Up
                  </p>
                )}

                {/* LEAD TAB: Read-only notice */}
                {followUpTab === "lead" && (
                  <div className="flex flex-col gap-3">
<div className="flex items-start gap-2 sm:gap-3 bg-blue-50 border border-blue-200 rounded-xl px-2 sm:px-4 py-2 sm:py-3">
<div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i className="bi bi-info-circle-fill text-blue-500 text-sm"></i>
                      </div>
                      <div>
<p className="text-xs sm:text-sm font-semibold text-blue-700">
                          Lead Follow-Up History
                        </p>
                        <p className="text-xs text-blue-600 mt-0.5">
                          Lead follow-ups are managed from the Leads section.
                          You can view the history on the right panel.
                        </p>
                      </div>
                    </div>

                    {selectedLead && (
<div className="bg-gray-50 border border-gray-100 rounded-xl p-2 sm:p-4 space-y-1.5 sm:space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400 font-medium">
                            Company
                          </span>
                          <span className="font-semibold text-gray-700">
                            {selectedLead.company_name || "—"}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400 font-medium">
                            Customer
                          </span>
                          <span className="font-semibold text-gray-700">
                            {selectedLead.customer_name || "—"}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400 font-medium">
                            Reference
                          </span>
                          <span className="font-semibold text-gray-700">
                            {selectedLead.reference || "—"}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400 font-medium">
                            Assignee
                          </span>
                          <span className="font-semibold text-gray-700">
                            {selectedLead.assignee || "—"}
                          </span>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-gray-400 italic text-center pt-2">
                      <i className="bi bi-lock mr-1"></i>
                      Lead follow-up entries are read-only in this view
                    </p>
                  </div>
                )}

                {/* QUOTATION TAB: Editable Form */}
                {followUpTab === "quotation" && (
<div className="grid grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-2 sm:gap-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Follow-Up Date
                      </label>
                      <input
                        type="date"
                        name="follow_up_date"
                        value={updateForm.follow_up_date}
                        onChange={handleInputChange}
className="w-full mt-1 sm:mt-1.5 border border-orange-300 rounded-sm px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm outline-none bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Activity Type *
                      </label>
                      <select
                        name="activity_type"
                        value={updateForm.activity_type}
                        onChange={handleInputChange}
className="w-full mt-1 sm:mt-1.5 border border-orange-300 rounded-sm px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm outline-none bg-gray-50"
                      >
                        <option value="">-- Select --</option>
                        <option>Call</option>
                        <option>Meeting</option>
                        <option>Email</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Follow-Up By
                      </label>
                      <select
                        name="follow_up_by"
                        value={updateForm.follow_up_by}
                        onChange={handleInputChange}
                        className="w-full mt-1 sm:mt-1.5 border border-orange-300 rounded-sm px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm outline-none bg-gray-50"
                      >
                        <option value="">Select User</option>
                        {followUpUsers.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Contact Person *
                      </label>
                      <input
                        name="contact_person"
                        value={updateForm.contact_person}
                        onChange={handleInputChange}
className="w-full mt-1 sm:mt-1.5 border border-orange-300 rounded-sm px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm outline-none bg-gray-50"
                      />
                    </div>

                    {/* BUG FIX #2: Added Quotation No field in follow-up form */}
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Quotation No
                      </label>
                      <input
                        name="quotation_no"
                        value={updateForm.quotation_no}
                        onChange={handleInputChange}
                        placeholder="e.g. QT-2025-001"
                        disabled={
                          !!selectedQuotation?.quotation_no ||
                          !!selectedLead?.quotation_no
                        }
                        className={`w-full mt-1.5 border border-orange-300 rounded-sm px-3 py-2 text-sm outline-none bg-gray-50 ${
                          selectedQuotation?.quotation_no ||
                          selectedLead?.quotation_no
                            ? "opacity-75 cursor-not-allowed"
                            : ""
                        }`}
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Description *
                      </label>
                      <textarea
                        name="description"
                        value={updateForm.description}
                        onChange={handleInputChange}
className="w-full mt-1 sm:mt-1.5 border border-orange-300 rounded-sm px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm outline-none bg-gray-50 h-16 sm:h-20 resize-none"
                      />
                    </div>
                    {/* <div className="col-span-2 border-2 border-dashed border-orange-300 rounded-xl p-3 text-center bg-orange-50/40">
                      <button
                        onClick={() => setShowFileModal(true)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 mx-auto transition-all shadow-md shadow-orange-200"
                      >
                        <i className="bi bi-cloud-upload"></i> Browse Files
                      </button>
                      {selectedFiles.length > 0 && (
                        <div className="mt-2 space-y-1 text-left">
                          {selectedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center bg-white px-3 py-1 text-xs rounded-lg border border-gray-100 shadow-sm"
                            >
                              <span className="text-gray-600 truncate">{file.name}</span>
                              <button
                                onClick={() =>
                                  setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
                                }
                                className="text-orange-400 hover:text-orange-600 ml-2"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-1.5">Max 2MB · JPG, PNG, PDF</p>
                    </div> */}
                  </div>
                )}
              </div>

              {/* RIGHT: History Panel */}
              {/* BUG FIX #5 & #6: Proper overflow-y-auto, aligned layout */}
<div className="w-1/2 px-2 sm:px-6 py-3 sm:py-5 flex flex-col overflow-hidden">
                {followUpTab === "lead" && (
<div className="flex flex-wrap justify-between items-center gap-1 mb-2 sm:mb-4 flex-shrink-0">
<p className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-widest leading-tight">
                      Lead Follow-Up History
                    </p>
<span className="text-[10px] sm:text-xs bg-blue-50 text-blue-500 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-semibold border border-blue-100">
                      {
                        followUpHistory.filter((h) => h.module_type === "sales")
                          .length
                      }{" "}
                      record(s)
                    </span>
                  </div>
                )}

                {followUpTab === "quotation" && (
<div className="flex flex-wrap justify-between items-center gap-1 mb-2 sm:mb-4 flex-shrink-0">
<p className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-widest leading-tight">
                      Quotation Follow-Up History
                    </p>
<span className="text-[10px] sm:text-xs bg-orange-50 text-orange-500 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg font-semibold border border-orange-100">
                      {
                        followUpHistory.filter(
                          (h) => h.module_type === "quotation",
                        ).length
                      }{" "}
                      record(s)
                    </span>
                  </div>
                )}

                {/* History List — scrollable */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {(() => {
                    const filtered = followUpHistory.filter((h) =>
                      followUpTab === "lead"
                        ? h.module_type === "sales"
                        : h.module_type === "quotation",
                    );

                    if (filtered.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                          <i className="bi bi-clock-history text-3xl mb-2"></i>
                          <p className="text-sm">No history found</p>
                        </div>
                      );
                    }

                    return filtered.map((item, idx) => {
                      const itemId = item.follow_up_id || item.id;
                      const previewId =
                        previewFollowUp?.follow_up_id || previewFollowUp?.id;
                      const isActive = previewId === itemId;

                      return (
                        <div key={itemId}>
                          <div
                            onClick={() =>
                              setPreviewFollowUp(isActive ? null : item)
                            }
                         className={`border rounded-xl p-2 sm:p-3 cursor-pointer transition-all select-none ${
                              isActive
                                ? "border-orange-400 bg-orange-50 shadow-sm"
                                : "hover:bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                {idx === 0 && (
                                  <span className="text-xs bg-orange-100 text-orange-500 px-2 py-0.5 rounded-full font-semibold">
                                    Latest
                                  </span>
                                )}
                                <div>
                                  <p className="font-semibold text-sm text-gray-700">
                                    {item.activity_type}
                                  </p>
                                  <p
                                    className={`text-[10px] uppercase font-semibold ${
                                      followUpTab === "lead"
                                        ? "text-blue-400"
                                        : "text-orange-400"
                                    }`}
                                  >
                                    {followUpTab === "lead"
                                      ? "Lead"
                                      : "Quotation"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-gray-400">
                                  {item.follow_up_date
                                    ? new Date(
                                        item.follow_up_date,
                                      ).toLocaleDateString()
                                    : "—"}
                                </span>
                                <i
                                  className={`bi ${isActive ? "bi-chevron-up" : "bi-chevron-down"} text-gray-400 text-xs`}
                                ></i>
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 truncate">
                              {item.description}
                            </p>
                          </div>

                          {/* BUG FIX #5: Preview panel rendered inline below each card for proper alignment */}
                          {isActive && (
                            <div className="mt-1 mb-2 border border-orange-200 rounded-xl bg-gradient-to-br from-orange-50 to-white p-4 text-sm shadow-sm">
                              <div className="flex justify-between items-center mb-3">
                                <p className="font-bold text-orange-500 text-xs uppercase tracking-wide">
                                  Details
                                </p>
                                <button
                                  onClick={() => setPreviewFollowUp(null)}
                                  className="text-gray-400 hover:text-gray-600 text-xs"
                                >
                                  ✕ Close
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                                {[
                                  {
                                    label: "Activity Type",
                                    value: previewFollowUp.activity_type,
                                  },
                                  {
                                    label: "Follow-Up Date",
                                    value: previewFollowUp.follow_up_date
                                      ? new Date(
                                          previewFollowUp.follow_up_date,
                                        ).toLocaleDateString()
                                      : "—",
                                  },
                                  {
                                    label: "Contact Person",
                                    value: previewFollowUp.contact_person,
                                  },
                                  {
                                    label: "Follow-Up By",
                                    value: previewFollowUp.follow_up_by,
                                  },
                                ].map(({ label, value }) => (
                                  <div key={label}>
                                    <p className="text-xs text-gray-400 font-medium">
                                      {label}
                                    </p>
                                    <p className="font-semibold text-gray-700 text-sm mt-0.5">
                                      {value || "—"}
                                    </p>
                                  </div>
                                ))}
                                <div>
                                  <p className="text-xs text-gray-400 font-medium">
                                    Status
                                  </p>
                                  <span
                                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold mt-0.5 inline-block ${
                                      previewFollowUp.status === "Completed"
                                        ? "bg-green-100 text-green-600"
                                        : previewFollowUp.status === "Cancelled"
                                          ? "bg-orange-100 text-orange-500"
                                          : "bg-orange-100 text-orange-600"
                                    }`}
                                  >
                                    {previewFollowUp.status || "—"}
                                  </span>
                                </div>
                                {previewFollowUp.quotation_no && (
                                  <div>
                                    <p className="text-xs text-gray-400 font-medium">
                                      Quotation No
                                    </p>
                                    <p className="font-semibold text-gray-700 text-sm mt-0.5">
                                      {previewFollowUp.quotation_no}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div className="mt-2.5">
                                <p className="text-xs text-gray-400 font-medium">
                                  Description
                                </p>
                                <p className="text-gray-700 mt-1 text-sm whitespace-pre-wrap">
                                  {previewFollowUp.description || "—"}
                                </p>
                              </div>

                              {/* BUG FIX #4: File URLs as clickable links that open in new tab */}
                              {previewFollowUp.files &&
                                previewFollowUp.files.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-xs text-gray-400 font-medium mb-1.5">
                                      Attached Files
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {previewFollowUp.files.map((f, i) => (
                                        <a
                                          key={i}
                                          href={f.file_path}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1.5 border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors shadow-sm"
                                        >
                                          <i className="bi bi-file-earmark-check text-indigo-500"></i>
                                          <span className="truncate max-w-[120px]">
                                            {f.filename ||
                                              f.file_name ||
                                              "File"}
                                          </span>
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
<div className="flex justify-end gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedFiles([]);
                  setPreviewFollowUp(null);
                  setFollowUpTab("quotation");
                }}
 className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-sm text-xs sm:text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all"              >
                Cancel
              </button>

              <button
                onClick={followUpTab === "quotation" ? handleUpdate : undefined}
                disabled={followUpTab === "lead" || updateLoading}
                title={
                  followUpTab === "lead"
                    ? "Lead follow-ups cannot be added here"
                    : ""
                }
                 className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-sm text-xs sm:text-sm font-semibold text-white transition-all shadow-md flex items-center gap-2  ${
                  followUpTab === "lead"
                    ? "bg-gray-300 cursor-not-allowed shadow-none"
                    : updateLoading
                      ? "bg-orange-400 cursor-not-allowed shadow-orange-200"
                      : "bg-orange-500 hover:bg-orange-600 shadow-orange-200"
                }`}
              >
                {updateLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="white"
                        strokeWidth="4"
                        opacity="0.25"
                      />
                      <path
                        fill="white"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Saving...
                  </>
                ) : followUpTab === "lead" ? (
                  <>
                    <i className="bi bi-lock-fill text-xs"></i>
                    Add Follow-Up
                  </>
                ) : (
                  "Add Follow-Up"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUOTATION UPDATE MODAL */}
      {showQuotationModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-[98vw] max-w-[1300px] h-[95vh] rounded-sm shadow-xl overflow-hidden border border-gray-100 flex flex-col mx-auto">
            <div
              className="flex justify-between items-center px-6 py-4 border-b border-gray-100 shadow-sm z-10"
              style={{
                background: "linear-gradient(to right, #eef2f7, #ffffff)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#334d77]/10">
                  <i className="bi bi-activity text-lg text-[#334d77]"></i>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                    {selectedLead?.customer_name ? `${selectedLead.customer_name.toUpperCase()} (${selectedLead.company_name})` : selectedLead?.company_name}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">
                    Quotation Management
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQuotationModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#334d77] hover:bg-slate-100 transition-all text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-row flex-1 overflow-hidden relative">
              {/* Left Side: Form */}
              <div className="w-7/12 min-w-[320px] bg-white border-r border-gray-100 flex flex-col relative z-10 overflow-y-auto">
                {isModalLocked && (
                  <div
                    className={`mx-4 mt-4 flex items-start gap-3 border rounded-xl px-4 py-3 shadow-sm ${
                      isWonOrLostLocked
                        ? selectedLead?.displayStatus === "Won"
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                        : "bg-green-50 border-green-200"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isWonOrLostLocked
                          ? selectedLead?.displayStatus === "Won"
                            ? "bg-green-100"
                            : "bg-red-100"
                          : "bg-green-100"
                      }`}
                    >
                      <i
                        className={`bi bi-lock-fill text-sm ${
                          isWonOrLostLocked
                            ? selectedLead?.displayStatus === "Won"
                              ? "text-green-600"
                              : "text-red-600"
                            : "text-green-600"
                        }`}
                      ></i>
                    </div>
                    <div>
                      <p
                        className={`text-sm font-bold ${
                          isWonOrLostLocked
                            ? selectedLead?.displayStatus === "Won"
                              ? "text-green-700"
                              : "text-red-700"
                            : "text-green-700"
                        }`}
                      >
                        {isWonOrLostLocked
                          ? selectedLead?.displayStatus === "Won"
                            ? "Lead Won"
                            : "Lead Lost"
                          : "Quotation Approved"}
                      </p>
                      <p
                        className={`text-xs mt-0.5 ${
                          isWonOrLostLocked
                            ? selectedLead?.displayStatus === "Won"
                              ? "text-green-600"
                              : "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {isWonOrLostLocked
                          ? `This lead is marked as ${selectedLead?.displayStatus}. No further quotation updates are permitted.`
                          : "This quotation is already approved. You cannot add or edit any further quotation activities."}
                      </p>
                    </div>
                  </div>
                )}

                <div
                  className={`p-3 sm:p-6 flex flex-col gap-3 sm:gap-4 ${isModalLocked ? "opacity-50 pointer-events-none select-none" : ""}`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Quotation Date <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="date"
                        name="quotation_date"
                        value={form.quotation_date}
                        onChange={handleChange}
                        className="w-full mt-1 border border-slate-300 rounded-sm px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm outline-none bg-gray-50 focus:border-[#334d77] focus:ring-1 focus:ring-[#334d77]/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Activity Type <span className="text-red-400">*</span>
                      </label>
                      <select
                        name="activity_type"
                        value={form.activity_type}
                        onChange={handleChange}
                        className="w-full mt-1 border border-slate-300 rounded-sm px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm outline-none bg-gray-50 focus:border-[#334d77] focus:ring-1 focus:ring-[#334d77]/20 transition-all"
                      >
                        <option value="">-- Select --</option>
                        <option>New</option>
                        <option>Revision</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Quotation Start Date
                      </label>
                      <input
                        type="date"
                        name="quotation_start_date"
                        value={form.quotation_start_date || ""}
                        onChange={handleChange}
                        className="w-full mt-1 border border-slate-300 rounded-sm px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm outline-none bg-gray-50 focus:border-[#334d77] focus:ring-1 focus:ring-[#334d77]/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Quotation Expiry Date
                      </label>
                      <input
                        type="date"
                        name="quotation_expiry_date"
                        value={form.quotation_expiry_date || ""}
                        onChange={handleChange}
                        className="w-full mt-1 border border-slate-300 rounded-sm px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm outline-none bg-gray-50 focus:border-[#334d77] focus:ring-1 focus:ring-[#334d77]/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Quotation No <span className="text-red-400">*</span>
                      </label>
                      <input
                        name="quotation_no"
                        value={form.quotation_no}
                        onChange={handleChange}
                        disabled={isQuotationNoLocked}
                        className={`w-full mt-1 border border-slate-300 rounded-sm px-3 py-2 text-sm outline-none bg-gray-50 focus:border-[#334d77] focus:ring-1 focus:ring-[#334d77]/20 transition-all ${
                          isQuotationNoLocked
                            ? "opacity-75 cursor-not-allowed"
                            : ""
                        }`}
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => {
                          // UPDATE (Live Stock): Fetch latest stock before opening modal
                          fetchProductsList();
                          setShowProductModal(true);
                        }}
                        className="w-full bg-[#334d77] hover:bg-[#1e2e4c] text-white py-2.5 px-4 rounded-sm text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm h-[38px]"
                      >
                        <i className="bi bi-plus-circle-fill"></i> Add / Edit Products
                      </button>
                    </div>
                  </div>

                  {quoteItems.length > 0 && quoteItems[0].product_id && (
                    <div className="text-xs text-indigo-600 font-semibold bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-lg">
                      <i className="bi bi-info-circle-fill mr-1.5"></i>
                      Selected Products:{" "}
                      {quoteItems
                        .filter((item) => item.product_id)
                        .map((item) => `${item.product_name} (${item.qty})`)
                        .join(", ")}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Amount (₹)
                      </label>
                      <input
                        type="number"
                        name="amount"
                        value={form.amount || ""}
                        readOnly
                        className="w-full mt-1 border border-slate-300 rounded-sm px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm outline-none bg-gray-100 cursor-not-allowed text-gray-500 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Discount (%)
                      </label>
                      <input
                        type="number"
                        name="discount"
                        value={form.discount || ""}
                        onChange={handleChange}
                        className="w-full mt-1 border border-slate-300 rounded-sm px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm outline-none bg-gray-50 focus:border-[#334d77] focus:ring-1 focus:ring-[#334d77]/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Tax (%)
                      </label>
                      <select
                        name="tax"
                        value={form.tax}
                        onChange={handleChange}
                        className="w-full mt-1 border border-slate-300 rounded-sm px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm outline-none bg-gray-50 focus:border-[#334d77] focus:ring-1 focus:ring-[#334d77]/20 transition-all"
                      >
                        <option value="0">0%</option>
                        <option value="9">9%</option>
                        <option value="18">18%</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Grand Total (₹)
                      </label>
                      <input
                        type="number"
                        name="grand_total"
                        value={form.grand_total || ""}
                        readOnly
                        className="w-full mt-1 border border-slate-300 rounded-sm px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm outline-none bg-gray-100 cursor-not-allowed text-gray-500 font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Description / Terms
                    </label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows="2"
                      className="w-full mt-1 border border-slate-300 rounded-sm px-3 py-2 text-sm outline-none bg-gray-50 resize-none focus:border-[#334d77] focus:ring-1 focus:ring-[#334d77]/20 transition-all"
                    ></textarea>
                  </div>

                  {/* File upload section commented out/disabled */}
                  {/*
                  <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50/30 text-center">
                    {!editingId ? (
                      <>
                        <button
                          onClick={() => setShowFileModal(true)}
                          className="text-white px-5 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 mx-auto transition-all bg-[#334d77] hover:bg-[#1e2e4c]"
                        >
                          <i className="bi bi-cloud-upload text-sm"></i> Upload Files
                        </button>
                        {selectedFiles.length > 0 && (
                          <div className="mt-3 space-y-1.5 text-left">
                            {selectedFiles.map((file, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center bg-white px-3 py-1.5 text-xs rounded-lg border border-gray-100 shadow-sm"
                              >
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                  <i className="bi bi-file-earmark-text text-blue-500 text-sm"></i>
                                  <span className="text-gray-600 font-medium truncate">
                                    {file.name}
                                  </span>
                                </div>
                                <button
                                  onClick={() =>
                                    setSelectedFiles(
                                      selectedFiles.filter((_, i) => i !== idx),
                                    )
                                  }
                                  className="text-gray-300 hover:text-red-500 transition-colors ml-2"
                                >
                                  <i className="bi bi-x-circle text-sm"></i>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-gray-500 italic">
                        File editing is unavailable during updates. Create a new
                        quotation to attach new files.
                      </p>
                    )}
                  </div>
                  */}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 mt-auto flex gap-3">
                  {isModalLocked ? (
                    <div className="flex-1 flex items-center justify-center gap-2 bg-gray-100 border border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-400 cursor-not-allowed select-none">
                      <i className="bi bi-lock-fill text-gray-400"></i>
                      {isWonOrLostLocked
                        ? `Locked — Lead ${selectedLead?.displayStatus}`
                        : "Locked — Quotation Approved"}
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={handleQuotationSubmit}
                        disabled={isSubmitting}
                        className={`flex-1 text-white rounded-xl py-3 text-sm font-semibold transition-all flex justify-center items-center gap-2 bg-[#334d77] hover:bg-[#1e2e4c] ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
                      >
                        {isSubmitting ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="white"
                                strokeWidth="4"
                                opacity="0.25"
                              />
                              <path
                                fill="white"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                              />
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-floppy2-fill"></i>
                            {editingId
                              ? "Update Quotation"
                              : "Save Quotation Activity"}
                          </>
                        )}
                      </button>
                      {editingId && (
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setForm({
                              quotation_no: form.quotation_no,
                              quotation_date: new Date()
                                .toISOString()
                                .split("T")[0],
                              activity_type: "",
                              quotation_status:
                                selectedLead.displayStatus === "Revision"
                                  ? "Revision"
                                  : "Pending",
                              assignee: "",
                              amount: "",
                              discount: "",
                              tax: "0",
                              grand_total: "",
                              description: "",
                            });
                            setQuoteItems([{ product_id: "", product_name: "", unit: "", price: 0, qty: 1, amount: 0 }]);
                          }}
                          className="flex-none bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl px-4 py-3 text-sm font-semibold transition-all"
                        >
                          Cancel
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Right Side: History Data (No tabs) */}
              <div className="w-5/12 min-w-[300px] bg-gray-50 flex flex-col overflow-hidden">
                <div className="flex border-b border-gray-200 bg-white p-4 items-center gap-2 flex-shrink-0 justify-between">
                  <div className="flex items-center gap-2">
                    <i className="bi bi-clock-history text-lg text-[#334d77]"></i>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#334d77]">Quotation History Data</h3>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scroll">
                  {followUpHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-100 rounded-xl p-8 shadow-sm">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 border border-slate-200">
                        <i className="bi bi-clock-history text-2xl text-slate-400"></i>
                      </div>
                      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">No Revisions Found</h3>
                      <p className="text-xs text-slate-400 mt-1 text-center max-w-[280px]">Quotation revisions and follow-up activities will be recorded here dynamically.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {followUpHistory.map((item, idx) => {
                        const { items: histItems, note: histNote } = parseDescriptionForItems(item.description);
                        const isPending = item.quotation_status === "Pending";
                        const isApproved = item.quotation_status === "Approved";
                        const isDeclined = item.quotation_status === "Declined";
                        return (
                          <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-4 relative overflow-hidden text-left">
                            {/* Left colored border indicating status */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                              isApproved ? "bg-emerald-500" : isDeclined ? "bg-rose-500" : "bg-[#334d77]"
                            }`} />

                            {/* Card Header */}
                            <div className="flex justify-between items-start pl-2">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-blue-100 text-blue-600 border border-blue-200">
                                  {String(item.created_by || item.updated_by || "U").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-700">Recorded by {item.created_by || item.updated_by || "System"}</span>
                                    {idx === 0 && (
                                      <span className="text-[8px] bg-slate-100 text-[#334d77] border border-slate-200 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Current</span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                                    <i className="bi bi-calendar-event text-[9px]"></i>
                                    Quotation Date: {item.quotation_date ? new Date(item.quotation_date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }) : "—"}
                                  </p>
                                  {item.updated_by && item.created_by && (new Date(item.updated_at) - new Date(item.created_at) > 2000) && (
                                    <div className="flex items-center gap-1.5 text-[11px] text-blue-600 font-semibold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md mt-1 w-fit">
                                      <i className="bi bi-pencil-fill text-[10px]"></i>
                                      Last edited by {item.updated_by} {formatDateTime(item.updated_at)}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Status Badge or Actions */}
                              <div className="flex items-center gap-2">
                                {isPending && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleApproveDecline(item.id, "Approved")}
                                      className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleApproveDecline(item.id, "Declined")}
                                      className="bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                      Decline
                                    </button>
                                  </>
                                )}
                                <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-sm">
                                  {item.quotation_status || "PENDING"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleViewQuotation(item.id)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-400 transition-all shadow-sm cursor-pointer"
                                  title="View this revision"
                                >
                                  <i className="bi bi-eye text-sm"></i>
                                </button>
                                {!isModalLocked && (
                                  <button
                                    type="button"
                                    onClick={() => handleEditClick(item)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-[#334d77] hover:border-[#334d77]/40 transition-all shadow-sm cursor-pointer"
                                    title="Edit this revision"
                                  >
                                    <i className="bi bi-pencil-square text-sm"></i>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Card Body */}
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                <div>
                                  <span className="text-slate-400 font-medium">Quotation No:</span>{" "}
                                  <span className="font-bold text-slate-700">{item.quotation_no || "—"}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-medium">Activity Type:</span>{" "}
                                  <span className="font-bold text-slate-700">{item.activity_type || "—"}</span>
                                </div>
                              </div>

                              <div className="text-xs">
                                <span className="text-slate-400 font-medium block">Description:</span>
                                <p className="text-slate-700 font-semibold mt-1">
                                  {histNote || "No description provided."}
                                </p>
                              </div>

                              <div className="grid grid-cols-4 gap-2 border-t border-slate-200 pt-3 text-[10px] sm:text-xs">
                                <div>
                                  <p className="text-slate-400 font-medium">AMOUNT</p>
                                  <p className="font-bold text-slate-700 mt-0.5">₹{Number(item.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div>
                                  <p className="text-slate-400 font-medium">DISCOUNT</p>
                                  <p className="font-bold text-slate-700 mt-0.5">₹{Number(item.discount_rs || (parseFloat(item.amount || 0) * parseFloat(item.discount || 0) / 100) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div>
                                  <p className="text-slate-400 font-medium">TAX</p>
                                  <p className="font-bold text-slate-700 mt-0.5">{parseFloat(item.tax || 0).toFixed(2)}%</p>
                                </div>
                                <div>
                                  <p className="text-slate-400 font-medium">GRAND TOTAL</p>
                                  <p className="font-bold text-emerald-600 mt-0.5">₹{Number(item.grand_total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                                </div>
                              </div>

                              {item.files && item.files.length > 0 && (
                                <div className="mt-3 pt-2 border-t border-slate-100">
                                  <p className="text-[9px] font-semibold text-gray-400 uppercase mb-1 flex items-center gap-1">
                                    <i className="bi bi-paperclip"></i> Attached Files
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {item.files.map((file, fileIdx) => (
                                      <a
                                        key={fileIdx}
                                        href={file.file_path}
                                        onClick={(e) => handleFileDownload(e, file.file_path, file.file_name || "File")}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-[#eef2f7] border border-blue-100 hover:bg-blue-50 text-blue-700 rounded text-[9px] font-medium transition-colors cursor-pointer"
                                      >
                                        <i className="bi bi-file-earmark-arrow-down"></i>
                                        <span
                                          className="truncate max-w-[100px]"
                                          title={file.file_name}
                                        >
                                          {file.file_name}
                                        </span>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* FILE MANAGER MODAL */}
      {showFileModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-[440px] rounded-sm shadow-xl overflow-hidden border border-gray-100">
            <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-orange-100 to-white border-b border-gray-100">
              <div className="flex items-center gap-2">
                <i className="bi bi-cloud-arrow-up text-orange-500 text-lg"></i>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Select Quotation Files
                </h2>
              </div>
              <button
                onClick={() => setShowFileModal(false)}
                className="w-8 h-8 rounded-full transition-colors flex items-center justify-center text-orange-500"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="p-6">
              <div
                className="w-full border-2 border-dashed border-orange-300 rounded-xl flex flex-col items-center justify-center p-8 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById("quotFiles").click()}
              >
                <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                  <i className="bi bi-cloud-arrow-up text-orange-500 text-2xl"></i>
                </div>
                <p className="font-bold text-gray-700 text-sm">Click or drag files here</p>
                <p className="text-xs text-gray-400 mt-2">JPG, PNG, PDF, CAD (Max 5MB), Excel (Max 2MB) - Max 5 files</p>
                <input
                  type="file"
                  id="quotFiles"
                  multiple
                  className="hidden"
                  onChange={handleSelect}
                  accept=".jpg,.jpeg,.png,.pdf,.xlsx,.xls,.csv,.excel,.dwg,.dxf"
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-1.5 text-left max-h-[150px] overflow-y-auto pr-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Selected Files:
                  </p>
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-gray-50 px-3 py-1.5 text-xs rounded-lg border border-gray-200 shadow-sm"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <i className="bi bi-file-earmark-text text-blue-500 text-sm"></i>
                        <span className="text-gray-600 font-medium truncate max-w-[240px]">
                          {file.name}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFiles(
                            selectedFiles.filter((_, i) => i !== idx),
                          );
                        }}
                        className="text-gray-300 hover:text-red-500 transition-colors ml-2"
                      >
                        <i className="bi bi-x-circle text-sm"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-3 bg-white flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setShowFileModal(false)}
                className="px-5 py-2 rounded-sm text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-[400px] rounded-sm shadow-xl overflow-hidden border border-gray-100">
            <div className="flex justify-between items-center px-5 py-3 bg-gradient-to-r from-orange-100 to-white border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 tracking-wide flex items-center gap-2">
                <i className="bi bi-trash text-orange-500 text-sm"></i>
                DELETE QUOTATION
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-orange-500"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col items-center py-8 px-6 text-center">
              <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mb-4 border border-orange-100">
                <i className="bi bi-trash text-orange-500 text-3xl"></i>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">
                {deleteName}
              </h2>
              <p className="text-gray-400 text-sm mt-2">
                This action cannot be undone. Are you sure?
              </p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2 rounded-sm text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteQuotation}
                disabled={isDeleting}
                className="px-6 py-2 rounded-sm text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-md transition flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="white"
                        strokeWidth="3"
                        fill="none"
                        opacity="0.3"
                      />
                      <path
                        d="M4 12a8 8 0 018-8"
                        stroke="white"
                        strokeWidth="3"
                      />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS CONFIRM MODAL */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-gray-900/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-sm shadow-xl w-full max-w-[350px] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 from-orange-100 to-white bg-gradient-to-r">
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-orange-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                  Confirm Status Change
                </h2>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-orange-600 text-sm leading-none"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-500 text-sm mb-6">
                Are you sure you want to change status?
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-5 py-2 rounded-sm text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleTableStatusChange(
                      statusChangeData.id,
                      statusChangeData.status,
                    );
                    setShowStatusModal(false);
                  }}
                  className="px-6 py-2 rounded-sm text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Yes Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONVERT TO PI MODAL */}
      {showPIModal && selectedPIQuotation && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-gray-900/30">
          <div className="bg-white w-[480px] rounded-sm shadow-xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 from-orange-100 to-white bg-gradient-to-r">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center">
                  <i
                    className="bi bi-file-earmark-arrow-up text-lg"
                    style={{ color: "#f07400" }}
                  ></i>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                    Convert to Proforma Invoice
                  </h2>
                  <p className="text-xs text-gray-400 font-medium">
                    {selectedPIQuotation.company_name} —{" "}
                    {selectedPIQuotation.customer_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPIModal(false);
                  setPiPercentage("");
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-orange-500 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Quotation No</span>
                  <span className="font-semibold text-gray-700">
                    {selectedPIQuotation.quotation_no || "-"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Reference</span>
                  <span className="font-semibold text-gray-700">
                    {selectedPIQuotation.reference || "-"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Assignee</span>
                  <span className="font-semibold text-gray-700">
                    {selectedPIQuotation.assignee || "-"}
                  </span>
                </div>
                <div className="h-px bg-gray-200"></div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Grand Total</span>
                  <span className="font-bold text-emerald-600 text-lg">
                    ₹{" "}
                    {piGrandTotal
                      ? Number(piGrandTotal).toLocaleString("en-IN")
                      : "0"}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                    Percentage <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={piPercentage}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          handlePiPercentageChange("");
                          return;
                        }
                        const num = Number(val);
                        if (num >= 0 && num <= 100)
                          handlePiPercentageChange(num);
                      }}
                      className="w-full border border-orange-300 rounded-sm pl-3 pr-8 py-2.5 text-sm outline-none bg-gray-50 transition-all"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                      %
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={piRupees}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          handlePiRupeesChange("");
                          return;
                        }
                        handlePiRupeesChange(Number(val));
                      }}
                      className="w-full border border-orange-300 rounded-sm pl-7 pr-3 py-2.5 text-sm outline-none bg-gray-50 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {piGrandTotal > 0 && (
                <div
                  className={`rounded-sm p-3 border transition-all ${
                    piIsOver
                      ? "bg-red-50 border-red-200"
                      : piEnteredPct === 100
                        ? "bg-green-50 border-green-200"
                        : piEnteredPct > 0
                          ? "bg-green-50 border-green-200"
                          : "bg-blue-50 border-blue-100"
                  }`}
                >
                  <p className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">
                    {piEnteredPct > 0
                      ? "Remaining After This Entry"
                      : "Total Available"}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="text-center">
                      <p
                        className={`text-xl font-bold ${piIsOver ? "text-red-600" : piEnteredPct === 100 ? "text-green-600" : "text-green-700"}`}
                      >
                        {piIsOver
                          ? "Over!"
                          : piEnteredPct > 0
                            ? `${parseFloat(piRemainingPct.toFixed(2))}%`
                            : "100%"}
                      </p>
                      <p className="text-xs text-gray-400">Percentage</p>
                    </div>
                    <div className="w-px h-10 bg-gray-200"></div>
                    <div className="text-center">
                      <p
                        className={`text-xl font-bold ${piIsOver ? "text-red-600" : piEnteredPct === 100 ? "text-green-600" : "text-green-700"}`}
                      >
                        {piIsOver
                          ? "Over!"
                          : piEnteredPct > 0
                            ? `₹${Number(piRemainingAmt).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                            : `₹${Number(piGrandTotal).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
                      </p>
                      <p className="text-xs text-gray-400">Amount</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-white rounded-full h-2 border border-gray-200 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          piIsOver
                            ? "bg-red-500"
                            : piEnteredPct >= 100
                              ? "bg-green-500"
                              : "bg-green-400"
                        }`}
                        style={{ width: `${Math.min(piEnteredPct, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-400">
                        {piEnteredPct > 0
                          ? `${parseFloat(piEnteredPct.toFixed(2))}% entered`
                          : "Enter % or ₹ above"}
                      </span>
                      <span className="text-xs text-gray-400">100%</span>
                    </div>
                  </div>
                </div>
              )}

              {piIsOver && (
                <p className="text-xs text-red-500 font-medium -mt-1">
                  ⚠ Percentage cannot exceed 100%
                </p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setShowPIModal(false);
                  setPiPercentage("");
                  setPiRupees("");
                }}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-sm py-2.5 text-sm font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePI}
                disabled={
                  isCreatingPI ||
                  !piPercentage ||
                  Number(piPercentage) <= 0 ||
                  Number(piPercentage) > 100
                }
                className={`flex-1 bg-green-500 hover:bg-green-600 text-white rounded-sm py-2.5 text-sm font-semibold shadow-md shadow-green-200 transition-all flex justify-center items-center gap-2 ${
                  isCreatingPI ||
                  !piPercentage ||
                  Number(piPercentage) <= 0 ||
                  Number(piPercentage) > 100
                    ? "opacity-60 cursor-not-allowed"
                    : ""
                }`}
              >
                {isCreatingPI ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="white"
                        strokeWidth="4"
                        opacity="0.25"
                      />
                      <path
                        fill="white"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Creating PI...
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-check"></i>
                    Create Proforma Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGNEE MODAL */}
      {showAssigneeModal && selectedAssigneeRow && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={closeAssigneePopover}
        >
          <div
            className="bg-white rounded-xl border border-gray-100 w-[460px] max-w-[95vw] shadow-2xl flex flex-col overflow-hidden max-h-[90vh] transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-orange-500 flex-shrink-0">
              <p className="text-sm font-bold text-white flex items-center gap-2 tracking-wide">
                <i className="bi bi-person-fill-gear text-base"></i>
                Change Assignee
              </p>
              <button
                onClick={closeAssigneePopover}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <i className="bi bi-x-lg text-sm"></i>
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1.5">
                    Last Assignee
                  </p>
                  <div className="flex gap-1 flex-wrap min-h-[36px] items-center">
                    {selectedAssigneeRow.assignee ? (
                      String(selectedAssigneeRow.assignee)
                        .split(",")
                        .map((name, i) => (
                          <span
                            key={i}
                            className="bg-blue-800 text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1"
                          >
                            <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[8px] font-bold flex-shrink-0">
                              {name.trim().charAt(0).toUpperCase()}
                            </span>
                            {name.trim()}
                          </span>
                        ))
                    ) : (
                      <span className="text-gray-400 text-xs italic">None</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1.5">
                    New Assignee <span className="text-red-400">*</span>
                  </label>
                  <Select
                    menuPosition="fixed"
                    instanceId="inline-assignee-select"
                    options={asignee}
                    value={newAssigneeValue}
                    onChange={(selected) =>
                      setNewAssigneeValue(selected || null)
                    }
                    placeholder="Select..."
                    unstyled
                    classNames={{
                      control: ({ isFocused }) =>
                        `w-full border rounded-md px-2 py-1 text-xs bg-gray-50 outline-none cursor-pointer min-h-[36px] ${isFocused ? "border-orange-400 ring-1 ring-orange-200" : "border-gray-300"}`,
                      valueContainer: () => "gap-1 flex-wrap",
                      placeholder: () => "text-gray-400 text-xs",
                      input: () => "text-xs text-gray-700",
                      menu: () =>
                        "mt-1 border border-gray-200 rounded-md bg-white shadow-lg z-[200]",
                      option: ({ isFocused, isSelected }) =>
                        `px-3 py-2 text-xs cursor-pointer ${isSelected ? "bg-blue-800 text-white" : isFocused ? "bg-orange-50 text-orange-700" : "text-gray-700"}`,
                      multiValue: () =>
                        "bg-blue-800 text-white rounded-full px-1.5 py-0.5 flex items-center gap-1 text-[10px]",
                      multiValueLabel: () => "text-white font-medium",
                      multiValueRemove: () =>
                        "text-white hover:bg-blue-900 rounded ml-0.5 cursor-pointer",
                      dropdownIndicator: () =>
                        "text-gray-400 px-1 cursor-pointer hover:text-orange-500",
                      clearIndicator: () =>
                        "text-gray-400 px-1 cursor-pointer hover:text-red-500",
                    }}
                  />
                </div>
              </div>

              <div className="h-px bg-gray-100"></div>

              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1.5 flex items-center gap-1">
                  <i className="bi bi-pencil-square text-gray-300"></i>
                  Task Description
                  <span className="text-gray-300 font-normal normal-case ml-1">
                    (optional)
                  </span>
                </label>
                <textarea
                  value={assigneeDescription}
                  onChange={(e) => setAssigneeDescription(e.target.value)}
                  placeholder="Write task details, instructions or notes..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs text-gray-700 bg-gray-50 outline-none resize-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200 transition-all placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1.5 flex items-center gap-1">
                  <i className="bi bi-paperclip text-gray-300"></i>
                  Attach Files
                  <span className="text-gray-300 font-normal normal-case ml-1">
                    (optional, max 5)
                  </span>
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleAssigneeFileChange}
                  accept=".jpg,.jpeg,.png,.pdf,.xlsx,.xls,.csv,.excel,.dwg,.dxf"
                  className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer outline-none border border-gray-300 rounded-md p-1 bg-gray-50"
                />
                {assigneeFiles.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-[100px] overflow-y-auto pr-1">
                    {assigneeFiles.map((file, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center bg-gray-50 border border-gray-200 rounded px-2 py-1 text-[10px] text-gray-600"
                      >
                        <span className="truncate max-w-[200px]">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAssigneeFile(i)}
                          className="text-red-500 hover:text-red-700 font-bold ml-1 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {loadingLog ? (
                <div className="border-t border-gray-100 pt-3 text-center text-xs text-gray-400 py-2">
                  Loading history...
                </div>
              ) : assigneeLog.length > 0 ? (
                (() => {
                  const sortedLogs = [...assigneeLog].sort(
                    (a, b) => new Date(b.changed_at) - new Date(a.changed_at),
                  );
                  const displayedLogs =
                    isAdmin || showAllHistory
                      ? sortedLogs
                      : sortedLogs.slice(0, 1);

                  return (
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-2 flex items-center gap-1">
                        <i className="bi bi-clock-history text-gray-300"></i>
                        {isAdmin ? "History Log" : "Last Change"}
                      </p>
                      <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                        {displayedLogs.map((log, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className="flex flex-col items-center mt-1">
                              <div className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0"></div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                                  {log.changed_by || "System"}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  assigned
                                </span>
                                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                  {log.new_assignee || "-"}
                                </span>
                              </div>
                              {log.changed_at && (
                                <p className="text-[9px] text-gray-400 mt-0.5">
                                  {formatDateTime(log.changed_at)}
                                </p>
                              )}
                              {log.description &&
                                log.description.trim() !== "" && (
                                  <div className="mt-1.5 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
                                    <p className="text-[10px] font-semibold text-amber-700 flex items-center gap-1 mb-0.5">
                                      <i className="bi bi-chat-text-fill text-[9px]"></i>
                                      Task Note
                                    </p>
                                    <p className="text-[10px] text-amber-800 leading-relaxed whitespace-pre-wrap">
                                      {log.description}
                                    </p>
                                  </div>
                                )}
                              {log.files && log.files.length > 0 && (
                                <div className="mt-1.5">
                                  <p className="text-[9px] font-semibold text-gray-400 uppercase mb-1 flex items-center gap-1">
                                    <i className="bi bi-paperclip"></i> Attached
                                    Files
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {log.files.map((file, fileIdx) => (
                                      <a
                                        key={fileIdx}
                                        href={file.file_path}
                                        onClick={(e) => handleFileDownload(e, file.file_path, file.file_name || "File")}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 rounded text-[9px] font-medium transition-colors cursor-pointer"
                                      >
                                        <i className="bi bi-file-earmark-arrow-down"></i>
                                        <span
                                          className="truncate max-w-[100px]"
                                          title={file.file_name}
                                        >
                                          {file.file_name}
                                        </span>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {!isAdmin && sortedLogs.length > 1 && (
                        <button
                          onClick={() => setShowAllHistory(!showAllHistory)}
                          className="mt-3 w-full py-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded text-[10px] text-gray-500 font-semibold flex items-center justify-center gap-1 transition-all"
                        >
                          <i
                            className={`bi ${showAllHistory ? "bi-chevron-up" : "bi-chevron-down"}`}
                          ></i>
                          {showAllHistory
                            ? "Hide History"
                            : `Show History (${sortedLogs.length - 1} more)`}
                        </button>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                    <i className="bi bi-clock-history text-gray-300"></i>
                    Last Change
                  </p>
                  <p className="text-xs text-gray-300 italic text-center py-2">
                    No history found
                  </p>
                </div>
              )}
            </div>

            {/* Footer sticky buttons */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button
                onClick={closeAssigneePopover}
                className="flex-1 py-2.5 rounded-lg text-xs border border-gray-200 text-gray-600 hover:bg-gray-100 font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAssigneeUpdate}
                disabled={isUpdatingAssignee || !newAssigneeValue}
                className={`flex-[2] py-2.5 rounded-lg text-xs text-white font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isUpdatingAssignee || !newAssigneeValue
                    ? "bg-orange-300 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-100"
                }`}
              >
                {isUpdatingAssignee ? (
                  <>
                    <svg
                      className="animate-spin h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="white"
                        strokeWidth="4"
                        opacity="0.25"
                      />
                      <path
                        fill="white"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-person-check-fill text-xs"></i>
                    Update Assignee
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proforma Invoice Assignee Selection Modal */}
      {showPiUserSelectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-[90vw] max-w-[450px] rounded-lg shadow-2xl border border-gray-100 overflow-hidden flex flex-col p-6 transition-all duration-300">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <i className="bi bi-person-badge text-lg text-orange-600"></i>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">
                  Select Proforma Invoice Assignee
                </h3>
                <p className="text-xs text-gray-500">
                  Multiple Proforma Invoice users found. Please select one to
                  assign.
                </p>
              </div>
            </div>

            <div className="space-y-3.5 my-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Assignee User
              </label>
              <select
                value={selectedPiUserForApproval}
                onChange={(e) => setSelectedPiUserForApproval(e.target.value)}
                className="w-full border border-orange-300 rounded-lg px-3.5 py-2.5 text-sm outline-none bg-gray-50 focus:border-orange-500 focus:bg-white transition-all font-medium text-gray-700"
              >
                <option value="">-- Choose User --</option>
                {availablePiUsers.map((user) => (
                  <option key={user.id} value={user.name}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPiUserSelectModal(false);
                  setApproveTargetHistId(null);
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!selectedPiUserForApproval) {
                    toast.error("Please select an assignee!");
                    return;
                  }
                  setShowPiUserSelectModal(false);
                  await proceedStatusUpdate(
                    approveTargetHistId,
                    "Approved",
                    selectedPiUserForApproval,
                  );
                  setApproveTargetHistId(null);
                }}
                className="flex-1 text-white rounded-lg py-2.5 text-sm font-semibold transition-all shadow-md hover:opacity-90"
                style={{ background: "#f07400" }}
              >
                Approve & Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && viewQuotation && (
        <div id="quotation-print-portal-wrapper" className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 p-5">
          <div className="bg-white w-full max-w-[850px] max-h-[88vh] overflow-y-auto border border-gray-100 rounded-lg shadow-2xl flex flex-col">
            {/* HEADER */}
            <div className="from-slate-100 to-white px-5 py-3.5 flex items-center justify-between bg-gradient-to-r sticky top-0 z-10 border-b border-gray-100 no-print">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 flex items-center justify-center">
                  <i className="bi bi-file-earmark-text text-base text-[#334d77]"></i>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {viewQuotation.company_name || "—"}
                  </p>
                  <p className="text-gray-400 text-xs">Quotation Document Format</p>
                </div>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="w-7 h-7 flex items-center justify-center text-[#334d77] hover:bg-slate-100 rounded-full transition-all"
              >
                <i className="bi bi-x-lg text-sm"></i>
              </button>
            </div>

            {/* BODY */}
            <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
              <div id="quotation-print-area" className="bg-slate-50 border border-slate-200 shadow-xl rounded-xl overflow-hidden max-w-[800px] mx-auto flex flex-col justify-between text-slate-800 font-sans">
                {/* Premium Header Accent */}
                  {/* Premium Header Accent */}
                  <div className="bg-gradient-to-r from-[#eef2f7] to-white p-6 text-[#1e293b] flex justify-between items-start border-b-4 border-[#334d77] flex-shrink-0 text-left">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#334d77] to-[#1e2e4c] flex items-center justify-center text-white font-black text-xl shadow-lg border border-[#334d77]/20">
                          G
                        </span>
                        <div>
                          <h1 className="text-[20px] font-black text-[#334d77] tracking-wider leading-none m-0">GURU Tech</h1>
                          <p className="text-[8px] text-[#475569] uppercase tracking-[0.25em] font-bold mt-1 m-0">Packaging Solution</p>
                        </div>
                      </div>
                      <div className="text-[10px] text-[#475569] mt-4 space-y-0.5 font-medium leading-relaxed">
                        <p className="flex items-center gap-1"><span className="text-[#334d77] font-bold">📍</span> 149, RK Industrial Estate, Bhuvaladi 100 feet Road, Kathwada GIDC, Ahmedabad - 382430, Gujarat, India</p>
                        <p className="flex items-center gap-1">
                          <span className="text-[#334d77] font-bold">📞</span> Phone: +91 96620 74346 | +91 95376 74346 | <span className="text-[#334d77] font-bold ml-1">✉</span> Email: sales@gurutechpackaging.com
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <h2 className="text-[22px] font-black text-[#334d77] tracking-wider m-0">QUOTATION</h2>
                      <div className="mt-4 bg-[#334d77]/5 rounded-[10px] p-3 border border-[#334d77]/15 text-[11px] inline-grid grid-cols-[auto_auto] gap-x-4 gap-y-2 text-left">
                        <span className="font-semibold text-[#64748b]">Quote No:</span>
                        <span className="font-bold text-[#334d77] text-right">{viewQuotation.quotation_no || "—"}</span>
                        <span className="font-semibold text-[#64748b]">Date:</span>
                        <span className="font-bold text-[#334d77] text-right">
                          {viewQuotation.quotation_date
                            ? new Date(viewQuotation.quotation_date).toLocaleDateString()
                            : viewQuotation.created_at
                              ? new Date(viewQuotation.created_at).toLocaleDateString()
                              : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    {/* Client info & details */}
                    <div className="flex flex-row justify-between gap-5 mb-6 text-xs flex-shrink-0 text-left">
                      <div className="w-[48%] bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-4">
                        <p className="text-[10px] text-[#64748b] uppercase tracking-[0.1em] font-extrabold mb-2.5 flex items-center gap-1.5">
                          <span className="text-[#334d77]">🏢</span> Client Details
                        </p>
                        <p className="text-[14px] font-extrabold text-[#1e293b] m-0">{viewQuotation.company_name || "—"}</p>
                        {viewQuotation.customer_name && (
                          <p className="text-[#475569] font-medium text-[12px] mt-1.5 m-0"><span className="text-[#94a3b8] font-normal">Attn:</span> {viewQuotation.customer_name}</p>
                        )}
                      </div>
                      <div className="w-[48%] bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-4 text-right">
                        <p className="text-[10px] text-[#64748b] uppercase tracking-[0.1em] font-extrabold mb-2.5 flex items-center gap-1.5 justify-end">
                          <span className="text-[#312e81]">ℹ</span> Reference Details
                        </p>
                        <p className="text-[#334155] font-bold italic text-[14px] m-0 truncate">{viewQuotation.reference || "—"}</p>
                      </div>
                    </div>

                    {/* Items table */}
                    <div className="flex-1 overflow-x-auto bg-white rounded-lg border border-[#e2e8f0] mt-3">
                      <table className="w-full text-[12px] border-collapse">
                        <thead>
                          <tr className="border-b-2 border-[#1e2e4c] bg-[#334d77] text-white font-bold uppercase text-[10px] tracking-[0.05em]">
                            <th className="py-3 px-3 text-left w-8">#</th>
                            <th className="py-3 px-2 text-left">Product Description</th>
                            <th className="py-3 px-2 text-center w-16">Unit</th>
                            <th className="py-3 px-2 text-right w-24">Price (₹)</th>
                            <th className="py-3 px-2 text-center w-16">Qty</th>
                            <th className="py-3 px-3 text-right w-24">Total (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const { items } = parseDescriptionForItems(viewQuotation.description);
                            const validItems = items.filter(item => item.product_id !== "");
                            if (validItems.length === 0) {
                              return (
                                <tr>
                                  <td colSpan="6" className="py-5 text-center text-[#94a3b8] italic border-b border-[#f1f5f9]">
                                    No products selected.
                                  </td>
                                </tr>
                              );
                            }
                            return validItems.map((item, index) => (
                              <tr key={index} className="border-b border-[#f1f5f9] text-[#334155]">
                                <td className="py-3 px-3 text-left">{index + 1}</td>
                                <td className="py-3 px-2 text-left">{item.product_name}</td>
                                <td className="py-3 px-2 text-center">{item.unit || "—"}</td>
                                <td className="py-3 px-2 text-right">
                                  {item.price ? Number(item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : "0.00"}
                                </td>
                                <td className="py-3 px-2 text-center font-bold">{item.qty || 1}</td>
                                <td className="py-3 px-3 text-right font-bold">
                                  {item.amount ? Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : "0.00"}
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {/* Financial breakdown */}
                    {(() => {
                      const subTotalVal = Number(viewQuotation.amount || 0);
                      const discountPercentVal = Number(viewQuotation.discount || 0);
                      const discountRsVal = viewQuotation.discount_rs ? Number(viewQuotation.discount_rs) : ((subTotalVal * discountPercentVal) / 100);
                      const taxPercentVal = Number(viewQuotation.tax || 0);
                      const taxRsVal = ((subTotalVal - discountRsVal) * taxPercentVal) / 100;
                      return (
                        <div className="mt-6 flex justify-end text-[12px] flex-shrink-0">
                          <div className="w-[300px] bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-4 text-left">
                            <div className="flex justify-between text-[#475569] font-semibold mb-2.5">
                              <span>Subtotal:</span>
                              <span>
                                ₹ {subTotalVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            {discountPercentVal > 0 && (
                              <div className="flex justify-between text-[#059669] font-semibold mb-2.5">
                                <span>Discount ({discountPercentVal}%):</span>
                                <span>
                                  -₹ {discountRsVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            )}
                            {taxPercentVal > 0 && (
                              <div className="flex justify-between text-[#475569] font-semibold mb-2.5">
                                <span>Tax ({taxPercentVal}%):</span>
                                <span>
                                  ₹ {taxRsVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between items-center text-[#1e293b] font-black mt-3 pt-3 border-t border-dashed border-[#cbd5e1]">
                              <span className="uppercase">Grand Total:</span>
                              <span className="text-[18px] text-[#334d77]">
                                ₹ {Number(viewQuotation.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Terms & signature footer */}
                    <div className="border-t border-[#e2e8f0] pt-6 mt-6 flex flex-row justify-between gap-6 flex-shrink-0 text-left">
                      <div className="w-[60%] text-left">
                        {(() => {
                          const { note } = parseDescriptionForItems(viewQuotation.description);
                          if (note) {
                            return (
                              <>
                                <p className="text-[10px] text-[#64748b] uppercase font-extrabold mb-2 flex items-center gap-1.5">
                                  <span className="text-[#334d77]">●</span> Terms & Conditions
                                </p>
                                <div className="text-[10px] text-[#475569] bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-3 min-h-[60px] font-medium whitespace-pre-wrap leading-relaxed">
                                  {note}
                                </div>
                              </>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="w-[35%] flex flex-col items-end justify-end text-right">
                        <div className="w-full border-b border-[#cbd5e1] h-[50px] mb-2 flex items-end justify-center pb-2 text-[10px] italic text-[#94a3b8] opacity-60">
                          Signature / Stamp
                        </div>
                        <p className="text-[10px] font-extrabold text-[#1e293b] uppercase tracking-[0.05em] m-0">Authorized Signatory</p>
                        <p className="text-[9px] text-[#64748b] mt-0.5 font-semibold m-0">Guru Tech Packaging Solution</p>
                      </div>
                    </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end gap-3 px-5 py-3.5 border-t border-gray-100 bg-white no-print">
              <button
                onClick={() => handlePrintQuotation(viewQuotation)}
                className="px-5 py-2 text-sm font-semibold bg-[#334d77] hover:bg-[#1e2e4c] text-white rounded-lg transition-all flex items-center gap-2 shadow-md shadow-slate-200 cursor-pointer"
              >
                <i className="bi bi-printer text-base"></i>
                Print / Download PDF
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="px-6 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVISION HISTORY MODAL */}
      {/* PRODUCT SUB-MODAL FOR ADDING/EDITING ITEMS */}
      {showProductModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-[850px] rounded-lg shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <i className="bi bi-cart-fill text-indigo-600 text-lg"></i>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Quotation Products / Items List
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 text-md rounded-full hover:bg-slate-100 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Table Body */}
            <div className="p-6 overflow-y-auto flex-1 custom-scroll">
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-2 w-20 text-center">Unit</th>
                      <th className="py-2.5 px-2 w-24 text-right">Price (₹)</th>
                      <th className="py-2.5 px-2 w-20 text-center">Qty</th>
                      <th className="py-2.5 px-2 w-24 text-right">Total (₹)</th>
                      <th className="py-2.5 px-2 w-20 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quoteItems.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="py-2 px-3">
                          <select
                            value={item.product_id || ""}
                            onChange={(e) => handleItemChange(idx, "product_id", e.target.value)}
                            className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs outline-none bg-slate-50 focus:border-indigo-500 focus:bg-white"
                          >
                            <option value="">-- Select Product --</option>
                            {productsList.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.product_name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2 text-center text-slate-500 font-medium">
                          {item.unit || "—"}
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={item.price || 0}
                            onChange={(e) => handleItemChange(idx, "price", parseFloat(e.target.value) || 0)}
                            className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-right outline-none bg-slate-50 focus:border-indigo-500 focus:bg-white"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            /* UPDATE (Quantity Input): Max limit tied to stock, allows empty string */
                            max={(() => {
                              const prod = productsList.find((p) => String(p.id) === String(item.product_id));
                              return prod ? parseFloat(prod.current_stocks) || 0 : undefined;
                            })()}
                            value={item.qty !== undefined ? item.qty : ""}
                            onChange={(e) => handleItemChange(idx, "qty", e.target.value === "" ? "" : parseInt(e.target.value))}
                            className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-center outline-none bg-slate-50 focus:border-indigo-500 focus:bg-white"
                          />
                        </td>
                        <td className="py-2 px-2 text-right text-slate-700 font-bold">
                          {item.amount ? `₹${item.amount.toFixed(2)}` : "₹0.00"}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={addQuoteItemRow}
                              className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-sm"
                              title="Add new row"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => removeQuoteItemRow(idx)}
                              disabled={quoteItems.length === 1}
                              className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                                quoteItems.length === 1
                                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                  : "bg-rose-500 text-white hover:bg-rose-600"
                              }`}
                              title="Delete row"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="bg-slate-50 p-3 flex justify-between items-center border-t border-slate-200">
                  <button
                    type="button"
                    onClick={addQuoteItemRow}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded text-xs transition-colors flex items-center gap-1 shadow-sm"
                  >
                    + Add Product Row
                  </button>
                  <div className="text-xs text-slate-500 font-semibold">
                    Total Amount: <span className="font-extrabold text-slate-800 text-sm">₹{parseFloat(form.amount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="px-5 py-2 text-xs font-bold bg-[#f07400] hover:bg-[#d86800] text-white rounded shadow-sm transition-all"
              >
                Apply & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
