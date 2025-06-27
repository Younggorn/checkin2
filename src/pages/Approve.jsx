import React, { useState, useEffect } from 'react';

const Approve = () => {
  const [otRequests, setOtRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingOT, setProcessingOT] = useState(null);
  const [activeTab, setActiveTab] = useState(0); // 0=รออนุมัติ, 1=อนุมัติแล้ว, 2=ไม่อนุมัติ
  
  // State สำหรับ Modal ไม่อนุมัติ
  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    otId: null,
    reason: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchAllOTRequests();
    }
  }, [selectedUserId]);

  // สถานะและสีที่ใช้แสดงผล
  const statusConfig = {
    0: { text: 'รออนุมัติ', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
    1: { text: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-800', icon: '✅' },
    2: { text: 'ไม่อนุมัติ', color: 'bg-red-100 text-red-800', icon: '❌' }
  };

  // ดึงข้อมูลพนักงานทั้งหมด
  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/Admin/getuser`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.status === "success") {
        setEmployees(result.data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  // ดึงข้อมูล OT ของพนักงานที่เลือก
  const fetchAllOTRequests = async () => {
    if (!selectedUserId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('ไม่พบ token กรุณาเข้าสู่ระบบใหม่');
        return;
      }
      
      const response = await fetch('http://localhost:8000/api/v1/user/getAllOTRequests', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // แปลงข้อมูลและกรองตาม user_id ที่เลือก
        const formattedData = result.data ? result.data.map(item => ({
          ...item,
          status: parseInt(item.status),
          total_hours: parseFloat(item.total_hours)
        })) : [];
        
        // กรองข้อมูลตาม user_id ที่เลือก
        const filteredData = selectedUserId === "all" 
          ? formattedData 
          : formattedData.filter(item => {
              const possibleUserIds = [
                item.user_id,
                item.employee_id, 
                item.created_by,
                item.requester_id,
                item.emp_id
              ];
              
              return possibleUserIds.includes(selectedUserId);
            });
        
        setOtRequests(filteredData);
        
        if (filteredData.length === 0) {
          setError('ไม่มีข้อมูล OT สำหรับพนักงานคนนี้');
        }
      } else {
        console.error("❌ API ไม่สำเร็จ:", result.message);
        setError(result.message || 'ไม่สามารถดึงข้อมูล OT ได้');
      }
    } catch (err) {
      console.error('❌ Error fetching OT requests:', err);
      setError(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

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

  // อนุมัติ OT
  // แก้ไขใน component
const handleApprove = async (otId) => {
  if (!confirm('คุณต้องการอนุมัติ OT นี้หรือไม่?')) return;

  setProcessingOT(otId);
  
  try {
    const token = localStorage.getItem('token');
    
    // ✅ ใช้ otId ใน URL path แทน body
    const response = await fetch(`http://localhost:8000/api/v1/user/approveOTRequest`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 1,
        otId: otId
      })
    });

    const result = await response.json();
    
    if (result.success) {
      alert('อนุมัติ OT สำเร็จ!');
      fetchAllOTRequests();
    } else {
      alert(result.message || 'ไม่สามารถอนุมัติ OT ได้');
    }
  } catch (err) {
    console.error('Error approving OT:', err);
    alert('เกิดข้อผิดพลาดในการอนุมัติ OT');
  } finally {
    setProcessingOT(null);
  }
};

// แก้ไข handleReject เช่นกัน
const handleReject = async () => {
  if (!rejectModal.reason.trim()) {
    alert('กรุณาระบุเหตุผลในการไม่อนุมัติ');
    return;
  }

  setProcessingOT(rejectModal.otId);
  
  try {
    const token = localStorage.getItem('token');
    
    // ✅ ใช้ otId ใน URL path
    const response = await fetch(`http://localhost:8000/api/v1/user/approveOTRequest/${rejectModal.otId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 2,
        reject_reason: rejectModal.reason
      })
    });

    const result = await response.json();
    
    if (result.success) {
      alert('ไม่อนุมัติ OT สำเร็จ!');
      closeRejectModal();
      fetchAllOTRequests();
    } else {
      alert(result.message || 'ไม่สามารถไม่อนุมัติ OT ได้');
    }
  } catch (err) {
    console.error('Error rejecting OT:', err);
    alert('เกิดข้อผิดพลาดในการไม่อนุมัติ OT');
  } finally {
    setProcessingOT(null);
  }
};

  // ได้พนักงานที่เลือก
  const getSelectedEmployee = () => {
    if (selectedUserId === "all") return { first_name: "ทุกคน", last_name: "" };
    return employees.find(emp => emp.user_id === selectedUserId);
  };

  // แยกข้อมูลตามสถานะ
  const pendingOTs = otRequests.filter(ot => ot.status === 0);
  const approvedOTs = otRequests.filter(ot => ot.status === 1);
  const rejectedOTs = otRequests.filter(ot => ot.status === 2);

  // ข้อมูลที่จะแสดงตาม tab ที่เลือก
  const getFilteredData = () => {
    switch (activeTab) {
      case 0: return pendingOTs;
      case 1: return approvedOTs;
      case 2: return rejectedOTs;
      default: return pendingOTs;
    }
  };

  const filteredData = getFilteredData();

  if (loading && selectedUserId) {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <span className="text-2xl">👨‍💼</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">อนุมัติ OT</h1>
            <p className="text-gray-600">จัดการการร้องขอ OT ทั้งหมด</p>
          </div>
        </div>
      </div>

      {/* Employee Selection Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
          👥 เลือกพนักงาน
        </h2>
        
        <select
          value={selectedUserId}
          onChange={(e) => {
            setSelectedUserId(e.target.value);
            setOtRequests([]);
            setActiveTab(0);
          }}
          className="w-full p-3 border border-gray-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">-- เลือกพนักงาน --</option>
          <option value="all">ทุกคน</option>
          {employees.map((emp) => (
            <option key={emp.user_id} value={emp.user_id}>
              {emp.first_name} {emp.last_name}
            </option>
          ))}
        </select>
      </div>

      {selectedUserId && (
        <>
          {/* Filter Tabs */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex space-x-4">
              <button 
                onClick={() => setActiveTab(0)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 0 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                รออนุมัติ ({pendingOTs.length})
              </button>
              <button 
                onClick={() => setActiveTab(1)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 1 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                อนุมัติแล้ว ({approvedOTs.length})
              </button>
              <button 
                onClick={() => setActiveTab(2)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 2 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ไม่อนุมัติ ({rejectedOTs.length})
              </button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="text-center">
                <span className="text-4xl">⚠️</span>
                <h2 className="text-xl font-bold text-gray-800 mt-2">เกิดข้อผิดพลาด</h2>
                <p className="text-gray-600 mt-1">{error}</p>
                <button 
                  onClick={fetchAllOTRequests}
                  className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  ลองใหม่
                </button>
              </div>
            </div>
          )}

          {/* OT List */}
          {!error && (
            <>
              {filteredData.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                  <span className="text-6xl">📄</span>
                  <h3 className="text-xl font-bold text-gray-800 mt-4">
                    ไม่มี OT {statusConfig[activeTab]?.text}
                  </h3>
                  <p className="text-gray-600 mt-2">
                    {selectedUserId === "all" 
                      ? "ยังไม่มีการร้องขอ OT ในสถานะนี้" 
                      : "พนักงานคนนี้ยังไม่มี OT ในสถานะนี้"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredData.map((ot) => (
                    <div key={ot.ot_id} className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${
                      ot.status === 0 ? 'border-yellow-400' :
                      ot.status === 1 ? 'border-green-400' : 'border-red-400'
                    }`}>
                      {/* Header with Employee Info */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-lg">👤</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800">
                               {ot.employee_name || 'ไม่ระบุชื่อ'}
                            </h3>
                          </div>
                        </div>
                        
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig[ot.status]?.color}`}>
                          {statusConfig[ot.status]?.icon} {statusConfig[ot.status]?.text}
                        </span>
                      </div>

                      {/* OT Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">วันที่สร้าง</label>
                          <div className="text-gray-800 font-medium">
                            {formatDate(ot.created_at)}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">จำนวนชั่วโมงรวม</label>
                          <div className="text-xl font-bold text-blue-600">
                            {ot.total_hours} ชม.
                          </div>
                        </div>
                      </div>

                      {/* Time Range */}
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                              <span>🟢</span> เวลาเริ่ม OT
                            </label>
                            <div className="text-gray-800 font-medium">
                              {formatDate(ot.start_time)} {formatTime(ot.start_time)}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                              <span>🔴</span> เวลาสิ้นสุด OT
                            </label>
                            <div className="text-gray-800 font-medium">
                              {formatDate(ot.end_time)} {formatTime(ot.end_time)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Reason */}
                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-600 flex items-center gap-1 mb-2">
                          <span>📝</span> เหตุผลในการทำ OT
                        </label>
                        <div className="bg-blue-50 rounded-lg p-3 text-gray-800">
                          {ot.reason}
                        </div>
                      </div>

                      {/* Action Buttons (เฉพาะรออนุมัติ) */}
                      {ot.status === 0 && (
                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => handleApprove(ot.ot_id)}
                            disabled={processingOT === ot.ot_id}
                            className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {processingOT === ot.ot_id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                กำลังดำเนินการ...
                              </>
                            ) : (
                              <>
                                <span>✅</span>
                                อนุมัติ
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => openRejectModal(ot.ot_id)}
                            disabled={processingOT === ot.ot_id}
                            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <span>❌</span>
                            ไม่อนุมัติ
                          </button>
                        </div>
                      )}

                      {/* Approved/Rejected by Info */}
                      {(ot.status === 1 || ot.status === 2) && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                                <span>👨‍💼</span> {ot.status === 1 ? 'อนุมัติโดย' : 'ไม่อนุมัติโดย'}
                              </label>
                              <div className="text-gray-800 font-medium">
                                {ot.approved_by_name || 'ไม่ระบุ'}
                              </div>
                            </div>
                            {ot.status === 1 && ot.updated_at && (
                              <div>
                                <label className="text-sm font-medium text-gray-600">วันที่อนุมัติ</label>
                                <div className="text-gray-800 font-medium">
                                  {formatDate(ot.updated_at)} {formatTime(ot.updated_at)}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Reject Reason */}
                          {ot.status === 2 && ot.reject_reason && (
                            <div className="mt-3">
                              <label className="text-sm font-medium text-gray-600 flex items-center gap-1 mb-2">
                                <span>💬</span> เหตุผลที่ไม่อนุมัติ
                              </label>
                              <div className="bg-red-50 rounded-lg p-3 text-red-800 border border-red-200">
                                {ot.reject_reason}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Refresh Button */}
          <div className="mt-6 text-center">
            <button
              onClick={fetchAllOTRequests}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
            >
              <span>🔄</span>
              รีเฟรชข้อมูล
            </button>
          </div>
        </>
      )}

      {/* Welcome State */}
      {!selectedUserId && (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">👋</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            ยินดีต้อนรับ
          </h3>
          <p className="text-gray-500">
            เริ่มต้นด้วยการเลือกพนักงานที่ต้องการดู OT
          </p>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">❌</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">ไม่อนุมัติ OT</h3>
                  <p className="text-gray-600 text-sm">กรุณาระบุเหตุผลในการไม่อนุมัติ</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เหตุผลที่ไม่อนุมัติ <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectModal.reason}
                onChange={(e) => setRejectModal(prev => ({
                  ...prev,
                  reason: e.target.value
                }))}
                placeholder="เช่น ไม่จำเป็นต้องทำ OT ในช่วงเวลานี้..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows="4"
                maxLength="500"
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {rejectModal.reason.length}/500
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={closeRejectModal}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectModal.reason.trim() || processingOT === rejectModal.otId}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processingOT === rejectModal.otId ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    กำลังดำเนินการ...
                  </>
                ) : (
                  'ยืนยันไม่อนุมัติ'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approve;