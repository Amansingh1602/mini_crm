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
    // Reset the input so the same file can be uploaded again if needed
    if (e.target) {
      e.target.value = '';
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700 }} className="gradient-text">Customers</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Manage your customer database</p>
        </div>

        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <div style={{ position: "relative", width: "300px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "14px", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="input-base"
              style={{ paddingLeft: "36px" }}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          
          <input 
            type="file" 
            accept=".csv" 
            style={{ display: "none" }} 
            ref={fileInputRef} 
            onChange={handleFileChange} 
          />
          <button 
            className="btn-primary" 
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            <Upload size={16} />
            {uploadMutation.isPending ? "Uploading..." : "Upload CSV"}
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(0,0,0,0.2)" }}>
              <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Name</th>
              <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Location</th>
              <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Total Spent</th>
              <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Last Purchase</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td colSpan={4} style={{ padding: "16px 20px" }}>
                    <div className="skeleton" style={{ height: "24px", width: "100%" }}></div>
                  </td>
                </tr>
              ))
            ) : data?.data.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                  No customers found
                </td>
              </tr>
            ) : (
              data?.data.map((customer: any) => (
                <tr key={customer.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.2s" }} className="hover:bg-white/5">
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>{customer.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{customer.email}</div>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px" }}>
                      <MapPin size={14} style={{ color: "var(--text-muted)" }} />
                      {customer.city || "Unknown"}
                    </div>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 500 }}>
                      <CreditCard size={14} style={{ color: "var(--accent)" }} />
                      ₹{customer.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "var(--text-secondary)" }}>
                      <Calendar size={14} />
                      {customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).toLocaleDateString() : "Never"}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {data?.pagination && (
          <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of {data.pagination.total} entries
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="btn-secondary"
                style={{ padding: "6px 12px" }}
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="btn-secondary"
                style={{ padding: "6px 12px" }}
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
