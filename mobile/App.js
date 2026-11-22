import React, { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/+$/, '');
const TABS = ['Overview', 'Key points', 'Outline', 'Transcript'];

export default function App() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function analyzeVideo() {
    Keyboard.dismiss();
    setError('');
    setResult(null);

    if (!API_BASE_URL) {
      setError('Set EXPO_PUBLIC_API_URL in mobile/.env to your deployed backend URL.');
      return;
    }
    if (!url.trim()) {
      setError('Paste a YouTube video link to get started.');
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || 'The video could not be analyzed.');
      setResult(payload);
      setActiveTab('Overview');
    } catch (requestError) {
      setError(requestError.message || 'Could not reach the VidBrief API. Check the API URL and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.topbar}>
          <View style={styles.brandMark}><Text style={styles.playMark}>▶</Text></View>
          <Text style={styles.brand}>vidbrief<Text style={styles.brandDot}>.</Text></Text>
          <View style={styles.topBadge}><View style={styles.onlineDot} /><Text style={styles.topBadgeText}>VIDEO NOTES</Text></View>
        </View>

        <View style={styles.hero}>
          <View style={styles.eyebrow}><Text style={styles.sparkle}>✳</Text><Text style={styles.eyebrowText}>YOUR PERSONAL VIDEO RESEARCHER</Text></View>
          <Text style={styles.title}>Understand the video.{ '\n' }<Text style={styles.titleMuted}>Skip the scrubbing.</Text></Text>
          <Text style={styles.subtitle}>Get the ideas, insights, and important moments from any YouTube video.</Text>

          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>YOUTUBE VIDEO LINK</Text>
            <TextInput
              style={styles.input}
              value={url}
              onChangeText={setUrl}
              placeholder="Paste a YouTube link here"
              placeholderTextColor="#a1a3ad"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="go"
              onSubmitEditing={analyzeVideo}
              accessibilityLabel="YouTube video URL"
            />
            <Pressable style={({ pressed }) => [styles.submitButton, pressed && styles.buttonPressed, busy && styles.buttonDisabled]} onPress={analyzeVideo} disabled={busy}>
              {busy ? <ActivityIndicator color="#ffffff" /> : <><Text style={styles.buttonSpark}>✳</Text><Text style={styles.buttonText}>Analyze video</Text><Text style={styles.buttonArrow}>↗</Text></>}
            </Pressable>
          </View>

          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
          <View style={styles.trustLine}><Text style={styles.trustText}>✓  Transcript-powered insights</Text><Text style={styles.trustDot}>·</Text><Text style={styles.trustText}>No account needed</Text></View>
        </View>

        {result ? (
          <View style={styles.results}>
            <View style={styles.resultHeader}>
              <View style={styles.resultEyebrow}><Text style={styles.resultEyebrowText}>VIDEO BRIEF</Text><View style={styles.readyPill}><View style={styles.readyDot} /><Text style={styles.readyText}>READY</Text></View></View>
              <Text style={styles.videoTitle}>{result.video?.title || 'YouTube video'}</Text>
              <Pressable onPress={() => result.video?.url && Linking.openURL(result.video.url)}><Text style={styles.originalLink}>↗  Open original video</Text></Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
              {TABS.map(tab => <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.activeTab]}><Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text></Pressable>)}
            </ScrollView>

            {activeTab === 'Overview' && <View style={styles.contentCard}><Text style={styles.cardKicker}>✳  THE BIG PICTURE</Text><Text style={styles.bodyText}>{result.summary}</Text><View style={styles.agentNote}><Text style={styles.agentTitle}>{result.used_ai ? 'Your brief is ready' : 'Transcript-based results'}</Text><Text style={styles.agentBody}>{result.agent_notes?.at(-1) || 'Analysis complete.'}</Text></View></View>}

            {activeTab === 'Key points' && <View style={styles.contentCard}><Text style={styles.cardKicker}>◎  MAIN TAKEAWAYS</Text>{(result.key_points || []).map((point, index) => <View key={`${index}-${point.slice(0, 16)}`} style={styles.pointRow}><Text style={styles.pointNumber}>{String(index + 1).padStart(2, '0')}</Text><Text style={styles.bodyText}>{point}</Text></View>)}</View>}

            {activeTab === 'Outline' && <View style={styles.contentCard}><Text style={styles.cardKicker}>▤  VIDEO OUTLINE</Text>{(result.outline || []).map((item, index) => <View key={`${index}-${item.section}`} style={styles.outlineRow}><Text style={styles.pointNumber}>{String(index + 1).padStart(2, '0')}</Text><View style={styles.outlineCopy}><Text style={styles.outlineTitle}>{item.section}</Text><Text style={styles.outlineDescription}>{item.description}</Text></View></View>)}{result.script ? <View style={styles.scriptBlock}><Text style={styles.cardKicker}>SCRIPT-STYLE RECAP</Text><Text style={styles.bodyText}>{result.script}</Text></View> : null}</View>}

            {activeTab === 'Transcript' && <View style={styles.contentCard}><Text style={styles.cardKicker}>▤  FULL TRANSCRIPT</Text><Text style={styles.transcript}>{result.transcript}</Text></View>}
          </View>
        ) : (
          <View style={styles.howCard}>
            <Text style={styles.howKicker}>THREE STEPS. ZERO GUESSWORK.</Text>
            <Text style={styles.howTitle}>A clearer way to catch up.</Text>
            <View style={styles.step}><Text style={styles.stepNum}>01</Text><View><Text style={styles.stepTitle}>Drop in a link</Text><Text style={styles.stepText}>Share a YouTube video to begin.</Text></View></View>
            <View style={styles.step}><Text style={styles.stepNum}>02</Text><View><Text style={styles.stepTitle}>Let AI do the work</Text><Text style={styles.stepText}>Specialist agents find the signal.</Text></View></View>
            <View style={styles.step}><Text style={styles.stepNum}>03</Text><View><Text style={styles.stepTitle}>Get the whole picture</Text><Text style={styles.stepText}>Read the summary, takeaways, and outline.</Text></View></View>
          </View>
        )}
        <Text style={styles.footer}>vidbrief<Text style={styles.brandDot}>.</Text>  A little more clarity for your next video.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f7f8fa' },
  page: { paddingHorizontal: 22, paddingBottom: 36, maxWidth: 640, width: '100%', alignSelf: 'center' },
  topbar: { height: 62, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e9eaed' },
  brandMark: { width: 27, height: 27, borderRadius: 9, backgroundColor: '#ef5651', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  playMark: { color: '#fff', fontSize: 11, marginLeft: 2 },
  brand: { fontSize: 21, fontWeight: '800', letterSpacing: -1, color: '#23252c' },
  brandDot: { color: '#ef5651' },
  topBadge: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#58b991' },
  topBadgeText: { fontSize: 9, color: '#858894', letterSpacing: 1.1 },
  hero: { alignItems: 'center', paddingTop: 44, paddingBottom: 30 },
  eyebrow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  sparkle: { color: '#eb655d', fontSize: 13 },
  eyebrowText: { color: '#eb655d', fontSize: 9, letterSpacing: 1.05 },
  title: { marginTop: 17, textAlign: 'center', color: '#20232b', fontSize: 37, lineHeight: 43, fontWeight: '800', letterSpacing: -1.6 },
  titleMuted: { color: '#a2a4ad' },
  subtitle: { color: '#7e818b', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 12, maxWidth: 370 },
  inputCard: { alignSelf: 'stretch', marginTop: 23, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e6e7eb', borderRadius: 13, padding: 14, shadowColor: '#20232b', shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  inputLabel: { color: '#a0a2aa', fontSize: 8, letterSpacing: 1.1, marginBottom: 6 },
  input: { height: 42, fontSize: 14, color: '#252832', paddingHorizontal: 0 },
  submitButton: { height: 46, borderRadius: 9, backgroundColor: '#252832', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginTop: 6 },
  buttonPressed: { backgroundColor: '#414550' },
  buttonDisabled: { opacity: 0.62 },
  buttonSpark: { color: '#fff', fontSize: 14 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  buttonArrow: { color: '#b8bac1', fontSize: 15 },
  errorBox: { alignSelf: 'stretch', backgroundColor: '#fff2f0', borderWidth: 1, borderColor: '#f3d4d0', borderRadius: 8, padding: 11, marginTop: 10 },
  errorText: { color: '#b4433c', fontSize: 12, lineHeight: 17 },
  trustLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 15 },
  trustText: { color: '#999ca5', fontSize: 9 },
  trustDot: { color: '#c6c8ce' },
  howCard: { borderTopWidth: 1, borderTopColor: '#e9eaed', paddingTop: 23, marginTop: 4 },
  howKicker: { color: '#858894', fontSize: 9, letterSpacing: 1.1 },
  howTitle: { color: '#20232b', fontSize: 22, fontWeight: '800', letterSpacing: -0.7, marginTop: 7, marginBottom: 12 },
  step: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#ededf0', gap: 15 },
  stepNum: { color: '#c0c1c9', fontSize: 11, width: 22, paddingTop: 1 },
  stepTitle: { color: '#252832', fontSize: 13, fontWeight: '700' },
  stepText: { color: '#898b94', fontSize: 11, marginTop: 4 },
  results: { borderTopWidth: 1, borderTopColor: '#e9eaed', paddingTop: 22 },
  resultHeader: { paddingBottom: 13 },
  resultEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  resultEyebrowText: { color: '#858894', fontSize: 9, letterSpacing: 1 },
  readyPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#edf8f3', borderRadius: 12, paddingHorizontal: 7, paddingVertical: 4 },
  readyDot: { backgroundColor: '#59b68e', width: 5, height: 5, borderRadius: 3 },
  readyText: { color: '#4b9d7c', fontSize: 8, letterSpacing: 0.5 },
  videoTitle: { color: '#20232b', fontSize: 20, lineHeight: 26, fontWeight: '800', letterSpacing: -0.4, marginTop: 8 },
  originalLink: { color: '#90929b', fontSize: 10, marginTop: 5 },
  tabs: { flexDirection: 'row', gap: 22, borderBottomWidth: 1, borderBottomColor: '#e9eaed', paddingRight: 10 },
  tab: { paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#ed655b' },
  tabText: { color: '#92949c', fontSize: 11 },
  activeTabText: { color: '#292b34', fontWeight: '700' },
  contentCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e9eaed', borderRadius: 11, padding: 16, marginTop: 15 },
  cardKicker: { color: '#858894', fontSize: 9, letterSpacing: 0.8, marginBottom: 12 },
  bodyText: { color: '#666974', fontSize: 13, lineHeight: 21 },
  agentNote: { borderTopWidth: 1, borderTopColor: '#f0f0f2', marginTop: 15, paddingTop: 12 },
  agentTitle: { color: '#30323a', fontSize: 11, fontWeight: '700' },
  agentBody: { color: '#999ba4', fontSize: 10, lineHeight: 16, marginTop: 4 },
  pointRow: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: '#f0f0f2', paddingVertical: 12 },
  pointNumber: { color: '#d18372', fontSize: 10, width: 20, paddingTop: 2 },
  outlineRow: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: '#f0f0f2', paddingVertical: 12 },
  outlineCopy: { flex: 1 },
  outlineTitle: { color: '#30323a', fontSize: 12, fontWeight: '700' },
  outlineDescription: { color: '#777a83', fontSize: 11, lineHeight: 17, marginTop: 4 },
  scriptBlock: { borderTopWidth: 1, borderTopColor: '#f0f0f2', paddingTop: 14, marginTop: 4 },
  transcript: { color: '#686b75', fontSize: 12, lineHeight: 19 },
  footer: { color: '#a0a2aa', fontSize: 10, textAlign: 'center', marginTop: 25 },
});
