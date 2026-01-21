'use client';

import { useState, useEffect } from 'react';
import { createListItem, updateListItem, deleteListItem } from '../stores/listBoardItems.js';

export default function ItemCard({ selectedItem, boardId, onItemUpdated, onItemDeleted, items = [], users = [] }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        person: '',
        firstname: '',
        lastname: '',
        columnValues: {}
    });
    const [loading, setLoading] = useState(false);

    // Initialize form data when selectedItem changes
    useEffect(() => {
        if (selectedItem) {
            // Initialize columnValues from selectedItem's column_values
            const initialColumnValues = {};
            if (selectedItem.column_values) {
                selectedItem.column_values.forEach(col => {
                    initialColumnValues[col.id] = col.text || '';
                });
            }
            
            setFormData({
                name: selectedItem.name || '',
                person: '',
                firstname: '',
                lastname: '',
                columnValues: initialColumnValues
            });
            setIsEditing(false);
        }
    }, [selectedItem]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleColumnValueChange = (columnId, value) => {
        setFormData(prev => ({
            ...prev,
            columnValues: {
                ...(prev.columnValues || {}),
                [columnId]: value
            }
        }));
    };

    // Format column values for API
    const formatColumnValuesForAPI = () => {
        const colValues = {};
        
        // Find column IDs from selectedItem or any existing item
        let sourceItem = selectedItem;
        if (!sourceItem && items.length > 0) {
            // Use first item to get column structure
            sourceItem = items[0];
        }

        if (sourceItem && sourceItem.column_values) {
            const personCol = sourceItem.column_values.find(col => col.column?.title === 'Person');
            const firstNameCol = sourceItem.column_values.find(col => col.column?.title === 'Firstname');
            const lastNameCol = sourceItem.column_values.find(col => col.column?.title === 'Lastname');

            if (formData.person && personCol) {
                colValues[personCol.id] = {
                    type: 'people',
                    value: formData.person
                };
            }
            if (formData.firstname && firstNameCol) {
                colValues[firstNameCol.id] = {
                    type: 'text',
                    value: formData.firstname
                };
            }
            if (formData.lastname && lastNameCol) {
                colValues[lastNameCol.id] = {
                    type: 'text',
                    value: formData.lastname
                };
            }
        } else {
            console.warn('Column IDs not available. Make sure you have at least one item in the board to get column structure.');
        }

        return colValues;
    };

    const handleUpdate = async () => {
        if (!selectedItem || !boardId) return;

        setLoading(true);
        try {
            const result = await updateListItem(boardId, selectedItem.id, formData.columnValues);
            if (result) {
                setIsEditing(false);
                if (onItemUpdated) {
                    onItemUpdated();
                }
            }
        } catch (error) {
            console.error('Error updating item:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedItem) return;

        setLoading(true);
        try {
            const result = await deleteListItem(selectedItem.id);
            if (result) {
                if (onItemDeleted) {
                    onItemDeleted(selectedItem.id);
                }
            }
        } catch (error) {
            console.error('Error deleting item:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!boardId || !formData.name.trim()) return;

        setLoading(true);
        try {
            // Format column values for API
            const colValues = formatColumnValuesForAPI();
            const result = await createListItem(boardId, formData.name, colValues);
            if (result) {
                setFormData({ name: '', person: '', firstname: '', lastname: '' });
                setIsCreating(false);
                if (onItemUpdated) {
                    onItemUpdated();
                }
            }
        } catch (error) {
            console.error('Error creating item:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Selected Item Section */}
            {selectedItem && (
                <div className="rounded-lg shadow-lg p-6 border" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-semibold" style={{ color: '#000000' }}>
                            {isEditing ? 'Edit Item' : 'Item Details'}
                        </h2>
                        <div className="flex gap-2">
                            {!isEditing ? (
                                <>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-4 py-2 text-white rounded-lg transition-colors"
                                        style={{ backgroundColor: '#007f9b' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#006a85'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007f9b'}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={loading}
                                        className="px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50"
                                        style={{ backgroundColor: '#dc2626' }}
                                        onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#b91c1c')}
                                        onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#dc2626')}
                                    >
                                        {loading ? 'Deleting...' : 'Delete'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 rounded-lg transition-colors"
                                        style={{ backgroundColor: '#f6f7fb', color: '#000000' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f6f7fb'}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpdate}
                                        disabled={loading}
                                        className="px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50"
                                        style={{ backgroundColor: '#007f9b' }}
                                        onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#006a85')}
                                        onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#007f9b')}
                                    >
                                        {loading ? 'Updating...' : 'Save Changes'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                                Item Name
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                                    style={{ 
                                        backgroundColor: '#ffffff', 
                                        borderColor: '#d1d5db', 
                                        color: '#000000',
                                        borderWidth: '1px'
                                    }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = '#007f9b'}
                                    onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                                />
                            ) : (
                                <p className="px-4 py-2 rounded-lg" style={{ backgroundColor: '#f6f7fb', color: '#000000' }}>
                                    {selectedItem.name}
                                </p>
                            )}
                        </div>

                        {/* Column Values */}
                        {selectedItem.column_values && selectedItem.column_values.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                                    Column Values
                                </label>
                                <div className="space-y-3">
                                    {selectedItem.column_values.map((col) => (
                                        <div key={col.id}>
                                            <label className="block text-xs mb-1" style={{ color: '#000000', opacity: 0.7 }}>
                                                {col.column?.title || col.id}
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={(formData.columnValues && formData.columnValues[col.id]) || col.text || ''}
                                                    onChange={(e) => handleColumnValueChange(col.id, e.target.value)}
                                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                                                    style={{ 
                                                        backgroundColor: '#ffffff', 
                                                        borderColor: '#d1d5db', 
                                                        color: '#000000',
                                                        borderWidth: '1px'
                                                    }}
                                                    onFocus={(e) => e.currentTarget.style.borderColor = '#007f9b'}
                                                    onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                                                />
                                            ) : (
                                                <p className="px-4 py-2 rounded-lg" style={{ backgroundColor: '#f6f7fb', color: '#000000' }}>
                                                    {col.text || 'N/A'}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-2">
                            <p className="text-xs" style={{ color: '#000000', opacity: 0.5 }}>
                                Item ID: {selectedItem.id}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Create New Item Section */}
            <div className="rounded-lg shadow-lg p-6 border" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold" style={{ color: '#000000' }}>
                        {isCreating ? 'Create New Item' : 'New Item'}
                    </h2>
                    <button
                        onClick={() => setIsCreating(!isCreating)}
                        className="px-4 py-2 text-white rounded-lg transition-colors"
                        style={{ backgroundColor: '#007f9b' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#006a85'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007f9b'}
                    >
                        {isCreating ? 'Cancel' : '+ New Item'}
                    </button>
                </div>

                {isCreating && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                                Item Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Enter item name"
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                                style={{ 
                                    backgroundColor: '#ffffff', 
                                    borderColor: '#d1d5db', 
                                    color: '#000000',
                                    borderWidth: '1px'
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#007f9b'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                                Person
                            </label>
                            <select
                                value={formData.person}
                                onChange={(e) => handleInputChange('person', e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                                style={{ 
                                    backgroundColor: '#ffffff', 
                                    borderColor: '#d1d5db', 
                                    color: '#000000',
                                    borderWidth: '1px'
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#007f9b'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                            >
                                <option value="">Select a person</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                            {users.length === 0 && (
                                <p className="text-xs mt-1" style={{ color: '#000000', opacity: 0.5 }}>
                                    No users available
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                                First Name
                            </label>
                            <input
                                type="text"
                                value={formData.firstname}
                                onChange={(e) => handleInputChange('firstname', e.target.value)}
                                placeholder="Enter first name"
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                                style={{ 
                                    backgroundColor: '#ffffff', 
                                    borderColor: '#d1d5db', 
                                    color: '#000000',
                                    borderWidth: '1px'
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#007f9b'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                                Last Name
                            </label>
                            <input
                                type="text"
                                value={formData.lastname}
                                onChange={(e) => handleInputChange('lastname', e.target.value)}
                                placeholder="Enter last name"
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                                style={{ 
                                    backgroundColor: '#ffffff', 
                                    borderColor: '#d1d5db', 
                                    color: '#000000',
                                    borderWidth: '1px'
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#007f9b'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                            />
                        </div>

                        <button
                            onClick={handleCreate}
                            disabled={loading || !formData.name.trim()}
                            className="w-full px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: '#007f9b' }}
                            onMouseEnter={(e) => {
                                if (!loading && formData.name.trim()) {
                                    e.currentTarget.style.backgroundColor = '#006a85';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!loading && formData.name.trim()) {
                                    e.currentTarget.style.backgroundColor = '#007f9b';
                                }
                            }}
                        >
                            {loading ? 'Creating...' : 'Create Item'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
