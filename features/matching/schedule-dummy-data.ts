export type TimeSlotStatus = "mutual_free" | "them_only" | "conflict";

export type TimeSlot = {
  time: string;
  period: "AM" | "PM";
  status: TimeSlotStatus;
};

export type DaySchedule = {
  dayShort: string;
  date: number;
  slots: TimeSlot[];
};

export type MeetingLocation = {
  id: string;
  name: string;
};

export type ScheduleOverlap = {
  eventName: string;
  time: string;
  personName: string;
  alternativeTimes: string[];
};

export type ScheduleUser = {
  id: number;
  name: string;
  title: string;
  company: string;
  badge: string;
  avatarUrl: string;
};

export const scheduleDummyUser: ScheduleUser = {
  id: 1,
  name: "Marcus Thorne",
  title: "CTO, NexaSystems",
  company: "Panathenea",
  badge: "Speaker",
  avatarUrl: "https://i.pravatar.cc/150?img=12",
};

export const festivalDays: DaySchedule[] = [
  {
    dayShort: "MON",
    date: 14,
    slots: [
      { time: "09:00", period: "AM", status: "mutual_free" },
      { time: "09:30", period: "AM", status: "mutual_free" },
      { time: "10:00", period: "AM", status: "them_only" },
      { time: "10:30", period: "AM", status: "mutual_free" },
      { time: "11:00", period: "AM", status: "mutual_free" },
      { time: "11:30", period: "AM", status: "mutual_free" },
    ],
  },
  {
    dayShort: "TUE",
    date: 15,
    slots: [
      { time: "09:00", period: "AM", status: "mutual_free" },
      { time: "09:30", period: "AM", status: "them_only" },
      { time: "10:00", period: "AM", status: "conflict" },
      { time: "10:30", period: "AM", status: "mutual_free" },
      { time: "11:00", period: "AM", status: "mutual_free" },
      { time: "11:30", period: "AM", status: "mutual_free" },
    ],
  },
  {
    dayShort: "WED",
    date: 16,
    slots: [
      { time: "09:00", period: "AM", status: "mutual_free" },
      { time: "09:30", period: "AM", status: "mutual_free" },
      { time: "10:00", period: "AM", status: "mutual_free" },
      { time: "10:30", period: "AM", status: "them_only" },
      { time: "11:00", period: "AM", status: "conflict" },
      { time: "11:30", period: "AM", status: "mutual_free" },
    ],
  },
  {
    dayShort: "THU",
    date: 17,
    slots: [
      { time: "09:00", period: "AM", status: "them_only" },
      { time: "09:30", period: "AM", status: "mutual_free" },
      { time: "10:00", period: "AM", status: "mutual_free" },
      { time: "10:30", period: "AM", status: "mutual_free" },
      { time: "11:00", period: "AM", status: "mutual_free" },
      { time: "11:30", period: "AM", status: "them_only" },
    ],
  },
  {
    dayShort: "FRI",
    date: 18,
    slots: [
      { time: "09:00", period: "AM", status: "mutual_free" },
      { time: "09:30", period: "AM", status: "mutual_free" },
      { time: "10:00", period: "AM", status: "them_only" },
      { time: "10:30", period: "AM", status: "conflict" },
      { time: "11:00", period: "AM", status: "mutual_free" },
      { time: "11:30", period: "AM", status: "mutual_free" },
    ],
  },
];

export const meetingLocations: MeetingLocation[] = [
  { id: "1", name: "AI Discovery Lounge (Hall A)" },
  { id: "2", name: "Innovation Hub (Hall B)" },
  { id: "3", name: "Networking Terrace" },
  { id: "4", name: "Main Conference Room" },
];

export const scheduleOverlap: ScheduleOverlap = {
  eventName: 'Web3 Keynote',
  time: "10:30 AM",
  personName: "Marcus",
  alternativeTimes: ["02:00 PM", "04:30 PM"],
};
