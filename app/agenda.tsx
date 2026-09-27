import { TenantBackgroundArt } from "@/components/tenant-background-art";
import { ThemedText } from "@/components/themed-text";
import { getTenantBackgroundSource } from "@/constants/tenant-assets";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LocalizedText = { en: string; el: string };
type AgendaSpeaker = { name: LocalizedText; role: LocalizedText };
type AgendaItem = {
  time: string;
  title: LocalizedText;
  note?: LocalizedText;
  speakers?: AgendaSpeaker[];
};

const AGENDA: AgendaItem[] = [
  { time: "18:00", title: { en: "Welcome", el: "Καλωσόρισμα" } },
  {
    time: "18:30",
    title: { en: "CEO Welcome", el: "CEO Welcome" },
    speakers: [{
      name: { en: "Vassilis Kazas", el: "Βασίλης Καζάς" },
      role: { en: "Managing Partner, Grant Thornton", el: "Διευθύνων Σύμβουλος, Grant Thornton" },
    }],
  },
  {
    time: "18:40",
    title: { en: "Opening Address", el: "Opening Address" },
    speakers: [{
      name: { en: "Kyriakos Pierrakakis", el: "Κυριάκος Πιερρακάκης" },
      role: {
        en: "Minister of Economy and Finance of the Hellenic Republic & President of the Eurogroup",
        el: "Υπουργός Εθνικής Οικονομίας και Οικονομικών & Πρόεδρος του Eurogroup",
      },
    }],
  },
  {
    time: "18:55",
    title: { en: "Technology & Beyond: The Future Advantage", el: "Technology & Beyond: The Future Advantage" },
    note: {
      en: "based on Grant Thornton’s Technology Survey 2026",
      el: "based on Grant Thornton’s Technology Survey 2026",
    },
    speakers: [{
      name: { en: "Stella Angelopoulou", el: "Στέλλα Αγγελοπούλου" },
      role: { en: "Partner, Head of Technology, Grant Thornton", el: "Partner, Head of Technology, Grant Thornton" },
    }],
  },
  {
    time: "19:10",
    title: {
      en: "Discussion Circle: “Accelerating Greek Entrepreneurship | The Next AI Frontier”",
      el: "Discussion Circle: “Accelerating Greek Entrepreneurship | The Next AI Frontier”",
    },
    speakers: [
      {
        name: { en: "Spyros Theodoropoulos", el: "Σπύρος Θεοδωρόπουλος" },
        role: {
          en: "President & CEO, Bespoke SGA Holdings S.A. & Chairman of the Board of Directors of SEV Hellenic Federation of Enterprises",
          el: "Πρόεδρος & Διευθύνων Σύμβουλος, Bespoke SGA Holdings Α.Ε. & Πρόεδρος του Δ.Σ. του ΣΕΒ Σύνδεσμος Επιχειρήσεων και Βιομηχανιών",
        },
      },
      {
        name: { en: "Agapi Sbokou", el: "Αγάπη Σμπώκου" },
        role: {
          en: "President, SETE, CEO, PHAEA",
          el: "Πρόεδρος, ΣΕΤΕ & Διευθύνουσα Σύμβουλος, PHAEA",
        },
      },
      {
        name: { en: "Theodoros Fessas", el: "Θεόδωρος Φέσσας" },
        role: {
          en: "Chairman Quest Group, Quest Holdings",
          el: "Πρόεδρος Δ.Σ., QUEST GROUP, QUEST ΣΥΜΜΕΤΟΧΩΝ",
        },
      },
    ],
  },
  {
    time: "19:45",
    title: {
      en: "Future Advantage | Industry Insight by:",
      el: "Future Advantage | Industry Insight by:",
    },
    note: { en: "Video Address", el: "Video Address" },
    speakers: [
      {
        name: { en: "Minas Liarokapis", el: "Μηνάς Λιαροκάπης" },
        role: { en: "CEO, Acumino Inc (tbc)", el: "Διευθύνων Σύμβουλος, Acumino Inc (tbc)" },
      },
      {
        name: { en: "Stratos Molyviatis", el: "Στράτος Μολυβιάτης" },
        role: {
          en: "Group Chief Operating Officer at National Bank of Greece (tbc)",
          el: "Γενικός Διευθυντής Λειτουργικής Στήριξης της Εθνικής Τράπεζας (tbc)",
        },
      },
      {
        name: { en: "Vardis Vardinogiannis", el: "Βαρδής Ι. Βαρδινογιάννης" },
        role: { en: "CEO, Couch Heroes (tbc)", el: "CEO, Couch Heroes (tbc)" },
      },
      {
        name: { en: "Speaker 1", el: "Ομιλητής 1" },
        role: { en: "E80 Group (tbc)", el: "E80 Group (tbc)" },
      },
    ],
  },
  {
    time: "20:00",
    title: {
      en: "Discussion with Prime Minister Kyriakos Mitsotakis on AI, People and the Future of Society",
      el: "Συζήτηση με τον Πρωθυπουργό κ. Κυριάκο Μητσοτάκη για την Τεχνητή Νοημοσύνη, τον Άνθρωπο και το Μέλλον της Κοινωνίας",
    },
    speakers: [
      {
        name: { en: "Kyriakos Mitsotakis", el: "Κυριάκος Μητσοτάκης" },
        role: { en: "Prime Minister of Greece (tbc)", el: "Πρωθυπουργός της Ελλάδας (tbc)" },
      },
      {
        name: { en: "Dr. Nikolaos Karamouzis", el: "Δρ. Νικόλαος Καραμούζης" },
        role: { en: "President, Grant Thornton Consulting", el: "Πρόεδρος, Grant Thornton Consulting" },
      },
      {
        name: { en: "Vassilis Kazas", el: "Βασίλης Καζάς" },
        role: { en: "Managing Partner, Grant Thornton", el: "Διευθύνων Σύμβουλος, Grant Thornton" },
      },
    ],
  },
  { time: "20:30", title: { en: "Cocktail", el: "Cocktail" } },
];

export default function AgendaScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const locale: "en" | "el" = i18n.language.toLowerCase().startsWith("el")
    ? "el"
    : "en";
  const hasBackgroundArt = Boolean(getTenantBackgroundSource("secondary"));

  return (
    <SafeAreaView style={styles.container}>
      {hasBackgroundArt && (
        <TenantBackgroundArt
          variant="secondary"
          style={[styles.backgroundArt, { width, height: width * (1864 / 2100) }]}
        />
      )}
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t("futureUnfold.back")}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>
          {t("futureUnfold.agenda")}
        </ThemedText>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText style={styles.title}>
          {t("futureUnfold.agendaTitle")}
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          {t("futureUnfold.agendaSubtitle")}
        </ThemedText>

        {AGENDA.map((item) => (
          <View key={item.time} style={styles.item}>
            <ThemedText style={styles.time}>{item.time}</ThemedText>
            <View style={styles.itemBody}>
              <ThemedText style={styles.itemTitle}>
                {item.title[locale]}
              </ThemedText>
              {item.note && (
                <ThemedText style={styles.note}>{item.note[locale]}</ThemedText>
              )}
              {item.speakers?.map((speaker) => (
                <View key={speaker.name.en} style={styles.speaker}>
                  <ThemedText style={styles.speakerName}>
                    {speaker.name[locale]}
                  </ThemedText>
                  <ThemedText style={styles.speakerRole}>
                    {speaker.role[locale]}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        ))}

        <ThemedText style={styles.coordinator}>
          {t("futureUnfold.coordinator")}
        </ThemedText>


      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    backgroundArt: {
      position: "absolute",
      top: 0,
      alignSelf: "center",
      opacity: 0.12,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
    content: { padding: 16, paddingBottom: 48 },
    title: { fontSize: 28, fontWeight: "700", color: colors.text },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      marginTop: 6,
      marginBottom: 22,
    },
    item: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingVertical: 16,
    },
    time: { width: 58, fontSize: 15, fontWeight: "700", color: colors.brand },
    itemBody: { flex: 1 },
    itemTitle: { fontSize: 16, fontWeight: "700", lineHeight: 22, color: colors.text },
    note: { marginTop: 4, fontSize: 13, fontStyle: "italic", color: colors.brand },
    speaker: { marginTop: 10 },
    speakerName: { fontSize: 14, fontWeight: "600", color: colors.text },
    speakerRole: { marginTop: 2, fontSize: 12, lineHeight: 17, color: colors.textSecondary },
    coordinator: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 16,
      fontSize: 13,
      fontStyle: "italic",
      color: colors.textSecondary,
    },
  });
}
