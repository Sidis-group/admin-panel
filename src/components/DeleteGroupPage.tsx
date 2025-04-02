import React, { useState, useEffect } from 'react';
import { Group, fetchGroups, updateGroupChouse, updateAllGroupsChouse, deleteGroups } from '../services/supabase';

// Search icon component (reused from GroupTable)
const SearchIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
    />
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
      className="fixed bg-white rounded-lg"
      style={{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)', 
        width: 'calc(100% - 120px)', 
        maxWidth: '400px', 
        padding: '20px', 
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)', 
        border: '1px solid rgba(229, 231, 235, 0.7)',
        zIndex: 60
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

const DeleteGroupPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectAll, setSelectAll] = useState(false);
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

  // Handle delete selected groups
  const handleDelete = () => {
    // Get all selected groups
    const selected = groups.filter(group => group.chouse).map(group => group.id);
    if (selected.length > 0) {
      setGroupsToDelete(selected);
      setShowConfirmation(true);
    }
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

  // Get selected groups count
  const selectedCount = groups.filter(group => group.chouse).length;

  const containerStyle = {
    backgroundColor: '#f3f4f8',
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%'
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(2px)',
    zIndex: 50
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
    zIndex: 40
  };

  return (
    <div style={containerStyle}>
      {/* Header with Title */}
      <div className="px-5 py-2" style={{ backgroundColor: '#6e47d5' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px', pointerEvents: 'none' }}>
              <SearchIcon className="text-gray-500" />
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
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Delete Groups</div>
              <div className="flex items-center">
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

      {/* Fixed Delete Button */}
      <div style={fixedButtonStyle}>
        <button
          onClick={handleDelete}
          disabled={selectedCount === 0}
          className={`w-full py-3 font-medium text-white text-center transition-colors rounded-md ${
            selectedCount === 0 ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'
          }`}
        >
          {selectedCount > 0 ? `Delete Groups (${selectedCount})` : 'Delete Groups'}
        </button>
      </div>

      {/* Confirmation Popup */}
      {showConfirmation && (
        <>
          {/* Dark overlay */}
          <div 
            className="fixed inset-0" 
            style={overlayStyle}
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

export default DeleteGroupPage;
