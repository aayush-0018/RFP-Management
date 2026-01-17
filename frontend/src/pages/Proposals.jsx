import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
    Eye,
    Mail,
    User,
    CheckSquare,
    BarChart3,
    GitCompare,
} from 'lucide-react';
import { getProposals, pollEmails, evaluateRfp, compareProposals } from '../api';
import { useNotification } from '../components/NotificationContext';
import Loader from '../components/Loader';
import '../styles/Proposals.css';

const Proposals = () => {
    const { rfpId } = useParams();
    const { showSuccess, showError, showWarning } = useNotification();
    const [proposals, setProposals] = useState([]);
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedForComparison, setSelectedForComparison] = useState([]);
    const [comparisonResult, setComparisonResult] = useState(null);

    console.log('Comparison Result:', comparisonResult);
    const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
    const [isComparing, setIsComparing] = useState(false);
    const [isLoadingProposals, setIsLoadingProposals] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [isPollingEmails, setIsPollingEmails] = useState(false);

    const uniqueProposals = useMemo(() => {
        return proposals.filter((proposal, index, self) =>
            index === self.findIndex(p => p.vendorId?.email === proposal.vendorId?.email)
        );
    }, [proposals]);

    const fetchProposals = useCallback(async () => {
        setIsLoadingProposals(true);
        try {
            const response = await getProposals(rfpId);
            setProposals(response.data);
        } catch (error) {
            console.error('Error fetching proposals:', error);
        } finally {
            // Add a small delay to ensure loader is visible
            setTimeout(() => {
                setIsLoadingProposals(false);
            }, 500);
        }
    }, [rfpId]);

    const pollAndFetchProposals = useCallback(async () => {
        setIsPollingEmails(true);
        try {
            await pollEmails();
            await fetchProposals();
        } finally {
            setTimeout(() => {
                setIsPollingEmails(false);
            }, 500);
        }
    }, [fetchProposals]);

    useEffect(() => {
        if (rfpId) pollAndFetchProposals();
    }, [rfpId, pollAndFetchProposals]);

    const handleEvaluate = async () => {
        setIsEvaluating(true);
        try {
            await evaluateRfp(rfpId);
            await fetchProposals();
            showSuccess('Proposals evaluated successfully!');
        } catch (error) {
            console.error('Error evaluating proposals:', error);
            showError('Failed to evaluate proposals');
        } finally {
            setTimeout(() => {
                setIsEvaluating(false);
            }, 500);
        }
    };

    const openModal = (proposal) => {
        setSelectedProposal(proposal);
        setIsModalOpen(true);
    };

    const toggleSelectionForComparison = (proposalId) => {
        setSelectedForComparison(prev =>
            prev.includes(proposalId)
                ? prev.filter(id => id !== proposalId)
                : [...prev, proposalId]
        );
    };

    const handleCompare = async () => {
        if (selectedForComparison.length < 2) {
            showWarning('Please select at least 2 proposals to compare');
            return;
        }

        setIsComparing(true);
        try {
            const result = await compareProposals(rfpId, selectedForComparison);
            setComparisonResult(result);
            setIsComparisonModalOpen(true);
            showSuccess('Comparison completed successfully!');
        } catch (error) {
            console.error('Error comparing proposals:', error);
            showError('Failed to compare proposals');
        } finally {
            setTimeout(() => {
                setIsComparing(false);
            }, 500);
        }
    };

    return (
        <div className="proposals-page">
            {/* Header */}
            <div className="proposals-header">
                <div>
                    <h1>Vendor Proposals</h1>
                    <p className="subtitle">Review, compare and evaluate vendor responses</p>
                </div>
                <div className="action-buttons">
                    <button className="primary-btn" onClick={handleEvaluate} disabled={isEvaluating}>
                        <BarChart3 size={18} /> Evaluate
                    </button>
                    <button
                        className="secondary-btn"
                        onClick={handleCompare}
                        disabled={selectedForComparison.length < 2 || isComparing}
                    >
                        <GitCompare size={18} />
                        Compare ({selectedForComparison.length})
                    </button>
                </div>
            </div>

            {(isLoadingProposals || isPollingEmails || isEvaluating || isComparing) ? (
                <div className="loading-container">
                    <Loader size="large" message={
                        isPollingEmails ? "Checking for new emails..." :
                            isEvaluating ? "Evaluating proposals..." :
                                isComparing ? "Comparing proposals..." :
                                    "Loading proposals..."
                    } />
                </div>
            ) : (
                <div className="proposals-grid">
                    {uniqueProposals.map(proposal => (
                        <div
                            key={proposal._id}
                            className={`proposal-card ${selectedForComparison.includes(proposal._id) ? 'selected' : ''
                                }`}
                        >
                            <div className="compare-toggle">
                                <input
                                    type="checkbox"
                                    checked={selectedForComparison.includes(proposal._id)}
                                    onChange={() => toggleSelectionForComparison(proposal._id)}
                                />
                            </div>

                            <div className="proposal-header">
                                <User size={20} />
                                <h3>{proposal.vendorId?.name || 'Unknown Vendor'}</h3>
                            </div>

                            <p className="email">
                                <Mail size={14} /> {proposal.vendorId?.email || 'No email'}
                            </p>

                            {proposal.aiScore !== undefined && (
                                <div className="score-badge">
                                    AI Score: <strong>{proposal.aiScore}</strong>
                                </div>
                            )}

                            {proposal.aiSummary && (
                                <p className="summary">{proposal.aiSummary}</p>
                            )}

                            <div className="card-actions">
                                <button
                                    className="icon-btn"
                                    onClick={() => openModal(proposal)}
                                >
                                    <Eye size={16} /> View
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && selectedProposal && (
                <div className="modal-overlay">
                    <div className="modal-content scrollable">
                        <h2>Proposal Details</h2>
                        <p><strong>Vendor:</strong> {selectedProposal.vendorId?.name}</p>
                        <p><strong>Email:</strong> {selectedProposal.vendorId?.email}</p>

                        <h4>Submitted Content</h4>
                        <pre>{selectedProposal.rawEmailContent}</pre>

                        {selectedProposal.aiScore !== undefined && (
                            <p><strong>AI Score:</strong> {selectedProposal.aiScore}</p>
                        )}
                        {selectedProposal.aiSummary && (
                            <p><strong>AI Summary:</strong> {selectedProposal.aiSummary}</p>
                        )}

                        <div className="modal-actions">
                            <button className="primary-btn" onClick={() => setIsModalOpen(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isComparisonModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content modal-large">
                        <h2>Comparison Result</h2>
                        {isComparing ? (
                            <Loader message="Analyzing proposals..." />
                        ) : (
                            <>
                                <p className="verdict">
                                    {comparisonResult?.data?.verdict}
                                </p>
                                {comparisonResult?.data?.justification && (
                                    <p>{comparisonResult.data?.justification}</p>
                                )}
                            </>
                        )}
                        <div className="modal-actions">
                            <button className="primary-btn" onClick={() => setIsComparisonModalOpen(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Proposals;
