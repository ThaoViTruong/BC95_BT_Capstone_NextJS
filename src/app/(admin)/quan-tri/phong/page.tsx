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
      <section className="rounded-3xl border border-line bg-card p-4 shadow-sm sm:p-5 lg:p-6">
        <div>
          <h3 className="text-lg font-bold text-slate-950 sm:text-xl">Danh sách phòng</h3>

          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Tổng cộng: {displayedTotal} phòng
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm theo tên phòng..."
                className="h-10 w-full rounded-xl border border-line px-3.5 pr-9 text-[11px] outline-none sm:h-11 sm:px-4 sm:pr-10 sm:text-sm"
              />

              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  aria-label="Xóa nội dung tìm kiếm"
                  title="Xóa tìm kiếm"
                  className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 sm:right-3 sm:h-6 sm:w-6"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                  >
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex gap-2 sm:gap-3 xl:justify-end">
              <select
                value={selectedLocation}
                onChange={(event) => setSelectedLocation(event.target.value)}
                className="h-10 min-w-0 flex-[1.35] rounded-xl border border-line bg-white px-3 text-[11px] sm:h-11 sm:flex-1 sm:px-4 sm:text-sm xl:max-w-[320px]"
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
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B246D] text-base font-bold text-white sm:h-11 sm:w-auto sm:px-5 sm:text-sm sm:font-semibold"
                aria-label="Thêm phòng"
              >
                <span className="sm:hidden">+</span>
                <span className="hidden sm:inline">+ Thêm phòng</span>
              </button>
            </div>
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
                    className="rounded-[20px] border border-line bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <Link
                        href={`/phong/${room.id}`}
                        className="relative h-[76px] w-[78px] shrink-0 overflow-hidden rounded-[14px] bg-slate-100"
                        aria-label={`Xem phòng ${room.tenPhong}`}
                      >
                        {room.hinhAnh ? (
                          <Image
                            src={getRoomImageSrc(room.hinhAnh)}
                            alt={room.tenPhong}
                            fill
                            sizes="78px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                            Chưa có ảnh
                          </div>
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/phong/${room.id}`}
                          className="block line-clamp-2 text-[11px] font-bold leading-[1.15rem] text-[#0B246D]"
                        >
                          {room.tenPhong}
                        </Link>
                        <p className="mt-1 line-clamp-1 text-[9px] text-slate-500">
                          {getLocationName(room.maViTri)}
                        </p>
                        <p className="mt-1.5 text-[12px] font-extrabold leading-none text-[#0B246D]">
                          {room.giaTien.toLocaleString("vi-VN")} ₫
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-200 pt-2">
                      <div className="flex min-w-0 items-center gap-2.5 text-[9px] font-medium text-slate-700">
                        <span className="inline-flex items-center gap-1 whitespace-nowrap">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-3 w-3 text-[#0B246D]"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
                            <circle cx="9.5" cy="7" r="4" />
                            <path d="M20 8v6" />
                            <path d="M23 11h-6" />
                          </svg>
                          {room.khach}
                        </span>
                        <span className="inline-flex items-center gap-1 whitespace-nowrap">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-3 w-3 text-[#0B246D]"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path d="M3 11v8" />
                            <path d="M21 11v8" />
                            <path d="M3 15h18" />
                            <path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />
                          </svg>
                          {room.phongNgu}
                        </span>
                        <span className="inline-flex items-center gap-1 whitespace-nowrap">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-3 w-3 text-[#0B246D]"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path d="M3 12v7" />
                            <path d="M21 12v7" />
                            <path d="M3 16h18" />
                            <path d="M5 12V9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3" />
                            <path d="M13 12V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3" />
                          </svg>
                          {room.giuong}
                        </span>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(room)}
                          aria-label={`Sửa phòng ${room.tenPhong}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#0B246D] transition hover:bg-blue-50"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-3.5 w-3.5"
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
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-3.5 w-3.5"
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
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="mt-6 hidden md:block">
              <table className="w-full table-fixed text-left">
                <thead>
                  <tr className="border-b border-line text-[11px] text-slate-500 lg:text-sm">
                    <th className="w-[6%] px-2 py-3 lg:px-3">ID</th>
                    <th className="w-[12%] px-2 py-3 lg:px-3">Hình ảnh</th>
                    <th className="w-[24%] px-2 py-3 lg:px-3">Tên phòng</th>
                    <th className="w-[20%] px-2 py-3 lg:px-3">Địa điểm</th>
                    <th className="w-[8%] px-2 py-3 lg:px-3">Khách</th>
                    <th className="w-[10%] whitespace-nowrap px-2 py-3 lg:px-3">Phòng ngủ</th>
                    <th className="w-[8%] whitespace-nowrap px-2 py-3 lg:px-3">Giường</th>
                    <th className="w-[12%] whitespace-nowrap px-2 py-3 lg:px-3">Giá</th>
                    <th className="w-[10%] px-2 py-3 lg:px-3">Thao tác</th>
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
                        <td className="px-2 py-3 text-xs lg:px-3 lg:text-sm">{room.id}</td>
                        <td className="px-2 py-3 lg:px-3">
                          <Link
                            href={`/phong/${room.id}`}
                            className="inline-block"
                            aria-label={`Xem phòng ${room.tenPhong}`}
                          >
                            {room.hinhAnh ? (
                              <Image
                                src={getRoomImageSrc(room.hinhAnh)}
                                alt={room.tenPhong}
                                width={72}
                                height={52}
                                sizes="72px"
                                className="h-12 w-[72px] cursor-pointer rounded-lg object-cover transition hover:opacity-80 lg:h-14 lg:w-20"
                              />
                            ) : (
                              <div className="flex h-12 w-[72px] cursor-pointer items-center justify-center rounded-lg bg-slate-100 text-[10px] text-slate-400 transition hover:bg-slate-200 lg:h-14 lg:w-20 lg:text-xs">
                                Chưa có ảnh
                              </div>
                            )}
                          </Link>
                        </td>

                        <td className="px-2 py-3 font-semibold text-slate-900 lg:px-3">
                          <Link
                            href={`/phong/${room.id}`}
                            className="line-clamp-2 cursor-pointer text-xs hover:underline lg:text-sm"
                            aria-label={`Xem chi tiết phòng ${room.tenPhong}`}
                          >
                            {room.tenPhong}
                          </Link>
                        </td>

                        <td className="px-2 py-3 text-xs text-slate-600 lg:px-3 lg:text-sm">
                          <p className="line-clamp-2">{getLocationName(room.maViTri)}</p>
                        </td>

                        <td className="px-2 py-3 text-xs lg:px-3 lg:text-sm">{room.khach}</td>

                        <td className="whitespace-nowrap px-2 py-3 text-xs lg:px-3 lg:text-sm">
                          {room.phongNgu}
                        </td>

                        <td className="whitespace-nowrap px-2 py-3 text-xs lg:px-3 lg:text-sm">{room.giuong}</td>

                        <td className="whitespace-nowrap px-2 py-3 text-xs font-semibold lg:px-3 lg:text-sm">
                          {room.giaTien.toLocaleString("vi-VN")} ₫
                        </td>

                        <td className="px-2 py-3 lg:px-3">
                          <div className="flex gap-1.5 lg:gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(room)}
                              aria-label={`Sửa phòng ${room.tenPhong}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 lg:h-9 lg:w-9"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                className="h-3.5 w-3.5 lg:h-4 lg:w-4"
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
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 lg:h-9 lg:w-9"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                className="h-3.5 w-3.5 lg:h-4 lg:w-4"
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
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-xl border border-line px-3 py-2 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
                >
                  ← Trang trước
                </button>

                <span className="text-center text-[11px] text-slate-600 sm:text-sm">
                  Trang {page} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-xl border border-line px-3 py-2 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
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
