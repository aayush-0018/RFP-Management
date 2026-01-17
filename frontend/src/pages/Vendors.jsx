import { useState, useEffect } from 'react';
import { getVendors, createVendor, updateVendor, deleteVendor } from '../api';
import { Plus, Mail, User, StickyNote, Pencil, Trash2 } from 'lucide-react';
import { useNotification } from '../components/NotificationContext';
import Loader from '../components/Loader';
import '../styles/Vendors.css';

const Vendors = () => {
    const { showSuccess, showError } = useNotification();
    const [vendors, setVendors] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editModal, setEditModal] = useState({ show: false, vendor: null });
    const [deleteModal, setDeleteModal] = useState({ show: false, vendorId: null });
    const [formData, setFormData] = useState({ name: '', email: '', notes: '' });
    const [editFormData, setEditFormData] = useState({ name: '', email: '', notes: '' });
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            const response = await getVendors();
            setVendors(response.data);
        } catch (error) {
            console.error('Error fetching vendors:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createVendor(formData);
            setFormData({ name: '', email: '', notes: '' });
            setShowModal(false);
            fetchVendors();
            showSuccess('Vendor created successfully!');
        } catch (error) {
            console.error('Error creating vendor:', error);
            showError('Failed to create vendor');
        }
    };

    const handleEdit = (vendor) => {
        setEditFormData({ name: vendor.name, email: vendor.email, notes: vendor.notes || '' });
        setEditModal({ show: true, vendor });
    };

    const handleDelete = (vendorId) => {
        setDeleteModal({ show: true, vendorId });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateVendor(editModal.vendor._id, editFormData);
            setEditFormData({ name: '', email: '', notes: '' });
            setEditModal({ show: false, vendor: null });
            fetchVendors();
            showSuccess('Vendor updated successfully!');
        } catch (error) {
            console.error('Error updating vendor:', error);
            showError('Failed to update vendor');
        }
    };

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        try {
            await deleteVendor(deleteModal.vendorId);
            setDeleteModal({ show: false, vendorId: null });
            fetchVendors();
            showSuccess('Vendor deleted successfully!');
        } catch (error) {
            console.error('Error deleting vendor:', error);
            showError('Failed to delete vendor');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="vendors-page">
            {/* Header */}
            <div className="vendors-header">
                <div>
                    <h1>Vendors</h1>
                    <p className="subtitle">Manage all registered vendors in your system</p>
                </div>
                <button className="primary-btn" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> Add Vendor
                </button>
            </div>

            {/* Vendor Grid */}
            <div className="vendors-grid">
                {vendors.map(vendor => (
                    <div className="vendor-card" key={vendor._id}>
                        <div className="vendor-header">
                            <div className="vendor-icon">
                                <User size={22} />
                            </div>
                            <div className="vendor-actions">
                                <button
                                    className="icon-btn edit-btn"
                                    onClick={() => handleEdit(vendor)}
                                    title="Edit vendor"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    className="icon-btn delete-btn"
                                    onClick={() => handleDelete(vendor._id)}
                                    title="Delete vendor"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <h3>{vendor.name}</h3>
                        <p><Mail size={14} /> {vendor.email}</p>
                        {vendor.notes && (
                            <p className="notes">
                                <StickyNote size={14} /> {vendor.notes}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Add Vendor</h2>
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                placeholder="Vendor name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <input
                                type="email"
                                placeholder="Email address"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                            <textarea
                                placeholder="Internal notes (optional)"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="primary-btn">
                                    Create Vendor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editModal.show && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Edit Vendor</h2>
                        <form onSubmit={handleEditSubmit}>
                            <input
                                type="text"
                                placeholder="Vendor name"
                                value={editFormData.name}
                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                required
                            />
                            <input
                                type="email"
                                placeholder="Email address"
                                value={editFormData.email}
                                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                required
                            />
                            <textarea
                                placeholder="Internal notes (optional)"
                                value={editFormData.notes}
                                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                            />
                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={() => setEditModal({ show: false, vendor: null })}>
                                    Cancel
                                </button>
                                <button type="submit" className="primary-btn">
                                    Update Vendor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteModal.show && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        {isDeleting ? (
                            <div className="loading-container">
                                <Loader size="large" message="Deleting vendor..." />
                            </div>
                        ) : (
                            <>
                                <h2>Delete Vendor</h2>
                                <p>Are you sure you want to delete this vendor? This action cannot be undone.</p>
                                <div className="modal-actions">
                                    <button type="button" className="secondary-btn" onClick={() => setDeleteModal({ show: false, vendorId: null })}>
                                        Cancel
                                    </button>
                                    <button type="button" className="danger-btn" onClick={handleDeleteConfirm}>
                                        Delete Vendor
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Vendors;
