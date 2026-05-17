import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, FONT_SIZES, MODE_META } from '@/constants';
import { useAppStore } from '@/store';
import { useOCR } from '@/hooks/useOCR';

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing] = useState<CameraType>('back');
  const [flash, setFlash] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const activeMode = useAppStore((s) => s.session.activeMode);
  const { isProcessing, error, process } = useOCR();

  const modeMeta = MODE_META[activeMode];

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || capturing) return;

    setCapturing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
        exif: false,
      });

      if (!photo?.uri) {
        Alert.alert('Capture failed', 'Could not take photo. Please try again.');
        return;
      }

      const text = await process(photo.uri);

      if (!text || text.trim().length === 0) {
        Alert.alert(
          'No text found',
          'Brain could not detect any text in this image. Try getting closer or adjusting the angle.',
          [{ text: 'Try again' }]
        );
        return;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/output');
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setCapturing(false);
    }
  }, [capturing, process, router]);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionSub}>
          Brain uses your camera to capture text. Images are processed on-device — nothing leaves your phone.
        </Text>
        <Pressable
          style={styles.permissionBtn}
          onPress={requestPermission}
          accessibilityRole="button"
          accessibilityLabel="Allow camera access"
        >
          <Text style={styles.permissionBtnLabel}>Allow camera</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const isLoading = capturing || isProcessing;

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        enableTorch={flash}
        accessibilityLabel="Camera viewfinder"
      >
        <SafeAreaView style={styles.overlay}>
          <View style={styles.topBar}>
            <View style={[styles.modePill, { backgroundColor: modeMeta.color + 'CC' }]}>
              <Text style={styles.modeIcon}>{modeMeta.icon}</Text>
              <Text style={styles.modeLabel}>{modeMeta.label} mode</Text>
            </View>
            <Pressable
              style={styles.flashBtn}
              onPress={() => setFlash((f) => !f)}
              accessibilityRole="button"
              accessibilityLabel={flash ? 'Disable flash' : 'Enable flash'}
            >
              <Text style={styles.flashIcon}>{flash ? '⚡' : '🔦'}</Text>
            </Pressable>
          </View>

          <View style={styles.reticle} accessibilityElementsHidden>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          <Text style={styles.hint} accessibilityLiveRegion="polite">
            {isLoading ? 'Reading text…' : 'Point at text and capture'}
          </Text>

          <View style={styles.bottomBar}>
            <View style={styles.bottomBarInner}>
              {error && (
                <Text style={styles.errorText} accessibilityLiveRegion="assertive">
                  {error}
                </Text>
              )}
              <Pressable
                style={[styles.shutterOuter, isLoading && styles.shutterDisabled]}
                onPress={handleCapture}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Capture text"
                accessibilityHint="Takes a photo and extracts text"
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <View style={styles.shutterInner} />
                )}
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modeIcon: { fontSize: 14 },
  modeLabel: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  flashBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashIcon: { fontSize: 20 },
  reticle: {
    alignSelf: 'center',
    width: '80%',
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: COLORS.white,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 4,
  },
  hint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  bottomBar: {
    paddingBottom: Platform.OS === 'ios' ? 20 : SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  bottomBarInner: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  errorText: {
    color: COLORS.warn,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
  shutterOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  shutterDisabled: {
    opacity: 0.5,
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  permissionIcon: { fontSize: 60 },
  permissionTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    textAlign: 'center',
  },
  permissionSub: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: SPACING.xl,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  permissionBtnLabel: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
});
