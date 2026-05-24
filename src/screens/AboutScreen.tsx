import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LegalLinkRow } from "../components/legal/LegalLinkRow";
import { legalLinksExcept } from "../constants/legalLinks";
import { ABOUT_SECTIONS, ABOUT_TITLE } from "../content/legal/about";
import { FONT_BEBAS_NEUE } from "../../theme/fonts";
import { Neo, neoCardStyle } from "../../theme/neoBrutal";

export function AboutScreen() {
  const router = useRouter();
  const links = legalLinksExcept({ excludeId: "about" });

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={22} color={Neo.textOnDark} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: FONT_BEBAS_NEUE }]}>{ABOUT_TITLE}</Text>
        <View style={styles.backSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {ABOUT_SECTIONS.map((section) => (
          <View key={section.heading} style={[styles.section, neoCardStyle()]}>
            <Text style={[styles.sectionHeading, { fontFamily: FONT_BEBAS_NEUE }]}>
              {section.heading}
            </Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <Text style={[styles.linksTitle, { fontFamily: FONT_BEBAS_NEUE }]}>Documents & links</Text>
        <View style={styles.links}>
          {links.map((item) => (
            <LegalLinkRow key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Neo.pageBg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: Neo.borderBold,
    borderBottomColor: Neo.ink,
    backgroundColor: Neo.headerBg,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: Neo.borderThin,
    borderColor: "rgba(250,250,250,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnPressed: {
    opacity: 0.85,
  },
  backSpacer: {
    width: 44,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 22,
    color: Neo.textOnDark,
    letterSpacing: 0.4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 32,
    gap: 12,
  },
  section: {
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  sectionHeading: {
    fontSize: 18,
    color: Neo.ink,
    letterSpacing: 0.35,
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 21,
    color: Neo.inkMuted,
  },
  linksTitle: {
    marginTop: 8,
    fontSize: 18,
    color: Neo.textOnDark,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  links: {
    gap: 8,
  },
});
