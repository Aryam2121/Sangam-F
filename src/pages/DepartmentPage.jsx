import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import PageHeader from "../Components/ui/PageHeader";
import { EmptyState, Field, inputClass } from "../Components/ui/FeatureUi";
import {
  fetchDepartments as apiFetchDepartments,
  createDepartment as apiCreateDepartment,
  updateDepartment as apiUpdateDepartment,
  deleteDepartment as apiDeleteDepartment,
} from "../services/sangamApi";
import { BiEdit, BiTrash } from "react-icons/bi";

const DepartmentCard = ({ id, name, description, onEdit, onDelete }) => {
  const navigate = useNavigate();

  return (
    <motion.div className="glass-card group relative flex flex-col gap-4 overflow-hidden p-6" whileHover={{ scale: 1.02 }}>
      <button
        type="button"
        onClick={() => navigate("/departmentdetails", { state: { name, id } })}
        className="flex flex-1 flex-col gap-3 text-left"
      >
        <h3 className="text-xl font-semibold text-white">{name}</h3>
        <p className="line-clamp-3 text-sm text-slate-300">{description}</p>
      </button>
      <div className="flex gap-2 border-t border-white/10 pt-3">
        <button type="button" onClick={() => onEdit({ _id: id, name, description })} className="btn flex-1 text-xs">
          <BiEdit /> Edit
        </button>
        <button type="button" onClick={() => onDelete(id)} className="btn btn-danger px-3 text-xs">
          <BiTrash />
        </button>
      </div>
    </motion.div>
  );
};

const DepartmentPage = () => {
  const [departments, setDepartments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newDepartment, setNewDepartment] = useState({ name: "", description: "" });
  const [editDepartment, setEditDepartment] = useState({ _id: "", name: "", description: "" });

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await apiFetchDepartments();
      setDepartments(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const filteredDepartments = departments.filter((department) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (department.name || "").toLowerCase().includes(q) ||
      (department.description || "").toLowerCase().includes(q)
    );
  });

  const createDepartment = async () => {
    if (!newDepartment.name.trim() || !newDepartment.description.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    try {
      await apiCreateDepartment(newDepartment);
      fetchDepartments();
      toast.success("Department created");
      setShowModal(false);
      setNewDepartment({ name: "", description: "" });
    } catch {
      toast.error("Failed to create department");
    }
  };

  const saveEditDepartment = async () => {
    if (!editDepartment.name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      await apiUpdateDepartment(editDepartment._id, {
        name: editDepartment.name,
        description: editDepartment.description,
      });
      fetchDepartments();
      toast.success("Department updated");
      setShowEditModal(false);
    } catch {
      toast.error("Failed to update department");
    }
  };

  const handleDeleteDepartment = async (id) => {
    if (!window.confirm("Delete this department?")) return;
    try {
      await apiDeleteDepartment(id);
      fetchDepartments();
      toast.success("Department deleted");
    } catch {
      toast.error("Failed to delete department");
    }
  };

  const FormModal = ({ title, values, setValues, onSave, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="mt-5 space-y-4">
          <Field label="Name">
            <input className={inputClass} value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
          </Field>
          <Field label="Description">
            <textarea
              className={`${inputClass} min-h-[96px]`}
              rows={3}
              value={values.description}
              onChange={(e) => setValues({ ...values, description: e.target.value })}
            />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={onSave}>Save</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-stack pb-10">
      <PageHeader
        kicker="Departments"
        title="Department Management"
        subtitle="Track teams, scopes, and active initiatives"
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
            Create department
          </button>
        }
      />

      <div className="relative">
        <input
          type="search"
          placeholder="Search departments…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`${inputClass} pl-10`}
        />
        <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-6">
              <div className="skeleton h-6 w-2/3" />
              <div className="skeleton mt-3 h-4 w-full" />
            </div>
          ))}
        </div>
      ) : filteredDepartments.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDepartments.map((department) => (
            <DepartmentCard
              key={department._id}
              id={department._id}
              name={department.name}
              description={department.description}
              onEdit={(dept) => {
                setEditDepartment(dept);
                setShowEditModal(true);
              }}
              onDelete={handleDeleteDepartment}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No departments"
          description="Create a department to organize projects and teams."
          action={
            <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
              Create department
            </button>
          }
        />
      )}

      {showModal && (
        <FormModal
          title="Create department"
          values={newDepartment}
          setValues={setNewDepartment}
          onSave={createDepartment}
          onClose={() => setShowModal(false)}
        />
      )}
      {showEditModal && (
        <FormModal
          title="Edit department"
          values={editDepartment}
          setValues={setEditDepartment}
          onSave={saveEditDepartment}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
};

export default DepartmentPage;
