import React, { useState, useEffect } from 'react';

const MyOT = () => {
  const [otRequests, setOtRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // สถานะและสีที่ใช้แสดงผล
  const statusConfig = {
    0: { text: 'รออนุมัติ', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
    1: { text: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-800', icon: '✅' },
    2: { text: 'ไม่อนุมัติ', color: 'bg-red-100 text-red-800', icon: '❌' }
  };

  // ดึงข้อมูล OT จาก API
  const fetchOTRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8000/api/v1/user/getMyOTRequests', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setOtRequests(result.data);
      } else {
        setError(result.message || 'ไม่สามารถดึงข้อมูล OT ได้');
      }
    } catch (err) {
      console.error('Error fetching OT requests:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOTRequests();
  }, []);

  // ฟอร์แมตวันที่
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // ฟอร์แมตเวลา
  const formatTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ลบ OT (เฉพาะรออนุมัติ)
  const deleteOTRequest = async (otId) => {
    if (!confirm('คุณต้องการลบการร้องขอ OT นี้หรือไม่?')) return;

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/api/v1/user/deleteOT/${otId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        alert('ลบการร้องขอ OT สำเร็จ');
        fetchOTRequests(); // รีเฟรชข้อมูล
      } else {
        alert(result.message || 'ไม่สามารถลบ OT ได้');
      }
    } catch (err) {
      console.error('Error deleting OT:', err);
      alert('เกิดข้อผิดพลาดในการลบ OT');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล OT...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="text-center">
            <span className="text-4xl">⚠️</span>
            <h2 className="text-xl font-bold text-gray-800 mt-2">เกิดข้อผิดพลาด</h2>
            <p className="text-gray-600 mt-1">{error}</p>
            <button 
              onClick={fetchOTRequests}
              className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              ลองใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">OT ของฉัน</h1>
              <p className="text-gray-600">รายการ OT ที่ยื่นไว้ทั้งหมด</p>
            </div>
          </div>
          
          {/* Create OT Button */}
          
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>📊</span>
          สถิติ OT
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {otRequests.filter(ot => ot.status === 0).length}
            </div>
            <div className="text-sm text-gray-600">รออนุมัติ</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {otRequests.filter(ot => ot.status === 1).length}
            </div>
            <div className="text-sm text-gray-600">อนุมัติแล้ว</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {otRequests.filter(ot => ot.status === 2).length}
            </div>
            <div className="text-sm text-gray-600">ไม่อนุมัติ</div>
          </div>
        </div>
      </div>

      {/* OT List */}
      {otRequests.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <span className="text-6xl">📄</span>
          <h3 className="text-xl font-bold text-gray-800 mt-4">ยังไม่มี OT</h3>
          <p className="text-gray-600 mt-2">คุณยังไม่ได้ยื่นเรื่อง OT เลย</p>
          <button
            onClick={() => window.location.href = '/OT'}
            className="mt-4 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
          >
            ยื่นเรื่อง OT แรก
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {otRequests.map((ot) => (
            <div key={ot.id} className="bg-white rounded-2xl shadow-lg p-6">
              {/* Header with Status */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{statusConfig[ot.status]?.icon}</span>
                  <div>
                    <h3 className="font-bold text-gray-800"></h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig[ot.status]?.color}`}>
                      {statusConfig[ot.status]?.text}
                    </span>
                  </div>
                </div>
                
                {/* Delete Button (เฉพาะรออนุมัติ) */}
                {ot.status === 0 && (
                  <button
                    onClick={() => deleteOTRequest(ot.ot_id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="ลบการร้องขอ OT"
                  >
                    🗑️
                  </button>
                )}
              </div>

              {/* Date Info */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">วันที่สร้าง</label>
                  <div className="text-gray-800 font-medium">
                    {formatDate(ot.created_at)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">จำนวนชั่วโมง</label>
                  <div className="text-xl font-bold text-blue-600">
                    {ot.total_hours} ชม.
                  </div>
                </div>
              </div>

              {/* Time Range */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <span>🟢</span> เวลาเริ่ม
                    </label>
                    <div className="text-gray-800 font-medium">
                      {formatDate(ot.start_time)} {formatTime(ot.start_time)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <span>🔴</span> เวลาสิ้นสุด
                    </label>
                    <div className="text-gray-800 font-medium">
                      {formatDate(ot.end_time)} {formatTime(ot.end_time)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1 mb-2">
                  <span>📝</span> เหตุผล
                </label>
                <div className="bg-blue-50 rounded-lg p-3 text-gray-800">
                  {ot.reason}
                </div>
              </div>

              {/* Approved by (ถ้ามี) */}
              {ot.approved_by_name && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <span>👤</span> อนุมัติโดย
                  </label>
                  <div className="text-gray-800 font-medium">
                    {ot.approved_by_name}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <button
          onClick={fetchOTRequests}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
        >
          <span>🔄</span>
          รีเฟรชข้อมูล
        </button>
      </div>
    </div>
  );
};

export default MyOT;