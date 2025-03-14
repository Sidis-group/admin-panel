import React, { useState, useEffect } from 'react';
import { Group, fetchGroups, updateGroupChouse, updateAllGroupsChouse, deleteGroups } from '../services/supabase';

// Since we're having issues with Heroicons, let's create a simple magnifying glass icon component
interface IconProps {
  className?: string;
}

const MagnifyingGlassIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={`w-4 h-4 ${className}`}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
    />
  </svg>
);

// Trash icon component for delete functionality
const TrashIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`w-5 h-5 ${className}`}
  >
    <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
  </svg>
);

// Edit icon component
const EditIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`w-5 h-5 ${className}`}
  >
    <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
  </svg>
);

// Check icon for "Done" state
const CheckIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`w-5 h-5 ${className}`}
  >
    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
  </svg>
);

// Confirmation popup component
interface ConfirmationPopupProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({ onConfirm, onCancel }) => {
  return (
    <div 
      className="fixed bg-white rounded-lg z-50"
      style={{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'calc(100% - 120px)', // 60px margin on each side
        maxWidth: '400px',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(229, 231, 235, 0.7)'
      }}
    >
      <h3 className="text-lg font-medium text-gray-800 text-center" style={{ margin: '30px 0' }}>Do you really want to delete the groups?</h3>
      <div className="flex justify-center" style={{ gap: '20px' }}>
        <button 
          onClick={onCancel}
          className="px-5 py-2 bg-white text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
          style={{
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid rgba(229, 231, 235, 0.7)',
            height: '40px',
            minWidth: '80px'
          }}
        >
          NO
        </button>
        <button 
          onClick={onConfirm}
          className="px-5 py-2 bg-red-500 rounded-lg font-medium text-sm text-white hover:bg-red-600 transition-colors"
          style={{
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid rgba(239, 68, 68, 0.7)',
            height: '40px',
            minWidth: '80px'
          }}
        >
          YES
        </button>
      </div>
    </div>
  );
};

const GroupTable: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectAll, setSelectAll] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingStatus, setSendingStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [editMode, setEditMode] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [groupsToDelete, setGroupsToDelete] = useState<number[]>([]);

  // Fetch groups on component mount
  useEffect(() => {
    const getGroups = async () => {
      try {
        setLoading(true);
        const data = await fetchGroups();
        setGroups(data);
        setFilteredGroups(data);
      } catch (error) {
        console.error('Error loading groups:', error);
      } finally {
        setLoading(false);
      }
    };

    getGroups();
  }, []);

  // Handle search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredGroups(groups);
    } else {
      const filtered = groups.filter(group => 
        group.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredGroups(filtered);
    }
  }, [searchQuery, groups]);

  // Handle checkbox change for a single group
  const handleChouseChange = async (id: number, checked: boolean) => {
    const updatedGroups = groups.map(group => 
      group.id === id ? { ...group, chouse: checked } : group
    );

    setGroups(updatedGroups);
    
    // Update in Supabase
    await updateGroupChouse(id, checked);

    // Update selectAll state based on whether all groups are now selected
    setSelectAll(updatedGroups.every(group => group.chouse));
  };

  // Handle select all functionality
  const handleSelectAll = async () => {
    const newSelectAll = !selectAll;
    
    // Update all groups in state
    const updatedGroups = groups.map(group => ({
      ...group,
      chouse: newSelectAll
    }));
    
    setGroups(updatedGroups);
    setSelectAll(newSelectAll);
    
    // Update in Supabase
    await updateAllGroupsChouse(newSelectAll);
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (editMode) {
      // Exiting edit mode, clear any selection
      const updatedGroups = groups.map(group => ({
        ...group,
        chouse: false
      }));
      setGroups(updatedGroups);
      setSelectAll(false);
      updateAllGroupsChouse(false);
    }
  };

  // Handle delete button click
  const handleDeleteClick = (id: number) => {
    setGroupsToDelete([id]);
    setShowConfirmation(true);
  };

  // Handle delete selected groups
  const handleDeleteSelected = () => {
    const selectedIds = groups
      .filter(group => group.chouse)
      .map(group => group.id);
    
    if (selectedIds.length === 0) {
      alert('Please select at least one group to delete');
      return;
    }
    
    setGroupsToDelete(selectedIds);
    setShowConfirmation(true);
  };

  // Confirm deletion
  const confirmDelete = async () => {
    try {
      // Delete the groups from Supabase
      const success = await deleteGroups(groupsToDelete);
      
      if (success) {
        // Remove the deleted groups from local state
        const updatedGroups = groups.filter(group => !groupsToDelete.includes(group.id));
        setGroups(updatedGroups);
        setFilteredGroups(updatedGroups);
        
        // If we deleted all groups, exit edit mode
        if (updatedGroups.length === 0) {
          setEditMode(false);
        }
      } else {
        console.error('Failed to delete groups from database');
        // Could add error handling UI here
      }
    } catch (error) {
      console.error('Error during deletion:', error);
      // Could add error handling UI here
    } finally {
      // Clean up regardless of success or failure
      setShowConfirmation(false);
      setGroupsToDelete([]);
    }
  };

  // Cancel deletion
  const cancelDelete = () => {
    setShowConfirmation(false);
    setGroupsToDelete([]);
  };

  // Handle send message functionality
  const handleSendMessage = async () => {
    try {
      setSending(true);
      setSendingStatus('idle');
      
      // Get the IDs of all selected (chouse: true) groups
      const selectedGroupIds = groups
        .filter(group => group.chouse)
        .map(group => group.group_id);
      
      if (selectedGroupIds.length === 0) {
        alert('Please select at least one group');
        setSending(false);
        return;
      }
      
      const webhookUrl = process.env.REACT_APP_WEBHOOK_URL;
      
      if (!webhookUrl) {
        console.error('Webhook URL not found in environment variables');
        setSending(false);
        setSendingStatus('error');
        return;
      }
      
      // Send the selected group IDs to the webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groupIds: selectedGroupIds }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }
      
      setSendingStatus('success');
      
      // Reset success status after 3 seconds
      setTimeout(() => {
        setSendingStatus('idle');
      }, 3000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setSendingStatus('error');
    } finally {
      setSending(false);
    }
  };

  // Get selected groups count
  const selectedCount = groups.filter(group => group.chouse).length;

  const containerStyle = {
    backgroundColor: '#f3f4f8',
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%'
  };

  const fixedButtonStyle = {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: '0.75rem 15px', // 15px padding on left and right
    borderTop: '1px solid #e5e7eb',
    boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
    backgroundColor: 'rgba(255,255,255,0.95)',
    zIndex: 10
  };

  // Shared input style
  const inputStyle = {
    height: '40px',
    backgroundColor: 'white',
    borderRadius: '6px',
    border: 'none',
    padding: '0 12px',
    color: 'black',
    fontSize: '14px'
  };

  // Smaller select all button style
  const smallButtonStyle = {
    height: '32px',
    backgroundColor: 'white',
    borderRadius: '4px',
    border: 'none',
    padding: '0 10px',
    color: 'black',
    fontSize: '13px'
  };

  // Title and header row style
  const headerStyle = {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: '12px 0', // Equal padding top and bottom
  };

  // Title style
  const titleStyle = {
    fontWeight: 'bold' as const,
    fontSize: '16px'
  };

  return (
    <div style={containerStyle}>
      {/* Search Bar with Edit Button */}
      <div className="px-5 py-2" style={{ backgroundColor: '#6e47d5' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative', marginRight: '20px' }}>
            <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px', pointerEvents: 'none' }}>
              <MagnifyingGlassIcon className="text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search"
              style={{
                height: '40px',
                width: '100%',
                backgroundColor: 'white',
                borderRadius: '6px',
                border: 'none',
                paddingLeft: '40px',
                paddingRight: '16px',
                fontSize: '14px',
                color: 'black'
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={toggleEditMode}
            style={{ 
              height: '40px', 
              width: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              backgroundColor: editMode ? '#FEF2F2' : 'white',
              color: editMode ? '#DC2626' : '#374151',
              flexShrink: 0,
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
            aria-label={editMode ? "Done editing" : "Edit groups"}
          >
            {editMode ? <CheckIcon className="w-5 h-5" /> : <EditIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* List Section */}
      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-purple-600"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-20" style={{ backgroundColor: '#f3f4f8' }}>
          {/* Title */}
          <div className="mx-5" style={{ padding: '12px 0' }}>
            <div className="flex items-center justify-between">
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Groups</div>
              <div className="flex items-center">
                {editMode && (
                  <span
                    onClick={handleDeleteSelected}
                    style={{ 
                      marginRight: '15px',
                      cursor: 'pointer',
                      color: '#DC2626'
                    }}
                    aria-label="Delete selected groups"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5"
                      style={{ color: '#DC2626' }}
                    >
                      <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-1.5 bg-white text-gray-700 rounded-md font-medium text-sm hover:bg-gray-50 transition-colors shadow-sm"
                >
                  {selectAll ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Groups List */}
          <ul className="mx-5 rounded-lg overflow-hidden bg-white shadow-sm">
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group, index) => (
                <li 
                  key={group.id} 
                  className={`px-4 py-3 ${
                    index !== filteredGroups.length - 1 ? "border-b border-gray-200" : ""
                  } cursor-pointer hover:bg-gray-50 transition-colors`}
                  onClick={() => handleChouseChange(group.id, !group.chouse)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{group.name}</div>
                      <div className="text-xs text-gray-500">ID: {group.group_id}</div>
                    </div>
                    <div className="flex items-center space-x-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="h-5 w-5 rounded-md border-gray-300 text-purple-600 focus:ring-purple-500"
                        checked={group.chouse}
                        onChange={(e) => handleChouseChange(group.id, e.target.checked)}
                      />
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-10 text-center text-sm text-gray-500">
                {searchQuery ? 'No groups matching your search' : 'No groups available'}
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Fixed Send Button */}
      <div style={fixedButtonStyle}>
        <button
          onClick={handleSendMessage}
          disabled={sending || editMode}
          className={`w-full py-3 font-medium text-white text-center transition-colors rounded-md ${
            editMode ? 'bg-gray-400' :
            sending ? 'bg-gray-400' : 
            sendingStatus === 'success' ? 'bg-green-600' : 
            sendingStatus === 'error' ? 'bg-red-500' : 
            'bg-gradient-to-r from-purple-600 to-indigo-600'
          }`}
        >
          {editMode ? 'Exit Edit Mode to Send' :
           sending ? 'Sending...' : 
           sendingStatus === 'success' ? 'Sent!' : 
           sendingStatus === 'error' ? 'Failed' : 
           selectedCount > 0 ? `Send Message (${selectedCount})` : 'Send Message'}
        </button>
      </div>

      {/* Confirmation Popup */}
      {showConfirmation && (
        <>
          {/* Dark overlay */}
          <div 
            className="fixed inset-0 z-40" 
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(2px)'
            }}
            onClick={cancelDelete}
          ></div>
          
          <ConfirmationPopup 
            onConfirm={confirmDelete}
            onCancel={cancelDelete}
          />
        </>
      )}
    </div>
  );
};

export default GroupTable;
