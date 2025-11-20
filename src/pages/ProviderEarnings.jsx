import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import "./ProviderEarnings.css";

export default function ProviderEarnings() {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    totalCommission: 0,
    totalPayments: 0,
    availableBalance: 0,
    recentPayments: [],
  });

  useEffect(() => {
    if (!user || role !== "provider") {
      navigate("/login/provider");
      return;
    }

    loadEarnings();
  }, [user, role]);

  async function loadEarnings() {
    try {
      setLoading(true);
  
      const [providerRes, bookingsRes] = await Promise.all([
        api.get("/providers/me"),
        api.get("/bookings/provider/me"),
      ]);
  
      const provider = providerRes.data;
      const bookings = bookingsRes.data;
  
      const paid = bookings.filter((b) => b.paymentStatus === "paid");
  
      // ---- Correct Calculations ----
  
      // Full actual money received from clients
      const totalActualPayments = paid.reduce((sum, b) => {
        const amount = b.finalAmount || b.amount || 0;
        return sum + amount;
      }, 0);
  
      // 10% platform commission
      const totalCommission = Math.round(totalActualPayments * 0.10);
  
      // Provider’s balance after commission
      const availableBalance = totalActualPayments - totalCommission;
  
      setEarnings({
        totalEarnings: totalActualPayments,      // BEFORE commission
        totalCommission: totalCommission,        // 10% fee
        availableBalance: availableBalance,      // AFTER commission
        totalPayments: paid.length,
        pendingCommission: totalCommission,

        recentPayments: paid.slice(0, 10).map((b) => {
          const amount = b.finalAmount || b.amount || 0;
  
          return {
            serviceType: b.serviceType,
            client: b.userId?.name || "Unknown",
            amount: amount,
            providerEarnings: Math.round(amount * 0.9),
            commission: Math.round(amount * 0.1),
            date: b.paymentAcceptedAt || b.completedAt,
          };
        }),
      });
  
    } catch (error) {
      console.error(error);
      alert("Error loading earnings");
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) {
    return (
      <div className="earnings-container">
        <p className="loading">Loading Earnings...</p>
      </div>
    );
  }

  return (
    <div className="earnings-container">
      <h1 className="page-title">💰 Earnings & Commission</h1>

      {/* ------------ Earnings Header Cards ------------- */}
      <div className="earnings-header">
        <div className="earn-card">
          <h3>Total Earnings</h3>
          <p className="amount">₹{(earnings.totalEarnings / 100).toFixed(2)}</p>
          <span>Your total earnings from all completed bookings</span>
        </div>

        <div className="earn-card">
          <h3>Earnings After Commission</h3>
          <p className="amount green">₹{(earnings.availableBalance / 100).toFixed(2)}</p>
          <span>Your actual earnings after platform fee</span>
        </div>

        <div className="earn-card">
        <h3>Platform Commission</h3>

        <p className="amount red">
            ₹{(earnings.totalCommission / 100).toFixed(2)}
        </p>

        <span>Total commission from completed bookings</span>

        <span className="pending-pay">
            Pending to pay: <strong>₹{(earnings.pendingCommission / 100).toFixed(2)}</strong>
        </span>

        <span className="limit-warning">
            ⚠ You cannot exceed ₹500 outstanding fee
        </span>
        </div>


        <div className="earn-card">
          <h3>Total Bookings</h3>
          <p className="amount">{earnings.totalPayments}</p>
          <span>Completed paid bookings</span>
        </div>
      </div>

      {/* ------------ Recent Payments Section ------------ */}
      <h2 className="section-title">Recent Payments</h2>

      {earnings.recentPayments.length === 0 ? (
        <p>No payments found</p>
      ) : (
        earnings.recentPayments.map((p, index) => (
          <div key={index} className="payment-box">
            <div className="payment-header">
              <h3>{p.serviceType}</h3>
              <span className="payment-date">
                {new Date(p.date).toLocaleDateString()}
              </span>
            </div>

            <p><strong>Total:</strong> ₹{(p.amount / 100).toFixed(2)}</p>

            <p className="green">
              Your Earnings: ₹{(p.providerEarnings / 100).toFixed(2)}
            </p>

            <p className="red">
              Commission: ₹{(p.commission / 100).toFixed(2)}
            </p>

            <p><strong>Client:</strong> {p.client}</p>
          </div>
        ))
      )}

      {/* ------------ Commission Structure ------------- */}
      <div className="commission-box">
        <h2 className="section-title">Commission Structure</h2>

        <div className="commission-table">
          <div className="row">
            <span>Service Price:</span>
            <span className="value">100%</span>
          </div>
          <div className="row">
            <span>Your Earnings:</span>
            <span className="value green">90%</span>
          </div>
          <div className="row">
            <span>Platform Commission:</span>
            <span className="value red">10%</span>
          </div>
        </div>

        <p className="note">
          Example: If a client pays ₹100 for your service, you earn ₹90 and the platform keeps ₹10 as commission.
        </p>
      </div>
    </div>
  );
}
