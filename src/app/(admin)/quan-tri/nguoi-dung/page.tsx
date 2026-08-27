"use client";

import { useEffect, useState } from "react";
import { usersService } from "@/services/users.service";
import type { CreateUserPayload, User } from "@/types/user";

const PAGE_SIZE = 5;

const initialCreateForm: CreateUserPayload = {
  id: 0,
  name: "",
  email: "",
  password: "",
  phone: "",
  birthday: "",
  gender: true,
  role: "USER",
};

function formatBirthday(value?: string | null) {
  if (!value) return "—";

  const ddmmyyyy = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (ddmmyyyy) {
    return value;
  }

  const yyyymmdd = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (yyyymmdd) {
    const [, year, month, day] = yyyymmdd;
    return `${day}/${month}/${year}`;
  }

  return value;
}

function birthdayToInputDate(value?: string | null) {
  if (!value) return "";

  const ddmmyyyy = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month}-${day}`;
  }

  const yyyymmdd = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (yyyymmdd) {
    const [, year, month, day] = yyyymmdd;
    return `${year}-${month}-${day}`;
  }

  return "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPhone(phone: string) {
  return /^0\d{9}$/.test(phone.trim());
}

function isValidBirthday(birthday?: string | null) {
  const value = birthdayToInputDate(birthday);

  if (!value) return false;

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return date <= today;
}

function isValidRole(role?: string | null) {
  return role === "USER" || role === "ADMIN";
}

function getNameError(name?: string | null) {
  if (!name?.trim()) {
    return "Vui lòng nhập họ tên.";
  }

  if (name.trim().length < 2) {
    return "Họ tên phải có ít nhất 2 ký tự.";
  }

  return "";
}

function getEmailError(email?: string | null) {
  if (!email?.trim()) {
    return "Vui lòng nhập email.";
  }

  if (!isValidEmail(email)) {
    return "Email không đúng định dạng. Ví dụ: example@gmail.com";
  }

  return "";
}

function getPasswordError(password?: string | null) {
  if (!password) {
    return "Vui lòng nhập mật khẩu.";
  }

  if (password.length < 6) {
    return "Mật khẩu phải có ít nhất 6 ký tự.";
  }

  return "";
}

function getPhoneError(phone?: string | null) {
  if (!phone?.trim()) {
    return "Vui lòng nhập số điện thoại.";
  }

  if (!isValidPhone(phone)) {
    return "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.";
  }

  return "";
}

function getBirthdayError(birthday?: string | null) {
  if (!birthday) {
    return "Vui lòng chọn ngày sinh.";
  }

  const value = birthdayToInputDate(birthday);

  if (!value) {
    return "Ngày sinh không hợp lệ.";
  }

  const birthDate = new Date(`${value}T00:00:00`);
  const today = new Date();

  if (birthDate > today) {
    return "Ngày sinh không được lớn hơn ngày hiện tại.";
  }

  let age = today.getFullYear() - birthDate.getFullYear();

  const month = today.getMonth() - birthDate.getMonth();

  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 18) {
    return "Người dùng phải đủ 18 tuổi.";
  }

  return "";
}

async function getUserDetail(user: User): Promise<User> {
  try {
    const detail = await usersService.getById(user.id);

    return {
      ...user,
      ...detail,
    };
  } catch (error) {
    console.error(`Không lấy được chi tiết user ${user.id}:`, error);
    return user;
  }
}

export default function AdminUserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: "id" | "name" | "birthday" | "gender" | "role";
    direction: "asc" | "desc";
  } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [protectedAccountPopup, setProtectedAccountPopup] = useState(false);
  const [page, setPage] = useState(1);
  const [totalRow, setTotalRow] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<User[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] =
    useState<CreateUserPayload>(initialCreateForm);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
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

  const [createTouched, setCreateTouched] = useState({
    name: false,
    email: false,
    password: false,
    phone: false,
    birthday: false,
  });

  const [editTouched, setEditTouched] = useState({
    name: false,
    email: false,
    birthday: false,
    phone: false,
  });

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        setError("");

        const result = await usersService.getPaging({
          pageIndex: page,
          pageSize: PAGE_SIZE,
        });

        const usersWithDetail = await Promise.all(
          result.data.map((user) => getUserDetail(user)),
        );

        setUsers(usersWithDetail);
        setTotalRow(result.totalRow);
      } catch (error) {
        console.error("Lỗi lấy users:", error);
        setError("Không thể tải danh sách người dùng.");
      } finally {
        setLoading(false);
      }
    }

    if (searchResults === null) {
      fetchUsers();
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

      const allUsers = await usersService.getAll();

      const filteredUsers = allUsers.filter((user) => {
        const name = user.name?.toLowerCase() ?? "";
        const email = user.email?.toLowerCase() ?? "";
        const phone = user.phone ?? "";

        return (
          name.includes(search) ||
          email.includes(search) ||
          phone.includes(search)
        );
      });

      const usersWithDetail = await Promise.all(
        filteredUsers.map((user) => getUserDetail(user)),
      );

      setSearchResults(usersWithDetail);
      setPage(1);
    } catch (error) {
      console.error("Lỗi tìm kiếm:", error);
      setError("Không thể tìm kiếm người dùng.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const response = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          setCurrentUserId(null);
          return;
        }

        const data = (await response.json()) as {
          user: User | null;
        };

        setCurrentUserId(data.user?.id ?? null);
      } catch (error) {
        console.error("Lỗi lấy tài khoản hiện tại:", error);
        setCurrentUserId(null);
      }
    }

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchInput);
    }, 600);

    return () => clearTimeout(timer);
  }, [searchInput]);

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

  async function handleCreateUser() {
    if (!isCreateFormValid) return;

    try {
      const payload: CreateUserPayload = {
        id: 0,
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        phone: createForm.phone,
        birthday: createForm.birthday,
        gender: createForm.gender,
        role: createForm.role,
      };

      const newUser = await usersService.create(payload);

      setUsers((current) => {
        return [newUser, ...current].slice(0, PAGE_SIZE);
      });

      setTotalRow((current) => current + 1);

      setPage(1);
      setSearchInput("");
      setSearchResults(null);

      setShowCreateForm(false);
      setCreateForm(initialCreateForm);

      setCreateTouched({
        name: false,
        email: false,
        password: false,
        phone: false,
        birthday: false,
      });

      showNotification("success", "Thành công", "Thêm người dùng thành công!");
    } catch (error) {
      console.error("Lỗi thêm người dùng:", error);

      showNotification("error", "Có lỗi xảy ra", "Không thể thêm người dùng.");
    }
  }

  async function handleUpdateUser() {
    if (!editingUser || !isEditFormValid) return;

    try {
      await usersService.update(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email,
        phone: editingUser.phone ?? "",
        birthday: editingUser.birthday,
        gender: editingUser.gender,
        role: editingUser.role,
      });

      showNotification(
        "success",
        "Cập nhật thành công",
        "Thông tin người dùng đã được cập nhật.",
      );

      setEditingUser(null);

      if (searchResults !== null) {
        await handleSearch(searchInput);
      } else {
        setRefreshKey((current) => current + 1);
      }
    } catch (error) {
      console.error("Lỗi cập nhật người dùng:", error);

      showNotification(
        "error",
        "Cập nhật thất bại",
        "Không thể cập nhật người dùng.",
      );
    }
  }

  function handleDeleteUser(id: number) {
    if (id === currentUserId) {
      setProtectedAccountPopup(true);
      return;
    }

    setDeleteUserId(id);
  }

  async function confirmDeleteUser() {
    if (deleteUserId === null) return;

    if (deleteUserId === currentUserId) {
      setDeleteUserId(null);
      setProtectedAccountPopup(true);
      return;
    }

    try {
      await usersService.remove(deleteUserId);

      if (searchResults !== null) {
        setSearchResults((current) =>
          current ? current.filter((user) => user.id !== deleteUserId) : null,
        );
      } else {
        setRefreshKey((current) => current + 1);
      }

      setDeleteUserId(null);

      showNotification(
        "success",
        "Xóa thành công",
        "Người dùng đã được xóa khỏi hệ thống.",
      );
    } catch (error) {
      console.error("Lỗi xóa người dùng:", error);

      setDeleteUserId(null);

      showNotification("error", "Xóa thất bại", "Không thể xóa người dùng.");
    }
  }

  function handleOpenEdit(user: User) {
    if (user.id === currentUserId) {
      setProtectedAccountPopup(true);
      return;
    }

    setEditTouched({
      name: false,
      email: false,
      birthday: false,
      phone: false,
    });

    setEditingUser({ ...user });
  }
  function handleSort(key: "id" | "name" | "birthday" | "gender" | "role") {
    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key,
        direction: "asc",
      };
    });
  }

  const createErrors = {
    name: getNameError(createForm.name),
    email: getEmailError(createForm.email),
    password: getPasswordError(createForm.password),
    phone: getPhoneError(createForm.phone),
    birthday: getBirthdayError(createForm.birthday),
  };

  const isCreateFormValid =
    !createErrors.name &&
    !createErrors.email &&
    !createErrors.password &&
    !createErrors.phone &&
    !createErrors.birthday &&
    typeof createForm.gender === "boolean" &&
    isValidRole(createForm.role);

  const editErrors = {
    name: getNameError(editingUser?.name),
    email: getEmailError(editingUser?.email),
    phone: getPhoneError(editingUser?.phone),
    birthday: getBirthdayError(editingUser?.birthday),
  };

  const isEditFormValid =
    editingUser !== null &&
    !editErrors.name &&
    !editErrors.email &&
    !editErrors.phone &&
    !editErrors.birthday &&
    typeof editingUser.gender === "boolean" &&
    isValidRole(editingUser.role);

  const isSearching = searchResults !== null;

  const normalTotalPages = Math.ceil(totalRow / PAGE_SIZE);

  const searchTotalPages = searchResults
    ? Math.ceil(searchResults.length / PAGE_SIZE)
    : 0;

  const totalPages = isSearching ? searchTotalPages : normalTotalPages;

  const baseDisplayedUsers = searchResults
    ? searchResults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : users;

  const displayedUsers = [...baseDisplayedUsers].sort((a, b) => {
    if (!sortConfig) return 0;

    let result = 0;

    switch (sortConfig.key) {
      case "id":
        result = a.id - b.id;
        break;

      case "name":
        result = (a.name ?? "").localeCompare(b.name ?? "", "vi", {
          sensitivity: "base",
        });
        break;

      case "birthday": {
        const dateA = birthdayToInputDate(a.birthday);
        const dateB = birthdayToInputDate(b.birthday);

        if (!dateA && !dateB) {
          result = 0;
        } else if (!dateA) {
          result = 1;
        } else if (!dateB) {
          result = -1;
        } else {
          result = dateA.localeCompare(dateB);
        }

        break;
      }

      case "gender":
        result = Number(a.gender) - Number(b.gender);
        break;

      case "role":
        result = (a.role ?? "").localeCompare(b.role ?? "");
        break;
    }

    return sortConfig.direction === "asc" ? result : -result;
  });

  const displayedTotal = searchResults ? searchResults.length : totalRow;

  return (
    <>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Danh sách người dùng
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Tổng cộng{" "}
                  <span className="font-semibold text-slate-800">
                    {displayedTotal}
                  </span>{" "}
                  người dùng
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative sm:w-80">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  >
                    <circle cx="11" cy="11" r="7" />

                    <path d="m20 20-3-3" />
                  </svg>

                  <input
                    type="text"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Tìm tên, email hoặc SĐT..."
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  onClick={() => {
                    setCreateForm(initialCreateForm);

                    setCreateTouched({
                      name: false,
                      email: false,
                      password: false,
                      phone: false,
                      birthday: false,
                    });

                    setShowCreateForm(true);
                  }}
                  className="flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#0B246D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
                >
                  <span className="text-lg">+</span>
                  Thêm người dùng
                </button>
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex min-h-64 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                <p className="mt-3 text-sm text-slate-500">
                  Đang tải danh sách...
                </p>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="w-full overflow-hidden">
                <table className="w-full table-fixed text-left">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="w-[9%] px-3 py-3.5 text-xs font-semibold uppercase text-slate-500">
                        <button
                          type="button"
                          onClick={() => handleSort("id")}
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          ID
                          <span>
                            {sortConfig?.key === "id"
                              ? sortConfig.direction === "asc"
                                ? "↑"
                                : "↓"
                              : "↕"}
                          </span>
                        </button>
                      </th>

                      <th className="w-[33%] px-3 py-3.5 text-xs font-semibold uppercase text-slate-500">
                        <button
                          type="button"
                          onClick={() => handleSort("name")}
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          Người dùng
                          <span>
                            {sortConfig?.key === "name"
                              ? sortConfig.direction === "asc"
                                ? "↑"
                                : "↓"
                              : "↕"}
                          </span>
                        </button>
                      </th>

                      <th className="w-[17%] px-3 py-3.5 text-xs font-semibold uppercase text-slate-500">
                        Điện thoại
                      </th>

                      <th className="w-[14%] px-3 py-3.5 text-xs font-semibold uppercase text-slate-500">
                        <button
                          type="button"
                          onClick={() => handleSort("birthday")}
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          Ngày sinh
                          <span>
                            {sortConfig?.key === "birthday"
                              ? sortConfig.direction === "asc"
                                ? "↑"
                                : "↓"
                              : "↕"}
                          </span>
                        </button>
                      </th>

                      <th className="w-[9%] px-3 py-3.5 text-xs font-semibold uppercase text-slate-500">
                        <button
                          type="button"
                          onClick={() => handleSort("gender")}
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          Giới tính
                          <span>
                            {sortConfig?.key === "gender"
                              ? sortConfig.direction === "asc"
                                ? "↑"
                                : "↓"
                              : "↕"}
                          </span>
                        </button>
                      </th>

                      <th className="w-[9%] px-3 py-3.5 text-xs font-semibold uppercase text-slate-500">
                        <button
                          type="button"
                          onClick={() => handleSort("role")}
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          Vai trò
                          <span>
                            {sortConfig?.key === "role"
                              ? sortConfig.direction === "asc"
                                ? "↑"
                                : "↓"
                              : "↕"}
                          </span>
                        </button>
                      </th>

                      <th className="w-[9%] px-3 py-3.5 text-center text-xs font-semibold uppercase text-slate-500">
                        Thao tác
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {displayedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center">
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                            🔍
                          </div>

                          <p className="mt-3 font-semibold text-slate-700">
                            Không tìm thấy người dùng
                          </p>

                          <p className="mt-1 text-sm text-slate-400">
                            Thử tìm kiếm bằng từ khóa khác.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      displayedUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                            #{user.id}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                                {user.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt={user.name || "Avatar"}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                                    <svg
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={2}
                                      className="h-5 w-5"
                                    >
                                      <circle cx="12" cy="8" r="4" />
                                      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
                                    </svg>
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="max-w-40 truncate text-sm font-semibold text-slate-900">
                                    {user.name || "—"}
                                  </p>

                                  {user.id === currentUserId && (
                                    <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                                      Bạn
                                    </span>
                                  )}
                                </div>

                                <p className="mt-0.5 max-w-56 truncate text-xs text-slate-500">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                            {user.phone || "—"}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                            {formatBirthday(user.birthday)}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {user.gender ? "Nam" : "Nữ"}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                user.role === "ADMIN"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>

                          <td className="px-2 py-4">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                title="Sửa người dùng"
                                onClick={() => handleOpenEdit(user)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100"
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
                                title="Xóa người dùng"
                                onClick={() => handleDeleteUser(user.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
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
                <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-center text-sm text-slate-500">
                    Trang{" "}
                    <span className="font-semibold text-slate-800">{page}</span>{" "}
                    / {totalPages}
                  </p>

                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((current) => current - 1)}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ← Trước
                    </button>

                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((current) => current + 1)}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Sau →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {showCreateForm && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowCreateForm(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <h3 className="text-xl font-bold text-slate-950">
                  Thêm người dùng
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Tạo tài khoản người dùng mới.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Họ tên <span className="text-red-500">*</span>
                </label>

                <input
                  value={createForm.name}
                  onChange={(event) =>
                    setCreateForm({
                      ...createForm,
                      name: event.target.value,
                    })
                  }
                  onBlur={() =>
                    setCreateTouched((current) => ({
                      ...current,
                      name: true,
                    }))
                  }
                  placeholder="Nhập họ tên"
                  className={`w-full rounded-xl border px-4 py-2.5 outline-none ${
                    createTouched.name && createErrors.name
                      ? "border-red-500 focus:ring-2 focus:ring-red-100"
                      : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                />

                {createTouched.name && createErrors.name && (
                  <p className="mt-1 text-sm text-red-500">
                    {createErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email <span className="text-red-500">*</span>
                </label>

                <input
                  type="email"
                  value={createForm.email}
                  onChange={(event) =>
                    setCreateForm({
                      ...createForm,
                      email: event.target.value,
                    })
                  }
                  onBlur={() =>
                    setCreateTouched((current) => ({
                      ...current,
                      email: true,
                    }))
                  }
                  placeholder="example@gmail.com"
                  className={`w-full rounded-xl border px-4 py-2.5 outline-none ${
                    createTouched.email && createErrors.email
                      ? "border-red-500"
                      : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                />

                {createTouched.email && createErrors.email && (
                  <p className="mt-1 text-sm text-red-500">
                    {createErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>

                <input
                  type="password"
                  value={createForm.password}
                  onChange={(event) =>
                    setCreateForm({
                      ...createForm,
                      password: event.target.value,
                    })
                  }
                  onBlur={() =>
                    setCreateTouched((current) => ({
                      ...current,
                      password: true,
                    }))
                  }
                  placeholder="Tối thiểu 6 ký tự"
                  className={`w-full rounded-xl border px-4 py-2.5 outline-none ${
                    createTouched.password && createErrors.password
                      ? "border-red-500"
                      : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                />

                {createTouched.password && createErrors.password && (
                  <p className="mt-1 text-sm text-red-500">
                    {createErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>

                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={createForm.phone}
                  onChange={(event) => {
                    const phone = event.target.value.replace(/\D/g, "");

                    setCreateForm({
                      ...createForm,
                      phone,
                    });
                  }}
                  onBlur={() =>
                    setCreateTouched((current) => ({
                      ...current,
                      phone: true,
                    }))
                  }
                  placeholder="0901234567"
                  className={`w-full rounded-xl border px-4 py-2.5 outline-none ${
                    createTouched.phone && createErrors.phone
                      ? "border-red-500"
                      : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                />

                {createTouched.phone && createErrors.phone && (
                  <p className="mt-1 text-sm text-red-500">
                    {createErrors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Ngày sinh <span className="text-red-500">*</span>
                </label>

                <input
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  value={createForm.birthday}
                  onChange={(event) =>
                    setCreateForm({
                      ...createForm,
                      birthday: event.target.value,
                    })
                  }
                  onBlur={() =>
                    setCreateTouched((current) => ({
                      ...current,
                      birthday: true,
                    }))
                  }
                  className={`w-full rounded-xl border px-4 py-2.5 outline-none ${
                    createTouched.birthday && createErrors.birthday
                      ? "border-red-500"
                      : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                />

                {createTouched.birthday && createErrors.birthday && (
                  <p className="mt-1 text-sm text-red-500">
                    {createErrors.birthday}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Giới tính
                </label>

                <select
                  value={String(createForm.gender)}
                  onChange={(event) =>
                    setCreateForm({
                      ...createForm,
                      gender: event.target.value === "true",
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="true">Nam</option>
                  <option value="false">Nữ</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Vai trò
                </label>

                <select
                  value={createForm.role}
                  onChange={(event) =>
                    setCreateForm({
                      ...createForm,
                      role: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={!isCreateFormValid}
                onClick={handleCreateUser}
                className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Thêm người dùng
              </button>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setEditingUser(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <h3 className="text-xl font-bold text-slate-950">
                  Sửa người dùng
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  ID người dùng: #{editingUser.id}
                </p>
                <h1 className="text-red-500 pt-5">
                  {" "}
                  *Avatar người dùng chỉ được phép tự thay đổi QTV không được
                  phép tự ý thay đổi
                </h1>
              </div>

              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <div className="grid gap-5 p-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Họ tên <span className="text-red-500">*</span>
                </label>

                <input
                  value={editingUser.name ?? ""}
                  onChange={(event) =>
                    setEditingUser({
                      ...editingUser,
                      name: event.target.value,
                    })
                  }
                  onBlur={() =>
                    setEditTouched((current) => ({
                      ...current,
                      name: true,
                    }))
                  }
                  className={`w-full rounded-xl border px-4 py-2.5 outline-none ${
                    editTouched.name && editErrors.name
                      ? "border-red-500"
                      : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                />

                {editTouched.name && editErrors.name && (
                  <p className="mt-1 text-sm text-red-500">{editErrors.name}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Email <span className="text-red-500">*</span>
                </label>

                <input
                  type="email"
                  value={editingUser.email ?? ""}
                  onChange={(event) =>
                    setEditingUser({
                      ...editingUser,
                      email: event.target.value,
                    })
                  }
                  onBlur={() =>
                    setEditTouched((current) => ({
                      ...current,
                      email: true,
                    }))
                  }
                  className={`w-full rounded-xl border px-4 py-2.5 outline-none ${
                    editTouched.email && editErrors.email
                      ? "border-red-500"
                      : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                />

                {editTouched.email && editErrors.email && (
                  <p className="mt-1 text-sm text-red-500">
                    {editErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>

                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={editingUser.phone ?? ""}
                  onChange={(event) => {
                    const phone = event.target.value.replace(/\D/g, "");

                    setEditingUser({
                      ...editingUser,
                      phone,
                    });
                  }}
                  onBlur={() =>
                    setEditTouched((current) => ({
                      ...current,
                      phone: true,
                    }))
                  }
                  placeholder="0901234567"
                  className={`w-full rounded-xl border px-4 py-2.5 outline-none ${
                    editTouched.phone && editErrors.phone
                      ? "border-red-500 focus:ring-2 focus:ring-red-100"
                      : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                />

                {editTouched.phone && editErrors.phone && (
                  <p className="mt-1 text-sm text-red-500">
                    {editErrors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Ngày sinh <span className="text-red-500">*</span>
                </label>

                <input
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  value={birthdayToInputDate(editingUser.birthday)}
                  onChange={(event) =>
                    setEditingUser({
                      ...editingUser,
                      birthday: event.target.value,
                    })
                  }
                  onBlur={() =>
                    setEditTouched((current) => ({
                      ...current,
                      birthday: true,
                    }))
                  }
                  className={`w-full rounded-xl border px-4 py-2.5 outline-none ${
                    editTouched.birthday && editErrors.birthday
                      ? "border-red-500"
                      : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                />

                {editTouched.birthday && editErrors.birthday && (
                  <p className="mt-1 text-sm text-red-500">
                    {editErrors.birthday}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Giới tính
                </label>

                <select
                  value={String(editingUser.gender)}
                  onChange={(event) =>
                    setEditingUser({
                      ...editingUser,
                      gender: event.target.value === "true",
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="true">Nam</option>
                  <option value="false">Nữ</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Vai trò
                </label>

                <select
                  value={editingUser.role ?? "USER"}
                  onChange={(event) =>
                    setEditingUser({
                      ...editingUser,
                      role: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 p-6">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleUpdateUser}
                disabled={!isEditFormValid}
                className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteUserId !== null && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDeleteUserId(null)}
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
                Bạn có chắc chắn muốn xóa người dùng này không?
              </p>

              <p className="mt-2 text-sm font-medium text-red-500">
                Hành động này không thể hoàn tác.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteUserId(null)}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={confirmDeleteUser}
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
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 p-4"
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
              className={`mt-6 w-full rounded-xl px-4 py-2.5 font-semibold text-white transition ${
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

      {protectedAccountPopup && (
        <div
          className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setProtectedAccountPopup(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-8 w-8 text-amber-600"
                >
                  <path d="M12 9v4" strokeLinecap="round" />

                  <path d="M12 17h.01" strokeLinecap="round" />

                  <path
                    d="M10.3 3.7 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <h3 className="mt-4 text-xl font-bold text-slate-900">
                Không thể thực hiện
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Bạn không được phép chỉnh sửa hoặc xóa tài khoản hiện đang đăng
                nhập.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setProtectedAccountPopup(false)}
              className="mt-6 w-full rounded-xl bg-[#0B246D] px-4 py-2.5 font-semibold text-white transition hover:bg-[#081a4d]"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
}
