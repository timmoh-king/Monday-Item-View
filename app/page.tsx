'use client';

import { useState, useEffect } from 'react';
import ItemCard from '@/src/components/itemCard';
import { fetchListItems } from '@/src/stores/listBoardItems';
import { useAccountUsers } from '@/src/hooks/useAccountUsers';

// TODO: Replace with your actual board ID or get it from environment/config
const BOARD_ID = process.env.NEXT_PUBLIC_MONDAY_BOARD_ID || 'YOUR_BOARD_ID';

interface ListItem {
    id: string;
    name: string;
    column_values?: Array<{
        id: string;
        text?: string;
        column?: {
            id: string;
            title?: string;
        };
    }>;
}

interface User {
    id: string;
    name: string;
    email: string;
}

export default function Home() {
    const [items, setItems] = useState<ListItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<ListItem | null>(null);
    const { users, loading: usersLoading } = useAccountUsers();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch items on component mount
    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        if (BOARD_ID === 'YOUR_BOARD_ID') {
            console.warn('Please set NEXT_PUBLIC_MONDAY_BOARD_ID in your environment variables');
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const fetchedItems = await fetchListItems(BOARD_ID);
            setItems(fetchedItems || []);
        } catch (error) {
            console.error('Error loading items:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleItemSelected = (item: ListItem) => {
        setSelectedItem(item);
    };

    const handleItemUpdated = async () => {
        setRefreshing(true);
        await loadItems();
        // Keep the same item selected if it still exists
        if (selectedItem) {
            const updatedItem = items.find((item: ListItem) => item.id === selectedItem.id);
            setSelectedItem(updatedItem || null);
        }
        setRefreshing(false);
    };

    const handleItemDeleted = async (deletedItemId: string) => {
        setRefreshing(true);
        await loadItems();
        // Clear selection if the deleted item was selected
        if (selectedItem?.id === deletedItemId) {
            setSelectedItem(null);
        }
        setRefreshing(false);
    };

    return (
        <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#f6f7fb' }}>
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2" style={{ color: '#000000' }}>
                        Monday Code - Item View
                    </h1>
                    <p style={{ color: '#000000', opacity: 0.7 }}>
                        Manage your board items - view, edit, create, and delete
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Items List Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="rounded-lg shadow-lg p-4 border" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold" style={{ color: '#000000' }}>
                                    Items ({items.length})
                                </h2>
                                <button
                                    onClick={loadItems}
                                    disabled={loading || refreshing}
                                    className="px-3 py-1 text-sm text-white rounded-lg transition-colors disabled:opacity-50"
                                    style={{ backgroundColor: '#007f9b' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#006a85'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007f9b'}
                                >
                                    {loading || refreshing ? 'Loading...' : 'Refresh'}
                                </button>
                            </div>

                            {loading ? (
                                <div className="text-center py-8" style={{ color: '#000000', opacity: 0.5 }}>
                                    Loading items...
                                </div>
                            ) : items.length === 0 ? (
                                <div className="text-center py-8" style={{ color: '#000000', opacity: 0.5 }}>
                                    {BOARD_ID === 'YOUR_BOARD_ID' 
                                        ? 'Please configure BOARD_ID' 
                                        : 'No items found'}
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                    {items.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleItemSelected(item)}
                                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                                                selectedItem?.id === item.id
                                                    ? 'text-white'
                                                    : 'hover:opacity-80'
                                            }`}
                                            style={{
                                                backgroundColor: selectedItem?.id === item.id ? '#007f9b' : '#f6f7fb',
                                                color: selectedItem?.id === item.id ? '#ffffff' : '#000000'
                                            }}
                                        >
                                            <div className="font-medium truncate">{item.name}</div>
                                            <div className="text-xs mt-1" style={{ opacity: 0.6 }}>
                                                ID: {item.id}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Item Card Main Content */}
                    <div className="lg:col-span-2">
                        <ItemCard
                            selectedItem={selectedItem}
                            boardId={BOARD_ID}
                            items={items as any}
                            users={users as any}
                            onItemUpdated={handleItemUpdated}
                            onItemDeleted={handleItemDeleted}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
