import { StyleSheet } from "react-native";

// Role display configuration
export const ROLE_CONFIG: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  speaker: { label: "SPEAKER", icon: "mic", color: "#194ff0" },
  exhibitor: {
    label: "EXHIBITOR", icon: "storefront-outline", color: "#f59e0b" },
  admin: { label: "ADMIN", icon: "shield-checkmark", color: "#ef4444" },
  attendee: { label: "ATTENDEE", icon: "person", color: "#10b981" },
};

// Mock groups - In a real app, this would come from the API
export const MOCK_GROUPS = [
  {
    id: 1,
    name: "Tech Leaders Forum",
    members: "1.2k",
    status: "Active now",
    icon: "people-outline",
    color: "#194ff0",
  },
  {
    id: 2,
    name: "Future of SaaS",
    members: "840",
    status: "Joined 2023",
    icon: "rocket-outline",
    color: "#6366f1",
  },
  {
    id: 3,
    name: "Systems Design Global",
    members: "5k",
    status: "12 mutual",
    icon: "grid-outline",
    color: "#10b981",
  },
];

// Format time helper
export const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// Format date helper
export const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

// Get role config helper
export const getRoleConfig = (role: string) => {
  return ROLE_CONFIG[role.toLowerCase()] || ROLE_CONFIG.attendee;
};

// ============================================
// ATTENDEE-ONLY STYLES
// ============================================

export const attendeeStyles = StyleSheet.create({
  // Background
  backgroundGradients: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    opacity: 0.3,
    overflow: "hidden",
  },
  gradientTopRight: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.3,
  },
  gradientBottomLeft: {
    position: "absolute",
    bottom: -80,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.2,
  },
  // Profile Header
  profileHeader: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: "rgba(128, 128, 128, 0.1)",
  },
  avatarPlaceholder: {
    width: 112,
    height: 112,
    borderRadius: 56,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(128, 128, 128, 0.1)",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "#101522",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  profileRole: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 4,
    textAlign: "center",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  linkedinButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(0, 119, 181, 0.1)",
  },
  linkedinButtonText: {
    color: "#0077b5",
    fontSize: 14,
    fontWeight: "600",
  },
  // Section with action
  sectionHeaderWithAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  // Interests
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestTag: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  interestTagText: {
    fontSize: 14,
    fontWeight: "500",
  },
  // Sessions
  sessionsContainer: {
    gap: 12,
  },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  sessionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  sessionMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  // Groups
  groupsContainer: {
    gap: 12,
  },
  groupCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  groupIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "700",
  },
  groupMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  // Bottom action buttons
  messageButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  meetingButton: {
    flex: 1.4,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#2DD4BF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  meetingButtonText: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "700",
  },
});
