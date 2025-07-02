import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const Approve = () => {
  const [otRequests, setOtRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingOT, setProcessingOT] = useState(null);
  const [activeTab, setActiveTab] = useState(0); // 0=รอรับรอง, 1=รับรองแล้ว, 2=ไม่รับรอง
  const [rejectedReasons, setRejectedReasons] = useState({}); // เก็บเหตุผลที่ไม่รับรอง
  
  // State สำหรับ Modal ไม่รับรอง
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
      fetchRejectedReasons();
    }
  }, [selectedUserId]);

  // สถานะและสีที่ใช้แสดงผล
  const statusConfig = {
    0: { text: 'รอรับรอง', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
    1: { text: 'รับรองแล้ว', color: 'bg-green-100 text-green-800', icon: '✅' },
    2: { text: 'ไม่รับรอง', color: 'bg-red-100 text-red-800', icon: '❌' }
  };

  // ✅ ใช้ API ใหม่ getOTStatus2 สำหรับดึงเหตุผลที่ไม่รับรอง
  const fetchRejectedReasons = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/Admin/getOTStatus2`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          const reasonsMap = {};
          result.data.forEach(item => {
            // ใช้ field ใหม่ตาม API
            reasonsMap[item.ot_id] = item.reason_reject;
          });
          setRejectedReasons(reasonsMap);
        }
      }
    } catch (error) {
      console.error("Error fetching rejected reasons:", error);
    }
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

  // รับรอง OT - ใช้ SweetAlert2
  const handleApprove = async (otId) => {
    const result = await Swal.fire({
      title: 'ยืนยันการรับรอง',
      text: 'คุณต้องการรับรอง OT นี้หรือไม่?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ใช่, รับรอง',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    setProcessingOT(otId);
    
    try {
      const token = localStorage.getItem('token');
      
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

      const apiResult = await response.json();
      
      if (apiResult.success) {
        await Swal.fire({
          title: 'สำเร็จ!',
          text: 'รับรอง OT เรียบร้อยแล้ว',
          icon: 'success',
          confirmButtonColor: '#10b981',
          timer: 2000,
          timerProgressBar: true
        });
        
        fetchAllOTRequests();
        fetchRejectedReasons();
      } else {
        await Swal.fire({
          title: 'เกิดข้อผิดพลาด!',
          text: apiResult.message || 'ไม่สามารถรับรอง OT ได้',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (err) {
      console.error('Error approving OT:', err);
      await Swal.fire({
        title: 'เกิดข้อผิดพลาด!',
        text: 'เกิดข้อผิดพลาดในการรับรอง OT',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setProcessingOT(null);
    }
  };

  // เปิด Modal ไม่รับรอง - ใช้ SweetAlert2
  const openRejectModal = async (otId) => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: 'ไม่รับรอง OT',
      text: 'กรุณาระบุเหตุผลในการไม่รับรอง',
      input: 'textarea',
      inputAttributes: {
        placeholder: 'เช่น ไม่จำเป็นต้องทำ OT ในช่วงเวลานี้...',
        maxlength: 200,
        rows: 4
      },
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ยืนยันไม่รับรอง',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
      inputValidator: (value) => {
        if (!value || value.trim().length === 0) {
          return 'กรุณาระบุเหตุผลในการไม่รับรอง';
        }
        if (value.trim().length < 5) {
          return 'เหตุผลต้องมีอย่างน้อย 5 ตัวอักษร';
        }
        return null;
      }
    });

    if (isConfirmed && reason) {
      await handleReject(otId, reason.trim());
    }
  };

  // ไม่รับรอง OT - ใช้ SweetAlert2
  const handleReject = async (otId, reason) => {
    setProcessingOT(otId);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/Admin/rejectOT/${otId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason_reject: reason
        })
      });

      const result = await response.json();
      
      if (result.success) {
        await Swal.fire({
          title: 'สำเร็จ!',
          text: 'ไม่รับรอง OT เรียบร้อยแล้ว',
          icon: 'success',
          confirmButtonColor: '#10b981',
          timer: 2000,
          timerProgressBar: true
        });
        
        fetchAllOTRequests();
        fetchRejectedReasons();
      } else {
        await Swal.fire({
          title: 'เกิดข้อผิดพลาด!',
          text: result.message || 'ไม่สามารถไม่รับรอง OT ได้',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (err) {
      console.error('Error rejecting OT:', err);
      await Swal.fire({
        title: 'เกิดข้อผิดพลาด!',
        text: 'เกิดข้อผิดพลาดในการไม่รับรอง OT',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
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
            <h1 className="text-2xl font-bold text-gray-800">รับรอง OT</h1>
           
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
            setRejectedReasons({});
          }}
          className="w-full p-3 border border-gray-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          
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
                รอรับรอง ({pendingOTs.length})
              </button>
              <button 
                onClick={() => setActiveTab(1)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 1 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                รับรองแล้ว ({approvedOTs.length})
              </button>
              <button 
                onClick={() => setActiveTab(2)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 2 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ไม่รับรอง ({rejectedOTs.length})
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

                      {/* ✅ แสดงเหตุผลที่ไม่รับรอง จาก API ใหม่ */}
                      {ot.status === 2 && rejectedReasons[ot.ot_id] && (
                        <div className="mb-4">
                          <label className="text-sm font-medium text-red-600 flex items-center gap-1 mb-2">
                            <span>❌</span> เหตุผลที่ไม่รับรอง
                          </label>
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800">
                            {rejectedReasons[ot.ot_id]}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons (เฉพาะรอรับรอง) */}
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
                                รับรอง
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => openRejectModal(ot.ot_id)}
                            disabled={processingOT === ot.ot_id}
                            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <span>❌</span>
                            ไม่รับรอง
                          </button>
                        </div>
                      )}

                      {/* Approved/Rejected by Info */}
                      {(ot.status === 1 || ot.status === 2) && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                                <span>👨‍💼</span> {ot.status === 1 ? 'รับรองโดย' : 'ไม่รับรองโดย'}
                              </label>
                              <div className="text-gray-800 font-medium">
                                {ot.approved_by_name || 'ไม่ระบุ'}
                              </div>
                            </div>
                            {ot.status === 1 && ot.updated_at && (
                              <div>
                                <label className="text-sm font-medium text-gray-600">วันที่รับรอง</label>
                                <div className="text-gray-800 font-medium">
                                  {formatDate(ot.updated_at)} {formatTime(ot.updated_at)}
                                </div>
                              </div>
                            )}
                          </div>
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
              onClick={() => {
                fetchAllOTRequests();
                fetchRejectedReasons();
              }}
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
    </div>
  );
};

export default Approve;