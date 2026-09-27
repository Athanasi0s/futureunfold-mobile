export enum UserRole {
  attendee = "attendee",
  speaker = "speaker",
  exhibitor = "exhibitor",
  admin = "admin",
  moderator = "moderator",
}

export type ModeratorPermissions = {
  validate_ticket: boolean;
  ticket_packages: boolean;
  user_reports: boolean;
  manage_sessions: boolean;
};

export type RegisterBody = {
  email: string;
  password: string;
  full_name: string;
  company?: string;
};

export type RegisterOut = {
  id: number;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  bio: string | null;
  company: string | null;
  linkedin_url: string | null;
  last_seen: string | null;
  created_at: string;
};

export type TokenOut = {
  access_token: string;
  token_type: string;
};

export type MeOut = {
  id: number;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  company: string | null;
  linkedin_url: string | null;
  last_seen: string | null;
  created_at: string;
  theme_preference?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  moderator_permissions?: ModeratorPermissions | null;
  eventora_qr_code?: string | null;
};

export type MeUpdateIn = {
  full_name?: string;
  role?: UserRole;
  avatar_url?: string;
  cover_url?: string | null;
  bio?: string;
  company?: string;
  linkedin_url?: string;
  date_of_birth?: string | null;
  gender?: string | null;
};

// ============================================
// PROGRAM & SESSIONS TYPES
// ============================================

export type VenueOut = {
  id: number;
  key: string;
  name: string;
  lat: number;
  lng: number;
  default_zoom?: number;
  has_indoor?: boolean;
};

export type SpeakerBriefOut = {
  user_id: number;
  full_name: string;
  company?: string | null;
  avatar_url?: string | null;
};

export type SpeakerOut = {
  user_id: number;
  full_name: string;
  email?: string | null;
  company?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  linkedin_url?: string | null;
};

export type SessionBriefOut = {
  id: number;
  title: string;
  start_time: string; // ISO string
  end_time: string; // ISO string
  type: string;
  venue_name?: string | null;
};

export type SpeakerWithSessionsOut = SpeakerOut & {
  sessions: SessionBriefOut[];
};

// ============================================
// CONNECTIONS TYPES
// ============================================

export type ConnectionUserOut = {
  user_id: number;
  user_name: string;
  avatar: string | null;
};

export type ConnectionsOut = {
  total: number;
  users: ConnectionUserOut[];
};

export type UserProfileOut = {
  id: number;
  email?: string | null;
  full_name: string;
  role: string; // "attendee", "exhibitor", "speaker", "admin"
  company?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  linkedin_url?: string | null;
  interests?: string[] | null;
  sessions?: SessionBriefOut[] | null; // Only for speakers
};

export type SessionOut = {
  id: number;
  title: string;
  description?: string | null;
  start_time: string; // ISO string
  end_time: string; // ISO string
  type: string;
  topic_tags?: string[] | null;
  venue?: VenueOut | null;
  speakers: SpeakerBriefOut[];
  image_url?: string | null;
  is_cancelled?: boolean;
  cancelled_at?: string | null;
  exhibitor_id?: number | null;
};

export type SessionDetailOut = SessionOut & {
  slides_url?: string | null;
  slides_unlocked: boolean;
  polls: PollOut[];
};

export type AgendaItemOut = {
  id: number;
  session: SessionOut;
  created_at: string; // ISO string - when user added to agenda
};

export type FavoriteResponseOut = {
  success: boolean;
  message: string;
  has_conflict: boolean;
  conflicting_sessions: SessionBriefOut[];
};

export type SessionCreateInput = {
  title: string;
  description?: string | null;
  start_time: string; // ISO string
  end_time: string; // ISO string
  type: string;
  topic_tags?: string[] | null;
  venue_id?: number | null;
  speaker_ids?: number[] | null;
  image_url?: string | null;
  exhibitor_id?: number | null;
};

export type SessionPatchInput = {
  title?: string;
  description?: string | null;
  type?: string;
  topic_tags?: string[] | null;
  image_url?: string | null;
  start_time?: string;
  end_time?: string;
  venue_id?: number | null;
  speaker_ids?: number[];
  exhibitor_id?: number | null;
  is_cancelled?: boolean | null;
};

export type ProgramFilters = {
  date?: string; // ISO date string (YYYY-MM-DD)
  topic?: string;
  search?: string;
};

// ============================================
// SESSION CHAT TYPES
// ============================================

export type SessionChatMessageSender = {
  id: number;
  full_name: string;
  avatar_url: string | null;
  role: "attendee" | "speaker" | "exhibitor" | "admin" | "moderator";
};

export type SessionChatMessage = {
  id: number;
  session_id: number;
  sender: SessionChatMessageSender;
  content: string;
  created_at: string;
};

export type SessionChatMessagesListOut = {
  messages: SessionChatMessage[];
  total: number;
  limit: number;
  offset: number;
};

export type SendSessionChatMessageInput = {
  content: string;
};

// ============================================
// POLLS TYPES
// ============================================

export type PollOptionOut = {
  id: number;
  text: string;
  vote_count: number;
};

export type PollOut = {
  id: number;
  question: string;
  session_id: number | null;
  group_id: number | null;
  created_by: number;
  is_active: boolean;
  created_at: string; // ISO string
  options: PollOptionOut[];
  user_voted_option_id: number | null; // null if user hasn't voted
  total_votes: number;
};

export type PollDetailOut = PollOut & {
  session_title: string | null;
};

export type PollCreateInput = {
  session_id?: number | null;
  group_id?: number | null;
  question: string;
  options: string[]; // At least 2 options required
};

export type VoteInput = {
  option_id: number;
};

// ============================================
// Q&A TYPES
// ============================================

export type QuestionAsker = {
  user_id: number;
  full_name: string;
  avatar_url: string | null;
};

export type QuestionOut = {
  id: number;
  session_id: number;
  body: string;
  status: "pending" | "answered" | "dismissed";
  answer_text: string | null;
  answered_by: number | null;
  answered_at: string | null;
  likes_count: number;
  liked_by_me: boolean;
  asker: QuestionAsker;
  created_at: string;
};

export type QAListOut = {
  questions: QuestionOut[];
  total: number;
  pending_count: number;
};

export type SubmitQuestionInput = {
  body: string;
};

export type AnswerQuestionInput = {
  answer_text: string;
};

export type LikeToggleOut = {
  liked: boolean;
  likes_count: number;
};

// ============================================
// GROUPS TYPES
// ============================================

export type GroupOut = {
  id: number;
  group_type: "topic" | "venue" | "interest";
  ref_key: string;
  title: string;
  description?: string | null;
  member_count: number;
  match_percentage?: number | null;
};

export type JoinGroupInput = {
  group_id: number;
  ref_key: string;
};

export type GroupFilters = {
  search?: string;
  has_role?: string;
  venue?: string;
};

export type GroupMessageSender = {
  id: number;
  full_name: string | null;
  avatar_url: string | null;
  role: "attendee" | "speaker" | "exhibitor" | "admin" | "moderator";
};

export type GroupMessage = {
  id: number;
  group_id: number;
  sender: GroupMessageSender;
  message_type: "text" | "image" | "pdf" | "file" | "system" | "poll";
  content: string;
  extra_data: Record<string, unknown> | null;
  created_at: string;
};

export type GroupMessagesResponse = {
  messages: GroupMessage[];
  total: number;
  limit: number;
  offset: number;
};

export type GroupMember = {
  user_id: number;
  full_name: string | null;
  avatar_url: string | null;
  role: "member" | "admin";
  user_role: "attendee" | "speaker" | "exhibitor" | "admin" | "moderator";
  joined_at: string;
};

export type GroupMembersResponse = {
  members: GroupMember[];
  total: number;
};

export type SendGroupMessageInput = {
  content: string;
  message_type?: "text" | "image" | "pdf" | "file" | "system" | "poll";
  extra_data?: Record<string, unknown> | null;
};

// ============================================
// USERS LIST TYPES
// ============================================

export type UserListItem = {
  id: number;
  email: string;
  full_name: string;
  role: string;
  company?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  linkedin_url?: string | null;
  interests: string[];
};

export type UsersListResponse = {
  users: UserListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

// ============================================
// SCHEDULING TYPES
// ============================================

export type TimeSlotStatus = "mutual_free" | "them_only" | "conflict" | "gcal_busy";

export type TimeSlot = {
  time: string;
  period: "AM" | "PM";
  status: TimeSlotStatus;
};

export type FestivalDay = {
  day_short: string;
  date: number;
  full_date: string;
  slots: TimeSlot[];
};

export type TargetUser = {
  id: number;
  name: string;
  title: string;
  company: string;
  badge: string;
  avatar_url: string;
};

export type AvailabilityOut = {
  target_user: TargetUser;
  festival_days: FestivalDay[];
};

export type ScheduleOverlapOut = {
  event_name: string;
  time: string;
  person_name: string;
  alternative_times: string[];
};

export type MeetingLocationOut = {
  id: number;
  name: string;
  venue_name: string;
};

export type CreateMeetingIn = {
  recipient_id: number;
  proposed_start: string;
  proposed_end: string;
  location_id?: number;
  message?: string;
};

export type MeetingUserOut = {
  id: number;
  name: string;
  title?: string;
  company?: string;
  badge?: string;
  avatar_url?: string;
};

export type MeetingOut = {
  id: number;
  requester: MeetingUserOut;
  recipient: MeetingUserOut;
  proposed_start: string;
  proposed_end: string;
  status: "pending" | "confirmed" | "declined" | "cancelled" | "expired";
  location: MeetingLocationOut | null;
  message: string | null;
  expires_at: string;
  created_at: string;
};

export type MeetingActionIn = {
  action: "accept" | "decline" | "cancel";
};

export type RescheduleMeetingIn = {
  proposed_start: string;
  proposed_end: string;
  location_id?: number;
  message?: string;
};

export type MyMeetingsOut = {
  incoming: MeetingOut[];
  outgoing: MeetingOut[];
  confirmed: MeetingOut[];
};

// ============================================
// QR / POINTS TYPES
// ============================================

export type QrCodeOut = {
  user_id: number;
  points: number;
};

export type ScanIn = {
  user_id: number;
};

export type ScanOut = {
  scan_id: number;
  scanned_user_id: number;
  scanned_user_name: string;
  points_awarded: number;
  scanner_total_points: number;
  scanned_total_points: number;
  message: string;
};

export type ScanLogOut = {
  id: number;
  scanner_id: number;
  scanner_name: string;
  scanned_id: number;
  scanned_name: string;
  points_awarded: number;
  created_at: string; // ISO string
};

export type LeaderboardEntryOut = {
  user_id: number;
  full_name: string;
  role: string;
  points: number;
  rank: number;
};

// ============================================
// REWARDS & MILESTONES TYPES
// ============================================

export type PointTransactionOut = {
  id: number;
  action_type: string;
  points_amount: number;
  source_ref?: string | null;
  created_at: string; // ISO string
};

export type RewardsMeOut = {
  total_points: number;
  current_tier: string; // "Explorer" | "Innovator" | "Master"
  unlocked_features: string[];
  recent_transactions: PointTransactionOut[];
};

export type MilestoneOut = {
  threshold: number;
  feature_key: string;
  label: string;
  achieved: boolean;
};

export type ProfileWrapUpOut = {
  greeting: string;
  percentile_rank: number;
  sessions_attended: number;
  total_hours: number;
  groups_joined: number;
  total_scans: number;
  milestone_timeline: PointTransactionOut[];
  certificate_eligible: boolean;
};

export type EarnActionOut = {
  action_type: string;
  label: string;
  description: string;
  icon: string;
  points: number;
  repeatable: boolean;
};

// ============================================
// DIRECT MESSAGES TYPES
// ============================================

export type ConversationUser = {
  id: number;
  full_name: string;
  avatar_url: string | null;
  role: "attendee" | "speaker" | "exhibitor" | "admin" | "moderator";
};

export type Conversation = {
  id: number;
  other_user: ConversationUser;
  last_message: string | null;
  last_message_at: string | null;
};

export type DirectMessage = {
  id: number;
  sender_id: number;
  recipient_id: number;
  text: string;
  created_at: string;
};

export type SendDirectMessageInput = {
  to_user_id: number;
  text: string;
};

// ============================================
// EXHIBITOR CHAT TYPES
// ============================================

export type ExhibitorChatMessageSender = {
  id: number;
  full_name: string;
  avatar_url: string | null;
  role: "attendee" | "speaker" | "exhibitor" | "admin" | "moderator";
};

export type ExhibitorChatMessageOut = {
  id: number;
  exhibitor_id: number;
  sender: ExhibitorChatMessageSender;
  content: string;
  created_at: string;
};

export type ExhibitorChatMessagesListOut = {
  messages: ExhibitorChatMessageOut[];
  total: number;
  limit: number;
  offset: number;
};

export type SendExhibitorChatMessageInput = {
  content: string;
};

// ----- OUTDOOR MAP -----
export type EntityCategory = "exhibitor" | "stage" | "amenity" | "sponsor";

export interface OutdoorMapProperties {
  id: number;
  name: string;
  category: EntityCategory;
  description: string | null;
  avatar_url: string | null;
  company: string | null;
  booth_number: string | null;
  extrusion_height: number;
}

export interface MapEntityProfile {
  id: number;
  name: string;
  category: EntityCategory;
  description: string | null;
  avatar_url: string | null;
  company: string | null;
  about: string | null;
  is_online: boolean;
}

// ============================================
// LOCATION SHARING TYPES
// ============================================

export type UserLocation = {
  user_id: number;
  full_name: string;
  avatar_url: string | null;
  latitude: number;
  longitude: number;
  updated_at: string;
  group_id: number;
  group_color: string;
};

export type GroupLocations = {
  locations: UserLocation[];
  group_id: number;
  group_title: string;
};

export type LocationSharingStatus = {
  group_id: number;
  group_title: string;
  sharing: boolean;
};

// ============================================
// VENUE DENSITY TYPES
// ============================================

export type DensityBucket = "green" | "yellow" | "orange" | "red";

export type VenueDensity = {
  venue_id: number;
  bucket: DensityBucket;
};

export type DensityResponse = {
  venues: VenueDensity[];
};

// ============================================
// GOOGLE CALENDAR TYPES
// ============================================

// ============================================
// TICKETING TYPES
// ============================================

export type TicketPackageOut = {
  id: number;
  ref_key: string;
  name: string;
  price_eur: number;
  description: string | null;
  features: string[];
  max_quantity: number | null;
};

export type CheckoutIn = {
  package_id: number;
};

export type CheckoutOut = {
  checkout_url: string;
};

export type TicketOut = {
  id: number;
  package_id: number;
  package_name: string;
  qr_code: string;   // UUID — pass directly to react-native-qrcode-svg
  status: "active" | "used" | "cancelled";
  created_at: string;
};

export type TicketValidateIn = {
  qr_code: string;
};

export type TicketValidateOut = {
  ticket_id: number;
  buyer_name: string;
  package_name: string;
  purchased_at: string;
  status: string;
};

export type GoogleCalendarStatusOut = {
  connected: boolean;
  is_valid: boolean;
};

// ============================================
// EXHIBITOR SHOWCASE TYPES
// ============================================

export type ShowcaseOut = {
  id: number;
  exhibitor_id: number;
  title: string;
  icon_url: string | null;
  visible: boolean;
};

export type ShowcaseIn = {
  title: string;
  icon_url?: string;
  visible: boolean;
};

// ============================================
// NOTIFICATIONS TYPES
// ============================================

export type NotificationOut = {
  id: number;
  title: string;
  body: string;
  type: string; // e.g. "dm", "meeting_request", "session_starting"
  ref_id: number | null;
  deeplink: string | null;
  seen: boolean;
  created_at: string; // ISO string
};

export type PushTokenIn = {
  token: string;
  platform?: "ios" | "android" | "web";
};

export type UnseenCountOut = {
  count: number;
};

export type NotifPreference = {
  category: string;
  enabled: boolean;
};

// ============================================
// EXHIBITOR STAFF TYPES
// ============================================

export type StaffOut = {
  id: number;
  full_name: string;
  role: string | null;
  avatar_url: string | null;
};

export type StaffIn = {
  full_name: string;
  role?: string;
  avatar_url?: string;
};

// ============================================
// ENHANCED LEADERBOARD TYPES
// ============================================

export type LeaderboardCategoryEntryOut = {
  user_id: number;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  count: number;
  rank: number;
};

export type LeaderboardStatsOut = {
  points_rank: number | null;
  sessions_rank: number | null;
  groups_rank: number | null;
  scans_rank: number | null;
};

export type EnhancedLeaderboardOut = {
  entries: LeaderboardCategoryEntryOut[];
  my_entry: LeaderboardCategoryEntryOut | null;
  my_stats: LeaderboardStatsOut;
  category: string;
  period: string;
  date: string | null;
};

// ============================================
// ADMIN DEMOGRAPHICS & GROUP RANKINGS TYPES
// ============================================

export interface AgeGroupItem {
  group: string; // "18-24", "25-34", "35-44", "45+"
  count: number;
  percentage: number;
}

export interface GenderItem {
  gender: string; // "male", "female", "prefer_not_to_say"
  count: number;
  percentage: number;
}

export interface DemographicsOut {
  age_groups: AgeGroupItem[];
  gender_breakdown: GenderItem[];
  sample_size_dob: number;
  sample_size_gender: number;
  total_users: number;
}

export interface GroupRankingItem {
  group_id: number;
  group_name: string;
  count: number;
}

export interface GroupRankingsOut {
  top_by_members: GroupRankingItem[];
  trending_members: GroupRankingItem[];
  full_ranking: GroupRankingItem[];
  chat_ranking: GroupRankingItem[];
  trending_chats: GroupRankingItem[];
}

// ============================================
// JOURNEY TIMELINE & CERTIFICATE TYPES
// ============================================

export type TimelineEventOut = {
  type: "session" | "group" | "scan" | "message" | "meeting" | "poll";
  title: string;
  subtitle: string | null;
  icon: string;
  timestamp: string;
};

export type TimelineDayOut = {
  date: string;
  day_label: string;
  events: TimelineEventOut[];
};

export type JourneyTimelineOut = {
  days: TimelineDayOut[];
  total_activities: number;
};

export type MilestoneRankOut = {
  category: string;
  icon: string;
  count: number;
  rank: number;
  total_users: number;
  percentile: number;
  rank_label: string;
};

export type CertificateTemplateConfig = {
  version: number;
  festival_name: string;
  tagline: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_gradient: [string, string];
  border_color: string;
};

export type CertificateDataOut = {
  user_name: string;
  user_avatar_url: string | null;
  top_milestones: MilestoneRankOut[];
  all_milestones: MilestoneRankOut[];
  template: CertificateTemplateConfig;
  template_version: number;
};

// ------------------------------------------------------------------
// Google Wallet (Phase 13 — GWLT-01; kinded per gap 5b)
// ------------------------------------------------------------------

export type WalletPassKind = "badge" | "ticket";

/**
 * Request body for POST /me/wallet/pass/{kind}.
 * Client supplies only the integer ticket_id. Backend looks up the Ticket row
 * and reads ticket.qr_code server-side to use as the wallet pass barcode.
 * DO NOT add a qr_code field here — that lookup is intentionally server-side.
 */
export type WalletPassIn = {
  ticket_id?: number | null; // required when kind === "ticket"
};

export type WalletPassOut = {
  save_url: string;
};

// ------------------------------------------------------------------
// Admin Push Broadcast (Phase 13 — PUSH-01..04)
// ------------------------------------------------------------------

/**
 * Backend Literal enum from app/services/deeplink_resolver.py.
 * Server resolves the template to a concrete deeplink at send time.
 * Closes T-13-02 (deeplink injection) at the schema layer — Pydantic
 * rejects any other value with HTTP 422.
 */
export type DeeplinkTemplate =
  | "none"
  | "trending_group"
  | "trending_session"
  | "biggest_group"
  | "biggest_group_chat"
  | "biggest_session"
  | "leaderboard"
  | "schedule";

export type BroadcastAudience = "attendee" | "speaker" | "exhibitor" | "admin";

// Phase 13 gap closure (gap 6c) — age-band targeting.
// Bucket boundaries match admin demographics dashboard (admin.py:297-304).
// Wire-format: identical to backend BroadcastPushIn.age_band Literal.
export type BroadcastAgeBand = "all" | "18-24" | "25-34" | "35-44" | "45+";

export type BroadcastPushIn = {
  title: string;
  body: string;
  role_filter?: BroadcastAudience | null;
  deeplink_template?: DeeplinkTemplate;
  age_band?: BroadcastAgeBand;
};

export type BroadcastPushOut = {
  sent_count: number;
  message: string;
  total_devices: number;
  ios_count: number;
  android_count: number;
  unknown_count: number;
  resolved_deeplink: string | null;
};

// ----------------------------------------------------------------------------
// Phase 13 Plan 08 — AppConfig theme keys (THME-01..03).
//
// The public /config endpoint returns these alongside the existing config
// fields. All 5 fields are optional / nullable: unset values fall through to
// the admin's selected preset. Hex values are validated server-side against
// ^#[0-9a-fA-F]{6}$ and the preset id against ^[a-z0-9_-]{1,40}$.
// ----------------------------------------------------------------------------

/** Partial view of the /config response showing only theme-related fields. */
export type AppConfigThemeFields = {
  active_theme_preset_id?: string | null;
  theme_color_1?: string | null;
  theme_color_2?: string | null;
  theme_color_3?: string | null;
  theme_color_4?: string | null;
};
