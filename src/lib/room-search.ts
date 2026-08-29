import { hasMinimumOneNightStay, normalizeBookingDate, toBookingDateTime } from "@/lib/booking-date";
import type { Booking } from "@/types/booking";
import type { Location } from "@/types/location";
import type { Room } from "@/types/room";

export type RoomSearchParams = {
  diemDen?: string;
  tenPhong?: string;
  tienIch?: string;
  ngayNhan?: string;
  ngayTra?: string;
  tuKhoa?: string;
  khach?: string;
};

type FilterRoomsInput = {
  bookings: Booking[];
  roomList: Room[];
  locationList: Location[];
  query: RoomSearchParams;
};

export type FilterRoomsResult = {
  filteredRooms: Room[];
  hasFilter: boolean;
  destination: string;
  roomName: string;
  amenity: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  locationById: Map<number, Location>;
};

export type SearchOption = {
  value: string;
  label: string;
};

function buildLocationRoomCountMap(roomList: Room[]) {
  const locationRoomCount = new Map<number, number>();

  for (const room of roomList) {
    locationRoomCount.set(room.maViTri, (locationRoomCount.get(room.maViTri) ?? 0) + 1);
  }

  return locationRoomCount;
}

function stripVietnamese(value: string) {
  return value
    .normalize("NFD")
    .replace(/[đĐ]/g, (char) => (char === "đ" ? "d" : "D"))
    .replace(/\p{Diacritic}/gu, "");
}

export function normalizeSearchText(value: string) {
  return stripVietnamese(value)
    .toLocaleLowerCase("vi-VN")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseGuestCount(value?: string) {
  const guestCount = Number(value ?? 0);

  if (!Number.isFinite(guestCount) || guestCount <= 0) {
    return 0;
  }

  return Math.floor(guestCount);
}

export function getLocationLabel(location: Location) {
  return `${location.tenViTri}, ${location.tinhThanh}`;
}

export function getLocationSearchText(location?: Location) {
  if (!location) {
    return "";
  }

  return normalizeSearchText(
    `${location.tenViTri} ${location.tinhThanh} ${location.quocGia} ${getLocationLabel(location)}`,
  );
}

function getRoomFeatureText(room: Room) {
  const features = [
    room.wifi ? "wifi internet" : "",
    room.hoBoi ? "ho boi hồ bơi pool" : "",
    room.dieuHoa ? "dieu hoa điều hòa may lanh" : "",
    room.bep ? "bep kitchen nhà bếp" : "",
    room.doXe ? "do xe bãi đỗ xe parking" : "",
    room.mayGiat ? "may giat giặt sấy" : "",
    room.tivi ? "tivi tv smart tv" : "",
    room.banLa || room.banUi ? "ban ui ban la ủi" : "",
  ];

  return features.join(" ");
}

function splitSearchKeywords(value: string) {
  return value
    .split(/[,\n;]+/g)
    .map((keyword) => normalizeSearchText(keyword))
    .filter(Boolean);
}

function getRoomNameSearchText(room: Room) {
  return normalizeSearchText(room.tenPhong);
}

function hasAllKeywords(text: string, keywords: string[]) {
  return keywords.every((keyword) => text.includes(keyword));
}

function isOverlappingBookingRange(
  checkIn: string,
  checkOut: string,
  bookingCheckIn?: string,
  bookingCheckOut?: string,
) {
  const startA = toBookingDateTime(checkIn);
  const endA = toBookingDateTime(checkOut);
  const startB = toBookingDateTime(bookingCheckIn);
  const endB = toBookingDateTime(bookingCheckOut);

  if (startA === null || endA === null || startB === null || endB === null) {
    return false;
  }

  return startA <= endB && endA >= startB;
}

function getRoomMatchScore(
  room: Room,
  location: Location | undefined,
  destination: string,
  roomNameKeywords: string[],
  amenityKeywords: string[],
) {
  let score = 0;

  const locationText = getLocationSearchText(location);
  const roomNameText = getRoomNameSearchText(room);
  const amenityText = normalizeSearchText(getRoomFeatureText(room));

  if (destination) {
    if (locationText.startsWith(destination)) {
      score += 4;
    } else if (locationText.includes(destination)) {
      score += 2;
    }
  }

  if (roomNameKeywords.length > 0) {
    score += roomNameKeywords.reduce((total, keyword) => {
      if (roomNameText.startsWith(keyword)) {
        return total + 3;
      }

      if (roomNameText.includes(keyword)) {
        return total + 1;
      }

      return total;
    }, 0);
  }

  if (amenityKeywords.length > 0) {
    score += amenityKeywords.reduce((total, keyword) => {
      if (amenityText.includes(keyword)) {
        return total + 1;
      }

      return total;
    }, 0);
  }

  score += Math.min(room.khach, 10) * 0.01;

  return score;
}

export function filterRooms({ bookings, roomList, locationList, query }: FilterRoomsInput): FilterRoomsResult {
  const destination = normalizeSearchText(query.diemDen ?? "");
  const roomName = normalizeSearchText(query.tenPhong ?? query.tuKhoa ?? "");
  const amenity = normalizeSearchText(query.tienIch ?? "");
  const checkIn = normalizeBookingDate(query.ngayNhan ?? "") ?? "";
  const checkOut = normalizeBookingDate(query.ngayTra ?? "") ?? "";
  const guestCount = parseGuestCount(query.khach);
  const roomNameKeywords = splitSearchKeywords(query.tenPhong ?? query.tuKhoa ?? "");
  const amenityKeywords = splitSearchKeywords(query.tienIch ?? "");
  const hasAvailabilityFilter = hasMinimumOneNightStay(checkIn, checkOut);

  const locationById = new Map<number, Location>(
    locationList.map((location) => [location.id, location]),
  );
  const bookingsByRoom = new Map<number, Booking[]>();

  for (const booking of bookings) {
    const roomBookings = bookingsByRoom.get(booking.maPhong) ?? [];
    roomBookings.push(booking);
    bookingsByRoom.set(booking.maPhong, roomBookings);
  }

  const filteredRooms = roomList
    .filter((room) => {
      const location = locationById.get(room.maViTri);
      const locationText = getLocationSearchText(location);
      const roomNameText = getRoomNameSearchText(room);
      const amenityText = normalizeSearchText(getRoomFeatureText(room));

      const matchDestination = destination ? locationText.includes(destination) : true;
      const matchRoomName =
        roomNameKeywords.length > 0 ? hasAllKeywords(roomNameText, roomNameKeywords) : true;
      const matchAmenity =
        amenityKeywords.length > 0 ? hasAllKeywords(amenityText, amenityKeywords) : true;
      const matchGuest = guestCount > 0 ? room.khach >= guestCount : true;
      const roomBookings = bookingsByRoom.get(room.id) ?? [];
      const matchAvailability = hasAvailabilityFilter
        ? roomBookings.every(
            (booking) =>
              !isOverlappingBookingRange(
                checkIn,
                checkOut,
                normalizeBookingDate(booking.ngayDen) ?? undefined,
                normalizeBookingDate(booking.ngayDi) ?? undefined,
              ),
          )
        : true;

      return matchDestination && matchRoomName && matchAmenity && matchGuest && matchAvailability;
    })
    .sort((roomA, roomB) => {
      const scoreA = getRoomMatchScore(
        roomA,
        locationById.get(roomA.maViTri),
        destination,
        roomNameKeywords,
        amenityKeywords,
      );
      const scoreB = getRoomMatchScore(
        roomB,
        locationById.get(roomB.maViTri),
        destination,
        roomNameKeywords,
        amenityKeywords,
      );

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      if (guestCount > 0 && roomA.khach !== roomB.khach) {
        return roomA.khach - roomB.khach;
      }

      if (
        destination ||
        roomNameKeywords.length > 0 ||
        amenityKeywords.length > 0 ||
        hasAvailabilityFilter
      ) {
        return roomB.id - roomA.id;
      }

      return roomA.id - roomB.id;
    });

  return {
    filteredRooms,
    hasFilter: Boolean(destination || roomName || amenity || checkIn || checkOut || guestCount > 0),
    destination,
    roomName,
    amenity,
    checkIn,
    checkOut,
    guestCount,
    locationById,
  };
}

export function getSearchableLocations(roomList: Room[], locationList: Location[]) {
  const locationRoomCount = buildLocationRoomCountMap(roomList);
  const seenLabels = new Set<string>();

  return locationList
    .filter((location) => (locationRoomCount.get(location.id) ?? 0) > 0)
    .sort((locationA, locationB) => {
      const countA = locationRoomCount.get(locationA.id) ?? 0;
      const countB = locationRoomCount.get(locationB.id) ?? 0;

      if (countA !== countB) {
        return countB - countA;
      }

      return locationA.id - locationB.id;
    })
    .filter((location) => {
      const normalizedLabel = normalizeSearchText(getLocationLabel(location));

      if (seenLabels.has(normalizedLabel)) {
        return false;
      }

      seenLabels.add(normalizedLabel);
      return true;
    });
}

export function buildLocationOptions(roomList: Room[], locationList: Location[]): SearchOption[] {
  const locationRoomCount = buildLocationRoomCountMap(roomList);
  const seenLabels = new Set<string>();
  const normalizedLocations = [...locationList]
    .sort((locationA, locationB) => {
      const countA = locationRoomCount.get(locationA.id) ?? 0;
      const countB = locationRoomCount.get(locationB.id) ?? 0;

      if (countA !== countB) {
        return countB - countA;
      }

      return locationA.id - locationB.id;
    })
    .filter((location) => {
      const normalizedLabel = normalizeSearchText(getLocationLabel(location));

      if (seenLabels.has(normalizedLabel)) {
        return false;
      }

      seenLabels.add(normalizedLabel);
      return true;
    });
  const locationNameCount = new Map<string, number>();

  for (const location of normalizedLocations) {
    const normalizedName = normalizeSearchText(location.tenViTri);
    locationNameCount.set(normalizedName, (locationNameCount.get(normalizedName) ?? 0) + 1);
  }

  return normalizedLocations.map((location) => {
    const normalizedName = normalizeSearchText(location.tenViTri);
    const isDuplicateName = (locationNameCount.get(normalizedName) ?? 0) > 1;

    return {
      value: getLocationLabel(location),
      label: isDuplicateName ? `${location.tenViTri} - ${location.tinhThanh}` : location.tenViTri,
    };
  });
}

export function buildAmenityOptions(roomList: Room[]): SearchOption[] {
  const hasIron = roomList.some((room) => room.banLa || room.banUi);
  const availabilityMap = [
    { value: "wifi", label: "Wifi", enabled: roomList.some((room) => room.wifi) },
    { value: "ho boi", label: "Hồ bơi", enabled: roomList.some((room) => room.hoBoi) },
    {
      value: "dieu hoa",
      label: "Điều hòa",
      enabled: roomList.some((room) => room.dieuHoa),
    },
    { value: "bep", label: "Bếp", enabled: roomList.some((room) => room.bep) },
    { value: "do xe", label: "Đỗ xe", enabled: roomList.some((room) => room.doXe) },
    {
      value: "may giat",
      label: "Máy giặt",
      enabled: roomList.some((room) => room.mayGiat),
    },
    { value: "tivi", label: "Tivi", enabled: roomList.some((room) => room.tivi) },
    { value: "ban ui", label: "Bàn ủi", enabled: hasIron },
  ];

  return availabilityMap
    .filter((item) => item.enabled)
    .map(({ value, label }) => ({ value, label }));
}

export function buildSearchHref(pathname: string, query: RoomSearchParams) {
  const searchParams = new URLSearchParams();

  if (query.diemDen?.trim()) {
    searchParams.set("diemDen", query.diemDen.trim());
  }

  const roomName = query.tenPhong?.trim() || query.tuKhoa?.trim();

  if (roomName) {
    searchParams.set("tenPhong", roomName);
  }

  if (query.tienIch?.trim()) {
    searchParams.set("tienIch", query.tienIch.trim());
  }

  const checkIn = normalizeBookingDate(query.ngayNhan ?? "");
  const checkOut = normalizeBookingDate(query.ngayTra ?? "");

  if (checkIn) {
    searchParams.set("ngayNhan", checkIn);
  }

  if (checkOut) {
    searchParams.set("ngayTra", checkOut);
  }

  if (parseGuestCount(query.khach) > 0) {
    searchParams.set("khach", String(parseGuestCount(query.khach)));
  }

  const search = searchParams.toString();

  return search ? `${pathname}?${search}` : pathname;
}
