import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Plus, Send, FileText, Pencil, Trash2 } from 'lucide-react';
import { getRfps, createRfp, updateRfp, deleteRfp, sendRfpToVendors, getVendors } from '../api';
import { useNotification } from '../components/NotificationContext';
import Loader from '../components/Loader';
import '../styles/RFPs.css';

const RFPs = () => {
    const { showSuccess, showError } = useNotification();
    const [rfps, setRfps] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editModal, setEditModal] = useState({ show: false, rfp: null });
    const [deleteModal, setDeleteModal] = useState({ show: false, rfpId: null });
    const [detailsModal, setDetailsModal] = useState({ show: false, rfp: null });
    const [sendModal, setSendModal] = useState({ show: false, rfpId: null, selectedVendors: [] });
    const [formData, setFormData] = useState({ prompt: '' });
    const [editFormData, setEditFormData] = useState({ prompt: '' });
    const [isSending, setIsSending] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchRfps();
        fetchVendors();
    }, []);

    const fetchRfps = async () => {
        const response = await getRfps();
        setRfps(response.data);
    };

    const fetchVendors = async () => {
        const response = await getVendors();
        setVendors(response.data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createRfp(formData);
            setFormData({ prompt: '' });
            setShowModal(false);
            await fetchRfps();
            showSuccess('RFP created successfully!');
        } catch (error) {
            console.error('Error creating RFP:', error);
            showError('Failed to create RFP');
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateRfp(editModal.rfp._id, editFormData);
            setEditFormData({ prompt: '' });
            setEditModal({ show: false, rfp: null });
            await fetchRfps();
            showSuccess('RFP updated successfully!');
        } catch (error) {
            console.error('Error updating RFP:', error);
            showError('Failed to update RFP');
        }
    };

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        try {
            await deleteRfp(deleteModal.rfpId);
            setDeleteModal({ show: false, rfpId: null });
            await fetchRfps();
            showSuccess('RFP deleted successfully!');
        } catch (error) {
            console.error('Error deleting RFP:', error);
            showError('Failed to delete RFP');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEdit = (rfp) => {
        setEditFormData({ prompt: rfp.rawPrompt });
        setEditModal({ show: true, rfp });
    };

    const handleDelete = (rfpId) => {
        setDeleteModal({ show: true, rfpId });
    };

    const handleSend = (rfpId) => {
        setSendModal({ show: true, rfpId, selectedVendors: [] });
    };

    const handleSendConfirm = async () => {
        setIsSending(true);
        try {
            await sendRfpToVendors(sendModal.rfpId, sendModal.selectedVendors);
            setSendModal({ show: false, rfpId: null, selectedVendors: [] });
            showSuccess('RFP sent to selected vendors successfully!');
        } catch (error) {
            console.error('Error sending RFP:', error);
            showError('Failed to send RFP to vendors');
        } finally {
            setTimeout(() => {
                setIsSending(false);
            }, 500);
        }
    };

    const toggleVendor = (vendorId) => {
        setSendModal(prev => ({
            ...prev,
            selectedVendors: prev.selectedVendors.includes(vendorId)
                ? prev.selectedVendors.filter(id => id !== vendorId)
                : [...prev.selectedVendors, vendorId],
        }));
    };

    return (
        <div className="rfps-page">
            <div className="rfps-header">
                <div>
                    <h1>RFP Management</h1>
                    <p className="subtitle">Create, send, and track all procurement requests</p>
                </div>
                <button className="primary-btn" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> Create RFP
                </button>
            </div>

            {/* RFP Grid */}
            <div className="rfps-grid">
                {rfps.map(rfp => (
                    <div className="rfp-card" key={rfp._id}>
                        {/* Card Header */}
                        <div className="rfp-card-header">
                            {/* <div className="rfp-icon">
                                <FileText size={24} />
                            </div> */}
                            <div className="rfp-title-section">
                                <h3>{rfp.title}</h3>
                                <span className={`status ${rfp.status.toLowerCase()}`}>
                                    {rfp.status}
                                </span>
                            </div>
                        </div>

                        <div className="rfp-card-content">
                            <div className="rfp-meta">
                                <div className="meta-item">
                                    <span className="meta-label">Items:</span>
                                    <span className="meta-value">{rfp.structuredRequirements.items.length}</span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label">Budget:</span>
                                    <span className="meta-value">Rs. {rfp.structuredRequirements.budget}</span>
                                </div>
                            </div>
                            {/* <div className="rfp-description">
                                {rfp.rawPrompt.length > 100
                                    ? `${rfp.rawPrompt.substring(0, 100)}...`
                                    : rfp.rawPrompt
                                }
                            </div> */}
                        </div>

                        <div className="rfp-card-actions">
                            <div className="action-row">
                                <button
                                    className="icon-btn"
                                    onClick={() => setDetailsModal({ show: true, rfp })}
                                    title="View details"
                                >
                                    <Eye size={16} />
                                </button>
                                <button
                                    className="icon-btn edit-btn"
                                    onClick={() => handleEdit(rfp)}
                                    title="Edit RFP"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    className="icon-btn delete-btn"
                                    onClick={() => handleDelete(rfp._id)}
                                    title="Delete RFP"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <div className="action-row">
                                <Link className="link-btn" to={`/proposals/${rfp._id}`}>
                                    View Proposals
                                </Link>
                                <button
                                    className="primary-btn small"
                                    onClick={() => handleSend(rfp._id)}
                                >
                                    <Send size={14} /> Send
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Create RFP</h2>
                            <p className="modal-subtitle">
                                Describe your procurement requirement clearly
                            </p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <textarea
                                placeholder="Example: We need 50 laptops with minimum 16GB RAM, delivery in 2 weeks..."
                                value={formData.prompt}
                                onChange={(e) =>
                                    setFormData({ ...formData, prompt: e.target.value })
                                }
                                required
                            />

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="secondary-btn"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="primary-btn">
                                    Create RFP
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editModal.show && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Edit RFP</h2>
                            <p className="modal-subtitle">
                                Update your procurement requirement
                            </p>
                        </div>

                        <form onSubmit={handleEditSubmit}>
                            <textarea
                                placeholder="Example: We need 50 laptops with minimum 16GB RAM, delivery in 2 weeks..."
                                value={editFormData.prompt}
                                onChange={(e) =>
                                    setEditFormData({ ...editFormData, prompt: e.target.value })
                                }
                                required
                            />

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="secondary-btn"
                                    onClick={() => setEditModal({ show: false, rfp: null })}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="primary-btn">
                                    Update RFP
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {detailsModal.show && (
                <div className="modal-overlay">
                    <div className="modal-content modal-large scrollable">
                        <div className="modal-header">
                            <h2>{detailsModal.rfp.title}</h2>
                            <span className={`status ${detailsModal.rfp.status.toLowerCase()}`}>
                                {detailsModal.rfp.status}
                            </span>
                        </div>

                        <section className="details-section">
                            <h4>Original Prompt</h4>
                            <p>{detailsModal.rfp.rawPrompt}</p>
                        </section>

                        <section className="details-section">
                            <h4>Items</h4>
                            <ul className="details-list">
                                {detailsModal.rfp.structuredRequirements.items.map((item, i) => (
                                    <li key={i}>
                                        <strong>{item.name}</strong>
                                        <span>Qty: {item.quantity}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <div className="modal-actions">
                            <button
                                className="primary-btn"
                                onClick={() => setDetailsModal({ show: false, rfp: null })}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {sendModal.show && (
                <div className="modal-overlay">
                    <div className="modal-content modal-large">
                        {isSending ? (
                            <div className="loading-container">
                                <Loader size="large" message="Sending RFP to vendors..." />
                            </div>
                        ) : (
                            <>
                                <div className="modal-header">
                                    <h2>Select Vendors</h2>
                                    <p className="modal-subtitle">
                                        Choose vendors who should receive this RFP
                                    </p>
                                </div>

                                <div className="vendor-switch-list">
                                    {vendors.map(vendor => (
                                        <div key={vendor._id} className="vendor-switch-row">
                                            <div className="vendor-info">
                                                <strong>{vendor.name}</strong>
                                                <span>{vendor.email}</span>
                                            </div>

                                            <label className="switch">
                                                <input
                                                    type="checkbox"
                                                    checked={sendModal.selectedVendors.includes(vendor._id)}
                                                    onChange={() => toggleVendor(vendor._id)}
                                                />
                                                <span className="slider"></span>
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                <div className="modal-actions">
                                    <button
                                        className="secondary-btn"
                                        onClick={() =>
                                            setSendModal({ show: false, rfpId: null, selectedVendors: [] })
                                        }
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="primary-btn"
                                        onClick={handleSendConfirm}
                                        disabled={sendModal.selectedVendors.length === 0}
                                    >
                                        Send RFP
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {deleteModal.show && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        {isDeleting ? (
                            <div className="loading-container">
                                <Loader size="large" message="Deleting RFP..." />
                            </div>
                        ) : (
                            <>
                                <div className="modal-header">
                                    <h2>Delete RFP</h2>
                                    <p className="modal-subtitle">
                                        Are you sure you want to delete this RFP? This action cannot be undone and will also delete all associated proposals.
                                    </p>
                                </div>

                                <div className="modal-actions">
                                    <button
                                        className="secondary-btn"
                                        onClick={() => setDeleteModal({ show: false, rfpId: null })}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="danger-btn"
                                        onClick={handleDeleteConfirm}
                                    >
                                        Delete RFP
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

export default RFPs;
