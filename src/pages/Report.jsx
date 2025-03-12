import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

export default function Report() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(5); // ✅ กำหนดจำนวนข้อมูลต่อหน้า
  const [totalPages, setTotalPages] = useState(1);

  // ✅ ดึงข้อมูลจาก API พร้อม Filter
  const getOwnData = async () => {
    try {
      let apiUrl = `${
        import.meta.env.VITE_API_URL
      }/api/v1/user/getOwntime?page=${page}&limit=${limit}`;

      if (startDate) apiUrl += `&startDate=${startDate}`;
      if (endDate) apiUrl += `&endDate=${endDate}`;

      const response = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (response.data.status === "success") {
        setData(response.data.data);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    }
  };

  useEffect(() => {
    if (user) {
      getOwnData();
    }
  }, [user, page, startDate, endDate]);

  const formatDate = (dateString) =>
    new Date(dateString).toISOString().split("T")[0]; // YYYY-MM-DD
  const formatTime = (timeString) => timeString || "Not Checked Out"; // แสดงเวลา หรือ ข้อความแจ้งเตือน

  return (
    <div className="flex flex-col items-center justify-center p-5">
      <h2 className="text-lg font-bold mb-4">Check-in Report</h2>

      <div className="flex space-x-4 mb-4 items-end">
        <div className="flex flex-col gap-2 ">
          <span className="text-lg">Start Date</span>{" "}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border p-2 text-sm rounded"
          />
        </div>

        <div className="flex flex-col gap-2 ">
          <span className="text-lg">Start Date</span>{" "}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border p-2 text-sm rounded"
          />
        </div>

        <button
          onClick={getOwnData}
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
            <th className="border border-gray-300 p-2">Diff Time</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((entry) => (
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
                <td className="border border-gray-300 p-2">
                  {formatTime(entry.time_difference)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="text-center p-4 text-gray-500">
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
