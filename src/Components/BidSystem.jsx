import React, { useMemo, useState } from "react";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import { createBid, deleteBid, fetchBids, updateBid } from "../services/sangamApi";
import { useStaleResource } from "../hooks/useStaleResource";

const BidSystem = () => {
  const {
    data: bids = [],
    setData: setBids,
    loading,
  } = useStaleResource({
    key: "bids",
    fetcher: fetchBids,
    maxAgeMs: 45_000,
    refreshMs: 60_000,
    initialValue: [],
  });
  const [lowestBidId, setLowestBidId] = useState(null);
  const [search, setSearch] = useState("");
  const [newBid, setNewBid] = useState({ contractor: "", resource: "", price: "", expiresAt: "" });
  const [selectedBid, setSelectedBid] = useState(null);
  const [editBid, setEditBid] = useState(null);
  const [saving, setSaving] = useState(false);

  const withExpiry = useMemo(
    () =>
      bids.map((bid) => ({
        ...bid,
        isExpired: Date.now() > new Date(bid.expiresAt).getTime(),
      })),
    [bids]
  );

  const findLowestBid = () => {
    const validBids = withExpiry.filter((bid) => !bid.isExpired);
    if (!validBids.length) {
      toast("No active bids available.", { icon: "ℹ️" });
      setLowestBidId(null);
      return;
    }
    const lowest = validBids.reduce((prev, curr) => (prev.price < curr.price ? prev : curr), validBids[0]);
    setLowestBidId(lowest._id);
  };

  const handleAddBid = async () => {
    if (!newBid.contractor || !newBid.resource || !newBid.price || !newBid.expiresAt) {
      toast.error("All fields are required");
      return;
    }
    setSaving(true);
    try {
      const created = await createBid(newBid);
      const bid = created?.bid || created?.data?.bid;
      if (bid) setBids((prev) => [bid, ...prev]);
      setNewBid({ contractor: "", resource: "", price: "", expiresAt: "" });
      toast.success("Bid added");
    } catch (err) {
      toast.error(err.message || "Failed to add bid");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBid = async (id) => {
    try {
      await deleteBid(id);
      setBids((prev) => prev.filter((bid) => bid._id !== id));
      if (lowestBidId === id) setLowestBidId(null);
      toast.success("Bid deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete bid");
    }
  };

  const handleDownloadBids = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      bids
        .map((bid) =>
          [bid.contractor, bid.resource, bid.price, new Date(bid.expiresAt).toLocaleString(), bid.isExpired ? "Expired" : "Active"].join(",")
        )
        .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    saveAs(blob, "bids.csv");
  };

  const filteredBids = withExpiry.filter(
    (bid) =>
      bid.contractor.toLowerCase().includes(search.toLowerCase()) ||
      bid.resource.toLowerCase().includes(search.toLowerCase())
  );

  const handleEditBid = (bid) => {
    setEditBid(bid);
  };

  const handleCloseDetails = () => setSelectedBid(null);

  const handleUpdateBid = async () => {
    if (!editBid?._id) return;
    setSaving(true);
    try {
      const updated = await updateBid(editBid._id, {
        contractor: editBid.contractor,
        resource: editBid.resource,
        price: Number(editBid.price),
        expiresAt: editBid.expiresAt,
      });
      const bid = updated?.bid || updated?.data?.bid;
      if (bid) {
        setBids((prev) => prev.map((item) => (item._id === bid._id ? bid : item)));
      }
      setEditBid(null);
      toast.success("Bid updated");
    } catch (err) {
      toast.error(err.message || "Failed to update bid");
    } finally {
      setSaving(false);
    }
  };

  const handleBidSort = (criteria) => {
    const sortedBids = [...withExpiry].sort((a, b) => {
      if (criteria === "price") return a.price - b.price;
      if (criteria === "expiration") return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
      return a.contractor.localeCompare(b.contractor);
    });
    setBids(sortedBids);
  };

  return (
    <div className="page pb-10">
      <div className="page-section mb-6">
        <p className="page-kicker">Procurement</p>
        <h1 className="page-title mt-2">Advanced Bidding System</h1>
        <p className="page-subtitle">Search, compare, and manage bids in one place.</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by contractor or resource"
          className="field"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Sort Bids */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => handleBidSort("price")}
          className="btn"
        >
          Sort by Price
        </button>
        <button
          onClick={() => handleBidSort("expiration")}
          className="btn"
        >
          Sort by Expiry
        </button>
        <button
          onClick={() => handleBidSort("contractor")}
          className="btn"
        >
          Sort by Contractor
        </button>
      </div>

      {/* Bids Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading &&
          [1, 2, 3].map((n) => (
            <div key={n} className="glass-card p-4">
              <div className="skeleton h-6 w-1/2" />
              <div className="skeleton mt-3 h-4 w-3/4" />
              <div className="skeleton mt-2 h-4 w-1/3" />
              <div className="skeleton mt-2 h-4 w-2/3" />
            </div>
          ))}
        {filteredBids.map((bid) => (
          <div
            key={bid._id}
            className={`glass-card p-4 ${
              bid.isExpired
                ? "ring-1 ring-red-400/30"
                : lowestBidId && lowestBidId === bid._id
                  ? "ring-1 ring-emerald-400/30"
                  : ""
            }`}
          >
            <h2 className="text-xl font-semibold">{bid.resource}</h2>
            <p className="mt-2">Contractor: {bid.contractor}</p>
            <p className="mt-1">Price: ₹{bid.price}</p>
            <p className="mt-1">
              Expires:{" "}
              {new Date(bid.expiresAt).toLocaleString()}{" "}
              {bid.isExpired && <span className="text-red-400">(Expired)</span>}
            </p>
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setSelectedBid(bid)}
                className="btn"
              >
                View Details
              </button>
              <button
                onClick={() => handleDeleteBid(bid._id)}
                className="btn btn-danger"
              >
                Delete
              </button>
              <button
                onClick={() => handleEditBid(bid)}
                className="btn"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
        {!loading && filteredBids.length === 0 && (
          <div className="glass-panel col-span-full p-8 text-center text-slate-400">
            No bids found for current filter.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={findLowestBid}
          className="btn btn-primary"
        >
          Highlight Lowest Bid
        </button>
        <button
          onClick={handleDownloadBids}
          className="btn"
        >
          Download Bids
        </button>
      </div>

      {/* Add New Bid */}
      <div className="mt-8 page-section">
        <h2 className="text-2xl font-semibold mb-4">Add New Bid</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Contractor Name"
            className="field"
            value={newBid.contractor}
            onChange={(e) => setNewBid({ ...newBid, contractor: e.target.value })}
          />
          <input
            type="text"
            placeholder="Resource Name"
            className="field"
            value={newBid.resource}
            onChange={(e) => setNewBid({ ...newBid, resource: e.target.value })}
          />
          <input
            type="number"
            placeholder="Price"
            className="field"
            value={newBid.price}
            onChange={(e) => setNewBid({ ...newBid, price: e.target.value })}
          />
          <input
            type="datetime-local"
            placeholder="Expiration Date"
            className="field"
            value={newBid.expiresAt}
            onChange={(e) => setNewBid({ ...newBid, expiresAt: e.target.value })}
          />
        </div>
        <div className="mt-4">
          <button
            onClick={handleAddBid}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? "Saving..." : "Add Bid"}
          </button>
        </div>
      </div> {/* Show details of the selected bid */}
      {selectedBid && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="glass-panel w-[92vw] max-w-xl p-6">
            <h2 className="text-2xl font-semibold mb-4">Bid Details</h2>
            <div className="mb-4">
              <p><strong>Contractor:</strong> {selectedBid.contractor}</p>
              <p><strong>Resource:</strong> {selectedBid.resource}</p>
              <p><strong>Price:</strong> ₹{selectedBid.price}</p>
              <p><strong>Expires At:</strong> {new Date(selectedBid.expiresAt).toLocaleString()}</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleCloseDetails}
                className="btn btn-danger"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Bid Modal */}
      {editBid && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="glass-panel w-[92vw] max-w-3xl p-6">
            <h2 className="text-2xl font-semibold mb-4">Edit Bid</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                className="field"
                value={editBid.contractor}
                onChange={(e) => setEditBid({ ...editBid, contractor: e.target.value })}
              />
              <input
                type="text"
                className="field"
                value={editBid.resource}
                onChange={(e) => setEditBid({ ...editBid, resource: e.target.value })}
              />
              <input
                type="number"
                className="field"
                value={editBid.price}
                onChange={(e) => setEditBid({ ...editBid, price: e.target.value })}
              />
              <input
                type="datetime-local"
                className="field"
                value={new Date(editBid.expiresAt).toISOString().slice(0, 16)}
                onChange={(e) => setEditBid({ ...editBid, expiresAt: e.target.value })}
              />
            </div>
            <div className="mt-4 flex justify-between">
              <button
                onClick={handleUpdateBid}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => setEditBid(null)}
                className="btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BidSystem;
