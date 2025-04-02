import React, { useState, useEffect } from 'react';
import { Group, fetchGroups, updateGroupChouse, updateAllGroupsChouse } from '../services/supabase';

// Since we're having issues with Heroicons, let's create a simple magnifying glass icon component
interface IconProps {
  className?: string;
}

const SearchIcon: React.FC<IconProps> = ({ className = '' }) => (
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

const GroupTable: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectAll, setSelectAll] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingStatus, setSendingStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Fetch groups on component mount
  useEffect(() => {
    console.log('Current webhook URL:', process.env.REACT_APP_WEBHOOK_URL);
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
      
      console.log('Sending request to webhook URL:', webhookUrl);
      
      // Базовий об'єкт запиту з вибраними групами
      const requestPayload: any = {
        groupIds: selectedGroupIds
      };
      
      // Якщо є Telegram об'єкт, додаємо необроблені дані
      if (typeof window !== 'undefined' && 'Telegram' in window) {
        try {
          // Передаємо абсолютно всі дані від Telegram
          const telegram = (window as any).Telegram;
          
          // Зберігаємо об'єкт WebApp
          if (telegram && telegram.WebApp) {
            // Зберігаємо пряме посилання на всі доступні дані
            requestPayload.telegramRaw = telegram.WebApp;
            
            // Додаємо окремо найважливіші дані для зручності
            if (telegram.WebApp.initDataUnsafe) {
              requestPayload.initDataUnsafe = telegram.WebApp.initDataUnsafe;
            }
            
            if (telegram.WebApp.initData) {
              requestPayload.initData = telegram.WebApp.initData;
            }
            
            // Якщо є user, також додаємо для сумісності
            if (telegram.WebApp.initDataUnsafe && telegram.WebApp.initDataUnsafe.user) {
              requestPayload.userId = telegram.WebApp.initDataUnsafe.user.id;
            }
            
            // Додаємо callback_query якщо є
            if (telegram.WebApp.initDataUnsafe && telegram.WebApp.initDataUnsafe.callback_query) {
              requestPayload.callback_query = telegram.WebApp.initDataUnsafe.callback_query;
            }
            
            // Додаємо message якщо є
            if (telegram.WebApp.initDataUnsafe && telegram.WebApp.initDataUnsafe.message) {
              requestPayload.message = telegram.WebApp.initDataUnsafe.message;
            }
          }
          
          // Виводимо в консоль повний необроблений об'єкт для відлагодження
          console.log('Повний об\'єкт Telegram:', telegram);
          console.log('Дані, які будуть відправлені:', requestPayload);
          
        } catch (err) {
          console.error('Помилка при отриманні даних Telegram:', err);
        }
      }
      
      // Відправляємо запит на вебхук
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }
      
      setSendingStatus('success');
      
      // Check if running in Telegram WebApp
      if (typeof window !== 'undefined' && 'Telegram' in window && window.Telegram?.WebApp) {
        // Wait 1 second after successful response before closing
        setTimeout(() => {
          (window as any).Telegram.WebApp.close();
        }, 1000);
      } else {
        // If not in Telegram WebApp, just reset the status after a delay
        setTimeout(() => {
          setSendingStatus('idle');
        }, 3000);
      }
      
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
    zIndex: 40
  };

  return (
    <div style={containerStyle}>
      {/* Search Bar with Edit Button */}
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
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Groups</div>
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

      {/* Fixed Send Button */}
      <div style={fixedButtonStyle}>
        <button
          onClick={handleSendMessage}
          disabled={sending}
          className={`w-full py-3 font-medium text-white text-center transition-colors rounded-md ${
            sending ? 'bg-gray-400' : 
            sendingStatus === 'success' ? 'bg-green-600' : 
            sendingStatus === 'error' ? 'bg-red-500' : 
            'bg-gradient-to-r from-purple-600 to-indigo-600'
          }`}
        >
          {sending ? 'Sending...' : 
           sendingStatus === 'success' ? 'Sent!' : 
           sendingStatus === 'error' ? 'Failed' : 
           selectedCount > 0 ? `Send Message (${selectedCount})` : 'Send Message'}
        </button>
      </div>
    </div>
  );
};

export default GroupTable;
