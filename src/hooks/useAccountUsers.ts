'use client';

import { useState, useEffect } from 'react';
import { fetchAccountUsers } from '@/src/stores/listAccountUsers';

interface User {
    id: string;
    name: string;
    email: string;
}

const STORAGE_KEY = 'monday_account_users';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CachedUsers {
    users: User[];
    timestamp: number;
}

export const useAccountUsers = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Load users from localStorage on mount
    useEffect(() => {
        const loadCachedUsers = () => {
            try {
                const cached = localStorage.getItem(STORAGE_KEY);
                if (cached) {
                    const parsed: CachedUsers = JSON.parse(cached);
                    const now = Date.now();
                    
                    // Check if cache is still valid (within 24 hours)
                    if (now - parsed.timestamp < CACHE_DURATION) {
                        setUsers(parsed.users);
                        setLoading(false);
                        return true; // Cache is valid
                    }
                }
            } catch (error) {
                console.error('Error loading cached users:', error);
            }
            return false; // Cache is invalid or doesn't exist
        };

        // Try to load from cache first
        const cacheValid = loadCachedUsers();

        // Fetch fresh users if cache is invalid
        if (!cacheValid) {
            fetchUsers();
        }
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const fetchedUsers = await fetchAccountUsers();
            console.log('Fetched users:', fetchedUsers);
            
            if (fetchedUsers && fetchedUsers.length > 0) {
                setUsers(fetchedUsers);
                
                // Save to localStorage
                const cacheData: CachedUsers = {
                    users: fetchedUsers,
                    timestamp: Date.now()
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshUsers = async () => {
        await fetchUsers();
    };

    return {
        users,
        loading,
        refreshUsers
    };
};
