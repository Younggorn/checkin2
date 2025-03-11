import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

export default function ReportAll() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]); // ✅ รายชื่อพนักงาน
  const [selectedUserId, setSelectedUserId] = useState(""); // ✅ user_id ที่เลือก
  const [data, setData] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  // ✅ ดึงรายชื่อพนักงานจาก API
  const fetchEmployees = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/Admin/getuser`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.status === "success") {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  // ✅ ดึงข้อมูล Check-in ของพนักงานที่เลือก
  const getUserData = async () => {
    if (!selectedUserId) return; // ถ้ายังไม่ได้เลือกพนักงาน ไม่ต้องดึงข้อมูล

    try {
      const apiUrl = `${
        import.meta.env.VITE_API_URL
      }/api/v1/user/getUserCheckingData`;

      const response = await axios.post(
        apiUrl,
        {
          user_id: selectedUserId,
          page,
          limit,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.status === "success") {
        setData(response.data.data);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      getUserData();
    }
  }, [selectedUserId, page, startDate, endDate]);

  const formatDate = (dateString) =>
    new Date(dateString).toISOString().split("T")[0]; // YYYY-MM-DD
  const formatTime = (timeString) => timeString || "Not Checked Out";

  return (
    <div className="flex flex-col items-center justify-center p-5">
      <h2 className="text-lg font-bold mb-4">Check-in Report</h2>

      <div className="mb-4">
        <label className="font-semibold">Select Employee: </label>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="border p-2 rounded ml-2"
        >
          <option value="">-- Select Employee --</option>
          {employees.map((emp) => (
            <option key={emp.user_id} value={emp.user_id}>
              {emp.first_name} {emp.last_name}
            </option>
          ))}
        </select>
      </div>

      {/* ✅ Date Range Filter */}
      <div className="flex space-x-4 mb-4">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          onClick={getUserData}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Filter
        </button>
      </div>

      {/* ✅ Data Table */}
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200 text-sm">
            <th className="border border-gray-300 p-2">Date</th>
            <th className="border border-gray-300 p-2">Check-in Time</th>
            <th className="border border-gray-300 p-2">Check-out Time</th>
            <th className="border border-gray-300 p-2">Image</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((entry) => {
              console.log("Photo URL:", entry.photo_url);
              return (
                <tr key={entry.checkin_id} className="text-center">
                  <td className="border border-gray-300 p-2">
                    {formatDate(entry.date)}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {formatTime(entry.checkin_time)}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {formatTime(entry.checkout_time)}
                  </td>
                  <td className="border border-gray-300 p-2 flex justify-center items-center">
                    <img
                      src={`${
                        import.meta.env.VITE_API_URL
                      }/${entry.photo_url.replace(/\\/g, "/")}`}    
                      alt="Check-in"
                      className="w-32 h-32 object-cover rounded-md border border-gray-300"
                    />
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="4" className="text-center p-4 text-gray-500">
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ✅ Pagination Controls */}
      <div className="flex justify-center space-x-4 mt-4">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className="bg-gray-300 px-3 py-1 rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-sm font-bold">{`Page ${page} of ${totalPages}`}</span>
        <button
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages}
          className="bg-gray-300 px-3 py-1 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
