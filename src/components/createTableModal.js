import React, { useState } from 'react';
import './CreateTableModal.css';

const CreateTableModal = ({ onClose, onSubmit }) => {
    const [tableName, setTableName] = useState('');
    const [tableStake, setTableStake] = useState('');
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ name: tableName, stake: Number(tableStake) });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Create New Table</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Table Name:</label>
                        <input
                            type="text"
                            value={tableName}
                            onChange={(e) => setTableName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Stake Amount:</label>
                        <select
                            value={tableStake}
                            onChange={(e) => setTableStake(e.target.value)}
                            required
                        >
                            <option value="">Select Stake</option>
                            {[1, 5, 10, 20, 50].map(stake => (
                                <option key={stake} value={stake}>${stake}</option>
                            ))}
                        </select>
                    </div>
                    <div className="modal-buttons">
                        <button type="submit" className="submit-btn">Create Table</button>
                        <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTableModal;
