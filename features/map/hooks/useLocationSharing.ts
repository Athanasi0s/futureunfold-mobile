import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import {
  toggleLocationSharing,
  getMyLocationSharingStatus,
} from "@/api/features/location";

export function useMyLocationSharingStatus() {
  return useQuery({
    queryKey: ["my-location-sharing"],
    queryFn: getMyLocationSharingStatus,
    staleTime: 30 * 1000,
  });
}

export function useToggleLocationSharing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      sharing,
    }: {
      groupId: number;
      sharing: boolean;
    }) => toggleLocationSharing(groupId, sharing),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-location-sharing"] });
      queryClient.invalidateQueries({ queryKey: ["friend-locations"] });
    },
  });
}

/**
 * Show confirmation before enabling location sharing.
 * Calls the toggle mutation on confirm.
 */
export function useConfirmToggleLocationSharing() {
  const mutation = useToggleLocationSharing();

  const toggle = (
    groupId: number,
    sharing: boolean,
    groupName: string,
    memberCount: number,
  ) => {
    if (sharing) {
      Alert.alert(
        "Share Location",
        `Share your location with ${memberCount} members of ${groupName}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Share",
            onPress: () => mutation.mutate({ groupId, sharing: true }),
          },
        ],
      );
    } else {
      mutation.mutate({ groupId, sharing: false });
    }
  };

  return { toggle, ...mutation };
}
