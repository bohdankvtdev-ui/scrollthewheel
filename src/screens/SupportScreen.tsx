import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LegalLinksFooter } from "../components/legal/LegalLinksFooter";
import { LEGAL_CONTACT_EMAIL } from "../constants/legal";
import { SUPPORT_FAQ, SUPPORT_INTRO, SUPPORT_META, SUPPORT_TITLE } from "../content/legal/supportInfo";
import { FONT_BEBAS_NEUE } from "../../theme/fonts";
import { Neo, neoCardStyle } from "../../theme/neoBrutal";

export function SupportScreen() {
  const router = useRouter();

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
        <Text style={[styles.headerTitle, { fontFamily: FONT_BEBAS_NEUE }]}>{SUPPORT_TITLE}</Text>
        <View style={styles.backSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.meta, { fontFamily: FONT_BEBAS_NEUE }]}>{SUPPORT_META}</Text>
        <Text style={styles.intro}>{SUPPORT_INTRO}</Text>

        <Pressable
          style={({ pressed }) => [styles.emailCard, neoCardStyle(), pressed && styles.emailPressed]}
          onPress={() => void Linking.openURL(`mailto:${LEGAL_CONTACT_EMAIL}`)}
          accessibilityRole="link"
          accessibilityLabel={`Email ${LEGAL_CONTACT_EMAIL}`}
        >
          <MaterialIcons name="mail-outline" size={22} color={Neo.ink} />
          <Text style={[styles.emailText, { fontFamily: FONT_BEBAS_NEUE }]}>{LEGAL_CONTACT_EMAIL}</Text>
        </Pressable>

        {SUPPORT_FAQ.map((item) => (
          <View key={item.q} style={[styles.faqCard, neoCardStyle()]}>
            <Text style={[styles.faqQ, { fontFamily: FONT_BEBAS_NEUE }]}>{item.q}</Text>
            <Text style={styles.faqA}>{item.a}</Text>
          </View>
        ))}

        <LegalLinksFooter excludeId="support" />
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
  meta: {
    fontSize: 13,
    color: Neo.textMutedOnDark,
    letterSpacing: 0.35,
  },
  intro: {
    fontSize: 15,
    lineHeight: 22,
    color: Neo.textOnDark,
  },
  emailCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Neo.neonCyan,
  },
  emailPressed: {
    opacity: 0.9,
  },
  emailText: {
    fontSize: 16,
    color: Neo.ink,
    letterSpacing: 0.3,
  },
  faqCard: {
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  faqQ: {
    fontSize: 17,
    color: Neo.ink,
    letterSpacing: 0.35,
    marginBottom: 8,
  },
  faqA: {
    fontSize: 14,
    lineHeight: 21,
    color: Neo.inkMuted,
  },
});
