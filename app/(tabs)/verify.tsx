import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Alert, Animated,
  useColorScheme, Keyboard, Platform,
} from 'react-native';
import {
  Type, Globe, FileUp, Shield, ChevronRight, X,
  Upload, FileText, Sparkles, CheckCircle2, AlertCircle, WifiOff,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import Colors from '@/constants/colors';
import { useCredits } from '@/providers/CreditsProvider';
import { useReports } from '@/providers/ReportsProvider';
import { processVerification, generateReportTitle, uploadFile, AuthenticationError } from '@/lib/verificationEngine';
import { parseError } from '@/lib/errorHandler';
import VerifyConfirmModal from '@/components/VerifyConfirmModal';

const MAX_CHARS = 10_000;
const MAX_CLAIMS = 50;
type InputType = 'text' | 'url' | 'pdf';
type ScanPhase = 'idle' | 'scanning' | 'confirm' | 'verifying';

// Normalize scan API response so UI never gets NaN/blank values
function normalizeScanData(raw: any, maxClaims: number) {
  const toNum = (v: any, fallback = 0) => {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const rawClaims = Array.isArray(raw?.claims) ? raw.claims : [];
  const claims = rawClaims
    .map((c: any) => {
      if (typeof c === 'string') return c;
      if (c?.text) return c.text;
      if (c?.claim) return c.claim;
      return '';
    })
    .map((s: string) => String(s).trim())
    .filter(Boolean)
    .slice(0, maxClaims);

  const unique = toNum(raw?.unique_claims, claims.length);
  const grouped = toNum(raw?.grouped_claims, 0);
  const total = toNum(raw?.total_claims, unique + grouped);

  return {
    claims,
    total_claims: total,
    grouped_claims: grouped,
    unique_claims: unique,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const ModeTab = ({ icon: Icon, label, active, onPress }: { icon: typeof Type; label: string; active: boolean; onPress: () => void }) => {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  return (
    <TouchableOpacity
      style={[styles.modeTab, { backgroundColor: active ? C.card : 'transparent' }, active && { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }]}
      onPress={onPress} activeOpacity={0.7}
    >
      <Icon size={17} color={active ? C.tint : C.textTertiary} strokeWidth={active ? 2.5 : 2} />
      <Text style={[styles.modeTabLabel, { color: active ? C.tint : C.textTertiary }, active && { fontWeight: '700' }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const ProgressBar = ({ progress, label }: { progress: number; label: string }) => {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const anim = useRef(new Animated.Value(0)).current;
  Animated.timing(anim, { toValue: progress, duration: 400, useNativeDriver: false }).start();
  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'], extrapolate: 'clamp' });
  return (
    <View style={styles.progressWrap}>
      <View style={[styles.progressTrack, { backgroundColor: C.surface }]}>
        <Animated.View style={[styles.progressFill, { width, backgroundColor: C.tint }]} />
      </View>
      <Text style={[styles.progressLabel, { color: C.textSecondary }]}>{label}</Text>
    </View>
  );
};

const AnalyzingCard = ({ progress, step, phase }: { progress: number; step: string; phase: ScanPhase }) => {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const scanSteps = ['Reading document...', 'Extracting claims...', 'Grouping similar claims...', 'Almost done...'];
  const verifySteps = ['Extracting claims...', 'Searching authoritative sources...', 'Cross-referencing data...', 'Analyzing validity...', 'Generating trust score...'];
  const steps = phase === 'scanning' ? scanSteps : verifySteps;

  return (
    <View style={[styles.analyzingCard, { backgroundColor: C.card }]}>
      <View style={[styles.analyzingIcon, { backgroundColor: C.tintLight }]}>
        <ActivityIndicator size="small" color={C.tint} />
      </View>
      <Text style={[styles.analyzingTitle, { color: C.text }]}>
        {phase === 'scanning' ? 'Scanning content' : 'Verifying content'}
      </Text>
      <Text style={[styles.analyzingStep, { color: C.textSecondary }]}>{step || steps[0]}</Text>
      <ProgressBar progress={progress} label={`${Math.round(progress)}%`} />
      <View style={styles.stepsList}>
        {steps.map((s, i) => {
          const stepProgress = (i / (steps.length - 1)) * 100;
          const done = progress > stepProgress + 5;
          const current = Math.abs(progress - stepProgress) < 20;
          return (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepDot, { backgroundColor: done ? C.success : current ? C.tint : C.border }]} />
              <Text style={[styles.stepText, { color: done ? C.success : current ? C.tint : C.textTertiary, fontWeight: current ? '600' : '400' }]}>{s}</Text>
              {done && <CheckCircle2 size={13} color={C.success} strokeWidth={2} />}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const ErrorBanner = ({ message, onDismiss }: { message: string; onDismiss: () => void }) => {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  return (
    <View style={[styles.errorBanner, { backgroundColor: C.errorLight }]}>
      <WifiOff size={15} color={C.error} strokeWidth={2} />
      <Text style={[styles.errorBannerText, { color: C.error }]} numberOfLines={2}>{message}</Text>
      <TouchableOpacity onPress={onDismiss}>
        <X size={15} color={C.error} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function VerifyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  const { creditsLeft, useCredit: deductCredits, hasEnoughCredits } = useCredits();
  const { createReport, updateReport, addClaimsToReport } = useReports();

  const [mode, setMode] = useState<InputType>('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<{ name: string; size: number; uri: string; mimeType: string } | null>(null);
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [scanResult, setScanResult] = useState<{ totalClaims: number; groupedClaims: number; uniqueClaims: number } | null>(null);
  const [scannedClaims, setScannedClaims] = useState<string[]>([]); // claims from /api/scan
  const [extractedText, setExtractedText] = useState('');
  const [pendingReportId, setPendingReportId] = useState<string | null>(null);

  const clear = () => {
    setText(''); setUrl(''); setFile(null);
    setProgress(0); setCurrentStep(''); setErrorMessage('');
    setPhase('idle'); setShowModal(false); setScanResult(null);
    setScannedClaims([]); setExtractedText(''); setPendingReportId(null);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        if (asset.size && asset.size > 2 * 1024 * 1024) {
          Alert.alert('File too large', 'Maximum file size is 2MB. Please choose a smaller file.');
          return;
        }
        setFile({ name: asset.name, size: asset.size ?? 0, uri: asset.uri, mimeType: asset.mimeType ?? 'application/pdf' });
      }
    } catch {
      Alert.alert('Error', 'Could not open document picker.');
    }
  };

  const canSubmit = () => {
    if (mode === 'text') return text.trim().length > 10;
    if (mode === 'url') return url.trim().length > 8;
    return file !== null;
  };

  // Step 1: Scan — extract + group claims, show modal
  const handleScan = async () => {
    Keyboard.dismiss();
    if (!canSubmit()) return;
    setErrorMessage('');
    setPhase('scanning');
    setProgress(0);

    try {
      const content = mode === 'text' ? text : mode === 'url' ? url : file?.name ?? '';
      const title = generateReportTitle(content, mode);
      const reportId = await createReport(title, content, mode,
        mode === 'url' ? url : undefined,
        mode === 'pdf' ? file?.name : undefined
      );
      setPendingReportId(reportId);

      // Progress animation for scan
      const scanSteps = ['Reading document...', 'Extracting claims...', 'Grouping similar claims...', 'Almost done...'];
      let p = 0;
      const scanInterval = setInterval(() => {
        p = Math.min(p + 8, 88);
        setProgress(p);
        const idx = Math.min(Math.floor((p / 100) * scanSteps.length), scanSteps.length - 1);
        setCurrentStep(scanSteps[idx]);
      }, 600);

      // Extract text if needed
      let textToScan = content;
      if (mode === 'pdf' && file) {
        setCurrentStep('Uploading document...');
        textToScan = await uploadFile({ uri: file.uri, name: file.name, type: file.mimeType });
      } else if (mode === 'url') {
        setCurrentStep('Fetching URL content...');
        const { fetchUrlContent } = await import('@/lib/verificationEngine');
        textToScan = await fetchUrlContent(url);
      }
      setExtractedText(textToScan);

      // Call scan endpoint
      let scanRaw: any;
      try {
        const { scanContent } = await import('@/lib/verificationEngine');
        scanRaw = await scanContent(textToScan, MAX_CLAIMS);
      } catch (scanErr: any) {
        // Auth errors must propagate — do not fall back silently
        if (scanErr instanceof AuthenticationError) {
          throw scanErr;
        }
        // Fallback: estimate from text length if /api/scan not yet available
        const wordCount = textToScan.split(/\s+/).filter(Boolean).length;
        const estimatedUnique = Math.min(Math.max(Math.floor(wordCount / 25), 1), MAX_CLAIMS);
        const grouped = Math.floor(estimatedUnique * 0.15);

        const placeholderClaims = Array.from({ length: estimatedUnique }, (_, i) => `Claim ${i + 1}`);

        scanRaw = {
          total_claims: estimatedUnique + grouped,
          grouped_claims: grouped,
          unique_claims: estimatedUnique,
          claims: placeholderClaims,
        };
      }

      const scanData = normalizeScanData(scanRaw, MAX_CLAIMS);

      clearInterval(scanInterval);
      setProgress(100);
      setCurrentStep('Done!');

      // Save claims for use in verify step
      setScannedClaims(scanData.claims);
      setScanResult({
        totalClaims: scanData.total_claims,
        groupedClaims: scanData.grouped_claims,
        uniqueClaims: Math.min(scanData.unique_claims, MAX_CLAIMS),
      });

      setTimeout(() => {
        setPhase('confirm');
        setShowModal(true);
      }, 400);

    } catch (e: any) {
      const { message } = parseError(e);
      setErrorMessage(message);
      setPhase('idle');
      setProgress(0);
    }
  };

  // Step 2: Verify — after user picks how many claims
  const handleVerify = async (maxClaims: number) => {
    setShowModal(false);
    if (!hasEnoughCredits(maxClaims)) {
      router.push('/paywall');
      return;
    }
    if (!pendingReportId) return;

    setPhase('verifying');
    setProgress(0);

    try {
      await updateReport(pendingReportId, { status: 'processing' });
      const verifySteps = [
        'Extracting claims from content...',
        'Searching authoritative sources...',
        'Cross-referencing data...',
        'Analyzing claim validity...',
        'Generating trust scores...',
      ];

      const { claims, creditsUsed } = await processVerification(
        pendingReportId,
        extractedText,
        (p) => {
          setProgress(p);
          const idx = Math.min(Math.floor((p / 100) * verifySteps.length), verifySteps.length - 1);
          setCurrentStep(verifySteps[idx]);
        },
        mode,
        maxClaims,
        scannedClaims.length > 0 ? scannedClaims.slice(0, maxClaims) : undefined,
      );

      await deductCredits(creditsUsed || claims.length);
      await addClaimsToReport(pendingReportId, claims, creditsUsed);
      router.push(`/report?id=${pendingReportId}`);
      clear();
    } catch (e: any) {
      const { message } = parseError(e);
      setErrorMessage(message);
      setPhase('idle');
      setProgress(0);
    }
  };

  const isProcessing = phase === 'scanning' || phase === 'verifying';

  return (
    <View style={[styles.screen, { backgroundColor: C.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: C.text }]}>Verify</Text>
          <Text style={[styles.headerSub, { color: C.textTertiary }]}>Fact-check any content instantly</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {!!errorMessage && <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage('')} />}

        <View style={[styles.modeSwitcher, { backgroundColor: C.surface }]}>
          <ModeTab icon={Type} label="Text" active={mode === 'text'} onPress={() => { if (!isProcessing) { setMode('text'); setErrorMessage(''); } }} />
          <ModeTab icon={Globe} label="URL" active={mode === 'url'} onPress={() => { if (!isProcessing) { setMode('url'); setErrorMessage(''); } }} />
          <ModeTab icon={FileUp} label="File" active={mode === 'pdf'} onPress={() => { if (!isProcessing) { setMode('pdf'); setErrorMessage(''); } }} />
        </View>

        {!isProcessing && (
          <View style={[styles.inputPanel, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={[styles.panelHeader, { borderBottomColor: C.border }]}>
              <View style={styles.panelHeaderLeft}>
                {mode === 'text' && <Type size={15} color={C.tint} strokeWidth={2} />}
                {mode === 'url' && <Globe size={15} color={C.tint} strokeWidth={2} />}
                {mode === 'pdf' && <FileUp size={15} color={C.tint} strokeWidth={2} />}
                <Text style={[styles.panelHeaderLabel, { color: C.textSecondary }]}>
                  {mode === 'text' ? 'Paste content' : mode === 'url' ? 'Enter URL' : 'Upload document'}
                </Text>
              </View>
              {(text || url || file) ? (
                <TouchableOpacity onPress={clear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <View style={[styles.clearBtn, { backgroundColor: C.surface }]}>
                    <X size={14} color={C.textSecondary} strokeWidth={2} />
                  </View>
                </TouchableOpacity>
              ) : null}
            </View>

            {mode === 'text' && (
              <TextInput
                style={[styles.textInput, { color: C.text }]}
                multiline placeholder="Paste an article, press release, or any claims to fact-check…"
                placeholderTextColor={C.textTertiary} value={text} onChangeText={setText}
                textAlignVertical="top" maxLength={MAX_CHARS} autoCorrect={false}
              />
            )}
            {mode === 'url' && (
              <TextInput
                style={[styles.urlInput, { color: C.text }]}
                placeholder="https://example.com/article" placeholderTextColor={C.textTertiary}
                value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url"
              />
            )}
            {mode === 'pdf' && (
              <>
                {!file ? (
                  <TouchableOpacity style={styles.uploadArea} onPress={pickDocument} activeOpacity={0.7}>
                    <View style={[styles.uploadIconWrap, { backgroundColor: C.tintLight }]}>
                      <Upload size={26} color={C.tint} strokeWidth={1.8} />
                    </View>
                    <Text style={[styles.uploadTitle, { color: C.text }]}>Tap to upload</Text>
                    <Text style={[styles.uploadSub, { color: C.textTertiary }]}>PDF or DOCX · max 2MB · max {MAX_CLAIMS} claims</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.filePreview}>
                    <View style={[styles.fileIconWrap, { backgroundColor: C.tintLight }]}>
                      <FileText size={24} color={C.tint} strokeWidth={1.8} />
                    </View>
                    <View style={styles.fileInfo}>
                      <Text style={[styles.fileName, { color: C.text }]} numberOfLines={1}>{file.name}</Text>
                      <Text style={[styles.fileSize, { color: C.textTertiary }]}>{(file.size / 1024 / 1024).toFixed(2)} MB</Text>
                    </View>
                    <TouchableOpacity onPress={() => setFile(null)} style={[styles.removeFile, { backgroundColor: C.errorLight }]}>
                      <X size={15} color={C.error} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            <View style={[styles.panelFooter, { borderTopColor: C.border, backgroundColor: C.surface }]}>
              {mode === 'text'
                ? <Text style={[styles.charCount, { color: C.textTertiary }]}>{text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}</Text>
                : mode === 'url'
                ? <Text style={[styles.hint, { color: C.textTertiary }]}>We extract and verify claims from the page</Text>
                : <Text style={[styles.hint, { color: C.textTertiary }]}>PDF and DOCX supported</Text>
              }
              <View style={[styles.costBadge, { backgroundColor: C.tintLight }]}>
                <Sparkles size={11} color={C.tint} strokeWidth={2} />
                <Text style={[styles.costText, { color: C.tint }]}>per claim</Text>
              </View>
            </View>
          </View>
        )}

        {isProcessing && <AnalyzingCard progress={progress} step={currentStep} phase={phase} />}

        {!isProcessing && (
          <TouchableOpacity
            style={[styles.verifyBtn, canSubmit() ? { backgroundColor: C.tint, shadowColor: C.tint } : { backgroundColor: C.surface }]}
            onPress={handleScan} disabled={!canSubmit()} activeOpacity={0.85}
          >
            <Shield size={19} color={canSubmit() ? '#fff' : C.textTertiary} strokeWidth={2.5} />
            <Text style={[styles.verifyBtnText, { color: canSubmit() ? '#fff' : C.textTertiary }]}>Scan & Verify</Text>
            {canSubmit() && <ChevronRight size={17} color="rgba(255,255,255,0.8)" strokeWidth={2.5} />}
          </TouchableOpacity>
        )}

        {!isProcessing && (
          <View style={styles.trustFooter}>
            <View style={styles.trustItem}>
              <CheckCircle2 size={14} color={C.success} strokeWidth={2} />
              <Text style={[styles.trustText, { color: C.textSecondary }]}>RAG verification against live sources</Text>
            </View>
            <View style={styles.trustItem}>
              <AlertCircle size={14} color={C.warning} strokeWidth={2} />
              <Text style={[styles.trustText, { color: C.textSecondary }]}>Similar claims auto-grouped before billing</Text>
            </View>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Confirm Modal */}
      <VerifyConfirmModal
        visible={showModal}
        scanResult={scanResult}
        creditsLeft={creditsLeft}
        onClose={() => { setShowModal(false); setPhase('idle'); }}
        onVerify={handleVerify}
        onUpgrade={() => { setShowModal(false); router.push('/paywall'); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.8 },
  headerSub: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  scroll: { paddingHorizontal: 16, gap: 12 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14 },
  errorBannerText: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 18 },
  modeSwitcher: { flexDirection: 'row', borderRadius: 14, padding: 4, gap: 2 },
  modeTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 11 },
  modeTabLabel: { fontSize: 13, fontWeight: '600', letterSpacing: -0.1 },
  inputPanel: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  panelHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  panelHeaderLabel: { fontSize: 13, fontWeight: '600', letterSpacing: -0.1 },
  clearBtn: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  textInput: { minHeight: 180, maxHeight: 280, padding: 16, fontSize: 15, lineHeight: 22, fontWeight: '400', ...Platform.select({ android: { textAlignVertical: 'top' } }) },
  urlInput: { padding: 16, fontSize: 15, fontWeight: '400', letterSpacing: -0.1 },
  uploadArea: { padding: 36, alignItems: 'center', gap: 8 },
  uploadIconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  uploadTitle: { fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
  uploadSub: { fontSize: 13, fontWeight: '400' },
  filePreview: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  fileIconWrap: { width: 48, height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  fileInfo: { flex: 1, gap: 3 },
  fileName: { fontSize: 14, fontWeight: '600', letterSpacing: -0.1 },
  fileSize: { fontSize: 12, fontWeight: '500' },
  removeFile: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  panelFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  charCount: { fontSize: 12, fontWeight: '500' },
  hint: { fontSize: 12, fontWeight: '400', flex: 1, marginRight: 8 },
  costBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  costText: { fontSize: 11, fontWeight: '700', letterSpacing: -0.1 },
  verifyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingVertical: 17, borderRadius: 16, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 5 },
  verifyBtnText: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  analyzingCard: { borderRadius: 18, padding: 24, gap: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  analyzingIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  analyzingTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  analyzingStep: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
  progressWrap: { width: '100%', gap: 6 },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  progressLabel: { fontSize: 11, fontWeight: '600', textAlign: 'right' },
  stepsList: { width: '100%', gap: 10, marginTop: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  stepDot: { width: 7, height: 7, borderRadius: 3.5 },
  stepText: { fontSize: 13, flex: 1 },
  trustFooter: { gap: 8, paddingHorizontal: 2 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trustText: { fontSize: 13, fontWeight: '400' },
});