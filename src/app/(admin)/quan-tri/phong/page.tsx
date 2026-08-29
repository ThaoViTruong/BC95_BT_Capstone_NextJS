"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { roomsService } from "@/services/rooms.service";
import { locationsService } from "@/services/locations.service";
import { getRoomImageSrc } from "@/lib/room-image";
import type { Room, RoomPayload } from "@/types/room";
import type { Location } from "@/types/location";
import Link from "next/link";

const PAGE_SIZE = 5;

const initialRoomForm: RoomPayload = {
  tenPhong: "",
  khach: 1,
  phongNgu: 1,
  giuong: 1,
  phongTam: 1,
  moTa: "",
  giaTien: 0,
  mayGiat: false,
  banLa: false,
  tivi: false,
  dieuHoa: false,
  wifi: false,
  bep: false,
  doXe: false,
  hoBoi: false,
  banUi: false,
  hinhAnh: "",
  maViTri: 0,
};

export default function AdminRoomPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [searchResults, setSearchResults] = useState<Room[] | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [deleteRoomId, setDeleteRoomId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<RoomPayload>(initialRoomForm);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [page, setPage] = useState(1);
  const [totalRow, setTotalRow] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<{
    show: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    show: false,
    type: "success",
    title: "",
    message: "",
  });

  function showNotification(
    type: "success" | "error",
    title: string,
    message: string,
  ) {
    setNotification({
      show: true,
      type,
      title,
      message,
    });
  }

  function closeNotification() {
    setNotification((current) => ({
      ...current,
      show: false,
    }));
  }

  function getApiErrorMessage(error: unknown, fallback: string) {
    if (typeof error !== "object" || error === null) {
      return fallback;
    }

    const response = (error as { response?: { data?: Record<string, unknown> } })
      .response;
    const content = response?.data?.content;
    const message = response?.data?.message;

    if (typeof content === "string" && content.trim()) {
      return content;
    }

    if (typeof message === "string" && message.trim()) {
      return message;
    }

    return fallback;
  }

  useEffect(() => {
    async function fetchLocations() {
      try {
        const data = await locationsService.getAll();

        setLocations(data);
      } catch (error) {
        console.error("Lỗi lấy địa điểm:", error);
      }
    }

    fetchLocations();
  }, []);

  useEffect(() => {
    async function fetchRooms() {
      try {
        setLoading(true);
        setError("");

        const result = await roomsService.getPaging({
          pageIndex: page,
          pageSize: PAGE_SIZE,
        });

        setRooms(result.data);
        setTotalRow(result.totalRow);
      } catch (error) {
        console.error("Lỗi lấy phòng:", error);

        setError("Không thể tải danh sách phòng.");
      } finally {
        setLoading(false);
      }
    }

    if (searchResults === null) {
      fetchRooms();
    }
  }, [page, searchResults, refreshKey]);

  function getLocationName(maViTri: number) {
    const location = locations.find((item) => item.id === maViTri);

    if (!location) {
      return `#${maViTri}`;
    }

    return `${location.tenViTri}, ${location.tinhThanh}`;
  }

  const isFiltering = searchResults !== null;

  const normalTotalPages = Math.ceil(totalRow / PAGE_SIZE);

  const filterTotalPages = searchResults
    ? Math.ceil(searchResults.length / PAGE_SIZE)
    : 0;

  const totalPages = isFiltering ? filterTotalPages : normalTotalPages;

  const displayedRooms = searchResults
    ? searchResults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : rooms;

  const displayedTotal =
    searchResults !== null ? searchResults.length : totalRow;

  const handleFilter = useCallback(async () => {
    const search = searchInput.trim().toLowerCase();

    if (!search && !selectedLocation) {
      setSearchResults(null);
      setPage(1);
      return;
    }
    try {
      setLoading(true);
      setError("");

      let data: Room[];
      if (selectedLocation) {
        data = await roomsService.getByLocation(Number(selectedLocation));
      } else {
        data = await roomsService.getAll();
      }

      const filtered = search
        ? data.filter((room) => room.tenPhong?.toLowerCase().includes(search))
        : data;

      setSearchResults(filtered);
      setPage(1);
    } catch (error) {
      console.error("Lỗi tìm kiếm phòng:", error);
      setError("Không thể tìm kiếm phòng.");
    } finally {
      setLoading(false);
    }
  }, [searchInput, selectedLocation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleFilter();
    }, 500);

    return () => clearTimeout(timer);
  }, [handleFilter]);

  async function handleCreateRoom() {
    if (
      !createForm.tenPhong.trim() ||
      !createForm.moTa.trim() ||
      createForm.giaTien <= 0 ||
      createForm.maViTri <= 0
    ) {
      showNotification(
        "error",
        "Thiếu thông tin",
        "Vui lòng nhập đầy đủ thông tin phòng.",
      );

      return;
    }

    try {
      const newRoom = await roomsService.create({
        ...createForm,
        hinhAnh: "",
      });

      if (selectedImage) {
        await roomsService.uploadImage(newRoom.id, selectedImage);
      }

      setShowCreateForm(false);
      setCreateForm(initialRoomForm);
      setSelectedImage(null);

      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }

      setImagePreview("");
      setSearchInput("");
      setSelectedLocation("");
      setSearchResults(null);
      setPage(1);

      setRefreshKey((current) => current + 1);

      showNotification("success", "Thêm thành công", "Phòng mới đã được thêm.");
    } catch (error) {
      console.error("Lỗi thêm phòng:", error);

      showNotification("error", "Thêm thất bại", "Không thể thêm phòng.");
    }
  }

  function handleOpenEdit(room: Room) {
    setShowCreateForm(false);

    setEditingRoom({
      ...room,
    });

    setEditImage(null);
    setEditImagePreview(getRoomImageSrc(room.hinhAnh));
  }

  async function handleUpdateRoom() {
    if (!editingRoom) {
      return;
    }

    if (
      !editingRoom.tenPhong.trim() ||
      !editingRoom.moTa.trim() ||
      editingRoom.giaTien <= 0 ||
      editingRoom.maViTri <= 0
    ) {
      showNotification(
        "error",
        "Thiếu thông tin",
        "Vui lòng nhập đầy đủ thông tin phòng.",
      );

      return;
    }

    try {
      await roomsService.update(editingRoom.id, {
        tenPhong: editingRoom.tenPhong,
        khach: editingRoom.khach,
        phongNgu: editingRoom.phongNgu,
        giuong: editingRoom.giuong,
        phongTam: editingRoom.phongTam,
        moTa: editingRoom.moTa,
        giaTien: editingRoom.giaTien,
        mayGiat: editingRoom.mayGiat,
        banLa: editingRoom.banLa,
        tivi: editingRoom.tivi,
        dieuHoa: editingRoom.dieuHoa,
        wifi: editingRoom.wifi,
        bep: editingRoom.bep,
        doXe: editingRoom.doXe,
        hoBoi: editingRoom.hoBoi,
        banUi: editingRoom.banUi,
        hinhAnh: editingRoom.hinhAnh,
        maViTri: editingRoom.maViTri,
      });

      if (editImage) {
        await roomsService.uploadImage(editingRoom.id, editImage);
      }

      setEditingRoom(null);
      setEditImage(null);
      setEditImagePreview("");

      if (searchResults !== null) {
        await handleFilter();
      } else {
        setRefreshKey((current) => current + 1);
      }

      showNotification(
        "success",
        "Cập nhật thành công",
        "Thông tin phòng đã được cập nhật.",
      );
    } catch (error) {
      console.error("Lỗi cập nhật phòng:", error);

      showNotification(
        "error",
        "Cập nhật thất bại",
        "Không thể cập nhật phòng.",
      );
    }
  }

  async function confirmDeleteRoom() {
    if (deleteRoomId === null) {
      return;
    }

    try {
      await roomsService.remove(deleteRoomId);

      if (searchResults !== null) {
        setSearchResults((current) =>
          current ? current.filter((room) => room.id !== deleteRoomId) : null,
        );
      } else {
        setRefreshKey((current) => current + 1);
      }

      setDeleteRoomId(null);

      showNotification("success", "Xóa thành công", "Phòng đã được xóa.");
    } catch (error: unknown) {
      console.error("Lỗi xóa phòng:", error);

      setDeleteRoomId(null);

      const serverMessage = getApiErrorMessage(
        error,
        "Không thể xóa phòng này.",
      );

      showNotification("error", "Xóa thất bại", serverMessage);
    }
  }

  return (
    <>
      <section className="rounded-3xl border border-line bg-card p-6 shadow-sm">
        <div>
          <h3 className="text-xl font-bold text-slate-950">Danh sách phòng</h3>

          <p className="mt-1 text-sm text-slate-500">
            Tổng cộng: {displayedTotal} phòng
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm theo tên phòng..."
                className="h-11 w-full rounded-xl border border-line px-4 pr-10 text-sm outline-none"
              />

              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
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
              value={selectedLocation}
              onChange={(event) => setSelectedLocation(event.target.value)}
              className="h-11 rounded-xl border border-line bg-white px-4 text-sm"
            >
              <option value="">Tất cả địa điểm</option>

              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.tenViTri} - {location.tinhThanh}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="h-11 whitespace-nowrap rounded-xl bg-[#0B246D] px-5 text-sm font-semibold text-white sm:w-auto"
            >
              + Thêm phòng
            </button>
          </div>
        </div>

        {loading && (
          <p className="mt-6 text-slate-500">Đang tải danh sách...</p>
        )}

        {error && <p className="mt-6 text-red-500">{error}</p>}

        {!loading && !error && (
          <>
            <div className="mt-6 space-y-3 md:hidden">
              {displayedRooms.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line bg-white p-6 text-center text-sm text-slate-500">
                  Không có phòng.
                </div>
              ) : (
                displayedRooms.map((room) => (
                  <article
                    key={room.id}
                    className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm"
                  >
                    <div className="relative aspect-[16/10] bg-slate-100">
                      {room.hinhAnh ? (
                        <Image
                          src={getRoomImageSrc(room.hinhAnh)}
                          alt={room.tenPhong}
                          fill
                          sizes="(max-width: 767px) 100vw, 0px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                          Chưa có ảnh
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Phòng #{room.id}
                          </p>
                          <Link
                            href={`/phong/${room.id}`}
                            className="mt-2 block text-base font-semibold text-slate-950"
                          >
                            {room.tenPhong}
                          </Link>
                          <p className="mt-1 text-sm text-slate-500">
                            {getLocationName(room.maViTri)}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {room.giaTien.toLocaleString("vi-VN")} ₫
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="rounded-full bg-slate-50 px-3 py-1.5">{room.khach} khách</span>
                        <span className="rounded-full bg-slate-50 px-3 py-1.5">{room.phongNgu} phòng ngủ</span>
                        <span className="rounded-full bg-slate-50 px-3 py-1.5">{room.giuong} giường</span>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(room)}
                          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-100"
                        >
                          Sửa phòng
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteRoomId(room.id)}
                          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100"
                        >
                          Xóa phòng
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="mt-6 hidden overflow-x-auto md:block">
              <table className="min-w-[860px] w-full text-left lg:min-w-[980px]">
                <thead>
                  <tr className="border-b border-line text-sm text-slate-500">
                    <th className="p-3">ID</th>
                    <th className="p-3">Hình ảnh</th>
                    <th className="p-3">Tên phòng</th>
                    <th className="p-3">Địa điểm</th>
                    <th className="p-3">Khách</th>
                    <th className="whitespace-nowrap p-3">Phòng ngủ</th>
                    <th className="whitespace-nowrap p-3">Giường</th>
                    <th className="whitespace-nowrap p-3">Giá</th>
                    <th className="p-3">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedRooms.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="p-8 text-center text-slate-500"
                      >
                        Không có phòng.
                      </td>
                    </tr>
                  ) : (
                    displayedRooms.map((room) => (
                      <tr
                        key={room.id}
                        className="border-b border-line text-sm"
                      >
                        <td className="p-3">{room.id}</td>
                        <td className="p-3">
                          <Link
                            href={`/phong/${room.id}`}
                            className="inline-block"
                            aria-label={`Xem phòng ${room.tenPhong}`}
                          >
                            {room.hinhAnh ? (
                              <Image
                                src={getRoomImageSrc(room.hinhAnh)}
                                alt={room.tenPhong}
                                width={80}
                                height={56}
                                sizes="80px"
                                className="h-14 w-20 cursor-pointer rounded-lg object-cover transition hover:opacity-80"
                              />
                            ) : (
                              <div className="flex h-14 w-20 cursor-pointer items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400 transition hover:bg-slate-200">
                                Chưa có ảnh
                              </div>
                            )}
                          </Link>
                        </td>

                        <td className="max-w-72 p-3 font-semibold text-slate-900">
                          <Link
                            href={`/phong/${room.id}`}
                            className="line-clamp-2 cursor-pointer hover:underline"
                            aria-label={`Xem chi tiết phòng ${room.tenPhong}`}
                          >
                            {room.tenPhong}
                          </Link>
                        </td>

                        <td className="p-3">{getLocationName(room.maViTri)}</td>

                        <td className="p-3">{room.khach}</td>

                        <td className="whitespace-nowrap p-3">
                          {room.phongNgu}
                        </td>

                        <td className="whitespace-nowrap p-3">{room.giuong}</td>

                        <td className="whitespace-nowrap p-3 font-semibold">
                          {room.giaTien.toLocaleString("vi-VN")} ₫
                        </td>

                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(room)}
                              aria-label={`Sửa phòng ${room.tenPhong}`}
                              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-100"
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

                                <path
                                  d="M13 7l4 4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteRoomId(room.id)}
                              aria-label={`Xóa phòng ${room.tenPhong}`}
                              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-100"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path d="M4 7h16" strokeLinecap="round" />

                                <path d="M10 11v6" strokeLinecap="round" />

                                <path d="M14 11v6" strokeLinecap="round" />

                                <path
                                  d="M6 7l1 12h10l1-12"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />

                                <path
                                  d="M9 7V4h6v3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
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
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-xl border border-line px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Trang trước
                </button>

                <span className="text-center text-sm text-slate-600">
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
      {showCreateForm && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"
          onClick={() => setShowCreateForm(false)}
        >
          <div
            className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-950">Thêm phòng</h3>

                <p className="mt-1 text-sm text-slate-500">
                  Nhập thông tin phòng mới.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="text-xl text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="mt-6">
              <h4 className="font-bold text-slate-900">Thông tin cơ bản</h4>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold">
                    Tên phòng
                    <span className="text-red-500"> *</span>
                  </label>

                  <input
                    type="text"
                    value={createForm.tenPhong}
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        tenPhong: event.target.value,
                      })
                    }
                    placeholder="Nhập tên phòng"
                    className="w-full rounded-xl border border-line px-4 py-2.5"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Địa điểm
                    <span className="text-red-500"> *</span>
                  </label>

                  <select
                    value={createForm.maViTri}
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        maViTri: Number(event.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-line bg-white px-4 py-2.5"
                  >
                    <option value={0}>-- Chọn địa điểm --</option>

                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.tenViTri} - {location.tinhThanh}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Giá tiền
                    <span className="text-red-500"> *</span>
                  </label>

                  <input
                    type="number"
                    min={0}
                    value={createForm.giaTien}
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        giaTien: Number(event.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-line px-4 py-2.5"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold">
                    Mô tả
                    <span className="text-red-500"> *</span>
                  </label>

                  <textarea
                    value={createForm.moTa}
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        moTa: event.target.value,
                      })
                    }
                    rows={4}
                    placeholder="Nhập mô tả phòng"
                    className="w-full resize-none rounded-xl border border-line px-4 py-2.5"
                  />
                </div>
              </div>
            </div>

            <div className="mt-7 border-t border-line pt-6">
              <h4 className="font-bold text-slate-900">Sức chứa</h4>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Khách
                  </label>

                  <input
                    type="number"
                    min={1}
                    value={createForm.khach}
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        khach: Number(event.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-line px-4 py-2.5"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold whitespace-nowrap">
                    Phòng ngủ
                  </label>

                  <input
                    type="number"
                    min={0}
                    value={createForm.phongNgu}
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        phongNgu: Number(event.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-line px-4 py-2.5"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Giường
                  </label>

                  <input
                    type="number"
                    min={0}
                    value={createForm.giuong}
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        giuong: Number(event.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-line px-4 py-2.5"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Phòng tắm
                  </label>

                  <input
                    type="number"
                    min={0}
                    value={createForm.phongTam}
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        phongTam: Number(event.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-line px-4 py-2.5"
                  />
                </div>
              </div>
            </div>

            <div className="mt-7 border-t border-line pt-6">
              <h4 className="font-bold text-slate-900">Tiện nghi</h4>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {[
                  ["mayGiat", "Máy giặt"],
                  ["banLa", "Bàn là"],
                  ["tivi", "Tivi"],
                  ["dieuHoa", "Điều hòa"],
                  ["wifi", "Wifi"],
                  ["bep", "Bếp"],
                  ["doXe", "Đỗ xe"],
                  ["hoBoi", "Hồ bơi"],
                  ["banUi", "Bàn ủi"],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3"
                  >
                    <input
                      type="checkbox"
                      checked={createForm[key as keyof RoomPayload] === true}
                      onChange={(event) =>
                        setCreateForm({
                          ...createForm,
                          [key]: event.target.checked,
                        })
                      }
                    />

                    <span className="text-sm font-medium">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-7 border-t border-line pt-6">
              <h4 className="font-bold text-slate-900">Hình ảnh</h4>

              <div className="mt-4">
                <label className="relative flex h-32 w-full max-w-48 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      unoptimized
                      sizes="192px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-sm text-slate-500">+ Chọn ảnh</span>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (!file) {
                        return;
                      }

                      setSelectedImage(file);

                      if (imagePreview) {
                        URL.revokeObjectURL(imagePreview);
                      }

                      setImagePreview(URL.createObjectURL(file));
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-xl border border-line px-5 py-2.5 font-semibold"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleCreateRoom}
                className="rounded-xl bg-slate-950 px-5 py-2.5 font-semibold text-white"
              >
                Thêm phòng
              </button>
            </div>
          </div>
        </div>
      )}

      {editingRoom && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Sửa phòng #{editingRoom.id}</h3>

              <button
                type="button"
                onClick={() => setEditingRoom(null)}
                className="text-xl text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="border-t border-line pt-4">
                <h4 className="mb-4 font-bold text-slate-900">Hình ảnh</h4>

                <label className="relative flex h-32 w-full max-w-48 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
                  {editImagePreview ? (
                    <Image
                      src={editImagePreview}
                      alt="Ảnh phòng"
                      fill
                      unoptimized
                      sizes="192px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-sm text-slate-500">+ Chọn ảnh</span>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (!file) return;

                      setEditImage(file);

                      if (editImagePreview.startsWith("blob:")) {
                        URL.revokeObjectURL(editImagePreview);
                      }

                      setEditImagePreview(URL.createObjectURL(file));
                    }}
                  />
                </label>

                <p className="mt-2 text-xs text-slate-500">
                  Nhấn vào ảnh để chọn ảnh mới.
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Tên phòng
                </label>

                <input
                  type="text"
                  value={editingRoom.tenPhong}
                  onChange={(event) =>
                    setEditingRoom({
                      ...editingRoom,
                      tenPhong: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-line px-4 py-2"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Giá tiền
                </label>

                <input
                  type="number"
                  value={editingRoom.giaTien}
                  onChange={(event) =>
                    setEditingRoom({
                      ...editingRoom,
                      giaTien: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-line px-4 py-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Địa điểm
                </label>

                <select
                  value={editingRoom.maViTri}
                  onChange={(event) =>
                    setEditingRoom({
                      ...editingRoom,
                      maViTri: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-line px-4 py-2"
                >
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.tenViTri} - {location.tinhThanh}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Mô tả
                </label>

                <textarea
                  value={editingRoom.moTa}
                  onChange={(event) =>
                    setEditingRoom({
                      ...editingRoom,
                      moTa: event.target.value,
                    })
                  }
                  rows={4}
                  className="w-full rounded-xl border border-line px-4 py-2"
                />
              </div>

              <div className="border-t border-line pt-4">
                <h4 className="mb-4 font-bold text-slate-900">Sức chứa</h4>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Khách
                    </label>

                    <input
                      type="number"
                      min={1}
                      value={editingRoom.khach}
                      onChange={(event) =>
                        setEditingRoom({
                          ...editingRoom,
                          khach: Number(event.target.value),
                        })
                      }
                      className="w-full rounded-xl border border-line px-4 py-2"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold whitespace-nowrap">
                      Phòng ngủ
                    </label>

                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={editingRoom.phongNgu}
                      onChange={(event) =>
                        setEditingRoom({
                          ...editingRoom,
                          phongNgu: Number(event.target.value),
                        })
                      }
                      className="w-full rounded-xl border border-line px-4 py-2"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Giường
                    </label>

                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={editingRoom.giuong}
                      onChange={(event) =>
                        setEditingRoom({
                          ...editingRoom,
                          giuong: Number(event.target.value),
                        })
                      }
                      className="w-full rounded-xl border border-line px-4 py-2"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Phòng tắm
                    </label>

                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={editingRoom.phongTam}
                      onChange={(event) =>
                        setEditingRoom({
                          ...editingRoom,
                          phongTam: Number(event.target.value),
                        })
                      }
                      className="w-full rounded-xl border border-line px-4 py-2"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-line pt-4">
                <h4 className="mb-4 font-bold text-slate-900">Tiện nghi</h4>

                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {[
                    ["mayGiat", "Máy giặt"],
                    ["banLa", "Bàn là"],
                    ["tivi", "Tivi"],
                    ["dieuHoa", "Điều hòa"],
                    ["wifi", "Wifi"],
                    ["bep", "Bếp"],
                    ["doXe", "Đỗ xe"],
                    ["hoBoi", "Hồ bơi"],
                    ["banUi", "Bàn ủi"],
                  ].map(([key, label]) => (
                    <label
                      key={key}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3"
                    >
                      <input
                        type="checkbox"
                        checked={editingRoom[key as keyof Room] === true}
                        onChange={(event) =>
                          setEditingRoom({
                            ...editingRoom,
                            [key]: event.target.checked,
                          })
                        }
                      />

                      <span className="text-sm font-medium">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setEditingRoom(null)}
                className="rounded-xl border border-line px-5 py-2"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleUpdateRoom}
                className="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteRoomId !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"
          onClick={() => setDeleteRoomId(null)}
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
                Xác nhận xóa phòng
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Bạn có chắc chắn muốn xóa phòng #{deleteRoomId} không?
              </p>

              <p className="mt-2 text-sm font-medium text-red-500">
                Hành động này không thể hoàn tác.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setDeleteRoomId(null)}
                className="flex-1 rounded-xl border border-line px-4 py-2.5 font-semibold"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={confirmDeleteRoom}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 font-semibold text-white hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {notification.show && (
        <div
          className="fixed inset-0 z-[11000] flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"
          onClick={closeNotification}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-center">
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
                  notification.type === "success"
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {notification.type === "success" ? "✓" : "✕"}
              </div>

              <h3 className="mt-4 text-xl font-bold text-slate-900">
                {notification.title}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {notification.message}
              </p>
            </div>

            <button
              type="button"
              onClick={closeNotification}
              className={`mt-6 w-full rounded-xl px-4 py-2.5 font-semibold text-white ${
                notification.type === "success"
                  ? "bg-green-600 hover:bg-green-700"
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
