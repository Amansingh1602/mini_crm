"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerApi } from "@/lib/api";
import { useState, useRef } from "react";
import { Search, MapPin, Calendar, CreditCard, ChevronLeft, ChevronRight, Upload } from "lucide-react";

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["customers", page, search],
    queryFn: () => customerApi.list({ page, limit: 10, search: search || undefined }),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => customerApi.upload(file),
    onSuccess: (res) => {
      alert(`Upload complete! Processed ${res.data.processed} rows.`);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (err: any) => {
      alert(`Upload failed: ${err.message}`);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header Section */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.03em" }} className="gradient-text">
            Customers
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Manage and view your customer segmentation database
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
          {/* Search Input */}
          <div style={{ position: "relative", width: "100%", minWidth: "240px" }}>
            <Search size={16} style={{ position: "absolute", left: "14px", top: "15px", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search customers..."
              className="input-base"
              style={{ paddingLeft: "40px" }}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          
          {/* CSV Upload */}
          <input 
            type="file" 
            accept=".csv" 
            style={{ display: "none" }} 
            ref={fileInputRef} 
            onChange={handleFileChange} 
          />
          <button 
            className="btn-primary" 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            style={{ height: "48px" }}
          >
            <Upload size={16} />
            {uploadMutation.isPending ? "Uploading..." : "Upload CSV"}
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-card" style={{ overflowX: "auto" }}>
        <table style={{ minWidth: "700px" }}>
          <thead>
            <tr>
              <th>Name & Contact</th>
              <th>Location</th>
              <th>Total Revenue</th>
              <th>Last Interaction</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  <td colSpan={4}>
                    <div className="skeleton" style={{ height: "30px", width: "100%" }}></div>
                  </td>
                </tr>
              ))
            ) : data?.data.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "64px", textAlign: "center", color: "var(--text-muted)" }}>
                  No customer records found matching search criteria.
                </td>
              </tr>
            ) : (
              data?.data.map((customer: any) => (
                <tr key={customer.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: "#f8fafc", fontSize: "15px" }}>{customer.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{customer.email}</div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-secondary)" }}>
                      <MapPin size={13} style={{ color: "var(--text-muted)" }} />
                      {customer.city || "Unknown"}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 700, color: "#f8fafc" }}>
                      <CreditCard size={13} style={{ color: "var(--accent)" }} />
                      ₹{customer.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-secondary)" }}>
                      <Calendar size={13} style={{ color: "var(--text-muted)" }} />
                      {customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).toLocaleDateString() : "Never"}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {data?.pagination && (
          <div style={{ padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", background: "rgba(9, 9, 15, 0.2)" }}>
            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Showing <span style={{ color: "var(--text-secondary)" }}>{((data.pagination.page - 1) * data.pagination.limit) + 1}</span> to <span style={{ color: "var(--text-secondary)" }}>{Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)}</span> of <span style={{ color: "var(--text-secondary)" }}>{data.pagination.total}</span> customers
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="btn-secondary"
                style={{ padding: "8px 12px" }}
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="btn-secondary"
                style={{ padding: "8px 12px" }}
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
