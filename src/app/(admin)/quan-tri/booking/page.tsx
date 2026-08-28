"use client";

import { useEffect, useState } from "react";
import { bookingsService } from "@/services/bookings.service";
import { roomsService } from "@/services/rooms.service";
import { usersService } from "@/services/users.service";
import type { Booking } from "@/types/booking";
import type { Room } from "@/types/room";
import type { User } from "@/types/user";

const PAGE_SIZE = 5;

type SortKey = "id" | "room" | "user" | "ngayDen" | "ngayDi" | "soLuongKhach";

type SortDirection = "asc" | "desc";

type MessageModal = {
  type: "success" | "error" | "warning";
  title: string;
  message: string;
};

type NewBooking = {
  maPhong: number;
  ngayDen: string;
  ngayDi: string;
  soLuongKhach: number;
  maNguoiDung: number;
};

const initialNewBooking: NewBooking = {
  maPhong: 0,
  ngayDen: "",
  ngayDi: "",
  soLuongKhach: 1,
  maNguoiDung: 0,
};

export default function AdminBookingPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [deleteBookingId, setDeleteBookingId] = useState<number | null>(null);
  const [messageModal, setMessageModal] = useState<MessageModal | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError("");

        const [bookingData, roomData, userData] = await Promise.all([
          bookingsService.getAll(),
          roomsService.getAll(),
          usersService.getAll(),
        ]);

        setBookings(bookingData);
        setRooms(roomData);
        setUsers(userData);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
        setError("Không thể tải danh sách đặt phòng.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  function getRoomName(roomId: number) {
    const room = rooms.find((item) => item.id === roomId);

    return room?.tenPhong ?? `Phòng #${roomId}`;
  }

  function getUserName(userId: number) {
    const user = users.find((item) => item.id === userId);

    if (!user) {
      return `User #${userId}`;
    }

    return user.name || user.email;
  }

  function formatDate(dateString: string) {
    if (!dateString) {
      return "";
    }

    const datePart = dateString.slice(0, 10);
    const [year, month, day] = datePart.split("-");

    if (!year || !month || !day) {
      return dateString;
    }

    return `${day}/${month}/${year}`;
  }

  function handleSort(key: SortKey) {
    setPage(1);

    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection("asc");
  }

  function renderSortIcon(key: SortKey) {
    if (sortKey !== key) {
      return <span className="text-slate-300">↕</span>;
    }

    return sortDirection === "asc" ? <span>↑</span> : <span>↓</span>;
  }

  const search = searchInput.trim().toLowerCase();

  const filteredBookings = bookings.filter((booking) => {
    const roomName = getRoomName(booking.maPhong).toLowerCase();

    const user = users.find((item) => item.id === booking.maNguoiDung);

    const userName = user?.name?.toLowerCase() ?? "";
    const userEmail = user?.email?.toLowerCase() ?? "";

    const matchesSearch =
      !search ||
      String(booking.id).includes(search) ||
      roomName.includes(search) ||
      userName.includes(search) ||
      userEmail.includes(search);
    const bookingStart = booking.ngayDen.slice(0, 10);
    const bookingEnd = booking.ngayDi.slice(0, 10);

    let matchesDate = true;

    if (dateFrom && dateTo) {
      matchesDate = bookingStart <= dateTo && bookingEnd >= dateFrom;
    } else if (dateFrom) {
      matchesDate = bookingEnd >= dateFrom;
    } else if (dateTo) {
      matchesDate = bookingStart <= dateTo;
    }

    return matchesSearch && matchesDate;
  });

  const sortedBookings = [...filteredBookings].sort((a, b) => {
    let valueA: string | number;
    let valueB: string | number;

    switch (sortKey) {
      case "room":
        valueA = getRoomName(a.maPhong).toLowerCase();
        valueB = getRoomName(b.maPhong).toLowerCase();
        break;

      case "user":
        valueA = getUserName(a.maNguoiDung).toLowerCase();
        valueB = getUserName(b.maNguoiDung).toLowerCase();
        break;

      case "ngayDen":
        valueA = new Date(a.ngayDen).getTime();
        valueB = new Date(b.ngayDen).getTime();
        break;

      case "ngayDi":
        valueA = new Date(a.ngayDi).getTime();
        valueB = new Date(b.ngayDi).getTime();
        break;

      case "soLuongKhach":
        valueA = a.soLuongKhach;
        valueB = b.soLuongKhach;
        break;

      default:
        valueA = a.id;
        valueB = b.id;
    }

    if (typeof valueA === "string" && typeof valueB === "string") {
      return sortDirection === "asc"
        ? valueA.localeCompare(valueB, "vi")
        : valueB.localeCompare(valueA, "vi");
    }

    return sortDirection === "asc"
      ? Number(valueA) - Number(valueB)
      : Number(valueB) - Number(valueA);
  });

  const totalPages = Math.ceil(sortedBookings.length / PAGE_SIZE);

  const displayedBookings = sortedBookings.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  async function handleUpdateBooking() {
    if (!editingBooking) {
      return;
    }

    if (
      !editingBooking.ngayDen ||
      !editingBooking.ngayDi ||
      editingBooking.soLuongKhach <= 0
    ) {
      setMessageModal({
        type: "warning",
        title: "Thông báo",
        message: "Vui lòng nhập đầy đủ thông tin.",
      });

      return;
    }

    if (new Date(editingBooking.ngayDi) <= new Date(editingBooking.ngayDen)) {
      setMessageModal({
        type: "warning",
        title: "Ngày không hợp lệ",
        message: "Ngày đi phải sau ngày đến.",
      });

      return;
    }

    try {
      await bookingsService.update(editingBooking.id, {
        id: editingBooking.id,
        maPhong: editingBooking.maPhong,
        ngayDen: editingBooking.ngayDen,
        ngayDi: editingBooking.ngayDi,
        soLuongKhach: editingBooking.soLuongKhach,
        maNguoiDung: editingBooking.maNguoiDung,
      });

      setBookings((current) =>
        current.map((booking) =>
          booking.id === editingBooking.id ? editingBooking : booking,
        ),
      );

      setEditingBooking(null);

      setMessageModal({
        type: "success",
        title: "Thành công",
        message: "Cập nhật đặt phòng thành công!",
      });
    } catch (error) {
      console.error("Lỗi cập nhật đặt phòng:", error);

      setMessageModal({
        type: "error",
        title: "Có lỗi xảy ra",
        message: "Không thể cập nhật đặt phòng.",
      });
    }
  }

  async function handleDeleteBooking() {
    if (deleteBookingId === null) {
      return;
    }

    try {
      await bookingsService.remove(deleteBookingId);

      setBookings((current) =>
        current.filter((booking) => booking.id !== deleteBookingId),
      );

      setDeleteBookingId(null);

      setMessageModal({
        type: "success",
        title: "Thành công",
        message: "Xóa đặt phòng thành công!",
      });
    } catch (error) {
      console.error("Lỗi xóa đặt phòng:", error);

      setMessageModal({
        type: "error",
        title: "Có lỗi xảy ra",
        message: "Không thể xóa đặt phòng.",
      });
    }
  }

  return (
    <>
      <section className="rounded-3xl border border-line bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-950">
              Danh sách đặt phòng
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Tổng cộng: {filteredBookings.length} đơn
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div className="relative w-full max-w-lg">
            <input
              type="text"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo ID, phòng, tên hoặc email người đặt..."
              className="h-11 w-full rounded-xl border border-line px-4 pr-11 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Từ ngày
                </label>

                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => {
                    setDateFrom(event.target.value);
                    setPage(1);
                  }}
                  className="h-11 rounded-xl border border-line bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Đến ngày
                </label>

                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(event) => {
                    setDateTo(event.target.value);
                    setPage(1);
                  }}
                  className="h-11 rounded-xl border border-line bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                    setPage(1);
                  }}
                  className="h-11 rounded-xl border border-line px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Xóa bộ lọc ngày
                </button>
              )}
            </div>

            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setPage(1);
                }}
                aria-label="Xóa tìm kiếm"
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {loading && (
          <p className="mt-6 text-slate-500">Đang tải danh sách...</p>
        )}

        {error && <p className="mt-6 text-red-500">{error}</p>}

        {!loading && !error && (
          <>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full table-fixed text-left">
                <thead>
                  <tr className="border-b border-line text-sm text-slate-500">
                    <SortHeader
                      label="ID"
                      active={sortKey === "id"}
                      icon={renderSortIcon("id")}
                      onClick={() => handleSort("id")}
                    />

                    <SortHeader
                      label="Phòng"
                      active={sortKey === "room"}
                      icon={renderSortIcon("room")}
                      onClick={() => handleSort("room")}
                    />

                    <SortHeader
                      label="Người đặt"
                      active={sortKey === "user"}
                      icon={renderSortIcon("user")}
                      onClick={() => handleSort("user")}
                    />

                    <SortHeader
                      label="Ngày đến"
                      active={sortKey === "ngayDen"}
                      icon={renderSortIcon("ngayDen")}
                      onClick={() => handleSort("ngayDen")}
                    />

                    <SortHeader
                      label="Ngày đi"
                      active={sortKey === "ngayDi"}
                      icon={renderSortIcon("ngayDi")}
                      onClick={() => handleSort("ngayDi")}
                    />

                    <SortHeader
                      label="Số khách"
                      active={sortKey === "soLuongKhach"}
                      icon={renderSortIcon("soLuongKhach")}
                      onClick={() => handleSort("soLuongKhach")}
                      center
                    />

                    <th className="whitespace-nowrap p-3 text-center">
                      Thao tác
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {displayedBookings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-8 text-center text-slate-500"
                      >
                        Không có đơn đặt phòng.
                      </td>
                    </tr>
                  ) : (
                    displayedBookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="border-b border-line text-sm"
                      >
                        <td className="p-3">{booking.id}</td>

                        <td className="max-w-64 p-3 font-medium">
                          <p className="line-clamp-2">
                            {getRoomName(booking.maPhong)}
                          </p>
                        </td>

                        <td className="p-3">
                          {getUserName(booking.maNguoiDung)}
                        </td>

                        <td className="whitespace-nowrap p-3">
                          {formatDate(booking.ngayDen)}
                        </td>

                        <td className="whitespace-nowrap p-3">
                          {formatDate(booking.ngayDi)}
                        </td>

                        <td className="whitespace-nowrap p-3 text-center">
                          {booking.soLuongKhach}
                        </td>

                        <td className="p-3">
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              title="Sửa"
                              onClick={() =>
                                setEditingBooking({
                                  ...booking,
                                })
                              }
                              className="rounded-lg bg-blue-50 px-3 py-1.5 font-semibold text-blue-600 transition hover:bg-blue-100"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  d="M4 20h4l10-10-4-4L4 16v4z"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path d="M13 7l4 4" strokeLinecap="round" />
                              </svg>
                            </button>

                            <button
                              type="button"
                              title="Xóa"
                              onClick={() => setDeleteBookingId(booking.id)}
                              className="rounded-lg bg-red-50 px-3 py-1.5 font-semibold text-red-600 transition hover:bg-red-100"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path d="M4 7h16" />
                                <path d="M10 11v6" />
                                <path d="M14 11v6" />
                                <path d="M6 7l1 12h10l1-12" />
                                <path d="M9 7V4h6v3" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-xl border border-line px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Trang trước
                </button>

                <span className="text-sm text-slate-600">
                  Trang {page} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-xl border border-line px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Trang sau →
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {editingBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setEditingBooking(null)}
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-950">
                  Sửa đặt phòng
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Booking #{editingBooking.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                className="text-xl text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Phòng
                </label>

                <select
                  value={editingBooking.maPhong}
                  onChange={(event) =>
                    setEditingBooking({
                      ...editingBooking,
                      maPhong: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-line bg-white px-4 py-2.5"
                >
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.tenPhong}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Ngày đến
                </label>

                <input
                  type="date"
                  value={editingBooking.ngayDen.slice(0, 10)}
                  onChange={(event) =>
                    setEditingBooking({
                      ...editingBooking,
                      ngayDen: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-line px-4 py-2.5"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Ngày đi
                </label>

                <input
                  type="date"
                  min={editingBooking.ngayDen.slice(0, 10)}
                  value={editingBooking.ngayDi.slice(0, 10)}
                  onChange={(event) =>
                    setEditingBooking({
                      ...editingBooking,
                      ngayDi: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-line px-4 py-2.5"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Số lượng khách
                </label>

                <input
                  type="number"
                  min={1}
                  value={editingBooking.soLuongKhach}
                  onChange={(event) =>
                    setEditingBooking({
                      ...editingBooking,
                      soLuongKhach: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-line px-4 py-2.5"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Người đặt
                </label>

                <input
                  type="text"
                  value={getUserName(editingBooking.maNguoiDung)}
                  disabled
                  className="w-full rounded-xl border border-line bg-slate-100 px-4 py-2.5 text-slate-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                className="rounded-xl border border-line px-5 py-2.5 font-semibold"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleUpdateBooking}
                className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteBookingId !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDeleteBookingId(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl font-bold text-red-600">
                !
              </div>

              <h3 className="mt-4 text-xl font-bold text-slate-950">
                Xác nhận xóa đặt phòng
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Bạn có chắc chắn muốn xóa booking #{deleteBookingId}?
              </p>

              <p className="mt-2 text-sm font-medium text-red-500">
                Hành động này không thể hoàn tác.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteBookingId(null)}
                className="flex-1 rounded-xl border border-line px-4 py-2.5 font-semibold"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleDeleteBooking}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 font-semibold text-white transition hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {messageModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setMessageModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-center">
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl font-bold ${
                  messageModal.type === "success"
                    ? "bg-green-100 text-green-600"
                    : messageModal.type === "error"
                      ? "bg-red-100 text-red-600"
                      : "bg-yellow-100 text-yellow-600"
                }`}
              >
                {messageModal.type === "success" ? "✓" : "!"}
              </div>

              <h3 className="mt-4 text-xl font-bold text-slate-950">
                {messageModal.title}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {messageModal.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMessageModal(null)}
              className={`mt-6 w-full rounded-xl px-4 py-2.5 font-semibold text-white transition ${
                messageModal.type === "success"
                  ? "bg-green-600 hover:bg-green-700"
                  : messageModal.type === "error"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#0B246D] hover:bg-blue-900"
              }`}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function SortHeader({
  label,
  icon,
  active,
  onClick,
  center = false,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  center?: boolean;
}) {
  return (
    <th className={`whitespace-nowrap p-3 ${center ? "text-center" : ""}`}>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 transition hover:text-blue-600 ${
          active ? "font-bold text-blue-600" : "font-semibold"
        }`}
      >
        {label}
        {icon}
      </button>
    </th>
  );
}
