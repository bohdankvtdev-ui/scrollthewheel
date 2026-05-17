import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { PrizeGlyph } from "../../../lib/ui/PrizeGlyph";

import { FONT_BEBAS_NEUE } from "../../../theme/fonts";

import { Neo } from "../../../theme/neoBrutal";

import type { SliceDefinition } from "../../schemas";
import type { ResolveContext } from "../../systems/types";
import { toSliceDisplay, getSliceTapDetail } from "../../utils/sliceDisplay";
import { formatSliceLandChance } from "../../utils/sliceLandChance";
import { getSliceVisualTheme } from "../../game/content/sliceVisualTheme";

type SlicePrizeSheetProps = {
  slice: SliceDefinition | null;
  sliceIndex: number | null;
  visible: boolean;
  onClose: () => void;
  /** All wedges on this wheel — used with resolveContext for honest land %. */
  wheelSlices?: readonly SliceDefinition[];
  resolveContext?: ResolveContext;
};

export function SlicePrizeSheet({
  slice,
  sliceIndex,
  visible,
  onClose,
  wheelSlices,
  resolveContext,
}: SlicePrizeSheetProps) {
  if (slice == null || sliceIndex == null) return null;

  const display = toSliceDisplay(slice);
  const detail = getSliceTapDetail(slice);
  const visual = getSliceVisualTheme(slice.kind, slice.weightTags, { sliceIndex });
  const landPct = formatSliceLandChance(slice, wheelSlices ?? [], resolveContext);



  return (

    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>

      <Pressable style={styles.backdrop} onPress={onClose}>

        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>

          <PrizeGlyph

            icon={display.icon}

            iconFamily={display.iconFamily}

            size="md"

            tint={slice.presentation?.chipColor ?? visual.chipBg}

            iconColor={slice.presentation?.iconColor ?? visual.iconColor}

            tone={visual.tone}

          />

          <Text style={[styles.title, { fontFamily: FONT_BEBAS_NEUE }]}>{slice.label}</Text>

          <View style={styles.metaRow}>

            <Text style={[styles.metaPill, { fontFamily: FONT_BEBAS_NEUE }]}>{detail.category}</Text>

            <Text style={[styles.metaPillMuted, { fontFamily: FONT_BEBAS_NEUE }]}>{landPct}</Text>

          </View>

          <Text style={styles.effect}>{detail.effectLine}</Text>

          <View style={styles.bullets}>

            {detail.bullets.map((line) => (

              <Text key={line} style={styles.bullet}>

                • {line}

              </Text>

            ))}

          </View>

          <Text style={styles.hint}>If the wheel stops here, this is applied to your run.</Text>

          <Pressable style={styles.closeBtn} onPress={onClose}>

            <Text style={[styles.closeLbl, { fontFamily: FONT_BEBAS_NEUE }]}>Got it</Text>

          </Pressable>

        </Pressable>

      </Pressable>

    </Modal>

  );

}



const styles = StyleSheet.create({

  backdrop: {

    flex: 1,

    backgroundColor: "rgba(0,0,0,0.65)",

    justifyContent: "center",

    alignItems: "center",

    padding: 24,

  },

  card: {

    width: "100%",

    maxWidth: 320,

    backgroundColor: Neo.neonYellow,

    borderWidth: Neo.borderBold,

    borderColor: Neo.ink,

    borderRadius: Neo.radiusCard,

    padding: 20,

    alignItems: "center",

    gap: 8,

  },

  title: {

    fontSize: 26,

    color: Neo.ink,

    letterSpacing: 0.4,

    textAlign: "center",

  },

  metaRow: {

    flexDirection: "row",

    flexWrap: "wrap",

    justifyContent: "center",

    gap: 8,

  },

  metaPill: {

    fontSize: 12,

    color: Neo.ink,

    backgroundColor: Neo.neonCyan,

    paddingHorizontal: 8,

    paddingVertical: 3,

    borderRadius: 6,

    borderWidth: Neo.borderThin,

    borderColor: Neo.ink,

    letterSpacing: 0.4,

    overflow: "hidden",

  },

  metaPillMuted: {

    fontSize: 12,

    color: Neo.ink,

    backgroundColor: "rgba(255,255,255,0.55)",

    paddingHorizontal: 8,

    paddingVertical: 3,

    borderRadius: 6,

    borderWidth: Neo.borderThin,

    borderColor: Neo.ink,

    letterSpacing: 0.35,

  },

  effect: {

    fontSize: 17,

    color: Neo.ink,

    textAlign: "center",

    lineHeight: 22,

    fontWeight: "600",

    marginTop: 4,

  },

  bullets: {

    alignSelf: "stretch",

    gap: 4,

    paddingHorizontal: 4,

  },

  bullet: {

    fontSize: 14,

    color: Neo.ink,

    lineHeight: 19,

  },

  hint: {

    fontSize: 13,

    color: Neo.inkMuted,

    textAlign: "center",

    lineHeight: 18,

  },

  closeBtn: {

    marginTop: 6,

    backgroundColor: Neo.ink,

    borderRadius: 10,

    paddingHorizontal: 24,

    paddingVertical: 10,

  },

  closeLbl: {

    fontSize: 16,

    color: Neo.neonYellow,

    letterSpacing: 0.35,

  },

});


