"use client";

import { useEffect, useState } from "react";
import { locationsService } from "@/services/locations.service";
import type { Location } from "@/types/location";

const PAGE_SIZE = 5;

const initialCreateForm = {
  id: 0,
  tenViTri: "",
  tinhThanh: "",
  quocGia: "",
};

export default function AdminLocationPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [page, setPage] = useState(1);
  const [totalRow, setTotalRow] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<Location[] | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [deleteLocationId, setDeleteLocationId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
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

  useEffect(() => {
    async function fetchLocations() {
      try {
        setLoading(true);
        setError("");

        const result = await locationsService.getPaging({
          pageIndex: page,
          pageSize: PAGE_SIZE,
        });

        setLocations(result.data);
        setTotalRow(result.totalRow);
      } catch (error) {
        console.error("Lỗi lấy địa điểm:", error);
        setError("Không thể tải danh sách địa điểm.");
      } finally {
        setLoading(false);
      }
    }

    if (searchResults === null) {
      fetchLocations();
    }
  }, [page, refreshKey, searchResults]);

  async function handleSearch(keyword: string) {
    const search = keyword.trim().toLowerCase();

    if (!search) {
      setSearchResults(null);
      setPage(1);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const allLocations = await locationsService.getAll();

      const filteredLocations = allLocations.filter((location) => {
        const tenViTri = location.tenViTri?.toLowerCase() ?? "";
        const tinhThanh = location.tinhThanh?.toLowerCase() ?? "";
        const quocGia = location.quocGia?.toLowerCase() ?? "";

        return (
          tenViTri.includes(search) ||
          tinhThanh.includes(search) ||
          quocGia.includes(search)
        );
      });

      setSearchResults(filteredLocations);
      setPage(1);
    } catch (error) {
      console.error("Lỗi tìm kiếm địa điểm:", error);

      setError("Không thể tìm kiếm địa điểm.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchInput);
    }, 600);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const isSearching = searchResults !== null;

  const normalTotalPages = Math.ceil(totalRow / PAGE_SIZE);

  const searchTotalPages = searchResults
    ? Math.ceil(searchResults.length / PAGE_SIZE)
    : 0;

  const totalPages = isSearching ? searchTotalPages : normalTotalPages;

  const displayedLocations = searchResults
    ? searchResults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : locations;

  const displayedTotal =
    searchResults !== null ? searchResults.length : totalRow;

  async function handleCreateLocation() {
    if (
      !createForm.tenViTri.trim() ||
      !createForm.tinhThanh.trim() ||
      !createForm.quocGia.trim()
    ) {
      showNotification(
        "error",
        "Thiếu thông tin",
        "Vui lòng nhập đầy đủ thông tin địa điểm.",
      );

      return;
    }

    try {
      const newLocation = await locationsService.create(createForm);

      if (selectedImage) {
        await locationsService.uploadImage(newLocation.id, selectedImage);
      }

      showNotification(
        "success",
        "Thêm thành công",
        "Địa điểm mới đã được thêm.",
      );

      setShowCreateForm(false);

      setCreateForm(initialCreateForm);

      setSelectedImage(null);

      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }

      setImagePreview("");

      setSearchInput("");
      setSearchResults(null);
      setPage(1);

      setRefreshKey((current) => current + 1);
    } catch (error) {
      console.error("Lỗi thêm địa điểm:", error);

      showNotification("error", "Thêm thất bại", "Không thể thêm địa điểm.");
    }
  }

  function handleOpenEdit(location: Location) {
    setEditingLocation({
      ...location,
    });

    setEditImage(null);

    setEditImagePreview(location.hinhAnh ?? "");
  }

  async function handleUpdateLocation() {
    if (!editingLocation) return;

    if (
      !editingLocation.tenViTri?.trim() ||
      !editingLocation.tinhThanh?.trim() ||
      !editingLocation.quocGia?.trim()
    ) {
      showNotification(
        "error",
        "Thiếu thông tin",
        "Vui lòng nhập đầy đủ thông tin địa điểm.",
      );

      return;
    }

    try {
      await locationsService.update(editingLocation.id, {
        id: editingLocation.id,
        tenViTri: editingLocation.tenViTri,
        tinhThanh: editingLocation.tinhThanh,
        quocGia: editingLocation.quocGia,
      });

      if (editImage) {
        await locationsService.uploadImage(editingLocation.id, editImage);
      }

      showNotification(
        "success",
        "Cập nhật thành công",
        "Thông tin địa điểm đã được cập nhật.",
      );

      setEditingLocation(null);
      setEditImage(null);
      setEditImagePreview("");

      if (searchResults !== null) {
        await handleSearch(searchInput);
      } else {
        setRefreshKey((current) => current + 1);
      }
    } catch (error) {
      console.error("Lỗi cập nhật địa điểm:", error);

      showNotification(
        "error",
        "Cập nhật thất bại",
        "Không thể cập nhật địa điểm.",
      );
    }
  }

  function handleDeleteLocation(id: number) {
    setDeleteLocationId(id);
  }

  async function confirmDeleteLocation() {
  if (deleteLocationId === null) return;

  try {
    await locationsService.remove(deleteLocationId);

    if (searchResults !== null) {
      setSearchResults((current) =>
        current ? current.filter((loc) => loc.id !== deleteLocationId) : null,
      );
    } else {
      setRefreshKey((current) => current + 1);
    }

    setDeleteLocationId(null);
    showNotification("success", "Xóa thành công", "Địa điểm đã được xóa.");
  } catch (error: any) {
    console.error("Lỗi xóa địa điểm:", error);
    setDeleteLocationId(null);

    const serverMessage =
      error?.response?.data?.content || "Không thể xóa địa điểm này.";

    showNotification("error", "Xóa thất bại", serverMessage);
  }
}

  return (
    <>
      <section className="rounded-3xl border border-line bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-950">
              Danh sách địa điểm
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Trang <span className="font-semibold text-slate-950">{page}</span>{" "}
              / {totalPages || 1}
              {" - "}
              Tổng{" "}
              <span className="font-semibold text-slate-950">
                {displayedTotal}
              </span>{" "}
              địa điểm
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm tên vị trí, tỉnh thành..."
                className="h-11 w-full rounded-xl border border-line bg-white px-4 pr-10 text-sm outline-none sm:w-80"
              />

              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSearchResults(null);
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="h-11 whitespace-nowrap rounded-xl bg-[#0B246D] px-5 text-sm font-semibold text-white"
            >
              + Thêm địa điểm
            </button>
          </div>
        </div>

        {loading && (
          <p className="mt-8 text-slate-500">Đang tải danh sách...</p>
        )}

        {error && <p className="mt-8 text-red-500">{error}</p>}

        {!loading && !error && (
          <>
            <div className="mt-8 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-line text-sm text-slate-500">
                    <th className="p-3">ID</th>

                    <th className="p-3">Hình ảnh</th>

                    <th className="p-3">Tên vị trí</th>

                    <th className="p-3">Tỉnh thành</th>

                    <th className="p-3">Quốc gia</th>

                    <th className="p-3">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedLocations.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-slate-500"
                      >
                        Không tìm thấy địa điểm phù hợp.
                      </td>
                    </tr>
                  ) : (
                    displayedLocations.map((location) => (
                      <tr
                        key={location.id}
                        className="border-b border-line text-sm"
                      >
                        <td className="p-3">{location.id}</td>

                        <td className="p-3">
                          {location.hinhAnh ? (
                            <img
                              src={location.hinhAnh}
                              alt={location.tenViTri}
                              className="h-14 w-20 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-20 items-center justify-center rounded-lg bg-slate-100 text-center text-xs text-slate-400">
                              Chưa có ảnh
                            </div>
                          )}
                        </td>

                        <td className="p-3 font-semibold text-slate-900">
                          {location.tenViTri}
                        </td>

                        <td className="p-3">{location.tinhThanh}</td>

                        <td className="p-3">{location.quocGia}</td>

                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(location)}
                              className="rounded-lg bg-blue-50 px-3 py-1.5 text-blue-600 hover:bg-blue-100"
                              title="Sửa"
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
                              onClick={() => handleDeleteLocation(location.id)}
                              className="rounded-lg bg-red-50 px-3 py-1.5 text-red-600 hover:bg-red-100"
                              title="Xóa"
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

      {showCreateForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowCreateForm(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">
                Thêm địa điểm
              </h3>

              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="text-xl text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Hình ảnh
                </label>

                <label className="flex h-20 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-slate-300">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl text-slate-400">+</span>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (!file) return;

                      setSelectedImage(file);

                      setImagePreview(URL.createObjectURL(file));
                    }}
                  />
                </label>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Tên vị trí <span className="text-red-500">*</span>
                </label>

                <input
                  value={createForm.tenViTri}
                  onChange={(event) =>
                    setCreateForm({
                      ...createForm,
                      tenViTri: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-line px-4 py-2.5"
                  placeholder="Nhập tên vị trí"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Tỉnh thành <span className="text-red-500">*</span>
                </label>

                <input
                  value={createForm.tinhThanh}
                  onChange={(event) =>
                    setCreateForm({
                      ...createForm,
                      tinhThanh: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-line px-4 py-2.5"
                  placeholder="Nhập tỉnh thành"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Quốc gia <span className="text-red-500">*</span>
                </label>

                <input
                  value={createForm.quocGia}
                  onChange={(event) =>
                    setCreateForm({
                      ...createForm,
                      quocGia: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-line px-4 py-2.5"
                  placeholder="Nhập quốc gia"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-xl border border-line px-5 py-2.5 font-semibold"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleCreateLocation}
                className="rounded-xl bg-slate-950 px-5 py-2.5 font-semibold text-white"
              >
                Thêm địa điểm
              </button>
            </div>
          </div>
        </div>
      )}

      {editingLocation && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setEditingLocation(null)}
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-950">
                  Sửa địa điểm
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  ID địa điểm: #{editingLocation.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingLocation(null)}
                className="text-xl text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Hình ảnh
                </label>

                <label className="flex h-24 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-slate-300">
                  {editImagePreview ? (
                    <img
                      src={editImagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm text-slate-400">Chọn ảnh</span>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (!file) return;

                      setEditImage(file);

                      setEditImagePreview(URL.createObjectURL(file));
                    }}
                  />
                </label>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Tên vị trí <span className="text-red-500">*</span>
                </label>

                <input
                  value={editingLocation.tenViTri ?? ""}
                  onChange={(event) =>
                    setEditingLocation({
                      ...editingLocation,
                      tenViTri: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Tỉnh thành <span className="text-red-500">*</span>
                </label>

                <input
                  value={editingLocation.tinhThanh ?? ""}
                  onChange={(event) =>
                    setEditingLocation({
                      ...editingLocation,
                      tinhThanh: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Quốc gia <span className="text-red-500">*</span>
                </label>

                <input
                  value={editingLocation.quocGia ?? ""}
                  onChange={(event) =>
                    setEditingLocation({
                      ...editingLocation,
                      quocGia: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={() => setEditingLocation(null)}
                className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleUpdateLocation}
                className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteLocationId !== null && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDeleteLocationId(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl font-bold text-red-600">
                !
              </div>

              <h3 className="mt-4 text-xl font-bold text-slate-900">
                Xác nhận xóa
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Bạn có chắc chắn muốn xóa địa điểm này không?
              </p>

              <p className="mt-2 text-sm font-medium text-red-500">
                Hành động này không thể hoàn tác.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteLocationId(null)}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={confirmDeleteLocation}
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
          className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/50 p-4"
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
