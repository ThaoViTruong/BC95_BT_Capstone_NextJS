"use client";

import { useEffect, useMemo, useState } from "react";
import { commentsService } from "@/services/comments.service";
import { roomsService } from "@/services/rooms.service";
import type { Comment } from "@/types/comment";
import type { Room } from "@/types/room";

const PAGE_SIZE = 5;

type AdminComment = Comment & {
  avatar?: string;
  tenNguoiBinhLuan?: string;
  maNguoiBinhLuan?: number;
};

type SortField = "user" | "room" | "date" | null;
type SortDirection = "asc" | "desc";

type Notification = {
  type: "success" | "error";
  title: string;
  message: string;
} | null;

export default function AdminCommentPage() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const [searchInput, setSearchInput] = useState("");
  const [selectedStar, setSelectedStar] = useState("");

  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null);

  const [notification, setNotification] = useState<Notification>(null);

  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError("");

        const roomData = await roomsService.getAll();
        setRooms(roomData);

        const requests = roomData.map(async (room) => {
          try {
            const response = await fetch(
              `https://airbnbnew.cybersoft.edu.vn/api/binh-luan/lay-binh-luan-theo-phong/${room.id}`,
              {
                method: "GET",
                headers: {
                  Accept: "application/json",
                  TokenCybersoft: process.env.NEXT_PUBLIC_CYBERSOFT_TOKEN ?? "",
                },
              },
            );

            if (!response.ok) {
              throw new Error(`HTTP ${response.status} - Phòng ${room.id}`);
            }

            const data = await response.json();

            console.log("ROOM:", room.id);
            console.log("API RESPONSE:", data);
            console.log("CONTENT:", data.content);

            const roomComments = Array.isArray(data.content)
              ? data.content
              : [];

            return roomComments.map(
              (comment: AdminComment): AdminComment => ({
                ...comment,
                maPhong: room.id,
              }),
            );
          } catch (error) {
            console.error(`Lỗi lấy bình luận phòng ${room.id}:`, error);

            return [];
          }
        });

        const commentsByRoom = await Promise.all(requests);

        const allComments: AdminComment[] = commentsByRoom.flat();

        setComments(allComments);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);

        setError("Không thể tải danh sách bình luận.");
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

  function formatDate(dateString?: string) {
    if (!dateString) {
      return "—";
    }

    const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (isoMatch) {
      const [, year, month, day] = isoMatch;

      return `${day}/${month}/${year}`;
    }

    const ddmmyyyyMatch = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})/);

    if (ddmmyyyyMatch) {
      return dateString.slice(0, 10);
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  }

  function handleSort(field: "user" | "room" | "date") {
    setPage(1);

    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));

      return;
    }

    setSortField(field);
    setSortDirection("asc");
  }

  function getSortIcon(field: "user" | "room" | "date") {
    if (sortField !== field) {
      return "↕";
    }

    return sortDirection === "asc" ? "↑" : "↓";
  }

  const filteredComments = useMemo(() => {
    const search = searchInput.trim().toLowerCase();

    const filtered = comments.filter((comment) => {
      const content = comment.noiDung?.toLowerCase() ?? "";

      const userName = comment.tenNguoiBinhLuan?.toLowerCase() ?? "";

      const roomName = getRoomName(comment.maPhong).toLowerCase();

      const matchSearch =
        !search ||
        content.includes(search) ||
        userName.includes(search) ||
        roomName.includes(search);

      const matchStar =
        !selectedStar || comment.saoBinhLuan === Number(selectedStar);

      return matchSearch && matchStar;
    });

    if (!sortField) {
      return filtered;
    }

    return [...filtered].sort((a, b) => {
      if (sortField === "date") {
        const timeA = a.ngayBinhLuan ? new Date(a.ngayBinhLuan).getTime() : 0;

        const timeB = b.ngayBinhLuan ? new Date(b.ngayBinhLuan).getTime() : 0;

        return sortDirection === "asc" ? timeA - timeB : timeB - timeA;
      }

      let valueA = "";
      let valueB = "";

      if (sortField === "user") {
        valueA = a.tenNguoiBinhLuan?.trim() || "Người dùng";
        valueB = b.tenNguoiBinhLuan?.trim() || "Người dùng";
      }

      if (sortField === "room") {
        valueA = getRoomName(a.maPhong);
        valueB = getRoomName(b.maPhong);
      }

      const result = valueA.localeCompare(valueB, "vi", {
        sensitivity: "base",
        numeric: true,
      });

      return sortDirection === "asc" ? result : -result;
    });
  }, [comments, rooms, searchInput, selectedStar, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredComments.length / PAGE_SIZE);

  const displayedComments = filteredComments.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => {
    if (totalPages === 0) {
      if (page !== 1) {
        setPage(1);
      }

      return;
    }

    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  async function handleDeleteComment() {
    if (deleteCommentId === null || deleting) {
      return;
    }

    const commentId = deleteCommentId;

    try {
      setDeleting(true);

      await commentsService.remove(commentId);

      setComments((current) =>
        current.filter((comment) => comment.id !== commentId),
      );

      setDeleteCommentId(null);

      setNotification({
        type: "success",
        title: "Xóa thành công",
        message: "Đánh giá đã được xóa khỏi hệ thống.",
      });
    } catch (error) {
      console.error("Lỗi xóa bình luận:", error);

      setDeleteCommentId(null);

      setNotification({
        type: "error",
        title: "Xóa thất bại",
        message: "Không thể xóa đánh giá. Vui lòng thử lại.",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <section className="rounded-3xl border border-line bg-card p-6 shadow-sm">
        <div>
          <h3 className="text-xl font-bold text-slate-950">
            Danh sách bình luận
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Tổng cộng: {filteredComments.length} bình luận
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(event) => {
                  setSearchInput(event.target.value);
                  setPage(1);
                }}
                placeholder="Tìm theo nội dung, người dùng hoặc phòng..."
                className="h-11 w-full rounded-xl border border-line px-4 pr-10 text-sm outline-none focus:border-slate-400"
              />

              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setPage(1);
                  }}
                  aria-label="Xóa nội dung tìm kiếm"
                  title="Xóa tìm kiếm"
                  className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="h-4 w-4"
                  >
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>

            <select
              value={selectedStar}
              onChange={(event) => {
                setSelectedStar(event.target.value);
                setPage(1);
              }}
              className="h-11 rounded-xl border border-line bg-white px-4 text-sm outline-none"
            >
              <option value="">Tất cả đánh giá</option>

              <option value="5">★ 5 sao</option>
              <option value="4">★ 4 sao</option>
              <option value="3">★ 3 sao</option>
              <option value="2">★ 2 sao</option>
              <option value="1">★ 1 sao</option>
              <option value="0">★ 0 sao</option>
            </select>
          </div>
        </div>

        {loading && (
          <div className="mt-8 flex items-center justify-center gap-3 py-10 text-slate-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />

            <span>Đang tải danh sách...</span>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="mt-6 space-y-3 md:hidden">
              {displayedComments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line bg-white p-6 text-center text-sm text-slate-500">
                  Không có bình luận.
                </div>
              ) : (
                displayedComments.map((comment) => (
                  <article
                    key={`${comment.maPhong}-${comment.id}`}
                    className="rounded-2xl border border-line bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      {comment.avatar ? (
                        <img
                          src={comment.avatar}
                          alt={comment.tenNguoiBinhLuan || "Avatar người dùng"}
                          className="h-11 w-11 shrink-0 rounded-full border border-slate-200 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            className="h-5 w-5"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0"
                            />
                          </svg>
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">
                          {comment.tenNguoiBinhLuan || "Người dùng"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {getRoomName(comment.maPhong)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
                        ★ {comment.saoBinhLuan ?? 0}
                      </span>
                    </div>

                    <div className="mt-4 rounded-2xl bg-slate-50 px-3 py-3">
                      <p className="text-sm leading-6 text-slate-700">
                        {comment.noiDung || "Không có nội dung"}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-500">
                        {formatDate(comment.ngayBinhLuan)}
                      </p>
                      <button
                        type="button"
                        onClick={() => setDeleteCommentId(comment.id)}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                      >
                        Xóa bình luận
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="mt-6 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-line text-sm text-slate-500">
                    <th className="p-3">ID</th>
                    <th className="p-3">
                      <button
                        type="button"
                        onClick={() => handleSort("user")}
                        className="flex items-center gap-2 font-semibold transition hover:text-slate-950"
                      >
                        Người bình luận
                        <span className="text-xs">{getSortIcon("user")}</span>
                      </button>
                    </th>
                    <th className="p-3">
                      <button
                        type="button"
                        onClick={() => handleSort("room")}
                        className="flex items-center gap-2 font-semibold transition hover:text-slate-950"
                      >
                        Phòng
                        <span className="text-xs">{getSortIcon("room")}</span>
                      </button>
                    </th>

                    <th className="p-3">Nội dung</th>

                    <th className="p-3">Sao</th>

                    <th className="p-3">
                      <button
                        type="button"
                        onClick={() => handleSort("date")}
                        className="flex items-center gap-2 font-semibold transition hover:text-slate-950"
                      >
                        Ngày
                        <span className="text-xs">{getSortIcon("date")}</span>
                      </button>
                    </th>

                    <th className="p-3">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedComments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-10 text-center text-slate-500"
                      >
                        Không có bình luận.
                      </td>
                    </tr>
                  ) : (
                    displayedComments.map((comment) => (
                      <tr
                        key={`${comment.maPhong}-${comment.id}`}
                        className="border-b border-line text-sm transition hover:bg-slate-50/60"
                      >
                        <td className="p-3">{comment.id}</td>

                        <td className="p-3">
                          <div className="flex min-w-44 items-center gap-3">
                            {comment.avatar ? (
                              <img
                                src={comment.avatar}
                                alt={
                                  comment.tenNguoiBinhLuan ||
                                  "Avatar người dùng"
                                }
                                className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.7"
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0"
                                  />
                                </svg>
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="max-w-40 truncate font-medium text-slate-900">
                                {comment.tenNguoiBinhLuan || "Người dùng"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="max-w-56 p-3">
                          <p className="line-clamp-2 font-medium text-slate-700">
                            {getRoomName(comment.maPhong)}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            #{comment.maPhong}
                          </p>
                        </td>

                        <td className="max-w-80 p-3">
                          <p className="line-clamp-3 text-slate-700">
                            {comment.noiDung || "Không có nội dung"}
                          </p>
                        </td>

                        <td className="p-3">
                          <span className="whitespace-nowrap font-medium text-amber-500">
                            ★ {comment.saoBinhLuan ?? 0}
                          </span>
                        </td>
                        <td className="whitespace-nowrap p-3 text-slate-600">
                          {formatDate(comment.ngayBinhLuan)}
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => setDeleteCommentId(comment.id)}
                            className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 0 && (
              <div className="mt-6 flex items-center justify-between gap-4">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="rounded-xl border border-line px-4 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Trang trước
                </button>

                <span className="whitespace-nowrap text-sm text-slate-600">
                  Trang <strong>{page}</strong> / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  className="rounded-xl border border-line px-4 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Trang sau →
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {deleteCommentId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"
          onClick={() => {
            if (!deleting) {
              setDeleteCommentId(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-comment-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl font-bold text-red-600">
                !
              </div>

              <h3
                id="delete-comment-title"
                className="mt-4 text-xl font-bold text-slate-950"
              >
                Xóa đánh giá?
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Đánh giá sẽ bị xóa khỏi hệ thống.
              </p>

              <p className="mt-2 text-sm font-medium text-red-500">
                Hành động này không thể hoàn tác.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteCommentId(null)}
                className="flex-1 rounded-xl border border-line px-4 py-2.5 font-semibold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteComment}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Đang xóa..." : "Xóa đánh giá"}
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"
          onClick={() => setNotification(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-center">
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold ${
                  notification.type === "success"
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {notification.type === "success" ? "✓" : "!"}
              </div>

              <h3 className="mt-4 text-xl font-bold text-slate-950">
                {notification.title}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {notification.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setNotification(null)}
              className={`mt-6 w-full rounded-xl px-4 py-2.5 font-semibold text-white transition ${
                notification.type === "success"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
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
