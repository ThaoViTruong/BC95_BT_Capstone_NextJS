import type { Location } from "@/types/location";
import type { Room } from "@/types/room";

export type RoomSearchParams = {
  diemDen?: string;
  tuKhoa?: string;
  khach?: string;
};

type FilterRoomsInput = {
  roomList: Room[];
  locationList: Location[];
  query: RoomSearchParams;
};

export type FilterRoomsResult = {
  filteredRooms: Room[];
  hasFilter: boolean;
  destination: string;
  keyword: string;
  guestCount: number;
  locationById: Map<number, Location>;
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
    room.banLa ? "ban la ban ui ủi" : "",
  ];

  return features.join(" ");
}

function getRoomSearchText(room: Room, location?: Location) {
  return normalizeSearchText(
    `${room.tenPhong} ${room.moTa} ${getRoomFeatureText(room)} ${getLocationSearchText(location)}`,
  );
}

function getRoomMatchScore(room: Room, location: Location | undefined, destination: string, keyword: string) {
  let score = 0;

  const locationText = getLocationSearchText(location);
  const roomText = getRoomSearchText(room, location);

  if (destination) {
    if (locationText.startsWith(destination)) {
      score += 4;
    } else if (locationText.includes(destination)) {
      score += 2;
    }
  }

  if (keyword) {
    if (roomText.startsWith(keyword)) {
      score += 3;
    } else if (roomText.includes(keyword)) {
      score += 1;
    }
  }

  score += Math.min(room.khach, 10) * 0.01;

  return score;
}

export function filterRooms({ roomList, locationList, query }: FilterRoomsInput): FilterRoomsResult {
  const destination = normalizeSearchText(query.diemDen ?? "");
  const keyword = normalizeSearchText(query.tuKhoa ?? "");
  const guestCount = parseGuestCount(query.khach);

  const locationById = new Map<number, Location>(
    locationList.map((location) => [location.id, location]),
  );

  const filteredRooms = roomList
    .filter((room) => {
      const location = locationById.get(room.maViTri);
      const locationText = getLocationSearchText(location);
      const roomText = getRoomSearchText(room, location);

      const matchDestination = destination ? locationText.includes(destination) : true;
      const matchKeyword = keyword ? roomText.includes(keyword) : true;
      const matchGuest = guestCount > 0 ? room.khach >= guestCount : true;

      return matchDestination && matchKeyword && matchGuest;
    })
    .sort((roomA, roomB) => {
      const scoreA = getRoomMatchScore(roomA, locationById.get(roomA.maViTri), destination, keyword);
      const scoreB = getRoomMatchScore(roomB, locationById.get(roomB.maViTri), destination, keyword);

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      if (guestCount > 0 && roomA.khach !== roomB.khach) {
        return roomA.khach - roomB.khach;
      }

      if (destination || keyword) {
        return roomB.id - roomA.id;
      }

      return roomA.id - roomB.id;
    });

  return {
    filteredRooms,
    hasFilter: Boolean(destination || keyword || guestCount > 0),
    destination,
    keyword,
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

export function buildLocationOptions(roomList: Room[], locationList: Location[]) {
  const optionSet = new Set<string>();

  for (const location of getSearchableLocations(roomList, locationList)) {
    optionSet.add(location.tenViTri);
    optionSet.add(location.tinhThanh);
    optionSet.add(location.quocGia);
    optionSet.add(getLocationLabel(location));
  }

  return Array.from(optionSet);
}

export function buildSearchHref(pathname: string, query: RoomSearchParams) {
  const searchParams = new URLSearchParams();

  if (query.diemDen?.trim()) {
    searchParams.set("diemDen", query.diemDen.trim());
  }

  if (query.tuKhoa?.trim()) {
    searchParams.set("tuKhoa", query.tuKhoa.trim());
  }

  if (parseGuestCount(query.khach) > 0) {
    searchParams.set("khach", String(parseGuestCount(query.khach)));
  }

  const search = searchParams.toString();

  return search ? `${pathname}?${search}` : pathname;
}
